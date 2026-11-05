import { randomUUID } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import {
	expect,
	type LoginResponse,
	test,
} from "../Fixtures/update-product-api.fixture";

test.describe("PUT /api/products/:id", () => {
	test("Admin replaces editable fields and persists the catalogue response", async ({
		api,
		existingProduct,
		updatePayload,
		updateProduct,
		adminToken,
	}) => {
		const response = await updateProduct(
			existingProduct.id,
			{
				...updatePayload,
				name: ` ${updatePayload.name} `,
				id: "client-selected-id",
				rating: 5,
				reviewCount: 100,
				pricePence: 1,
			},
			adminToken,
		);
		expect(response.status()).toBe(StatusCodes.OK);
		expect(response.headers()["cache-control"]).toBe("no-store");
		const expected = {
			...existingProduct,
			...updatePayload,
			price: 129.99,
			inStock: true,
		};
		expect(await response.json()).toEqual(expected);
		const fetched = await api.get(`/api/products/${existingProduct.id}`);
		expect(fetched.status()).toBe(StatusCodes.OK);
		expect(await fetched.json()).toEqual(expected);
		const catalogue = await api.get("/api/products");
		expect(catalogue.status()).toBe(StatusCodes.OK);
		expect(await catalogue.json()).toContainEqual(expected);

		const repeated = await updateProduct(
			existingProduct.id,
			updatePayload,
			adminToken,
		);
		expect(repeated.status()).toBe(StatusCodes.OK);
		expect(await repeated.json()).toEqual(expected);
	});

	for (const [price, stock] of [
		["0.00", 0],
		["0.29", 1],
		["21474836.47", 2147483647],
	] as const) {
		test(`Persists price ${price} and stock ${stock} exactly`, async ({
			api,
			existingProduct,
			updatePayload,
			updateProduct,
			adminToken,
		}) => {
			const response = await updateProduct(
				existingProduct.id,
				{
					...updatePayload,
					price,
					stock,
				},
				adminToken,
			);
			expect(response.status()).toBe(StatusCodes.OK);
			const fetched = await api.get(`/api/products/${existingProduct.id}`);
			expect(fetched.status()).toBe(StatusCodes.OK);
			expect(await fetched.json()).toMatchObject({
				price: Number(price),
				stock,
				inStock: stock > 0,
			});
		});
	}

	for (const [label, token] of [
		["missing", undefined],
		["invalid", "invalid"],
	] as const) {
		test(`Rejects a ${label} token without changing the product`, async ({
			api,
			existingProduct,
			updatePayload,
			updateProduct,
		}) => {
			const response = await updateProduct(
				existingProduct.id,
				updatePayload,
				token,
			);
			expect(response.status()).toBe(StatusCodes.UNAUTHORIZED);
			const fetched = await api.get(`/api/products/${existingProduct.id}`);
			expect(await fetched.json()).toEqual(existingProduct);
		});
	}

	test("Rejects a valid non-admin token without changing the product", async ({
		api,
		existingProduct,
		registeredUser,
		loginUser,
		updatePayload,
		updateProduct,
	}) => {
		const login = await loginUser({
			email: registeredUser.email,
			password: registeredUser.password,
		});
		expect(login.status()).toBe(StatusCodes.OK);
		const { accessToken } = (await login.json()) as LoginResponse;
		const response = await updateProduct(
			existingProduct.id,
			updatePayload,
			accessToken,
		);
		expect(response.status()).toBe(StatusCodes.FORBIDDEN);
		const fetched = await api.get(`/api/products/${existingProduct.id}`);
		expect(await fetched.json()).toEqual(existingProduct);
	});

	test("Returns 404 rather than creating a missing product", async ({
		api,
		updatePayload,
		updateProduct,
		adminToken,
	}) => {
		const id = randomUUID();
		const response = await updateProduct(id, updatePayload, adminToken);
		expect(response.status()).toBe(StatusCodes.NOT_FOUND);
		expect(await response.json()).toEqual({ error: "Product not found" });
		expect((await api.get(`/api/products/${id}`)).status()).toBe(
			StatusCodes.NOT_FOUND,
		);
	});

	for (const [field, value] of [
		["name", ""],
		["name", " "],
		["name", "n".repeat(201)],
		["description", ""],
		["description", "d".repeat(2001)],
		["category", ""],
		["category", "c".repeat(101)],
		["price", "-0.01"],
		["price", "1.001"],
		["price", "1e2"],
		["price", "21474836.48"],
		["stock", -1],
		["stock", 1.5],
		["stock", 2147483648],
		["stock", "not-a-number"],
		["stock", "12abc"],
		["stock", "1.5"],
	] as const) {
		test(`Rejects invalid ${field} ${JSON.stringify(value).slice(0, 40)} without saving`, async ({
			api,
			existingProduct,
			updatePayload,
			updateProduct,
			adminToken,
		}) => {
			const response = await updateProduct(
				existingProduct.id,
				{
					...updatePayload,
					[field]: value,
				},
				adminToken,
			);
			expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
			expect(await response.json()).toMatchObject({
				error: "Validation failed",
				fieldErrors: { [field]: expect.any(String) },
			});
			const fetched = await api.get(`/api/products/${existingProduct.id}`);
			expect(await fetched.json()).toEqual(existingProduct);
		});
	}

	test("Rejects an empty update", async ({
		api,
		existingProduct,
		updateProduct,
		adminToken,
	}) => {
		const response = await updateProduct(existingProduct.id, {}, adminToken);
		expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
		const fetched = await api.get(`/api/products/${existingProduct.id}`);
		expect(await fetched.json()).toEqual(existingProduct);
	});

	for (const field of [
		"name",
		"description",
		"category",
		"price",
		"stock",
	] as const) {
		test(`Requires ${field} for a full PUT replacement`, async ({
			api,
			existingProduct,
			updatePayload,
			updateProduct,
			adminToken,
		}) => {
			const payload: Partial<typeof updatePayload> = { ...updatePayload };
			delete payload[field];
			const response = await updateProduct(
				existingProduct.id,
				payload,
				adminToken,
			);
			expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
			const fetched = await api.get(`/api/products/${existingProduct.id}`);
			expect(await fetched.json()).toEqual(existingProduct);
		});
	}

	for (const body of ["{invalid", "null", "[]", '"not an object"']) {
		test(`Rejects malformed or non-object JSON ${body}`, async ({
			api,
			existingProduct,
			adminToken,
		}) => {
			const response = await api.put(`/api/products/${existingProduct.id}`, {
				data: body,
				headers: {
					Authorization: ["Bearer", adminToken].join(" "),
					"Content-Type": "application/json",
				},
			});
			expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
			const fetched = await api.get(`/api/products/${existingProduct.id}`);
			expect(await fetched.json()).toEqual(existingProduct);
		});
	}
});
