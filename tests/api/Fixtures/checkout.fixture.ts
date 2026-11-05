import { test as base, expect } from "@playwright/test";
import {
	generateValidUser,
	registerUser,
	type RegisterPayload,
} from "../../helpers/user.helper";
import { setTestAccountCredit } from "../../helpers/test-database.helper";
import { LoginPage } from "../../ui/Pages/login.page";

type CheckoutFixtures = {
	checkoutUser: RegisterPayload;
	setAccountCredit: (email: string, balancePence: number) => Promise<void>;
};

export const test = base.extend<CheckoutFixtures>({
	checkoutUser: [
		async ({ page }, use) => {
			const user = generateValidUser();
			await registerUser(user);

			const loginPage = new LoginPage(page);
			await loginPage.goto();
			await loginPage.login(user.email, user.password);

			await use(user);
		},
		{ auto: true },
	],
	// biome-ignore lint/correctness/noEmptyPattern: Playwright requires destructuring even when a fixture has no dependencies.
	setAccountCredit: async ({}, use) => {
		await use(setTestAccountCredit);
	},
});

export { expect };
