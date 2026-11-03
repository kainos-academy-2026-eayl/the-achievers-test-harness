# Test Database - How It Works

## Architecture

```
┌─────────────────────────────────────────┐
│         Your Local Machine              │
├─────────────────────────────────────────┤
│ Development Database  │  Test Database  │
│ (port 5432)          │  (port 5433)    │
│                      │                 │
│ Your real data       │  Docker         │
│ Never touched by     │  PostgreSQL     │
│ tests                │  Auto-seeded    │
└─────────────────────────────────────────┘
```

## How It Works

### 1. **Database Isolation**
   - **Development (5432):** Your real data, never touched
   - **Test (5433):** Docker container, disposable, resets automatically
   - Tests always connect to 5433 - no risk of data loss

### 2. **Automatic Migrations**
   - Your backend has Prisma migration files in `prisma/migrations/`
   - When `npm run db:start` runs, it syncs all migrations to the test database
   - Test database schema always matches your dev database schema
   - No manual migration management needed

### 3. **Automatic Seeding**
   - After migrations run, Prisma automatically seeds the database
   - Seeds are defined in `prisma/seed.ts` (in backend)
   - Creates test data: 1 admin user + 14 products
   - Happens every time you start or reset the database

### 4. **Full Test Cycle (npm run db:test)**
   ```
   Start Database
        ↓
   Apply Migrations (from your schema)
        ↓
   Seed Data (admin user + products)
        ↓
   Run All Tests
        ↓
   Reset Database (delete data, wipe volume)
        ↓
   Stop Container
   ```

## Key Files

- **docker-compose.yml** - Docker configuration (port 5433, PostgreSQL 15)
- **scripts/test-db.sh** - Orchestration script (handles all lifecycle)
- **scripts/sync-migrations.sh** - Syncs migrations from your Prisma schema
- **backend/.env.test** - Database credentials for test database
- **backend/prisma/seed.ts** - What data gets seeded (admin user + products)

## Why This Design?

✅ **Tests never touch your real data** - Port separation is fail-safe  
✅ **Always up-to-date schema** - Migrations sync from your dev database  
✅ **Reproducible test data** - Same seeding every run  
✅ **One command to test** - `npm run db:test` handles everything  
✅ **Manual control available** - Run `db:start`, `db:test`, `db:reset` separately if needed  

## Troubleshooting

**Docker not running?**
```bash
# Make sure Docker Desktop is open
docker ps
```

**Database won't start?**
```bash
# Clean up any stuck containers
docker-compose down -v
npm run db:start
```

**Need to inspect the test database directly?**
```bash
# Connect with psql
psql postgresql://testuser:testpassword@localhost:5433/app_test
```

That's it - everything is automated and safe!
