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

async function openCheckout(page: Page) {
    await page.getByRole("link", { name: "Checkout", exact: true }).click();
    await expect(page).toHaveURL("/checkout");
    await expect(
        page.getByRole("heading", { name: "Checkout", exact: true }),
    ).toBeVisible();
}

async function fillValidShippingAddress(checkoutPage: CheckoutPage) {
    await checkoutPage.fillDifferentAddress({
        addressLine1: "23 Test Street",
        city: "Testville",
        postcode: "SW1A 1AA",
    });
}

test.describe("Checkout", () => {
    test("places an order with multiple cart items", async ({ page }) => {
        await addProductToCart(page, "Chalk & Tip Kit");
        await addProductToCart(page, "Spot Training Cue Ball");
        await openCheckout(page);
        await expect(
            page.getByText("1 × Chalk & Tip Kit", { exact: true }),
        ).toBeVisible();
        await expect(
            page.getByText("1 × Spot Training Cue Ball", { exact: true }),
        ).toBeVisible();
        await expect(page.getByText("£32.97", { exact: true })).toBeVisible();
        await expect(page.getByText("£100,000.00", { exact: true })).toBeVisible();

        const checkoutPage = new CheckoutPage(page);
        await expect(checkoutPage.availableCredit).toHaveText("£100,000.00");
        await fillValidShippingAddress(checkoutPage);
        await checkoutPage.fillDemoCard();
        await checkoutPage.placeOrder();

        await expect(page).toHaveURL(/\/orders\/[0-9a-f-]+$/i);
        await expect(
            page.getByRole("heading", { name: "Thank you for your order" }),
        ).toBeVisible();
        await expect(
            page.getByText("1 × Chalk & Tip Kit", { exact: true }),
        ).toBeVisible();
        await expect(
            page.getByText("1 × Spot Training Cue Ball", { exact: true }),
        ).toBeVisible();
        await expect(page.getByText("£32.97", { exact: true })).toBeVisible();
        await expect(checkoutPage.remainingCredit).toHaveText("£99,967.03");
        const shippingAddress = page.getByRole("region", {
            name: "Shipping address",
        });
        await expect(shippingAddress).toContainText("23 Test Street");
        await expect(shippingAddress).toContainText("Testville");
        await expect(shippingAddress).toContainText("SW1A 1AA");

        const orderReference = page.getByText(/^ORD-[A-Z0-9]{8}$/);
        await expect(orderReference).toBeVisible();
        const reference = (await orderReference.textContent()) ?? "";
        expect(reference).toMatch(/^ORD-[A-Z0-9]{8}$/);
        await page.reload();
        await expect(page.getByText(reference, { exact: true })).toBeVisible();

        await page.goto("/cart");
        await expect(
            page.getByRole("heading", { name: "Your cart is empty" }),
        ).toBeVisible();
    });

    test("allows spending the exact balance, then rejects another order", async ({
        page,
        checkoutUser,
        setAccountCredit,
    }) => {
        await setAccountCredit(checkoutUser.email, 1998);
        await addProductToCart(page, "Chalk & Tip Kit");
        await openCheckout(page);

        const checkoutPage = new CheckoutPage(page);
        await expect(checkoutPage.availableCredit).toHaveText("£19.98");
        await fillValidShippingAddress(checkoutPage);
        await checkoutPage.fillDemoCard();
        await checkoutPage.placeOrder();

        await expect(page).toHaveURL(/\/orders\/[0-9a-f-]+$/i);
        await expect(checkoutPage.remainingCredit).toHaveText("£0.00");

        await addProductToCart(page, "Chalk & Tip Kit");
        await openCheckout(page);
        await expect(checkoutPage.availableCredit).toHaveText("£0.00");
        await fillValidShippingAddress(checkoutPage);
        await checkoutPage.fillDemoCard();
        await checkoutPage.placeOrder();

        await expect(page).toHaveURL("/checkout");
        await expect(
            page.getByRole("alert").filter({ hasText: "Not enough account credit" }),
        ).toBeVisible();
        await expect(checkoutPage.availableCredit).toHaveText("£0.00");
        await expect(
            page.getByText("1 × Chalk & Tip Kit", { exact: true }),
        ).toBeVisible();
    });

    test("rejects an order one penny above the available credit", async ({
        page,
        checkoutUser,
        setAccountCredit,
    }) => {
        await setAccountCredit(checkoutUser.email, 1997);
        await addProductToCart(page, "Chalk & Tip Kit");
        await openCheckout(page);

        const checkoutPage = new CheckoutPage(page);
        await expect(checkoutPage.availableCredit).toHaveText("£19.97");
        await expect(page.locator(".checkout-grand-total strong")).toHaveText(
            "£19.98",
        );
        await fillValidShippingAddress(checkoutPage);
        await checkoutPage.fillDemoCard();
        await checkoutPage.placeOrder();

        await expect(page).toHaveURL("/checkout");
        await expect(
            page.getByRole("alert").filter({ hasText: "Not enough account credit" }),
        ).toBeVisible();
        await expect(checkoutPage.availableCredit).toHaveText("£19.97");
        await expect(
            page.getByText("1 × Chalk & Tip Kit", { exact: true }),
        ).toBeVisible();
    });

    test("rejects an invalid shipping postcode without placing an order", async ({
        page,
    }) => {
        await addProductToCart(page, "Chalk & Tip Kit");
        await openCheckout(page);

        const checkoutPage = new CheckoutPage(page);
        await checkoutPage.fillDifferentAddress({
            addressLine1: "23 Test Street",
            city: "Testville",
            postcode: "NOT A POSTCODE",
        });
        await checkoutPage.fillDemoCard();
        await checkoutPage.placeOrder();

        await expect(page).toHaveURL("/checkout");
        await expect(
            page
                .getByRole("alert")
                .filter({ hasText: "Check your shipping address and try again." }),
        ).toBeVisible();
        await expect(
            page.getByText("Enter a valid UK postcode, for example SW1A 1AA"),
        ).toBeVisible();
        await expect(checkoutPage.availableCredit).toHaveText("£100,000.00");
        await expect(
            page.getByText("1 × Chalk & Tip Kit", { exact: true }),
        ).toBeVisible();
    });

    test("rejects invalid demo card details without placing an order", async ({
        page,
    }) => {
        await addProductToCart(page, "Chalk & Tip Kit");
        await openCheckout(page);

        const checkoutPage = new CheckoutPage(page);
        await fillValidShippingAddress(checkoutPage);
        await checkoutPage.fillDemoCard("4111 1111 1111 1111");
        await checkoutPage.placeOrder();

        await expect(page).toHaveURL("/checkout");
        await expect(
            page.getByRole("alert").filter({
                hasText: "Check the highlighted details before placing your order.",
            }),
        ).toBeVisible();
        await expect(
            page.getByRole("alert").filter({
                hasText: "Enter the demo card details shown above.",
            }),
        ).toBeVisible();
        await expect(checkoutPage.availableCredit).toHaveText("£100,000.00");
        await expect(
            page.getByText("1 × Chalk & Tip Kit", { exact: true }),
        ).toBeVisible();
    });

    test("uses a saved profile address for the order", async ({
        page,
        checkoutUser,
    }) => {
        await page.goto("/profile");
        await page.locator("#profile-home-addressLine1").fill("23 Saved Street");
        await page.locator("#profile-home-city").fill("Savedtown");
        await page.locator("#profile-home-postcode").fill("SW1A 1AA");
        await page
            .getByLabel("Current password", { exact: true })
            .fill(checkoutUser.password);
        await page
            .getByRole("button", { name: "Save changes", exact: true })
            .click();
        await expect(page).toHaveURL(/\/profile\?updated=1$/);
        await expect(
            page
                .getByRole("status")
                .filter({ hasText: "Your profile has been updated." }),
        ).toBeVisible();

        await addProductToCart(page, "Chalk & Tip Kit");
        await openCheckout(page);

        const checkoutPage = new CheckoutPage(page);
        const savedAddress = page.getByRole("radio", { name: /Home address/ });
        await expect(savedAddress).toBeChecked();
        await checkoutPage.fillDemoCard();
        await checkoutPage.placeOrder();

        await expect(page).toHaveURL(/\/orders\/[0-9a-f-]+$/i);
        const shippingAddress = page.getByRole("region", {
            name: "Shipping address",
        });
        await expect(shippingAddress).toContainText("23 Saved Street");
        await expect(shippingAddress).toContainText("Savedtown");
        await expect(shippingAddress).toContainText("SW1A 1AA");
    });
});
