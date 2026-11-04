import type { Page } from "@playwright/test";

export class TermsPage {
	constructor(readonly page: Page) {}

	get heading() {
		return this.page.getByRole("heading", { level: 1 });
	}

	get termSections() {
		return this.page.locator(".terms-card");
	}

	get footerTermsLink() {
		return this.page
			.getByRole("navigation", { name: "Footer" })
			.getByRole("link", { name: "Terms & Conditions", exact: true });
	}

	get homeNavLink() {
		return this.page
			.getByRole("navigation", { name: "Main" })
			.getByRole("link", { name: "Home", exact: true });
	}

	get shopNavLink() {
		return this.page
			.getByRole("navigation", { name: "Main" })
			.getByRole("link", { name: "Shop", exact: true });
	}

	termSection(title: string) {
		return this.termSections.filter({
			has: this.page.getByRole("heading", { name: title }),
		});
	}

	async goto() {
		await this.page.goto("/terms");
	}

	async clickFooterTerms() {
		await this.footerTermsLink.click();
	}
}
