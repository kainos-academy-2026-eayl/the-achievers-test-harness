import {
	test as base,
	type APIRequestContext,
	type APIResponse,
} from "@playwright/test";

export const API_URL = process.env.API_URL ?? "http://localhost:3000";

export interface RegisterPayload {
	name: string;
	email: string;
	password: string;
	safeWordHint: string;
	safeWord: string;
}

type RegisterFixtures = {
	api: APIRequestContext;
	validUser: RegisterPayload;
	register: (payload: object) => Promise<APIResponse>;
};

export const test = base.extend<RegisterFixtures>({
	api: async ({ playwright }, use) => {
		const api = await playwright.request.newContext({ baseURL: API_URL });
		await use(api);
		await api.dispose();
	},

	// Fresh unique email per test so runs don't collide with existing rows.
	// biome-ignore lint/correctness/noEmptyPattern: Playwright requires destructuring even when a fixture has no dependencies.
	validUser: async ({}, use) => {
		await use({
			name: "Lee Service",
			email: `leeservice${Date.now()}@example.com`,
			password: "iamamazing123",
			safeWordHint: "favourite-movie",
			safeWord: "cars",
		});
	},

	register: async ({ api }, use) => {
		await use((payload) => api.post("/api/register", { data: payload }));
	},
});

export { expect } from "@playwright/test";
