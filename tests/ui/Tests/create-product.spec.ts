import { randomUUID } from "node:crypto";
import { type Page, expect, test } from "@playwright/test";
import { StatusCodes } from "http-status-codes";
import { getAdminCredentials } from "../../helpers/admin.helper";
import { generateValidUser, registerUser } from "../../helpers/user.helper";
import {
    CreateProductPage,
    type ProductFormValues,
} from "../Pages/create-product.page";
import { LoginPage } from "../Pages/login.page";

function generateProduct(): ProductFormValues {
    return {
        name: `Harness Cue ${randomUUID()}`,
        description: "A balanced maple cue.",
        category: "Cues",
        price: "89.99",
    };
}

async function loginAs(page: Page, email: string, password: string) {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);
}

test.describe("Create product UI", () => {
    test("Admin creates a product from the dashboard", async ({ page }) => {
        const { email, password } = getAdminCredentials();
        const product = generateProduct();
        const createPage = new CreateProductPage(page);
        await loginAs(page, email, password);
        await expect(page).toHaveURL("/admin");

        await page
            .getByRole("link", { name: "Create product", exact: true })
            .click();
        await expect(page).toHaveURL("/admin/products/new");
        await createPage.fill(product);
        await createPage.submit();

        await expect(page).toHaveURL("/admin?created=1");
        await expect(
            page.getByText("Product created successfully.", { exact: true }),
        ).toBeVisible();
        await expect(
            page.getByRole("table").getByText(product.name, { exact: true }),
        ).toBeVisible();
    });

    test("Rejects a whitespace-only name and keeps the other details", async ({
        page,
    }) => {
        const { email, password } = getAdminCredentials();
        const product = { ...generateProduct(), name: "   " };
        const createPage = new CreateProductPage(page);
        await loginAs(page, email, password);
        await createPage.goto();
        await createPage.fill(product);

        await createPage.submit();

        await expect(page).toHaveURL("/admin/products");
        await expect(createPage.formError).toContainText(
            "Please fix the errors below.",
        );
        await expect(createPage.fields.name).toHaveAttribute(
            "aria-invalid",
            "true",
        );
        await expect(createPage.fields.description).toHaveValue(
            product.description,
        );
    });

    test("Blocks a non-admin user from the product form", async ({ page }) => {
        const user = generateValidUser();
        await registerUser(user);
        await loginAs(page, user.email, user.password);
        await expect(page).toHaveURL("/");

        const response = await page.goto("/admin/products/new");

        expect(response?.status()).toBe(StatusCodes.FORBIDDEN);
        await expect(
            page.getByRole("heading", { name: "Not allowed", exact: true }),
        ).toBeVisible();
    });

    test("Sends anonymous visitors to login", async ({ page }) => {
        await page.goto("/admin/products/new");

        await expect(page).toHaveURL("/login");
    });
});
