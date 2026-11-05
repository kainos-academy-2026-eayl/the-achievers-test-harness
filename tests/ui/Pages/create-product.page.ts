import type { Page } from "@playwright/test";

export interface ProductFormValues {
	name: string;
	description: string;
	category: string;
	price: string;
}

export class CreateProductPage {
	constructor(readonly page: Page) {}

	get fields() {
		return {
			name: this.page.getByTestId("product-name"),
			description: this.page.getByTestId("product-description"),
			category: this.page.getByTestId("product-category"),
			price: this.page.getByTestId("product-price"),
		};
	}

	get formError() {
		return this.page.getByRole("alert");
	}

	async goto() {
		await this.page.goto("/admin/products/new");
	}

	async fill(product: ProductFormValues) {
		await this.fields.name.fill(product.name);
		await this.fields.description.fill(product.description);
		await this.fields.category.fill(product.category);
		await this.fields.price.fill(product.price);
	}

	async submit() {
		await this.page
			.getByRole("button", { name: "Create product", exact: true })
			.click();
	}
}
