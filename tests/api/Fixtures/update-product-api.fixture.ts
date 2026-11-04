import type { APIResponse } from "@playwright/test";
import { StatusCodes } from "http-status-codes";
import {
	test as base,
	expect,
	type ProductPayload,
	type ProductResponse,
} from "./create-product-api.fixture";

export interface UpdateProductPayload extends ProductPayload {
	stock: number;
}

export interface EditableProduct extends ProductResponse {
	stock: number;
	inStock: boolean;
}

type UpdateProductFixtures = {
	existingProduct: EditableProduct;
	updatePayload: UpdateProductPayload;
	updateProduct: (
		id: string,
		payload: object,
		accessToken?: string,
	) => Promise<APIResponse>;
};

export const test = base.extend<UpdateProductFixtures>({
	existingProduct: async (
		{ createProduct, productPayload, adminToken, api },
		use,
	) => {
		const response = await createProduct(productPayload, adminToken);
		expect(
			response.status(),
			`Product setup failed: ${await response.text()}`,
		).toBe(StatusCodes.CREATED);
		const product = (await response.json()) as EditableProduct;
		try {
			await use(product);
		} finally {
			const deleted = await api.delete(
				`/api/products/${encodeURIComponent(product.id)}`,
				{ headers: { Authorization: ["Bearer", adminToken].join(" ") } },
			);
			expect(
				[StatusCodes.NO_CONTENT, StatusCodes.NOT_FOUND],
				`Product cleanup failed: ${await deleted.text()}`,
			).toContain(deleted.status());
		}
	},
	updatePayload: async ({ productPayload }, use) => {
		await use({
			...productPayload,
			name: `${productPayload.name} updated`,
			description: "An updated balanced cue.",
			category: "Premium Cues",
			price: "129.99",
			stock: 25,
		});
	},
	updateProduct: async ({ api }, use) => {
		await use((id, payload, accessToken) =>
			api.put(`/api/products/${encodeURIComponent(id)}`, {
				data: payload,
				headers: accessToken
					? { Authorization: ["Bearer", accessToken].join(" ") }
					: undefined,
			}),
		);
	},
});

export { expect, type LoginResponse } from "./create-product-api.fixture";
