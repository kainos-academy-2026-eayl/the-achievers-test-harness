import { StatusCodes } from "http-status-codes";
import {
    test,
    expect,
    type LoginResponse,
    type ProductResponse,
} from "../Fixtures/create-product-api.fixture";

test.describe("POST /api/products", () => {
    test("Admin creates a product that can be fetched by its location", async ({
        adminToken,
        productPayload,
        createProduct,
        api,
    }) => {
        const response = await createProduct(productPayload, adminToken);

        expect(response.status()).toBe(StatusCodes.CREATED);
        const location = response.headers().location ?? "";
        expect(location).toMatch(/^\/api\/products\/.+/);
        const created = (await response.json()) as ProductResponse;
        expect(created).toMatchObject({
            name: productPayload.name,
            description: productPayload.description,
            category: productPayload.category,
            price: 89.99,
            rating: null,
            reviewCount: 0,
        });

        const fetched = await api.get(location);
        expect(fetched.status()).toBe(StatusCodes.OK);
        expect(await fetched.json()).toMatchObject({
            id: created.id,
            name: productPayload.name,
        });
    });

    test("Rejects a request without a token", async ({
        productPayload,
        createProduct,
    }) => {
        const response = await createProduct(productPayload);

        expect(response.status()).toBe(StatusCodes.UNAUTHORIZED);
        expect(await response.json()).toEqual({
            error: "Authentication required",
        });
    });

    test("Rejects an invalid token", async ({
        productPayload,
        createProduct,
    }) => {
        const response = await createProduct(productPayload, "invalid");

        expect(response.status()).toBe(StatusCodes.UNAUTHORIZED);
        expect(await response.json()).toEqual({
            error: "Invalid or expired token",
        });
    });

    test("Rejects a valid non-admin token", async ({
        registeredUser,
        loginUser,
        productPayload,
        createProduct,
    }) => {
        const login = await loginUser({
            email: registeredUser.email,
            password: registeredUser.password,
        });
        expect(login.status()).toBe(StatusCodes.OK);
        const { accessToken } = (await login.json()) as LoginResponse;

        const response = await createProduct(productPayload, accessToken);

        expect(response.status()).toBe(StatusCodes.FORBIDDEN);
        expect(await response.json()).toEqual({
            error: "Admin access required",
        });
    });

    test("Rejects an invalid price with field errors", async ({
        adminToken,
        productPayload,
        createProduct,
    }) => {
        const response = await createProduct(
            { ...productPayload, price: "1.001" },
            adminToken,
        );

        expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
        const body = await response.json();
        expect(body.error).toBe("Validation failed");
        expect(body.fieldErrors).toHaveProperty("price");
    });
});
