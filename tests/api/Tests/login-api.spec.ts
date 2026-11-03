import { StatusCodes } from "http-status-codes";
import {
	test,
	expect,
	type LoginResponse,
} from "../Fixtures/login-api.fixture";

test.describe("POST /api/login", () => {
	test("Logs in with valid credentials after registration", async ({
		registeredUser: validUser,
		loginUser,
	}) => {
		// Login with the registered credentials
		const loginResponse = await loginUser({
			email: validUser.email,
			password: validUser.password,
		});

		expect(loginResponse.status()).toBe(StatusCodes.OK);
		const body = (await loginResponse.json()) as LoginResponse;
		expect(body.accessToken).toBeTruthy();
		expect(body.tokenType).toBe("Bearer");
		expect(body.expiresIn).toBe(3600);
		expect(body.user.email).toBe(validUser.email);
		expect(body.user.name).toBe(validUser.name);
		expect(body.user.createdAt).toBeTruthy();
	});

	test("Normalises email to lowercase during login", async ({
		registeredUser: validUser,
		loginUser,
	}) => {
		// Login with uppercase email
		const loginResponse = await loginUser({
			email: validUser.email.toUpperCase(),
			password: validUser.password,
		});

		expect(loginResponse.status()).toBe(StatusCodes.OK);
		const body = (await loginResponse.json()) as LoginResponse;
		expect(body.user.email).toBe(validUser.email.toLowerCase());
	});

	test("Rejects login with incorrect password", async ({
		registeredUser: validUser,
		loginUser,
	}) => {
		// Try to login with wrong password
		const loginResponse = await loginUser({
			email: validUser.email,
			password: "wrongpassword123",
		});

		expect(loginResponse.status()).toBe(StatusCodes.UNAUTHORIZED);
		const body = await loginResponse.json();
		expect(body.error).toBe("Invalid email or password");
	});

	test("Rejects login with non-existent email", async ({ loginUser }) => {
		const loginResponse = await loginUser({
			email: `nonexistent${Date.now()}@example.com`,
			password: "iamamazing123",
		});

		expect(loginResponse.status()).toBe(StatusCodes.UNAUTHORIZED);
		const body = await loginResponse.json();
		expect(body.error).toBe("Invalid email or password");
	});

	test("Rejects login with invalid email format", async ({ loginUser }) => {
		const loginResponse = await loginUser({
			email: "not-an-email",
			password: "iamamazing123",
		});

		expect(loginResponse.status()).toBe(StatusCodes.BAD_REQUEST);
		const body = await loginResponse.json();
		expect(body.error).toBe("A valid email is required");
	});

	test("Rejects login with missing email", async ({ loginUser }) => {
		const loginResponse = await loginUser({
			email: "",
			password: "iamamazing123",
		});

		expect(loginResponse.status()).toBe(StatusCodes.BAD_REQUEST);
		const body = await loginResponse.json();
		expect(body.error).toBe("A valid email is required");
	});

	test("Rejects login with missing password", async ({ loginUser }) => {
		const loginResponse = await loginUser({
			email: `test${Date.now()}@example.com`,
			password: "",
		});

		expect(loginResponse.status()).toBe(StatusCodes.BAD_REQUEST);
		const body = await loginResponse.json();
		expect(body.error).toBe(
			"Password must be between 1 and 128 characters long",
		);
	});

	test("Rejects login with password exceeding 128 characters", async ({
		loginUser,
	}) => {
		const loginResponse = await loginUser({
			email: `test${Date.now()}@example.com`,
			password: "a".repeat(129),
		});

		expect(loginResponse.status()).toBe(StatusCodes.BAD_REQUEST);
		const body = await loginResponse.json();
		expect(body.error).toBe(
			"Password must be between 1 and 128 characters long",
		);
	});

	test("Preserves password whitespace (does not trim)", async ({
		registeredUser: validUser,
		loginUser,
	}) => {
		// Try to login with spaces around password
		const loginResponse = await loginUser({
			email: validUser.email,
			password: ` ${validUser.password} `,
		});

		expect(loginResponse.status()).toBe(StatusCodes.UNAUTHORIZED);
		const body = await loginResponse.json();
		expect(body.error).toBe("Invalid email or password");
	});

	test("Rejects malformed JSON", async ({ api }) => {
		const response = await api.post("/api/login", {
			headers: { "Content-Type": "application/json" },
			data: "{ invalid",
		});

		expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
	});
});
