import { StatusCodes } from 'http-status-codes';
import { test, expect } from '../Fixtures/register-api.fixture';

test.describe('POST /api/register', () => {
    test('Registers a new user and does not return sensitive fields', async ({ register, validUser }) => {
        const response = await register(validUser);

        expect(response.status()).toBe(StatusCodes.CREATED);
        const body = await response.json();
        expect(body.email).toBe(validUser.email);
        expect(body.name).toBe(validUser.name);
        expect(body.createdAt).toBeTruthy();
        expect(body).not.toHaveProperty('password');
        expect(body).not.toHaveProperty('passwordHash');
        expect(body).not.toHaveProperty('safeWordHash');
        expect(body).not.toHaveProperty('id');
    });

    test('Normalises email to lower case and trims the name', async ({ register, validUser }) => {
        const response = await register({
            ...validUser,
            name: `  ${validUser.name}  `,
            email: validUser.email.toUpperCase(),
        });

        expect(response.status()).toBe(StatusCodes.CREATED);
        const body = await response.json();
        expect(body.email).toBe(validUser.email.toLowerCase());
        expect(body.name).toBe(validUser.name);
    });

    test('Rejects an already registered email with 409', async ({ register, validUser }) => {
        expect((await register(validUser)).status()).toBe(StatusCodes.CREATED);

        const response = await register(validUser);

        expect(response.status()).toBe(StatusCodes.CONFLICT);
        expect((await response.json()).error).toBe('An account with this email already exists');
    });

    const invalidCases: Array<[string, Record<string, unknown>, string]> = [
        ['missing name', { name: undefined }, 'Name is required'],
        ['blank name', { name: '   ' }, 'Name is required'],
        ['invalid email', { email: 'not-an-email' }, 'A valid email is required'],
        ['missing email', { email: undefined }, 'A valid email is required'],
        ['password shorter than 12 characters', { password: 'short' }, 'Password must be at least 12 characters long'],
        ['password longer than 128 characters', { password: 'a'.repeat(129) }, 'Password must be no more than 128 characters long'],
        ['missing safe-word hint', { safeWordHint: undefined }, 'A valid safe-word hint is required'],
        ['unknown safe-word hint', { safeWordHint: 'not-a-hint' }, 'A valid safe-word hint is required'],
        ['blank safe word', { safeWord: '   ' }, 'A non-blank safe word is required'],
        ['safe word longer than 128 characters', { safeWord: 'a'.repeat(129) }, 'Safe word must be no more than 128 characters long'],
    ];

    for (const [name, override, message] of invalidCases) {
        test(`Rejects ${name} with 400`, async ({ register, validUser }) => {
            const response = await register({ ...validUser, ...override });

            expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
            expect((await response.json()).error).toBe(message);
        });
    }

    test('Rejects malformed JSON with 400', async ({ api }) => {
        const response = await api.post('/api/register', {
            headers: { 'Content-Type': 'application/json' },
            data: '{ invalid',
        });

        expect(response.status()).toBe(StatusCodes.BAD_REQUEST);
    });

    test('Does not expose the old registration routes', async ({ api, validUser }) => {
        const responses = await Promise.all([
            api.post('/api/auth/register', { data: validUser }),
            api.post('/api-register', { data: validUser }),
        ]);

        expect(responses.map((r) => r.status())).toEqual([StatusCodes.NOT_FOUND, StatusCodes.NOT_FOUND]);
    });
});
