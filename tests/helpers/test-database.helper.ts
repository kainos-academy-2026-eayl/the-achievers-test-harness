import { Pool } from "pg";

export async function setTestAccountCredit(
	email: string,
	balancePence: number,
): Promise<void> {
	const connectionString = process.env.TEST_DATABASE_URL;
	if (!connectionString) {
		throw new Error("TEST_DATABASE_URL must point to the app_test database.");
	}
	if (new URL(connectionString).pathname !== "/app_test") {
		throw new Error(
			"Credit test setup is restricted to the app_test database.",
		);
	}
	if (!Number.isSafeInteger(balancePence) || balancePence < 0) {
		throw new Error("Account credit must be a non-negative number of pence.");
	}

	const pool = new Pool({ connectionString });
	try {
		const result = await pool.query(
			'UPDATE "User" SET "creditBalancePence" = $1 WHERE email = $2',
			[balancePence, email],
		);
		if (result.rowCount !== 1) {
			throw new Error(
				`Could not find test user ${email} to set account credit.`,
			);
		}
	} finally {
		await pool.end();
	}
}
