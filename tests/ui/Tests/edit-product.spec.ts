import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { StatusCodes } from "http-status-codes";
import { expect, test } from "../../api/Fixtures/update-product-api.fixture";
import { getAdminCredentials } from "../../helpers/admin.helper";
import { EditProductPage } from "../Pages/edit-product.page";
import { LoginPage } from "../Pages/login.page";

async function loginAs(page: Page, credentials = getAdminCredentials()) {
	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.login(credentials.email, credentials.password);
}

test.describe("Update product UI", () => {
	test("Admin opens a prefilled form, saves all fields and sees persisted changes in the shop", async ({
		page,
		api,
		existingProduct,
		updatePayload,
	}) => {
		await loginAs(page);
		await page
			.getByRole("link", { name: `Edit ${existingProduct.name}`, exact: true })
			.click();
		const editPage = new EditProductPage(page);
		await expect(page).toHaveURL(`/admin/products/${existingProduct.id}/edit`);
		await expect(editPage.fields.name).toHaveValue(existingProduct.name);
		await expect(editPage.fields.description).toHaveValue(
			existingProduct.description,
		);
		await expect(editPage.fields.category).toHaveValue(
			existingProduct.category,
		);
		await expect(editPage.fields.price).toHaveValue(
			existingProduct.price.toFixed(2),
		);
		await expect(editPage.fields.stock).toHaveValue(
			String(existingProduct.stock),
		);
		await editPage.fill({
			...updatePayload,
			stock: String(updatePayload.stock),
		});
		await editPage.submit();
		await expect(page).toHaveURL("/admin?updated=1");
		await expect(page.getByRole("status")).toHaveText(
			"Product updated successfully.",
		);
		const row = page.getByRole("row").filter({
			has: page.getByRole("rowheader", {
				name: updatePayload.name,
				exact: true,
			}),
		});
		await expect(row).toContainText(updatePayload.category);
		await expect(row).toContainText("£129.99");
		const response = await api.get(`/api/products/${existingProduct.id}`);
		expect(response.status()).toBe(StatusCodes.OK);
		expect(await response.json()).toMatchObject({
			...updatePayload,
			id: existingProduct.id,
			price: 129.99,
			inStock: true,
		});
		await page.goto("/shop");
		await expect(
			page.getByText(updatePayload.name, { exact: true }),
		).toBeVisible();
		await editPage.goto(existingProduct.id);
		await expect(editPage.fields.stock).toHaveValue("25");
		await expect(editPage.fields.price).toHaveValue("129.99");
	});

	test("Cancel discards changes", async ({
		page,
		api,
		existingProduct,
		updatePayload,
	}) => {
		await loginAs(page);
		const editPage = new EditProductPage(page);
		await editPage.goto(existingProduct.id);
		await editPage.fill({
			...updatePayload,
			stock: String(updatePayload.stock),
		});
		await editPage.cancel();
		await expect(page).toHaveURL("/admin");
		const fetched = await api.get(`/api/products/${existingProduct.id}`);
		expect(await fetched.json()).toEqual(existingProduct);
	});

	test("Whitespace-only name shows linked errors and preserves other fields", async ({
		page,
		api,
		existingProduct,
		updatePayload,
	}) => {
		await loginAs(page);
		const editPage = new EditProductPage(page);
		await editPage.goto(existingProduct.id);
		await editPage.fill({ ...updatePayload, name: "   ", stock: "25" });
		await editPage.submit();
		await expect(editPage.formError).toContainText(
			"Please fix the errors below.",
		);
		await expect(
			editPage.formError.getByRole("link", {
				name: "Name is required",
				exact: true,
			}),
		).toHaveAttribute("href", "#product-name");
		await expect(editPage.fields.name).toHaveAttribute("aria-invalid", "true");
		await expect(editPage.fields.description).toHaveValue(
			updatePayload.description,
		);
		await expect(editPage.fields.stock).toHaveValue("25");
		const fetched = await api.get(`/api/products/${existingProduct.id}`);
		expect(await fetched.json()).toEqual(existingProduct);
	});

	for (const [field, value] of [
		["price", "1.001"],
		["stock", "-1"],
		["stock", "1.5"],
	] as const) {
		test(`Browser blocks invalid ${field} ${value}`, async ({
			page,
			api,
			existingProduct,
		}) => {
			await loginAs(page);
			const editPage = new EditProductPage(page);
			await editPage.goto(existingProduct.id);
			await editPage.fields[field].fill(value);
			await editPage.submit();
			expect(
				await editPage.fields[field].evaluate(
					(element: HTMLInputElement) => element.validity.valid,
				),
			).toBe(false);
			await expect(page).toHaveURL(
				`/admin/products/${existingProduct.id}/edit`,
			);
			const fetched = await api.get(`/api/products/${existingProduct.id}`);
			expect(await fetched.json()).toEqual(existingProduct);
		});
	}

	test("Rejects a missing CSRF token without changing the product", async ({
		page,
		api,
		existingProduct,
		updatePayload,
	}) => {
		await loginAs(page);
		const editPage = new EditProductPage(page);
		await editPage.goto(existingProduct.id);
		const response = await page.request.post(
			`/admin/products/${existingProduct.id}/edit`,
			{
				form: { ...updatePayload, stock: String(updatePayload.stock) },
			},
		);
		expect(response.status()).toBe(StatusCodes.FORBIDDEN);
		expect(await response.text()).toContain("Invalid form session");
		const fetched = await api.get(`/api/products/${existingProduct.id}`);
		expect(await fetched.json()).toEqual(existingProduct);
	});

	test("Shows a missing-product page", async ({ page }) => {
		await loginAs(page);
		const response = await new EditProductPage(page).goto(randomUUID());
		expect(response?.status()).toBe(StatusCodes.NOT_FOUND);
		await expect(page.getByRole("alert")).toContainText("Product not found");
		await expect(
			page.getByRole("button", { name: "Save changes" }),
		).toHaveCount(0);
	});

	test("Handles deletion between opening the form and saving", async ({
		page,
		api,
		existingProduct,
		updatePayload,
		adminToken,
	}) => {
		await loginAs(page);
		const editPage = new EditProductPage(page);
		await editPage.goto(existingProduct.id);
		const deleted = await api.delete(`/api/products/${existingProduct.id}`, {
			headers: { Authorization: ["Bearer", adminToken].join(" ") },
		});
		expect(deleted.status()).toBe(StatusCodes.NO_CONTENT);
		await editPage.fill({
			...updatePayload,
			stock: String(updatePayload.stock),
		});
		await editPage.submit();
		await expect(editPage.formError).toContainText("Product not found");
		await expect(
			page.getByRole("button", { name: "Save changes" }),
		).toHaveCount(0);
	});

	test("Blocks non-admin form access and submission", async ({
		page,
		registeredUser,
		existingProduct,
		updatePayload,
		api,
	}) => {
		await loginAs(page, registeredUser);
		const response = await new EditProductPage(page).goto(existingProduct.id);
		expect(response?.status()).toBe(StatusCodes.FORBIDDEN);
		await expect(
			page.getByRole("heading", { name: "Not allowed", exact: true }),
		).toBeVisible();
		const submitted = await page.request.post(
			`/admin/products/${existingProduct.id}/edit`,
			{
				form: { ...updatePayload, stock: "25" },
			},
		);
		expect(submitted.status()).toBe(StatusCodes.FORBIDDEN);
		const fetched = await api.get(`/api/products/${existingProduct.id}`);
		expect(await fetched.json()).toEqual(existingProduct);
	});

	test("Redirects anonymous form access and submission to login", async ({
		page,
	}) => {
		const id = randomUUID();
		await new EditProductPage(page).goto(id);
		await expect(page).toHaveURL("/login");
		const response = await page.request.post(`/admin/products/${id}/edit`, {
			form: {},
			maxRedirects: 0,
		});
		expect(response.status()).toBe(StatusCodes.SEE_OTHER);
		expect(response.headers().location).toBe("/login");
	});
});
