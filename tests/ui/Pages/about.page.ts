import type { Page } from "@playwright/test";

export class AboutPage {
	constructor(readonly page: Page) {}

	get heading() {
		return this.page.getByRole("heading", { level: 1 });
	}

	get missionHeading() {
		return this.page.getByTestId("mission-title");
	}

	get missionText() {
		return this.page.locator(".mission-text");
	}

	get teamHeading() {
		return this.page.getByTestId("team-title");
	}

	get teamCards() {
		return this.page.locator(".team-card");
	}

	get footerAboutLink() {
		return this.page
			.getByRole("navigation", { name: "Footer" })
			.getByRole("link", { name: "About Us", exact: true });
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

	teamCard(name: string) {
		return this.teamCards.filter({
			has: this.page.getByRole("heading", { name, exact: true }),
		});
	}

	async goto() {
		await this.page.goto("/about");
	}

	async clickFooterAbout() {
		await this.footerAboutLink.click();
	}
}
