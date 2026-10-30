import type { Page } from "@playwright/test";
import type { RegisterPayload } from "../../api/Fixtures/register-api.fixture";

export class RegisterPage {
	constructor(readonly page: Page) {}

	get fields() {
		return {
			"registration-name": this.page.getByTestId("registration-name"),
			"registration-email": this.page.getByTestId("registration-email"),
			"registration-password": this.page.getByTestId("registration-password"),
			"registration-confirm-password": this.page.getByTestId(
				"registration-confirm-password",
			),
			"safe-word-hint": this.page.getByTestId("safe-word-hint"),
			"registration-safe-word": this.page.getByTestId("registration-safe-word"),
		};
	}

	get notice() {
		return this.page.getByTestId("registration-notice");
	}

	get loginLink() {
		return this.page.getByRole("main").getByRole("link", {
			name: "Login",
			exact: true,
		});
	}

	async goto() {
		await this.page.goto("/registration");
	}

	async fill(user: RegisterPayload) {
		await this.fields["registration-name"].fill(user.name);
		await this.fields["registration-email"].fill(user.email);
		await this.fields["registration-password"].fill(user.password);
		await this.fields["registration-confirm-password"].fill(user.password);
		if (user.safeWordHint) {
			await this.fields["safe-word-hint"].selectOption(user.safeWordHint);
		}
		await this.fields["registration-safe-word"].fill(user.safeWord);
	}

	async submit() {
		await this.page
			.getByRole("button", { name: "Register", exact: true })
			.click();
	}

	async submitAndWaitForResponse() {
		const response = this.page.waitForResponse(
			(response) =>
				new URL(response.url()).pathname === "/registration" &&
				response.request().method() === "POST",
		);
		await this.submit();
		return response;
	}
}
