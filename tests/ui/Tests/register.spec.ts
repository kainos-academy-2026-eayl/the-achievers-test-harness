import { StatusCodes } from "http-status-codes";
import { test, expect } from "../Fixtures/register-ui.fixture";

test.describe("Registration UI", () => {
	const requiredFields = [
		["name", "registration-name"],
		["email", "registration-email"],
		["password", "registration-password"],
		["password confirmation", "registration-confirm-password"],
		["safe word hint", "safe-word-hint"],
		["safe word", "registration-safe-word"],
	] as const;

	for (const [name, id] of requiredFields) {
		test(`Prevents submission without ${name}`, async ({
			page,
			registerPage,
			validUser,
		}) => {
			await registerPage.goto();
			await registerPage.fill(
				id === "safe-word-hint"
					? { ...validUser, safeWordHint: "" }
					: validUser,
			);

			const field = registerPage.fields[id];
			if (id !== "safe-word-hint") {
				await field.fill("");
			}
			await registerPage.submit();

			await expect(field).toBeFocused();
			expect(
				await field.evaluate(
					(element: HTMLInputElement | HTMLSelectElement) =>
						element.validity.valueMissing,
				),
			).toBe(true);
			await expect(page).toHaveURL("/registration");
		});
	}

	test("Prevents submission with an invalid email", async ({
		page,
		registerPage,
		validUser,
	}) => {
		await registerPage.goto();
		await registerPage.fill(validUser);
		const email = registerPage.fields["registration-email"];
		await email.fill("not-an-email");
		await registerPage.submit();

		await expect(email).toBeFocused();
		expect(
			await email.evaluate(
				(element: HTMLInputElement) => element.validity.typeMismatch,
			),
		).toBe(true);
		await expect(page).toHaveURL("/registration");
	});

	test("Rejects mismatched passwords, preserves details and clears secrets", async ({
		page,
		registerPage,
		validUser,
	}) => {
		await registerPage.goto();
		await registerPage.fill(validUser);
		await registerPage.fields["registration-confirm-password"].fill(
			"differentpassword123",
		);

		const response = await registerPage.submitAndWaitForResponse();
		expect(response.status()).toBe(StatusCodes.BAD_REQUEST);

		await expect(registerPage.notice).toHaveAttribute("role", "alert");
		await expect(registerPage.notice).toHaveText("Please fix the following:");
		await expect(
			page.getByText("Your passwords do not match.", { exact: true }),
		).toBeVisible();
		await expect(registerPage.fields["registration-name"]).toHaveValue(
			validUser.name,
		);
		await expect(registerPage.fields["registration-email"]).toHaveValue(
			validUser.email,
		);
		await expect(registerPage.fields["safe-word-hint"]).toHaveValue(
			validUser.safeWordHint,
		);
		for (const id of [
			"registration-password",
			"registration-confirm-password",
			"registration-safe-word",
		] as const) {
			await expect(registerPage.fields[id]).toHaveValue("");
		}
	});

	for (const [name, id, message] of [
		["name", "registration-name", "Enter your name."],
		["safe word", "registration-safe-word", "Enter a safe word."],
	] as const) {
		test(`Rejects a whitespace-only ${name}`, async ({
			page,
			registerPage,
			validUser,
		}) => {
			await registerPage.goto();
			await registerPage.fill(validUser);
			await registerPage.fields[id].fill("   ");

			const response = await registerPage.submitAndWaitForResponse();
			expect(response.status()).toBe(StatusCodes.BAD_REQUEST);

			await expect(registerPage.notice).toHaveAttribute("role", "alert");
			await expect(registerPage.notice).toHaveText("Please fix the following:");
			await expect(page.getByText(message, { exact: true })).toBeVisible();
		});
	}

	test("Navigates to login for an existing account", async ({
		page,
		registerPage,
	}) => {
		await registerPage.goto();
		await registerPage.loginLink.click();

		await expect(page).toHaveURL("/login");
		await expect(
			page.getByRole("heading", { name: "Login", exact: true }),
		).toBeVisible();
	});

	test("Successfully registers with valid credentials", async ({
		page,
		registerPage,
		validUser,
	}) => {
		await registerPage.goto();
		await registerPage.fill(validUser);

		const response = await registerPage.submitAndWaitForResponse();
		expect(response.status()).toBe(StatusCodes.ACCEPTED);
		await expect(
			page.getByText("Your registration details were received."),
		).toBeVisible();
	});

	test("Registration fails with already used email", async ({
		registerPage,
		registeredUser,
	}) => {
		await registerPage.goto();
		await registerPage.fill(registeredUser);
		const response = await registerPage.submitAndWaitForResponse();
		expect(response.status()).toBe(StatusCodes.CONFLICT);
		await expect(registerPage.notice).toHaveText(
			"An account with this email already exists. Try logging in instead.",
		);
	});
});
