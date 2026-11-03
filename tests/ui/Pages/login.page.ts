import type { Page } from "@playwright/test";

export class LoginPage {
	constructor(readonly page: Page) {}

	get email() {
		return this.page.getByLabel("Email", { exact: true });
	}

	get password() {
		return this.page.getByLabel("Password", { exact: true });
	}

	get notice() {
		return this.page.locator("#login-notice");
	}

	get registerLink() {
		return this.page
			.getByRole("main")
			.getByRole("link", { name: "Register", exact: true });
	}

	get forgotPasswordLink() {
		return this.page.getByRole("link", {
			name: "Forgot your password?",
			exact: true,
		});
	}

	async goto() {
		await this.page.goto("/login");
	}

	async submit() {
		await this.page.getByRole("button", { name: "Login" }).click();
	}

	async login(email: string, password: string) {
		await this.email.fill(email);
		await this.password.fill(password);
		await this.submit();
	}

	async clickRegister() {
		await this.registerLink.click();
	}
}
