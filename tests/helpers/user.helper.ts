import { randomUUID } from "node:crypto";
import { request } from "@playwright/test";
import { StatusCodes } from "http-status-codes";

export const API_URL = process.env.API_URL ?? "http://localhost:3000";

export interface RegisterPayload {
	name: string;
	email: string;
	password: string;
	safeWordHint: string;
	safeWord: string;
}

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

export function generateValidUser(): RegisterPayload {
	return {
		name: "Lee Service",
		email: `leeservice-${randomUUID()}@example.com`,
		password: "iamamazing123",
		safeWordHint: "favourite-movie",
		safeWord: "cars",
	};
}

export async function registerUser(
	payload: RegisterPayload,
): Promise<RegisterPayload> {
	const context = await request.newContext({ baseURL: API_URL });
	try {
		const response = await context.post("/api/register", { data: payload });
		if (response.status() !== StatusCodes.CREATED) {
			throw new Error(
				`Registration failed: ${response.status()} - ${await response.text()}`,
			);
		}
		return payload;
	} finally {
		await context.dispose();
	}
}
