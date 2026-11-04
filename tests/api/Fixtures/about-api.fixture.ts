import { test as base, type APIRequestContext } from "@playwright/test";

// The About Us page is served by the frontend, not the backend API.
export const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:8000";

type AboutFixtures = {
    web: APIRequestContext;
};

export const test = base.extend<AboutFixtures>({
    web: async ({ playwright }, use) => {
        const web = await playwright.request.newContext({
            baseURL: FRONTEND_URL,
        });
        await use(web);
        await web.dispose();
    },
});

export { expect } from "@playwright/test";
