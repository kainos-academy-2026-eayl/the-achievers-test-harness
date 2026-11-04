import { expect, test } from "@playwright/test";
import { TermsPage } from "../Pages/terms.page";

const termSections = [
	"The Calluminator Disclaimer",
	"Refund Policy",
	"Support & Liability",
	"Responsible Use",
	"Use of Website",
];

test.describe("Terms & Conditions UI", () => {
	test("Navigates to the Terms & Conditions page from the footer link", async ({
		page,
	}) => {
		const termsPage = new TermsPage(page);

		await page.goto("/");
		await expect(termsPage.footerTermsLink).toBeVisible();
		await expect(termsPage.footerTermsLink).toHaveAttribute("href", "/terms");
		await termsPage.clickFooterTerms();

		await expect(page).toHaveURL("/terms");
		await expect(termsPage.heading).toHaveText("Terms & Conditions");
	});

	test("Displays the page heading", async ({ page }) => {
		const termsPage = new TermsPage(page);

		await termsPage.goto();

		await expect(termsPage.heading).toBeVisible();
		await expect(termsPage.heading).toHaveText("Terms & Conditions");
	});

	test("Displays all five term sections with content", async ({ page }) => {
		const termsPage = new TermsPage(page);

		await termsPage.goto();

		await expect(termsPage.termSections).toHaveCount(termSections.length);

		for (const section of termSections) {
			const sectionElement = termsPage.termSection(section);
			await expect(sectionElement).toBeVisible();
			await expect(sectionElement.locator("p")).not.toBeEmpty();
		}
	});

	const viewports = [
		{ name: "desktop", width: 1280, height: 800 },
		{ name: "tablet", width: 820, height: 1180 },
		{ name: "mobile", width: 375, height: 667 },
	];

	for (const viewport of viewports) {
		test(`Layout is usable on ${viewport.name}`, async ({ page }) => {
			const termsPage = new TermsPage(page);
			await page.setViewportSize({
				width: viewport.width,
				height: viewport.height,
			});

			await termsPage.goto();

			await expect(termsPage.heading).toBeVisible();
			await expect(termsPage.termSections).toHaveCount(termSections.length);

			const noHorizontalScroll = await page.evaluate(
				() =>
					document.documentElement.scrollWidth <=
					document.documentElement.clientWidth,
			);
			expect(noHorizontalScroll).toBe(true);

			// Verify all sections are visible and within viewport bounds
			for (let i = 0; i < termSections.length; i++) {
				const box = await termsPage.termSections.nth(i).boundingBox();
				if (!box) throw new Error("Term section has no layout box");
				expect(box.x).toBeGreaterThanOrEqual(0);
				expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
			}
		});
	}

	test("Navigates to other pages and back to Terms & Conditions", async ({
		page,
	}) => {
		const termsPage = new TermsPage(page);

		await termsPage.goto();

		await termsPage.shopNavLink.click();
		await expect(page).toHaveURL(/\/shop/);

		await termsPage.clickFooterTerms();
		await expect(page).toHaveURL("/terms");
		await expect(termsPage.heading).toBeVisible();

		await termsPage.homeNavLink.click();
		await expect(page).toHaveURL("/");

		await page.goBack();
		await expect(page).toHaveURL("/terms");
		await expect(termsPage.termSections).toHaveCount(termSections.length);
	});
});
