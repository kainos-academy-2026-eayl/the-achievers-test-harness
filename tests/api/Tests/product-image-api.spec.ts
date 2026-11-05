import { StatusCodes } from "http-status-codes";
import {
	jpegFile,
	pngFile,
	unsupportedFile,
} from "../../helpers/product-image.helper";
import {
	test,
	expect,
	type LoginResponse,
	type ProductImageResponse,
} from "../Fixtures/product-image-api.fixture";

test.describe("POST /api/products/:id/images", () => {
	test("Admin uploads a PNG that is served back at its location", async ({
		api,
		existingProduct,
		adminToken,
		uploadImage,
	}) => {
		const file = pngFile();

		const response = await uploadImage(existingProduct.id, file, adminToken);

		expect(response.status()).toBe(StatusCodes.CREATED);
		const image = (await response.json()) as ProductImageResponse;
		expect(image).toMatchObject({ contentType: "image/png" });
		expect(response.headers().location).toBe(image.url);

		const served = await api.get(image.url);
		expect(served.status()).toBe(StatusCodes.OK);
		expect(served.headers()["content-type"]).toContain("image/png");
		expect(await served.body()).toEqual(file.buffer);

		const product = await api.get(`/api/products/${existingProduct.id}`);
		expect(await product.json()).toMatchObject({
			images: [expect.objectContaining({ id: image.id })],
		});
	});

	test("Rejects a request without a token", async ({
		existingProduct,
		uploadImage,
	}) => {
		const response = await uploadImage(existingProduct.id, pngFile());

		expect(response.status()).toBe(StatusCodes.UNAUTHORIZED);
		expect(await response.json()).toEqual({
			error: "Authentication required",
		});
	});

	test("Rejects a valid non-admin token", async ({
		registeredUser,
		loginUser,
		existingProduct,
		uploadImage,
	}) => {
		const login = await loginUser({
			email: registeredUser.email,
			password: registeredUser.password,
		});
		expect(login.status()).toBe(StatusCodes.OK);
		const { accessToken } = (await login.json()) as LoginResponse;

		const response = await uploadImage(
			existingProduct.id,
			pngFile(),
			accessToken,
		);

		expect(response.status()).toBe(StatusCodes.FORBIDDEN);
		expect(await response.json()).toEqual({
			error: "Admin access required",
		});
	});

	test("Rejects a file that is not a JPEG, PNG or WebP image", async ({
		api,
		existingProduct,
		adminToken,
		uploadImage,
	}) => {
		const response = await uploadImage(
			existingProduct.id,
			unsupportedFile(),
			adminToken,
		);

		expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
		const body = await response.json();
		expect(body.fieldErrors).toHaveProperty("image");

		const product = await api.get(`/api/products/${existingProduct.id}`);
		expect(await product.json()).toMatchObject({ images: [] });
	});
});

test.describe("PUT /api/products/:id/images/:imageId", () => {
	test("Admin replaces an image so only the new file is served", async ({
		api,
		existingProduct,
		adminToken,
		uploadImage,
		replaceImage,
	}) => {
		const uploaded = (await (
			await uploadImage(existingProduct.id, pngFile(), adminToken)
		).json()) as ProductImageResponse;
		const replacement = jpegFile();

		const response = await replaceImage(
			existingProduct.id,
			uploaded.id,
			replacement,
			adminToken,
		);

		expect(response.status()).toBe(StatusCodes.OK);
		const image = (await response.json()) as ProductImageResponse;
		expect(image).toMatchObject({ contentType: "image/jpeg" });
		expect(image.id).not.toBe(uploaded.id);

		const oldImage = await api.get(uploaded.url);
		expect(oldImage.status()).toBe(StatusCodes.NOT_FOUND);
		const served = await api.get(image.url);
		expect(served.headers()["content-type"]).toContain("image/jpeg");
		expect(await served.body()).toEqual(replacement.buffer);
		const product = await api.get(`/api/products/${existingProduct.id}`);
		expect(await product.json()).toMatchObject({
			images: [expect.objectContaining({ id: image.id })],
		});
	});
});

test.describe("DELETE /api/products/:id/images/:imageId", () => {
	test("Admin removes an image so it is no longer listed or served", async ({
		api,
		existingProduct,
		adminToken,
		uploadImage,
		removeImage,
	}) => {
		const uploaded = (await (
			await uploadImage(existingProduct.id, pngFile(), adminToken)
		).json()) as ProductImageResponse;

		const response = await removeImage(
			existingProduct.id,
			uploaded.id,
			adminToken,
		);

		expect(response.status()).toBe(StatusCodes.NO_CONTENT);
		const product = await api.get(`/api/products/${existingProduct.id}`);
		expect(await product.json()).toMatchObject({ images: [] });
		const served = await api.get(uploaded.url);
		expect(served.status()).toBe(StatusCodes.NOT_FOUND);
	});
});
