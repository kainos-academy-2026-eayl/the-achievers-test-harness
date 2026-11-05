import type { Page } from "@playwright/test";
import type { ImageFile } from "../../helpers/product-image.helper";
import type { ProductFormValues } from "./create-product.page";

export interface ProductEditFormValues extends ProductFormValues {
	stock: string;
}

export class EditProductPage {
	constructor(readonly page: Page) {}

	get fields() {
		return {
			name: this.page.getByTestId("product-name"),
			description: this.page.getByTestId("product-description"),
			category: this.page.getByTestId("product-category"),
			price: this.page.getByTestId("product-price"),
			stock: this.page.getByTestId("product-stock"),
		};
	}

	get formError() {
		return this.page.getByRole("alert");
	}

	async goto(id: string) {
		return this.page.goto(`/admin/products/${encodeURIComponent(id)}/edit`);
	}

	async fill(values: ProductEditFormValues) {
		for (const field of [
			"name",
			"description",
			"category",
			"price",
			"stock",
		] as const) {
			await this.fields[field].fill(values[field]);
		}
	}

	async submit() {
		await this.page
			.getByRole("button", { name: "Save changes", exact: true })
			.click();
	}

	get productImages() {
		return this.page.locator("li.image-item img.image-thumb");
	}

	get noImagesMessage() {
		return this.page.getByText("This product has no images yet.", {
			exact: true,
		});
	}

	async uploadImage(file: ImageFile) {
		await this.page.getByLabel("Add an image").setInputFiles(file);
		await this.page
			.getByRole("button", { name: "Upload image", exact: true })
			.click();
	}

	async removeImage(position: number) {
		await this.page
			.getByRole("button", {
				name: `Remove image ${position}`,
				exact: true,
			})
			.click();
	}

	async cancel() {
		await this.page
			.getByRole("link", {
				name: "Cancel and return to catalogue",
				exact: true,
			})
			.click();
	}
}
