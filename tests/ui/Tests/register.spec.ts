import { StatusCodes } from "http-status-codes";
import { test, expect } from "../../api/Fixtures/register-api.fixture";

test("Successful registration with valid credentials", async ({ page }) => {
	await page.goto("/");
	// ...
	await page.getByRole("link", { name: "Login" }).click();
	await page.getByRole("link", { name: "Register" }).click();
	await page.getByTestId("registration-name").click();
	await page.getByTestId("registration-name").fill("Lee Service");
	await page.getByTestId("registration-email").click();
	await page
		.getByTestId("registration-email")
		.fill(`leeservice@gmail${Date.now()}.com`);
	await page.getByTestId("registration-password").click();
	await page.getByTestId("registration-password").fill("iamamazing123");
	await page.getByTestId("registration-confirm-password").click();
	await page.getByTestId("registration-confirm-password").fill("iamamazing123");
	await page.getByTestId("safe-word-hint").selectOption("favourite-movie");
	await page.getByTestId("registration-safe-word").click();
	await page.getByTestId("registration-safe-word").fill("cars");
	await page.getByRole("button", { name: "Register" }).click();
	await expect(
		page.locator("text=Your registration details were received."),
	).toBeVisible();
});

test("Registration fails with already used email", async ({
	page,
	register,
	validUser,
}) => {
	const response = await register(validUser);
	expect(response.status()).toBe(StatusCodes.CREATED);

	await page.goto("/");
	await page.getByRole("link", { name: "Login" }).click();
	await page.getByRole("link", { name: "Register" }).click();
	await page.getByTestId("registration-name").click();
	await page.getByTestId("registration-name").fill("Lee Service");
	await page.getByTestId("registration-email").click();
	await page.getByTestId("registration-email").fill(validUser.email);
	await page.getByTestId("registration-password").click();
	await page.getByTestId("registration-password").fill("iamamazing123");
	await page.getByTestId("registration-confirm-password").click();
	await page.getByTestId("registration-confirm-password").fill("iamamazing123");
	await page.getByTestId("safe-word-hint").selectOption("favourite-movie");
	await page.getByTestId("registration-safe-word").click();
	await page.getByTestId("registration-safe-word").fill("cars");
	await page.getByRole("button", { name: "Register" }).click();
	await expect(
		page.locator(
			"text=An account with this email already exists. Try logging in instead.",
		),
	).toBeVisible();
});
