import { StatusCodes } from "http-status-codes";
import { expect, test } from "../Fixtures/contact-api.fixture";

const contactDetails = {
	email: "support@cuecorner.com",
	phone: "+1 (555) 123-4567",
	address: "123 Pool Lane, Billiard City, BC 12345",
};

test.describe("GET /contact", () => {
	test("Returns the Contact Us page as HTML", async ({ web }) => {
		const response = await web.get("/contact");

		expect(response.status()).toBe(StatusCodes.OK);
		expect(response.headers()["content-type"]).toContain("text/html");
		const html = await response.text();
		expect(html).toContain("<title>Contact Us | Cue Corner</title>");
		expect(html).toContain("Contact Us");
	});

	test("Renders all three contact method cards", async ({ web }) => {
		const response = await web.get("/contact");
		const html = await response.text();

		expect(response.status()).toBe(StatusCodes.OK);
		expect(html.match(/class="contact-card"/g)).toHaveLength(3);
		expect(html).toContain("contact-card");
		expect(html).toContain("contact-icon");
		expect(html).toContain("contact-content");
	});

	test("Contains correct email contact information", async ({ web }) => {
		const response = await web.get("/contact");
		const html = await response.text();

		expect(response.status()).toBe(StatusCodes.OK);
		expect(html).toContain(contactDetails.email);
		expect(html).toContain("Email");
	});

	test("Contains correct phone contact information", async ({ web }) => {
		const response = await web.get("/contact");
		const html = await response.text();

		expect(response.status()).toBe(StatusCodes.OK);
		expect(html).toContain(contactDetails.phone);
		expect(html).toContain("Phone");
	});

	test("Contains correct address contact information", async ({ web }) => {
		const response = await web.get("/contact");
		const html = await response.text();

		expect(response.status()).toBe(StatusCodes.OK);
		expect(html).toContain(contactDetails.address);
		expect(html).toContain("Address");
	});

	test("Serves the Contact Us stylesheet and SVG icons", async ({ web }) => {
		const response = await web.get("/contact");
		const html = await response.text();

		expect(response.status()).toBe(StatusCodes.OK);

		const stylesheet = await web.get("/css/contact.css");
		expect(stylesheet.status()).toBe(StatusCodes.OK);
		expect(stylesheet.headers()["content-type"]).toContain("text/css");

		const svgMatches = [...html.matchAll(/<svg[^>]*aria-hidden="true"/g)];
		expect(svgMatches.length).toBeGreaterThanOrEqual(3);
	});

	test("Renders call-to-action button with correct link", async ({ web }) => {
		const response = await web.get("/contact");
		const html = await response.text();

		expect(response.status()).toBe(StatusCodes.OK);
		expect(html).toContain("Visit the Shop");
		expect(html).toContain('href="/shop"');
	});

	test("Has proper semantic HTML structure and accessibility", async ({
		web,
	}) => {
		const response = await web.get("/contact");
		const html = await response.text();

		expect(response.status()).toBe(StatusCodes.OK);
		expect(html).toContain("Contact Us");
		expect(html).toContain("<nav");
		expect(html).toContain("<footer");
		expect(html).toContain("aria-labelledby");
		expect(html).toContain("role=");
	});
});
