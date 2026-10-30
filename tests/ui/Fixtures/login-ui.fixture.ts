import { test as base } from "../../api/Fixtures/register-api.fixture";
import { LoginPage } from "../Pages/login.page";

export const test = base.extend<{ loginPage: LoginPage }>({
	loginPage: async ({ page }, use) => {
		await use(new LoginPage(page));
	},
});

export { expect } from "@playwright/test";
