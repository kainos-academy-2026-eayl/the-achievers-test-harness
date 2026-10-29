import { defineConfig } from "@playwright/test";

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
					"postgresql://dev:dev@localhost:5432/app_dev?schema=public",
				JWT_SECRET: process.env.JWT_SECRET ?? "test-only-jwt-secret",
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
