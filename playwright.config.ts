import { defineConfig } from "@playwright/test";
import * as fs from "node:fs";

// Load .env.test from backend if it exists
const loadEnvFile = (filePath: string): Record<string, string> => {
	if (!fs.existsSync(filePath)) {
		return {};
	}

	const content = fs.readFileSync(filePath, "utf-8");
	const env: Record<string, string> = {};

	content.split("\n").forEach((line) => {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) return;

		const [key, ...valueParts] = trimmed.split("=");
		const value = valueParts.join("=").replace(/^"|"$/g, "");
		if (key) env[key.trim()] = value;
	});

	return env;
};

const backendEnvTest = loadEnvFile("../the-achievers-backend-actual/.env.test");

// Shell-exported values take precedence over the harness file.
const harnessEnvTest = loadEnvFile("./.env.test");
for (const [key, value] of Object.entries(harnessEnvTest)) {
	process.env[key] ??= value;
}

const testDatabaseUrl =
	process.env.TEST_DATABASE_URL ??
	process.env.DATABASE_URL ??
	backendEnvTest.DATABASE_URL ??
	"postgresql://testuser:testpassword@localhost:5433/app_test?schema=public";

if (new URL(testDatabaseUrl).pathname !== "/app_test") {
	throw new Error("Playwright tests require the dedicated app_test database.");
}

process.env.TEST_DATABASE_URL = testDatabaseUrl;
const backendPort = process.env.E2E_BACKEND_PORT ?? "3100";
const frontendPort = process.env.E2E_FRONTEND_PORT ?? "8100";
const backendUrl = `http://localhost:${backendPort}`;
const frontendUrl = `http://localhost:${frontendPort}`;
process.env.API_URL = backendUrl;

export default defineConfig({
	testDir: "./tests",
	use: {
		baseURL: frontendUrl,
		testIdAttribute: "id",
	},
	webServer: [
		{
			command: "npm run dev",
			cwd: "../the-achievers-backend-actual",
			url: `${backendUrl}/health`,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			env: {
				PORT: backendPort,
				DATABASE_URL: testDatabaseUrl,
				JWT_SECRET:
					process.env.JWT_SECRET ??
					backendEnvTest.JWT_SECRET ??
					"test-only-jwt-secret-not-for-production-use",
				FRONTEND_ORIGIN: frontendUrl,
			},
		},
		{
			command: "npm run dev",
			cwd: "../the-achievers-frontend-actual",
			url: frontendUrl,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			env: {
				PORT: frontendPort,
				BACKEND_URL: backendUrl,
			},
		},
	],
});
