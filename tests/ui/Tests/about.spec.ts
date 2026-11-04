import { expect, test } from "@playwright/test";
import { AboutPage } from "../Pages/about.page";

const teamMembers = [
	{ name: "Jack Luter", role: "Larper" },
	{ name: "Antidisestablishmentarianism Zacharska", role: "Not-Knower" },
	{ name: "Ryan Doherty", role: "Scroller" },
	{ name: "Sophia Toner", role: "Slacker" },
];

test.describe("About Us UI", () => {
	test("Navigates to the About Us page from the footer link", async ({
		page,
	}) => {
		const aboutPage = new AboutPage(page);

		await page.goto("/");
		await expect(aboutPage.footerAboutLink).toBeVisible();
		await expect(aboutPage.footerAboutLink).toHaveAttribute("href", "/about");
		await aboutPage.clickFooterAbout();

		await expect(page).toHaveURL("/about");
		await expect(aboutPage.heading).toHaveText("About Cue Corner");
	});

	test("Displays the heading, introduction and mission statement", async ({
		page,
	}) => {
		const aboutPage = new AboutPage(page);

		await aboutPage.goto();

		await expect(aboutPage.heading).toBeVisible();
		await expect(aboutPage.heading).toHaveText("About Cue Corner");
		await expect(aboutPage.missionHeading).toBeVisible();
		await expect(aboutPage.missionText).toBeVisible();
		await expect(aboutPage.missionText).toContainText("Cue Corner");
		await expect(aboutPage.missionText).toContainText("pool and snooker");
	});

	test("Displays all four team members with name, role, bio and image", async ({
		page,
	}) => {
		const aboutPage = new AboutPage(page);

		await aboutPage.goto();

		await expect(aboutPage.teamHeading).toHaveText("Meet the Team");
		await expect(aboutPage.teamCards).toHaveCount(teamMembers.length);

		for (const member of teamMembers) {
			const card = aboutPage.teamCard(member.name);
			await expect(card).toBeVisible();
			await expect(card.locator(".team-name")).toHaveText(member.name);
			await expect(card.locator(".team-role")).toHaveText(member.role);
			await expect(card.locator(".team-bio")).not.toBeEmpty();

			const image = card.getByRole("img", {
				name: `Photo of ${member.name}`,
			});
			await expect(image).toBeVisible();
			// Visible alone does not prove the file loaded.
			await expect
				.poll(() =>
					image.evaluate(
						(img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
					),
				)
				.toBe(true);
		}
	});

	const viewports = [
		{ name: "desktop", width: 1280, height: 800, stacked: false },
		{ name: "tablet", width: 820, height: 1180, stacked: false },
		{ name: "mobile", width: 375, height: 667, stacked: true },
	];

	for (const viewport of viewports) {
		test(`Layout is usable on ${viewport.name}`, async ({ page }) => {
			const aboutPage = new AboutPage(page);
			await page.setViewportSize({
				width: viewport.width,
				height: viewport.height,
			});

			await aboutPage.goto();

			await expect(aboutPage.heading).toBeVisible();
			await expect(aboutPage.teamCards).toHaveCount(teamMembers.length);

			const noHorizontalScroll = await page.evaluate(
				() =>
					document.documentElement.scrollWidth <=
					document.documentElement.clientWidth,
			);
			expect(noHorizontalScroll).toBe(true);

			const first = await aboutPage.teamCards.nth(0).boundingBox();
			const second = await aboutPage.teamCards.nth(1).boundingBox();
			if (!first || !second) throw new Error("Team cards have no layout box");

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

	test("Navigates to other pages and back to About Us", async ({ page }) => {
		const aboutPage = new AboutPage(page);

		await aboutPage.goto();

		await aboutPage.shopNavLink.click();
		await expect(page).toHaveURL(/\/shop/);

		await aboutPage.clickFooterAbout();
		await expect(page).toHaveURL("/about");
		await expect(aboutPage.heading).toBeVisible();

		await aboutPage.homeNavLink.click();
		await expect(page).toHaveURL("/");

		await page.goBack();
		await expect(page).toHaveURL("/about");
		await expect(aboutPage.teamCards).toHaveCount(teamMembers.length);
	});
});
