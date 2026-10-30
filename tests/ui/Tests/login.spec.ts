import { test, expect } from "../Fixtures/login-ui.fixture";

test.describe("Login UI", () => {
	test("Successfully logs in with registered credentials", async ({
		page,
		loginPage,
		registeredUser: validUser,
	}) => {
		await loginPage.goto();
		await loginPage.login(validUser.email, validUser.password);

		await expect(page).toHaveURL("/");
	});

	test("Rejects an incorrect password, retains the email and clears the password", async ({
		page,
		loginPage,
		registeredUser: validUser,
	}) => {
		await loginPage.goto();
		await loginPage.login(`  ${validUser.email}  `, "wrongpassword123");

		await expect(page).toHaveURL("/login");
		await expect(loginPage.notice).toHaveAttribute("role", "alert");
		await expect(loginPage.notice).toHaveText("Invalid email or password");
		await expect(loginPage.email).toHaveValue(validUser.email);
		await expect(loginPage.password).toHaveValue("");
	});

	test("Displays error message with non-existent email", async ({
		page,
		loginPage,
	}) => {
		await loginPage.goto();
		await loginPage.login(
			`nonexistent${Date.now()}@example.com`,
			"iamamazing123",
		);

		await expect(page).toHaveURL("/login");
		await expect(loginPage.notice).toHaveAttribute("role", "alert");
		await expect(loginPage.notice).toHaveText("Invalid email or password");
	});

	test("Login page contains link to forgot password", async ({ loginPage }) => {
		await loginPage.goto();
		const forgotLink = loginPage.forgotPasswordLink;
		await expect(forgotLink).toBeVisible();
		await expect(forgotLink).toHaveAttribute("href", "/reset-pass");
	});

	test("Navigating to register link from login page works", async ({
		page,
		loginPage,
	}) => {
		await loginPage.goto();
		await expect(loginPage.registerLink).toBeVisible();
		await expect(loginPage.registerLink).toHaveAttribute(
			"href",
			"/registration",
		);
		await loginPage.clickRegister();

		await expect(page).toHaveURL("/registration");
	});
});
