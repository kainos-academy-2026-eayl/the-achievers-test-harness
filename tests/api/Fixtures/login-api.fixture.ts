import type { APIResponse } from "@playwright/test";
import { test as base } from "./register-api.fixture";

export interface LoginPayload {
	email: string;
	password: string;
}

export interface LoginResponse {
	accessToken: string;
	tokenType: string;
	expiresIn: number;
	user: {
		email: string;
		name: string;
		createdAt: string;
	};
}

type LoginFixtures = {
	loginUser: (payload: LoginPayload) => Promise<APIResponse>;
};

export const test = base.extend<LoginFixtures>({
	loginUser: async ({ api }, use) => {
		await use((payload) => api.post("/api/login", { data: payload }));
	},
});

export { expect } from "@playwright/test";
