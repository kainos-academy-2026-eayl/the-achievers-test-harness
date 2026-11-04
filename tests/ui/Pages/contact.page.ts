import type { Page } from "@playwright/test";

export class ContactPage {
	constructor(readonly page: Page) {}

	get heading() {
		return this.page.getByRole("heading", { level: 1 });
	}

	get contactCards() {
		return this.page.locator(".contact-card");
	}

	get emailCard() {
		return this.contactCards.filter({
			has: this.page.locator("h3").filter({ hasText: "Email" }),
		});
	}

	get phoneCard() {
		return this.contactCards.filter({
			has: this.page.locator("h3").filter({ hasText: "Phone" }),
		});
	}

	get addressCard() {
		return this.contactCards.filter({
			has: this.page.locator("h3").filter({ hasText: "Address" }),
		});
	}

	get emailIcon() {
		return this.emailCard.locator("svg");
	}

	get emailValue() {
		return this.emailCard.locator(".contact-value");
	}

	get phoneIcon() {
		return this.phoneCard.locator("svg");
	}

	get phoneValue() {
		return this.phoneCard.locator(".contact-value");
	}

	get addressIcon() {
		return this.addressCard.locator("svg");
	}

	get addressValue() {
		return this.addressCard.locator(".contact-value");
	}

	get shopButton() {
		return this.page.getByRole("link", { name: "Visit the Shop", exact: true });
	}

	get footerContactLink() {
		return this.page
			.getByRole("navigation", { name: "Footer" })
			.getByRole("link", { name: "Contact Us", exact: true });
	}

	get homeNavLink() {
		return this.page
			.getByRole("navigation", { name: "Main" })
			.getByRole("link", { name: "Home", exact: true });
	}

	async goto() {
		await this.page.goto("/contact");
	}

	async clickFooterContact() {
		await this.footerContactLink.click();
	}

	async clickShopButton() {
		await this.shopButton.click();
	}
}
