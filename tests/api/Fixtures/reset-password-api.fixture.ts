import type { APIResponse } from "@playwright/test";
import { test as base } from "./login-api.fixture";

type ResetPasswordFixtures = {
	getSafeWordHint: (email: string) => Promise<APIResponse>;
	verifySafeWord: (payload: object) => Promise<APIResponse>;
	resetPassword: (payload: object) => Promise<APIResponse>;
};

export const test = base.extend<ResetPasswordFixtures>({
	getSafeWordHint: async ({ api }, use) => {
		// The hint endpoint is limited to 5 requests/minute per IP, so wait out
		// the window and retry if earlier specs have used it up.
		await use(async (email) => {
			let response = await api.get("/api/safe-word-hint", {
				params: { email },
			});
			for (
				let attempt = 0;
				attempt < 2 && response.status() === 429;
				attempt++
			) {
				const retryAfter = Number(response.headers()["retry-after"] ?? 60);
				await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
				response = await api.get("/api/safe-word-hint", { params: { email } });
			}
			return response;
		});
	},

	verifySafeWord: async ({ api }, use) => {
		await use((payload) =>
			api.post("/api/reset-password/verify", { data: payload }),
		);
	},

	resetPassword: async ({ api }, use) => {
		await use((payload) => api.post("/api/reset-password", { data: payload }));
	},
});

export { expect } from "@playwright/test";
