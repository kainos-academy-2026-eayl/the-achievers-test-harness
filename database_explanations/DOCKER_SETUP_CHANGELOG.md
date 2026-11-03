# Docker Test Database Setup - Change Log

**Date Created:** 2026-11-03
**Purpose:** Isolate test data from the development database by running tests against a Docker-based PostgreSQL container

## Summary of Changes

This setup allows tests to run against an isolated PostgreSQL database running in Docker, preventing test data (like 1000+ test accounts) from cluttering your main development database.

---

## New Files Created

### 1. `docker-compose.yml`
- **Purpose:** Docker Compose configuration for the test database service
- **Key Details:**
  - PostgreSQL 15 Alpine image
  - Container name: `achievers-test-db`
  - Port: 5433 (host) → 5432 (container)
  - Database name: `app_test`
  - Credentials: `testuser` / `testpassword`
  - Volume: `test-db-volume` for persistent data
  - Health check: `pg_isready` every 10 seconds
  - Network: `achievers-test-network`

### 2. `scripts/test-db.sh` (executable bash script)
- **Purpose:** CLI for managing the test database container
- **Commands:**
  - `start` - Start the test database container
  - `stop` - Stop the container
  - `reset` - Remove volumes and start fresh
  - `status` - Show container status
  - `help` - Show help message
- **Usage:**
  ```bash
  bash scripts/test-db.sh start
  bash scripts/test-db.sh reset
  bash scripts/test-db.sh stop
  ```

### 3. `scripts/init-test-db.sql`
- **Purpose:** PostgreSQL initialization script (runs when container first starts)
- **Current Contents:** Creates the public schema (actual application schema created by Prisma migrations)

### 4. `.env.test`
- **Purpose:** Environment variables for test database configuration
- **Contents:**
  - `DATABASE_URL`: PostgreSQL connection string for test DB on port 5433
  - `JWT_SECRET`: Test-only JWT secret

---

## Modified Files

### 1. `package.json`
**Added new npm scripts:**
```json
"test:docker": "npm run db:start && DATABASE_URL='postgresql://testuser:testpassword@localhost:5433/app_test?schema=public' playwright test"
"test:docker:reset": "npm run db:reset && npm run test:docker"
"db:start": "bash scripts/test-db.sh start"
"db:stop": "bash scripts/test-db.sh stop"
"db:reset": "bash scripts/test-db.sh reset"
"db:status": "bash scripts/test-db.sh status"
```

### 2. `README.md`
**Added comprehensive documentation:**
- New section: "Using a Docker-based test database"
- Docker prerequisites
- Usage examples for all `npm run db:*` and `npm run test:docker` commands
- Troubleshooting section with Docker-specific issues
- New "Docker test database" section explaining:
  - Files and configuration
  - Database connection details
  - Port assignment (5433 to avoid conflicts)

---

## How to Use

### First Time Setup
```bash
# Start the test database
npm run db:start

# Run tests against the Docker database
npm run test:docker

# Stop when done
npm run db:stop
```

### Resetting Test Data
```bash
# This stops the container, removes all volumes (data), and starts fresh
npm run db:reset
```

### Individual Test Suites
```bash
# After starting the database with: npm run db:start

# Set DATABASE_URL for a single test run
DATABASE_URL='postgresql://testuser:testpassword@localhost:5433/app_test?schema=public' npm run test:api
DATABASE_URL='postgresql://testuser:testpassword@localhost:5433/app_test?schema=public' npm run test:ui
```

### Checking Status
```bash
npm run db:status
```

---

## Reverting Changes

If something goes wrong or you want to revert to the state before Docker setup:

### Option 1: Keep the Docker setup but stop using it
```bash
# Simply stop the container
npm run db:stop

# Use regular tests again (against your development database)
npm test
```

### Option 2: Complete rollback to previous state
```bash
# Remove the Docker setup files
rm docker-compose.yml
rm -rf scripts/
rm .env.test

# Restore package.json to previous version
git checkout package.json

# Restore README.md to previous version
git checkout README.md

# Verify
git status
```

### Option 3: Remove Docker resources if container is stuck
```bash
# Stop and remove the container entirely
docker-compose down -v

# Or manually
docker stop achievers-test-db
docker rm achievers-test-db
docker volume rm the-achievers-test-harness_test-db-volume
```

---

## Testing the Setup

1. **Verify Docker is installed:**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Start the test database:**
   ```bash
   npm run db:start
   ```

3. **Check the container is running:**
   ```bash
   npm run db:status
   ```

4. **Test database connection:**
   ```bash
   docker exec achievers-test-db psql -U testuser -d app_test -c "SELECT 1;"
   ```

5. **Run a test to verify integration:**
   ```bash
   npm run test:docker
   ```

6. **Verify test data doesn't affect development DB:**
   - Check your development database for new accounts
   - Verify only the test database on port 5433 has the test data

---

## Key Files to Reference

- **New:** [docker-compose.yml](/docker-compose.yml)
- **New:** [scripts/test-db.sh](/scripts/test-db.sh)
- **New:** [scripts/init-test-db.sql](/scripts/init-test-db.sql)
- **New:** [.env.test](/.env.test)
- **Modified:** [package.json](/package.json) - Added 6 new npm scripts
- **Modified:** [README.md](/README.md) - Added Docker documentation sections

---

## Backup Information

Original state before changes:
- Commit: Check `git log` for the previous commit hash
- Branch: `registrationTests`
- Database: Used development database on localhost:5432

To view all changes:
```bash
git diff HEAD
git status
```

To see what changed in each file:
```bash
git diff docker-compose.yml
git diff package.json
git diff README.md
```
