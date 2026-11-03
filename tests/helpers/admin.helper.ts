import type { LoginPayload } from "./user.helper";

export function getAdminCredentials(): LoginPayload {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
        throw new Error(
            "Set ADMIN_EMAIL and ADMIN_PASSWORD to the seeded admin account",
        );
    }
    return { email, password };
}
