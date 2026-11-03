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

### Using the default local database

```bash
npm test                          # All API and UI tests
npm run test:api                   # API tests
npm run test:ui                    # UI tests
npm run test:headed                # Run with a visible browser
npx playwright test --list         # Discover tests without starting servers

# Select an exact file (additional npm script arguments are additive filters).
npx playwright test tests/ui/Tests/register.spec.ts
npx playwright test tests/api/Tests/login-api.spec.ts
```

### Using a Docker-based test database

To avoid creating test data (like hundreds of accounts) in your main development
database, run tests against an isolated Docker-based PostgreSQL container:

```bash
# Start the test database container
# (Prisma migrations run automatically to create the schema)
npm run db:start

# Run tests against the Docker database
npm run test:docker

# Or run specific test suites (migrations run once when db:start executes)
DATABASE_URL='postgresql://testuser:testpassword@localhost:5433/app_test?schema=public' npm run test:api
DATABASE_URL='postgresql://testuser:testpassword@localhost:5433/app_test?schema=public' npm run test:ui

# Reset the database (removes all test data) and re-run tests
npm run test:docker:reset

# Stop the database when done
npm run db:stop

# Check database status
npm run db:status
```

**How it works:**
- When you run `npm run db:start`, the Docker database starts and Prisma migrations
  automatically create the database schema (tables, columns, relationships) from
  your backend's migrations. This happens only once per database start.
- The test database is completely isolated from your development database
- You can reset it anytime with `npm run db:reset` to clear all test data

**Docker prerequisites:**
- Docker and Docker Compose installed on your system
- The test database container `achievers-test-db` will run on port `5433` (host)
  to avoid conflicts with any local PostgreSQL on port `5432`

### Other commands

```bash
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
- **Docker database connection refused:** ensure Docker Desktop is running and
  that port `5433` is not in use. Use `npm run db:status` to check the
  container status. If the container exists but is not running, use
  `docker ps -a` to verify, then `npm run db:start` to restart it.
- **Tests accumulating test data:** use `npm run db:reset` to stop the
  container, remove all volumes, and start fresh. After schema migrations run,
  tests will use a clean database.

## Docker test database

The project includes a Docker setup to isolate test data from your development
database. This ensures that running tests hundreds of times won't create
thousands of duplicate accounts in your primary database.

### Files and configuration

- **[docker-compose.yml](./docker-compose.yml):** Docker Compose configuration
  for the test PostgreSQL container
- **[.env.test](./.env.test):** Test database connection string (database URL
  on port `5433`)
- **[scripts/test-db.sh](./scripts/test-db.sh):** Bash script to start, stop,
  reset, and check status of the test database
- **[scripts/init-test-db.sql](./scripts/init-test-db.sql):** PostgreSQL
  initialization script (runs on first container start)

The Docker container exposes PostgreSQL on port `5433` (not the default `5432`)
to avoid conflicts with a local PostgreSQL installation. The test database is
named `app_test` with credentials `testuser:testpassword`.

## CI

[The CI workflow](./.github/workflows/ci.yml) runs on pushes and pull requests to
`main`. It installs harness dependencies, checks lint and formatting, and runs
the TypeScript build check on Node.js 22. It does not currently run integration
tests or provision the sibling applications/database.

Keep system documentation in this README rather than separate change-summary
or feature-explanation files.
