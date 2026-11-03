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

const backendEnvTest = loadEnvFile("../the-achievers-backend/.env.test");

export default defineConfig({
	testDir: "./tests",
	use: {
		baseURL: "http://localhost:8000",
		testIdAttribute: "id",
	},
	webServer: [
		{
			command: "npm run dev",
			cwd: "../the-achievers-backend",
			url: "http://localhost:3000/health",
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			env: {
				PORT: "3000",
				DATABASE_URL:
					process.env.DATABASE_URL ??
					backendEnvTest.DATABASE_URL ??
					"postgresql://testuser:testpassword@localhost:5433/app_test?schema=public",
				JWT_SECRET:
					process.env.JWT_SECRET ??
					backendEnvTest.JWT_SECRET ??
					"test-only-jwt-secret-not-for-production-use",
				FRONTEND_ORIGIN: "http://localhost:8000",
			},
		},
		{
			command: "npm run dev",
			cwd: "../the-achievers-frontend",
			url: "http://localhost:8000",
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			env: {
				PORT: "8000",
				BACKEND_URL: "http://localhost:3000",
			},
		},
	],
});
