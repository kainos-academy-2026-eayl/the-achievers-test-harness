import type { APIResponse } from "@playwright/test";
import type { ImageFile } from "../../helpers/product-image.helper";
import { test as base } from "./update-product-api.fixture";

export interface ProductImageResponse {
	id: string;
	url: string;
	contentType: string;
}

type ProductImageFixtures = {
	uploadImage: (
		productId: string,
		file: ImageFile,
		accessToken?: string,
	) => Promise<APIResponse>;
	replaceImage: (
		productId: string,
		imageId: string,
		file: ImageFile,
		accessToken?: string,
	) => Promise<APIResponse>;
	removeImage: (
		productId: string,
		imageId: string,
		accessToken?: string,
	) => Promise<APIResponse>;
};

function authorization(accessToken?: string) {
	return accessToken
		? { Authorization: ["Bearer", accessToken].join(" ") }
		: undefined;
}

export const test = base.extend<ProductImageFixtures>({
	uploadImage: async ({ api }, use) => {
		await use((productId, file, accessToken) =>
			api.post(`/api/products/${encodeURIComponent(productId)}/images`, {
				multipart: { image: file },
				headers: authorization(accessToken),
			}),
		);
	},

	replaceImage: async ({ api }, use) => {
		await use((productId, imageId, file, accessToken) =>
			api.put(
				`/api/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
				{
					multipart: { image: file },
					headers: authorization(accessToken),
				},
			),
		);
	},

	removeImage: async ({ api }, use) => {
		await use((productId, imageId, accessToken) =>
			api.delete(
				`/api/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
				{ headers: authorization(accessToken) },
			),
		);
	},
});

export { expect, type LoginResponse } from "./update-product-api.fixture";
