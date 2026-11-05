import { randomUUID } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { test, expect } from "../Fixtures/reset-password-api.fixture";

test.describe("GET /api/safe-word-hint", () => {
	// The fixture may need to wait out the per-minute rate limit window.
	test.setTimeout(90_000);

	test("Returns the safe word hint of a registered email", async ({
		registeredUser,
		getSafeWordHint,
	}) => {
		const response = await getSafeWordHint(registeredUser.email);

		expect(response.status()).toBe(StatusCodes.OK);
		expect(await response.json()).toEqual({
			safeWordHint: registeredUser.safeWordHint,
		});
	});

	test("Returns not found for an unknown email", async ({
		validUser,
		getSafeWordHint,
	}) => {
		const response = await getSafeWordHint(validUser.email);

		expect(response.status()).toBe(StatusCodes.NOT_FOUND);
		expect(await response.json()).toEqual({
			error: "No safe word hint found for this email",
		});
	});

	test("Rejects an invalid email", async ({ getSafeWordHint }) => {
		const response = await getSafeWordHint("not-an-email");

		expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
		expect(await response.json()).toEqual({
			error: "A valid email is required",
		});
	});
});

test.describe("POST /api/reset-password/verify", () => {
	test("Accepts the correct safe word", async ({
		registeredUser,
		verifySafeWord,
	}) => {
		const response = await verifySafeWord({
			email: registeredUser.email,
			safeWord: registeredUser.safeWord,
		});

		expect(response.status()).toBe(StatusCodes.NO_CONTENT);
		expect(await response.text()).toBe("");
	});

	test("Rejects an incorrect safe word", async ({
		registeredUser,
		verifySafeWord,
	}) => {
		const response = await verifySafeWord({
			email: registeredUser.email,
			safeWord: "wrong-safe-word",
		});

		expect(response.status()).toBe(StatusCodes.UNAUTHORIZED);
		expect(await response.json()).toEqual({
			error: "Invalid email or safe word",
		});
	});

	test("Rejects an unknown email without revealing that it is unknown", async ({
		validUser,
		verifySafeWord,
	}) => {
		const response = await verifySafeWord({
			email: validUser.email,
			safeWord: validUser.safeWord,
		});

		expect(response.status()).toBe(StatusCodes.UNAUTHORIZED);
		expect(await response.json()).toEqual({
			error: "Invalid email or safe word",
		});
	});

	test("Rejects a blank safe word", async ({
		registeredUser,
		verifySafeWord,
	}) => {
		const response = await verifySafeWord({
			email: registeredUser.email,
			safeWord: "   ",
		});

		expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
		expect(await response.json()).toEqual({
			error: "A non-blank safe word is required",
		});
	});

	test("Rejects an invalid email", async ({ verifySafeWord }) => {
		const response = await verifySafeWord({
			// Attempts are counted per email for 15 minutes, so use a fresh invalid value.
			email: `not-an-email-${randomUUID()}`,
			safeWord: "cars",
		});

		expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
		expect(await response.json()).toEqual({
			error: "A valid email is required",
		});
	});
});

test.describe("POST /api/reset-password", () => {
	test("Resets the password so only the new one can log in", async ({
		registeredUser,
		resetPassword,
		loginUser,
	}) => {
		const newPassword = "brand-new-password-456";

		const response = await resetPassword({
			email: registeredUser.email,
			safeWord: registeredUser.safeWord,
			newPassword,
		});

		expect(response.status()).toBe(StatusCodes.NO_CONTENT);
		const newLogin = await loginUser({
			email: registeredUser.email,
			password: newPassword,
		});
		expect(newLogin.status()).toBe(StatusCodes.OK);
		const oldLogin = await loginUser({
			email: registeredUser.email,
			password: registeredUser.password,
		});
		expect(oldLogin.status()).toBe(StatusCodes.UNAUTHORIZED);
	});

	test("Rejects an incorrect safe word and keeps the password", async ({
		registeredUser,
		resetPassword,
		loginUser,
	}) => {
		const response = await resetPassword({
			email: registeredUser.email,
			safeWord: "wrong-safe-word",
			newPassword: "brand-new-password-456",
		});

		expect(response.status()).toBe(StatusCodes.UNAUTHORIZED);
		expect(await response.json()).toEqual({
			error: "Invalid email or safe word",
		});
		const login = await loginUser({
			email: registeredUser.email,
			password: registeredUser.password,
		});
		expect(login.status()).toBe(StatusCodes.OK);
	});

	test("Rejects a new password shorter than 12 characters", async ({
		registeredUser,
		resetPassword,
	}) => {
		const response = await resetPassword({
			email: registeredUser.email,
			safeWord: registeredUser.safeWord,
			newPassword: "short",
		});

		expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
		expect(await response.json()).toEqual({
			error: "Password must be at least 12 characters long",
		});
	});

	test("Rejects a new password longer than 128 characters", async ({
		registeredUser,
		resetPassword,
	}) => {
		const response = await resetPassword({
			email: registeredUser.email,
			safeWord: registeredUser.safeWord,
			newPassword: "a".repeat(129),
		});

		expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
		expect(await response.json()).toEqual({
			error: "Password must be no more than 128 characters long",
		});
	});
});
