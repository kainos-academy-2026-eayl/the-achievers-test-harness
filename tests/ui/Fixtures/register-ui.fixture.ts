import { test as base } from "../../api/Fixtures/register-api.fixture";
import { RegisterPage } from "../Pages/register.page";

export const test = base.extend<{ registerPage: RegisterPage }>({
	registerPage: async ({ page }, use) => {
		await use(new RegisterPage(page));
	},
});

export { expect } from "@playwright/test";
