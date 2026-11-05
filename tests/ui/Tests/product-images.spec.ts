import type { Page } from "@playwright/test";
import { StatusCodes } from "http-status-codes";
import {
	expect,
	test,
	type ProductImageResponse,
} from "../../api/Fixtures/product-image-api.fixture";
import { getAdminCredentials } from "../../helpers/admin.helper";
import { pngFile, unsupportedFile } from "../../helpers/product-image.helper";
import { EditProductPage } from "../Pages/edit-product.page";
import { LoginPage } from "../Pages/login.page";

async function loginAs(page: Page) {
	const { email, password } = getAdminCredentials();
	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.login(email, password);
}

test.describe("Product images UI", () => {
	test("Admin uploads an image that is associated with the product", async ({
		page,
		api,
		existingProduct,
	}) => {
		const file = pngFile();
		await loginAs(page);
		const editPage = new EditProductPage(page);
		await editPage.goto(existingProduct.id);
		await expect(editPage.noImagesMessage).toBeVisible();

		await editPage.uploadImage(file);

		await expect(page.getByRole("status")).toHaveText("Image uploaded.");
		await expect(editPage.productImages).toHaveCount(1);
		const fetched = await api.get(`/api/products/${existingProduct.id}`);
		expect(await fetched.json()).toMatchObject({
			images: [expect.objectContaining({ contentType: "image/png" })],
		});

		await page.goto("/shop");
		const tile = page
			.locator("article.product-tile")
			.filter({ hasText: existingProduct.name });
		await expect(tile.locator("img.product-photo")).toHaveCount(1);
	});

	test("Unsupported file type is rejected with an error", async ({
		page,
		api,
		existingProduct,
	}) => {
		await loginAs(page);
		const editPage = new EditProductPage(page);
		await editPage.goto(existingProduct.id);

		await editPage.uploadImage(unsupportedFile());

		await expect(editPage.formError).toHaveText(
			"Choose a JPEG, PNG or WebP image.",
		);
		await expect(editPage.noImagesMessage).toBeVisible();
		await expect(editPage.productImages).toHaveCount(0);
		const fetched = await api.get(`/api/products/${existingProduct.id}`);
		expect(await fetched.json()).toMatchObject({ images: [] });
	});

	test("Admin removes an image and it is no longer displayed", async ({
		page,
		api,
		existingProduct,
		adminToken,
		uploadImage,
	}) => {
		const uploaded = await uploadImage(
			existingProduct.id,
			pngFile(),
			adminToken,
		);
		expect(uploaded.status()).toBe(StatusCodes.CREATED);
		const image = (await uploaded.json()) as ProductImageResponse;
		await loginAs(page);
		const editPage = new EditProductPage(page);
		await editPage.goto(existingProduct.id);
		await expect(editPage.productImages).toHaveCount(1);

		await editPage.removeImage(1);

		await expect(page.getByRole("status")).toHaveText("Image removed.");
		await expect(editPage.noImagesMessage).toBeVisible();
		const fetched = await api.get(`/api/products/${existingProduct.id}`);
		expect(await fetched.json()).toMatchObject({ images: [] });
		const served = await api.get(image.url);
		expect(served.status()).toBe(StatusCodes.NOT_FOUND);

		await page.goto("/shop");
		const tile = page
			.locator("article.product-tile")
			.filter({ hasText: existingProduct.name });
		await expect(tile.locator("img.product-photo")).toHaveCount(0);
	});
});
