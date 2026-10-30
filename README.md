# The Achievers Test Harness

Playwright and TypeScript tests for the Achievers registration and login flows.
API tests call the backend directly; UI tests use a real browser against the
frontend. Requests are not mocked.

## Prerequisites and setup

- Node.js 22 (the version used by CI) and npm.
- The backend and frontend checked out alongside this repository:

  ```text
  the-achievers/
    the-achievers-backend/
    the-achievers-frontend/
    the-achievers-test-harness/
  ```

- Dependencies installed in each application using its own setup instructions.
- A running PostgreSQL database with the backend schema migrated and its Prisma
  client generated. Use a disposable development/test database, not production.

Install the harness dependencies and default browser:

```bash
npm ci
npx playwright install chromium
```

## Servers and configuration

[playwright.config.ts](./playwright.config.ts) starts both applications with
`npm run dev`, using the sibling directories above:

| Application | Address | Readiness check |
| --- | --- | --- |
| Backend | `http://localhost:3000` | `/health` |
| Frontend | `http://localhost:8000` | `/` |

Locally, Playwright reuses existing servers; in CI it starts fresh servers.
Startup has a 120-second timeout. Even API-only runs currently require both
servers because they share this configuration.

The browser base URL is `http://localhost:8000`. `getByTestId()` matches HTML
`id` attributes, not `data-testid`.

| Environment variable | Purpose |
| --- | --- |
| `API_URL` | Backend URL for API fixtures; defaults to `http://localhost:3000`. Does not change the frontend's backend URL or server readiness checks. |
| `DATABASE_URL` | Database connection passed to a backend started by Playwright. Set this to your test database; configuration includes a local development fallback. |
| `JWT_SECRET` | Signing secret passed to a backend started by Playwright; otherwise a test-only default is used. |
| `CI` | Disables reuse of existing servers when set. |

Playwright starts the frontend with `PORT=8000` and
`BACKEND_URL=http://localhost:3000`, and the backend with `PORT=3000` and
`FRONTEND_ORIGIN=http://localhost:8000`. Reused servers keep their own environment;
changing harness variables does not reconfigure them. Do not commit credentials.

## Running and checking tests

```bash
npm test                          # All API and UI tests
npm run test:api                   # API tests
npm run test:ui                    # UI tests
npm run test:headed                # Run with a visible browser
npx playwright test --list         # Discover tests without starting servers

# Select an exact file (additional npm script arguments are additive filters).
npx playwright test tests/ui/Tests/register.spec.ts
npx playwright test tests/api/Tests/login-api.spec.ts

npm run typecheck
npm run lint
npm run format:check
npm run format                    # Apply formatting
npm run build                     # TypeScript check; no application bundle
```

Playwright writes run artifacts to `test-results/`. To generate and open an HTML
report:

```bash
npx playwright test --reporter=html
npm run test:report
```

## Test structure

```text
tests/
  api/
    Fixtures/
      register-api.fixture.ts
      login-api.fixture.ts
    Tests/
      register-api.spec.ts
      login-api.spec.ts
  ui/
    Fixtures/
      register-ui.fixture.ts
      login-ui.fixture.ts
    Pages/
      register.page.ts
      login.page.ts
    Tests/
      register.spec.ts
      login.spec.ts
```

### Shared fixtures

- `api`: an isolated backend request context, disposed after each test.
- `validUser`: valid registration data with a UUID-based email, without creating
  an account.
- `register(payload)`: calls `POST /api/register`; accepts arbitrary objects so
  validation tests can send invalid input.
- `registeredUser`: registers `validUser`, asserts HTTP 201, then provides the
  same credentials. Setup failures include the response body.
- `loginUser(payload)`: calls `POST /api/login`, extending the registration
  fixtures rather than duplicating their setup.
- `registerPage` and `loginPage`: page objects provided by UI fixtures that
  extend the same registration fixtures.

Fixtures are test-scoped and created only when requested. Use `validUser` for
form validation and `registeredUser` when a saved account is necessary.
Created accounts are not automatically deleted, so periodically reset the
disposable test database.

### Page objects

- `RegisterPage`: registration navigation, field locators, filling, submission,
  response waiting, notice and login link.
- `LoginPage`: login navigation, field/link locators, submission and login.

Page objects own reusable browser interactions. Specs own expectations.
`submitAndWaitForResponse()` is for submissions that reach the server; use
`submit()` for browser-validation tests that block submission.

## Coverage

### API registration

Tests `POST /api/register` for successful creation, safe response fields,
normalization, duplicate emails, invalid/missing fields, password and safe-word
length limits, malformed JSON and removal of old registration routes.

### API login

Tests `POST /api/login` with newly registered credentials, email normalization,
incorrect passwords, unknown accounts, invalid/empty input, password length,
password whitespace preservation and malformed JSON.

### UI registration

Tests required-field and email browser validation, mismatched passwords,
preservation of non-sensitive details, clearing secret fields, whitespace-only
name/safe word rejection, login navigation and duplicate-account feedback.

### UI login

Tests successful login, incorrect-password and unknown-account feedback,
retaining the email and clearing the password after failure, registration
navigation and the password-reset link.

API and UI cases intentionally overlap where they verify different layers:
HTTP contracts versus browser validation, rendered feedback and navigation.

## Troubleshooting

- **500 instead of 201/200/401:** inspect the backend terminal. Check database
  connectivity, migrations and generated Prisma client. Invalid-input tests
  may still pass because validation can reject a request before database access.
  Do not change assertions to accept server errors.
- **Server startup timeout:** check both ports, sibling checkout locations,
  application dependencies and each application's startup logs.
- **Browser executable missing:** run `npx playwright install chromium`.
- **Unexpected settings:** a reused server keeps the environment it was started
  with. Restart that server with the intended test configuration.

## CI

[The CI workflow](./.github/workflows/ci.yml) runs on pushes and pull requests to
`main`. It installs harness dependencies, checks lint and formatting, and runs
the TypeScript build check on Node.js 22. It does not currently run integration
tests or provision the sibling applications/database.

Keep system documentation in this README rather than separate change-summary
or feature-explanation files.
