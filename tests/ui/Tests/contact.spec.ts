import { expect, test } from "@playwright/test";
import { ContactPage } from "../Pages/contact.page";

const contactDetails = {
	email: "support@cuecorner.com",
	phone: "+1 (555) 123-4567",
	address: "123 Pool Lane, Billiard City, BC 12345",
};

test.describe("Contact Us UI", () => {
	test("Navigates to the Contact Us page from the footer link", async ({
		page,
	}) => {
		const contactPage = new ContactPage(page);

		await page.goto("/");
		await expect(contactPage.footerContactLink).toBeVisible();
		await expect(contactPage.footerContactLink).toHaveAttribute(
			"href",
			"/contact",
		);
		await contactPage.clickFooterContact();

		await expect(page).toHaveURL("/contact");
		await expect(contactPage.heading).toHaveText("Contact Us");
	});

	test("Displays the heading and all three contact method cards", async ({
		page,
	}) => {
		const contactPage = new ContactPage(page);

		await contactPage.goto();

		await expect(contactPage.heading).toBeVisible();
		await expect(contactPage.heading).toHaveText("Contact Us");
		await expect(contactPage.contactCards).toHaveCount(3);
	});

	test("Displays email contact information with proper formatting", async ({
		page,
	}) => {
		const contactPage = new ContactPage(page);

		await contactPage.goto();

		await expect(contactPage.emailCard).toBeVisible();
		await expect(contactPage.emailIcon).toBeVisible();
		await expect(contactPage.emailValue).toHaveText(contactDetails.email);
	});

	test("Displays phone contact information with proper formatting", async ({
		page,
	}) => {
		const contactPage = new ContactPage(page);

		await contactPage.goto();

		await expect(contactPage.phoneCard).toBeVisible();
		await expect(contactPage.phoneIcon).toBeVisible();
		await expect(contactPage.phoneValue).toHaveText(contactDetails.phone);
	});

	test("Displays address contact information with proper formatting", async ({
		page,
	}) => {
		const contactPage = new ContactPage(page);

		await contactPage.goto();

		await expect(contactPage.addressCard).toBeVisible();
		await expect(contactPage.addressIcon).toBeVisible();
		await expect(contactPage.addressValue).toHaveText(contactDetails.address);
	});

	const viewports = [
		{ name: "desktop", width: 1280, height: 800, stacked: false },
		{ name: "tablet", width: 820, height: 1180, stacked: false },
		{ name: "mobile", width: 375, height: 667, stacked: true },
	];

	for (const viewport of viewports) {
		test(`Layout is usable on ${viewport.name}`, async ({ page }) => {
			const contactPage = new ContactPage(page);
			await page.setViewportSize({
				width: viewport.width,
				height: viewport.height,
			});

			await contactPage.goto();

			await expect(contactPage.heading).toBeVisible();
			await expect(contactPage.contactCards).toHaveCount(3);

			const noHorizontalScroll = await page.evaluate(
				() =>
					document.documentElement.scrollWidth <=
					document.documentElement.clientWidth,
			);
			expect(noHorizontalScroll).toBe(true);

			const first = await contactPage.contactCards.nth(0).boundingBox();
			const second = await contactPage.contactCards.nth(1).boundingBox();
			if (!first || !second)
				throw new Error("Contact cards have no layout box");

			if (viewport.stacked) {
				expect(second.y).toBeGreaterThan(first.y + first.height - 1);
			} else {
				expect(Math.abs(second.y - first.y)).toBeLessThan(2);
			}

			for (const box of [first, second]) {
				expect(box.x).toBeGreaterThanOrEqual(0);
				expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
			}
		});
	}

	test("Navigates to other pages and back to Contact Us", async ({ page }) => {
		const contactPage = new ContactPage(page);

		await contactPage.goto();

		await contactPage.homeNavLink.click();
		await expect(page).toHaveURL("/");

		await contactPage.clickFooterContact();
		await expect(page).toHaveURL("/contact");
		await expect(contactPage.heading).toBeVisible();

		await page.goBack();
		await expect(page).toHaveURL("/");

		await page.goForward();
		await expect(page).toHaveURL("/contact");
		await expect(contactPage.contactCards).toHaveCount(3);
	});

	test("Call-to-action button navigates to Shop page", async ({ page }) => {
		const contactPage = new ContactPage(page);

		await contactPage.goto();

		await expect(contactPage.shopButton).toBeVisible();
		await contactPage.clickShopButton();

		await expect(page).toHaveURL(/\/shop/);
	});
});
