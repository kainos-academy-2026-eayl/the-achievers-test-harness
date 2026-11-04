import { randomUUID } from "node:crypto";
import type { APIResponse } from "@playwright/test";
import { StatusCodes } from "http-status-codes";
import { getAdminCredentials } from "../../helpers/admin.helper";
import { test as base, expect, type LoginResponse } from "./login-api.fixture";

export interface ProductPayload {
	name: string;
	description: string;
	category: string;
	price: string;
}

export interface ProductResponse {
	id: string;
	name: string;
	description: string;
	category: string;
	price: number;
	rating: number | null;
	reviewCount: number;
}

type CreateProductFixtures = {
	adminToken: string;
	productPayload: ProductPayload;
	createProduct: (
		payload: object,
		accessToken?: string,
	) => Promise<APIResponse>;
};

export const test = base.extend<CreateProductFixtures>({
	adminToken: async ({ loginUser }, use) => {
		const response = await loginUser(getAdminCredentials());
		expect(
			response.status(),
			`Admin login failed: ${await response.text()}`,
		).toBe(StatusCodes.OK);
		const body = (await response.json()) as LoginResponse;
		await use(body.accessToken);
	},

	// biome-ignore lint/correctness/noEmptyPattern: Playwright requires destructuring even when a fixture has no dependencies.
	productPayload: async ({}, use) => {
		await use({
			name: `Harness Cue ${randomUUID()}`,
			description: "A balanced maple cue.",
			category: "Cues",
			price: "89.99",
		});
	},

	createProduct: async ({ api }, use) => {
		await use((payload, accessToken) =>
			api.post("/api/products", {
				data: payload,
				headers: accessToken
					? { Authorization: `Bearer ${accessToken}` }
					: undefined,
			}),
		);
	},
});

export { expect, type LoginResponse } from "./login-api.fixture";
