import type { Page } from "@playwright/test";

export class ResetPasswordPage {
	constructor(readonly page: Page) {}

	get heading() {
		return this.page.getByRole("heading", {
			name: "Reset your password",
			exact: true,
		});
	}

	get email() {
		return this.page.getByLabel("Email", { exact: true });
	}

	get safeWord() {
		return this.page.getByLabel("Safe Word", { exact: true });
	}

	get notice() {
		return this.page.locator("#reset-notice");
	}

	get loginLink() {
		return this.page.getByRole("link", { name: "Back to login", exact: true });
	}

	async goto() {
		await this.page.goto("/reset-pass");
	}

	async submit() {
		await this.page
			.getByRole("button", { name: "Submit", exact: true })
			.click();
	}

	async requestReset(email: string, safeWord = "") {
		await this.email.fill(email);
		await this.safeWord.fill(safeWord);
		await this.submit();
	}

	async clickLogin() {
		await this.loginLink.click();
	}
}
