import { StatusCodes } from "http-status-codes";
import { expect, test } from "../Fixtures/terms-api.fixture";

const termSections = [
	"The Calluminator Disclaimer",
	"Refund Policy",
	"Support & Liability",
	"Responsible Use",
	"Use of Website",
];

test.describe("GET /terms", () => {
	test("Returns the Terms & Conditions page as HTML", async ({ web }) => {
		const response = await web.get("/terms");

		expect(response.status()).toBe(StatusCodes.OK);
		expect(response.headers()["content-type"]).toContain("text/html");
		const html = await response.text();
		expect(html).toContain("Terms &amp; Conditions | Cue Corner");
		expect(html).toContain("Terms & Conditions");
	});

	test("Renders all five term sections", async ({ web }) => {
		const response = await web.get("/terms");
		const html = await response.text();

		expect(response.status()).toBe(StatusCodes.OK);
		for (const section of termSections) {
			expect(html).toContain(section);
		}
	});

	test("Serves the Terms & Conditions stylesheet", async ({ web }) => {
		const stylesheet = await web.get("/css/terms.css");
		expect(stylesheet.status()).toBe(StatusCodes.OK);
		expect(stylesheet.headers()["content-type"]).toContain("text/css");
	});

	test("Page contains properly formatted content sections", async ({ web }) => {
		const response = await web.get("/terms");
		const html = await response.text();

		expect(response.status()).toBe(StatusCodes.OK);
		// Verify section containers exist
		expect(html.match(/class="terms-card"/g)).toBeTruthy();
		// Verify headings exist
		expect(html.match(/<h2>/g)).toBeTruthy();
	});
});
