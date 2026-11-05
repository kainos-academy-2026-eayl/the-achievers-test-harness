import { expect, test } from "@playwright/test";
import { generateValidUser } from "../../helpers/user.helper";
import { LoginPage } from "../Pages/login.page";
import { ResetPasswordPage } from "../Pages/reset-password.page";

test.describe("Reset password UI", () => {
	test("Shows the reset form with the demo notice", async ({ page }) => {
		const resetPage = new ResetPasswordPage(page);

		await resetPage.goto();

		await expect(resetPage.heading).toBeVisible();
		await expect(resetPage.email).toBeVisible();
		await expect(resetPage.safeWord).toBeVisible();
		await expect(resetPage.notice).toContainText(
			"Enter your email and the safe word",
		);
	});

	test("Blocks submission when the email is empty", async ({ page }) => {
		const resetPage = new ResetPasswordPage(page);

		await resetPage.goto();
		await resetPage.submit();

		await expect(page).toHaveURL("/reset-pass");
		expect(
			await resetPage.email.evaluate(
				(input: HTMLInputElement) => input.validity.valueMissing,
			),
		).toBe(true);
	});

	test("Blocks submission when the email is not a valid address", async ({
		page,
	}) => {
		const resetPage = new ResetPasswordPage(page);

		await resetPage.goto();
		await resetPage.requestReset("not-an-email");

		await expect(page).toHaveURL("/reset-pass");
		expect(
			await resetPage.email.evaluate(
				(input: HTMLInputElement) => input.validity.typeMismatch,
			),
		).toBe(true);
	});

	test("Shows an error for an unknown email and wrong safe word", async ({
		page,
	}) => {
		const { email } = generateValidUser();
		const resetPage = new ResetPasswordPage(page);

		await resetPage.goto();
		await resetPage.requestReset(email, "wrong-safe-word");

		await expect(resetPage.notice).toHaveAttribute("role", "alert");
		await expect(resetPage.email).toHaveValue(email);
	});

	test("Navigating to login from the back to login link works", async ({
		page,
	}) => {
		const resetPage = new ResetPasswordPage(page);

		await resetPage.goto();
		await expect(resetPage.loginLink).toHaveAttribute("href", "/login");
		await resetPage.clickLogin();

		await expect(page).toHaveURL("/login");
	});

	test("Navigating from the login page forgot password link works", async ({
		page,
	}) => {
		const loginPage = new LoginPage(page);
		const resetPage = new ResetPasswordPage(page);

		await loginPage.goto();
		await loginPage.forgotPasswordLink.click();

		await expect(page).toHaveURL("/reset-pass");
		await expect(resetPage.heading).toBeVisible();
	});
});
