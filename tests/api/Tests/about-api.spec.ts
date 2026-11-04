import { StatusCodes } from "http-status-codes";
import { expect, test } from "../Fixtures/about-api.fixture";

const teamNames = [
	"Jack Luter",
	"Antidisestablishmentarianism Zacharska",
	"Ryan Doherty",
	"Sophia Toner",
];

test.describe("GET /about", () => {
	test("Returns the About Us page as HTML", async ({ web }) => {
		const response = await web.get("/about");

		expect(response.status()).toBe(StatusCodes.OK);
		expect(response.headers()["content-type"]).toContain("text/html");
		const html = await response.text();
		expect(html).toContain("<title>About Us | Cue Corner</title>");
		expect(html).toContain("About Cue Corner");
		expect(html).toContain("Our Mission");
		expect(html).toContain("Meet the Team");
	});

	test("Renders all four team members", async ({ web }) => {
		const response = await web.get("/about");
		const html = await response.text();

		expect(response.status()).toBe(StatusCodes.OK);
		expect(html.match(/class="team-card"/g)).toHaveLength(teamNames.length);
		for (const name of teamNames) {
			expect(html).toContain(name);
		}
	});

	test("Serves the About Us stylesheet and team images", async ({ web }) => {
		const response = await web.get("/about");
		const html = await response.text();

		const stylesheet = await web.get("/css/about.css");
		expect(stylesheet.status()).toBe(StatusCodes.OK);
		expect(stylesheet.headers()["content-type"]).toContain("text/css");

		const sources = [
			...html.matchAll(/src="(\/css\/images\/[^"]+)"[^>]*class="team-image"/g),
		].map((match) => match[1]);
		expect(sources).toHaveLength(teamNames.length);
		for (const source of sources) {
			const image = await web.get(source);
			expect(image.status(), `${source} failed to load`).toBe(StatusCodes.OK);
			expect(image.headers()["content-type"]).toContain("image/");
		}
	});
});
