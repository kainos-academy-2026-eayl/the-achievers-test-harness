import { randomUUID } from "node:crypto";
import type { APIRequestContext, APIResponse } from "@playwright/test";
import { StatusCodes } from "http-status-codes";
import {
	expect,
	test,
	type LoginPayload,
	type LoginResponse,
} from "../Fixtures/login-api.fixture";
import { setTestAccountCredit } from "../../helpers/test-database.helper";

const productId = "chalk-tip-kit";
const shippingAddress = {
	addressLine1: "23 API Test Street",
	addressLine2: null,
	city: "Testville",
	postcode: "SW1A 1AA",
};

type AuthorizationHeaders = { Authorization: string };
type LoginAction = (payload: LoginPayload) => Promise<APIResponse>;

async function getAuthorizationHeaders(
	loginUser: LoginAction,
	credentials: LoginPayload,
): Promise<AuthorizationHeaders> {
	const response = await loginUser(credentials);
	expect(response.status()).toBe(StatusCodes.OK);
	const body = (await response.json()) as LoginResponse;
	return { Authorization: `Bearer ${body.accessToken}` };
}

async function addProductToCart(
	api: APIRequestContext,
	cartId: string,
): Promise<void> {
	const response = await api.post("/api/cart/items", {
		headers: { "X-Cart-Id": cartId },
		data: { productId, quantity: 1 },
	});
	expect(response.status()).toBe(StatusCodes.OK);
}

async function placeOrder(
	api: APIRequestContext,
	cartId: string,
	authorization: AuthorizationHeaders,
	address: unknown = shippingAddress,
): Promise<APIResponse> {
	return api.post("/api/orders", {
		headers: { ...authorization, "X-Cart-Id": cartId },
		data: { shippingAddress: address },
	});
}

test.describe("/api/orders", () => {
	test("creates an order, reduces credit, and clears the cart", async ({
		api,
		registeredUser,
		loginUser,
	}) => {
		const authorization = await getAuthorizationHeaders(
			loginUser,
			registeredUser,
		);
		const cartId = randomUUID();
		await addProductToCart(api, cartId);

		const response = await placeOrder(api, cartId, authorization);
		expect(response.status()).toBe(StatusCodes.CREATED);
		const order = await response.json();
		expect(order).toMatchObject({
			status: "placed",
			items: [
				{
					productId,
					name: "Chalk & Tip Kit",
					price: 14.99,
					quantity: 1,
				},
			],
			subtotal: 14.99,
			shipping: 4.99,
			total: 19.98,
			shippingAddress,
		});
		expect(order.reference).toMatch(/^ORD-[A-Z0-9]{8}$/);
		expect(Date.parse(order.createdAt)).not.toBeNaN();

		const storedOrder = await api.get(`/api/orders/${order.id}`, {
			headers: authorization,
		});
		expect(storedOrder.status()).toBe(StatusCodes.OK);
		expect((await storedOrder.json()).reference).toBe(order.reference);

		const cart = await api.get("/api/cart", {
			headers: { "X-Cart-Id": cartId },
		});
		expect(cart.status()).toBe(StatusCodes.OK);
		expect((await cart.json()).items).toEqual([]);

		const profile = await api.get("/api/me", { headers: authorization });
		expect(profile.status()).toBe(StatusCodes.OK);
		expect((await profile.json()).creditBalance).toBeCloseTo(99980.02, 2);
	});

	test("requires authentication to place an order", async ({ api }) => {
		const cartId = randomUUID();
		await addProductToCart(api, cartId);

		const response = await api.post("/api/orders", {
			headers: { "X-Cart-Id": cartId },
			data: { shippingAddress },
		});
		expect(response.status()).toBe(StatusCodes.UNAUTHORIZED);
	});

	test("rejects an invalid cart id", async ({
		api,
		loginUser,
		registeredUser,
	}) => {
		const authorization = await getAuthorizationHeaders(
			loginUser,
			registeredUser,
		);
		const response = await api.post("/api/orders", {
			headers: { ...authorization, "X-Cart-Id": "not-a-uuid" },
			data: { shippingAddress },
		});

		expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
		expect((await response.json()).error).toBe(
			"X-Cart-Id must be a valid UUID",
		);
	});

	test("rejects an invalid shipping address without changing the cart", async ({
		api,
		registeredUser,
		loginUser,
	}) => {
		const authorization = await getAuthorizationHeaders(
			loginUser,
			registeredUser,
		);
		const cartId = randomUUID();
		await addProductToCart(api, cartId);

		const response = await placeOrder(api, cartId, authorization, {
			addressLine1: "23 API Test Street",
			city: "Testville",
			postcode: "NOT A POSTCODE",
		});
		expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
		const body = await response.json();
		expect(body.fieldErrors["shippingAddress.postcode"]).toBe(
			"Enter a valid UK postcode, for example SW1A 1AA",
		);

		const cart = await api.get("/api/cart", {
			headers: { "X-Cart-Id": cartId },
		});
		expect((await cart.json()).items).toHaveLength(1);
	});

	test("rejects an empty cart", async ({ api, registeredUser, loginUser }) => {
		const authorization = await getAuthorizationHeaders(
			loginUser,
			registeredUser,
		);
		const response = await placeOrder(api, randomUUID(), authorization);

		expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
		expect((await response.json()).error).toBe("Cart is empty");
	});

	test("rejects insufficient credit without mutating the order or cart", async ({
		api,
		registeredUser,
		loginUser,
	}) => {
		await setTestAccountCredit(registeredUser.email, 1997);
		const authorization = await getAuthorizationHeaders(
			loginUser,
			registeredUser,
		);
		const cartId = randomUUID();
		await addProductToCart(api, cartId);

		const response = await placeOrder(api, cartId, authorization);
		expect(response.status()).toBe(StatusCodes.CONFLICT);
		expect((await response.json()).error).toBe("Not enough account credit");

		const profile = await api.get("/api/me", { headers: authorization });
		expect((await profile.json()).creditBalance).toBe(19.97);

		const cart = await api.get("/api/cart", {
			headers: { "X-Cart-Id": cartId },
		});
		expect((await cart.json()).items).toHaveLength(1);

		const orders = await api.get("/api/orders", { headers: authorization });
		expect(await orders.json()).toEqual([]);
	});

	test("does not expose one user's order to another user", async ({
		api,
		registeredUser,
		loginUser,
		register,
	}) => {
		const ownerAuthorization = await getAuthorizationHeaders(
			loginUser,
			registeredUser,
		);
		const cartId = randomUUID();
		await addProductToCart(api, cartId);
		const createResponse = await placeOrder(api, cartId, ownerAuthorization);
		expect(createResponse.status()).toBe(StatusCodes.CREATED);
		const order = await createResponse.json();

		const otherUser = {
			...registeredUser,
			email: `order-reader-${randomUUID()}@example.com`,
		};
		const registerResponse = await register(otherUser);
		expect(registerResponse.status()).toBe(StatusCodes.CREATED);
		const otherAuthorization = await getAuthorizationHeaders(
			loginUser,
			otherUser,
		);

		const otherOrder = await api.get(`/api/orders/${order.id}`, {
			headers: otherAuthorization,
		});
		expect(otherOrder.status()).toBe(StatusCodes.NOT_FOUND);
		expect((await otherOrder.json()).error).toBe("Order not found");

		const otherOrders = await api.get("/api/orders", {
			headers: otherAuthorization,
		});
		expect(await otherOrders.json()).toEqual([]);
	});
});
