import type { Page } from "@playwright/test";
import { expect, test } from "../../api/Fixtures/checkout.fixture";
import { CheckoutPage } from "../Pages/checkout.page";

async function addProductToCart(page: Page, productName: string) {
	await page.goto("/shop");
	await page
		.getByRole("button", {
			name: `Add ${productName} to cart`,
			exact: true,
		})
		.click();
	await expect(page).toHaveURL(/\/cart/);
}

test.describe("Order History", () => {
	test("shows a completed order in the customer's history", async ({
		page,
	}) => {
		await addProductToCart(page, "Chalk & Tip Kit");
		await addProductToCart(page, "Spot Training Cue Ball");
		await page.getByRole("link", { name: "Checkout", exact: true }).click();
		await expect(page).toHaveURL("/checkout");

		const checkoutPage = new CheckoutPage(page);
		await checkoutPage.fillDifferentAddress({
			addressLine1: "23 Test Street",
			city: "Testville",
			postcode: "SW1A 1AA",
		});
		await checkoutPage.fillDemoCard();
		await checkoutPage.placeOrder();

		await expect(page).toHaveURL(/\/orders\/[0-9a-f-]+$/i);
		const orderReference = page.getByText(/^ORD-[A-Z0-9]{8}$/);
		await expect(orderReference).toBeVisible();
		const reference = (await orderReference.textContent()) ?? "";

		await page
			.getByRole("link", { name: "View All Orders", exact: true })
			.click();

		await expect(page).toHaveURL("/orders");
		await expect(
			page.getByRole("heading", { name: "Order History", exact: true }),
		).toBeVisible();
		await expect(page.getByText(reference, { exact: true })).toBeVisible();
		await expect(
			page.getByText("Chalk & Tip Kit", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText("Spot Training Cue Ball", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText("Quantity: 1", { exact: true }).first(),
		).toBeVisible();
		await expect(page.getByText("Placed", { exact: true })).toBeVisible();
		await expect(page.getByText("£32.97", { exact: true })).toBeVisible();
	});

	test("shows the empty state for a new customer", async ({ page }) => {
		await page.goto("/orders");

		await expect(
			page.getByRole("heading", { name: "Order History", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: "You haven't placed any orders yet",
				exact: true,
			}),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: "Start shopping", exact: true }),
		).toHaveAttribute("href", "/shop");
	});
});
