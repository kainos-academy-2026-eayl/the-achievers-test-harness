# Docker Test Database Implementation Guide

A structured guide for implementing an isolated Docker-based test database system with automation.

---

## 📋 Prompt to Give

Copy and paste this prompt to Copilot when starting on a fresh repository:

```
I need a Docker-based test database system for an isolated testing environment.

Setup:
- PostgreSQL container on port 5433 (separate from dev database on 5432)
- Auto-apply all Prisma migrations from the backend schema
- Auto-seed with test data (1 admin user + test products)
- All tests should run against this isolated test database only

Requirements:
1. One-command full test cycle: npm run db:test
   This should: start database → run migrations → seed data → run tests → reset database → stop container

2. Manual commands for control:
   - npm run db:start (start + migrate + seed only)
   - npm test (run tests)
   - npm run db:reset (clear and reseed)
   - npm run db:stop (shut down)

3. Documentation:
   - Keep it simple: maximum 2 markdown files
   - First file: Quick start (how to run commands)
   - Second file: How it works (architecture, how migrations/seeding work, troubleshooting)
   - Update README.md to link to these guides instead of duplicating explanations

4. Implementation:
   - Create/update bash scripts for database lifecycle management
   - Update package.json with npm scripts
   - Ensure your dev database is never touched
   - Verify all tests pass after implementation

Make it production-ready and thoroughly test it before finishing.
```

---

## 🔍 What Needs to Be Known?

Before starting, Copilot should explore and understand your repository structure:

### Directory Structure
- **Where are the tests?** (Playwright? Jest? etc.)
- **How are repos organized?** (sibling directories? monorepo? separate?)
- **What's the backend location?** (needed for accessing Prisma migrations)

### Prisma Configuration
- **Does prisma/migrations folder exist?** (with your database migrations)
- **What's in prisma/schema.prisma?** (to understand the database schema)
- **Does a seed.ts file exist?** (or does it need to be created?)

### Database Setup
- **Current dev database details** (what port? what credentials?)
- **What test data should be seeded?** (number of users, products, etc.)
- **Are there existing database credentials?** (.env.test or .env files)

### Docker & Docker Compose
- **Is Docker Compose already configured?** (docker-compose.yml exists?)
- **What PostgreSQL version** should be used?
- **Any existing Docker setup** to build on?

### Testing Setup
- **How many tests currently exist?**
- **Do tests already point to a database?** (or assume one?)
- **Where are test fixtures/factories?** (for understanding seed data)

---

## ⚙️ How It Works

### Architecture Overview

```
Your Local Machine
├─ Development Database (port 5432)
│  └─ Your real data, never touched by tests
│
└─ Test Database (port 5433, Docker)
   └─ Isolated container, auto-reset, safe to destroy
```

### The Full Test Cycle (npm run db:test)

```
1. START DATABASE
   └─ Docker container spins up on port 5433

2. HEALTH CHECK
   └─ Wait for PostgreSQL to be ready

3. SYNC MIGRATIONS
   └─ Read Prisma migrations from backend/prisma/migrations/
   └─ Run: prisma migrate deploy (using 5433 connection)

4. SEED DATA
   └─ Run: prisma db seed
   └─ Executes prisma/seed.ts script
   └─ Creates test data (admin user, products, etc.)

5. RUN TESTS
   └─ Execute all Playwright/Jest tests
   └─ Tests connect to 5433 via DATABASE_URL env var

6. RESET DATABASE
   └─ Stop container
   └─ Remove Docker volume
   └─ Restart fresh container
   └─ Re-apply migrations
   └─ Re-seed data

7. STOP DATABASE
   └─ Remove container and network
   └─ Clean shutdown
```

### Key Implementation Files

**docker-compose.yml**
- Defines PostgreSQL 15 container
- Sets port 5433, credentials, database name
- Creates persistent volume

**scripts/test-db.sh**
- Central orchestration script with functions:
  - `start_docker_db()` - Start + migrate + seed
  - `full_test_run()` - Complete cycle (test:db)
  - `reset_docker_db()` - Reset to fresh state
  - `stop_docker_db()` - Clean shutdown

**scripts/sync-migrations.sh**
- Finds Prisma migrations in backend
- Runs `prisma migrate deploy` against test database
- Ensures schema always matches dev database

**package.json**
- `npm run db:test` - Calls `scripts/test-db.sh test`
- `npm run db:start` - Calls `scripts/test-db.sh start`
- `npm run db:stop` - Calls `scripts/test-db.sh stop`
- `npm run db:reset` - Calls `scripts/test-db.sh reset`

**playwright.config.ts (or test runner config)**
- Loads `backend/.env.test` 
- Sets `DATABASE_URL` env var to 5433 connection
- Ensures tests always use test database, never dev

**backend/.env.test**
- Test database credentials
- `DATABASE_URL=postgresql://testuser:testpassword@localhost:5433/app_test`

### Data Isolation Strategy

Three-layer isolation ensures dev database never affected:

1. **Port Separation** - Dev on 5432, Test on 5433
2. **Credential Separation** - Different users/passwords per database
3. **Process Isolation** - Test database in separate Docker container

Any test can safely destroy/reset 5433 without touching 5432.

### Migration Sync Process

1. Test database starts fresh (no schema)
2. `sync-migrations.sh` detects migration files in `backend/prisma/migrations/`
3. Runs `prisma migrate deploy` pointing to test database (5433)
4. Prisma creates `_prisma_migrations` table and tracks which migrations ran
5. Only pending migrations run (idempotent)
6. After sync, test database has identical schema to dev database

### Seeding Process

1. After migrations complete, `prisma db seed` runs
2. Executes `backend/prisma/seed.ts` script
3. Creates reproducible test data (same every run)
4. Example: 1 admin user + 14 products with realistic data
5. Happens automatically on `db:start` and `db:reset`

### Documentation Strategy

Keep explanations simple and focused:

**QUICK_START.md** (1 page)
- What commands exist
- When to use each command
- What gets seeded

**HOW_IT_WORKS.md** (2-3 pages)
- Architecture diagram
- Step-by-step flow
- How migrations sync
- How seeding works
- Troubleshooting guide

**README.md**
- Minimal reference
- Links to the two guides above
- No duplication of explanations

---

## ✅ Verification Checklist

After implementation, verify:

- [ ] `npm run db:test` runs complete cycle without errors
- [ ] All tests pass (43/43, or your number)
- [ ] All migrations apply (14/14, or your number)
- [ ] Database auto-seeds correctly
- [ ] Dev database (5432) was never touched
- [ ] Container starts/stops cleanly
- [ ] Manual commands work: start, test, reset, stop
- [ ] Documentation is clear and complete
- [ ] No old verbose docs remain (only 2 files)
- [ ] README links to guides only (no duplication)

---

## 🚀 Result

When done, you'll have:

✅ One-command full test cycle (`npm run db:test`)  
✅ Manual step-by-step control (`npm run db:start`, etc.)  
✅ Automatic migrations and seeding  
✅ Complete data isolation (dev database safe)  
✅ Production-ready and thoroughly tested  
✅ Simple documentation (2 files only)  
✅ All tests passing  

Ready to share with your team!
