import type { Page } from "@playwright/test";

export class CheckoutPage {
	constructor(readonly page: Page) {}

	get addressLine1() {
		return this.page.getByLabel("Address line 1", { exact: true });
	}

	get city() {
		return this.page.getByLabel("Town or city", { exact: true });
	}

	get postcode() {
		return this.page.getByLabel("Postcode", { exact: true });
	}

	get cardNumber() {
		return this.page.getByLabel("Card number", { exact: true });
	}

	get cardExpiry() {
		return this.page.getByLabel("Expiry", { exact: true });
	}

	get cardCvc() {
		return this.page.getByLabel("Security code", { exact: true });
	}

	get availableCredit() {
		return this.page.locator('[aria-label="Available account credit"] strong');
	}

	get remainingCredit() {
		return this.page.locator('[aria-label="Remaining account credit"] strong');
	}

	async fillDifferentAddress(address: {
		addressLine1: string;
		city: string;
		postcode: string;
	}) {
		await this.page
			.getByLabel("Use this address for this order", { exact: true })
			.check();
		await this.addressLine1.fill(address.addressLine1);
		await this.city.fill(address.city);
		await this.postcode.fill(address.postcode);
	}

	async fillDemoCard(cardNumber = "4242 4242 4242 4242") {
		await this.cardNumber.fill(cardNumber);
		await this.cardExpiry.fill("12/34");
		await this.cardCvc.fill("123");
	}

	async placeOrder() {
		await this.page
			.getByRole("button", { name: "Place order", exact: true })
			.click();
	}
}
