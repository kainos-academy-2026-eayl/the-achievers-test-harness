# How Automatic Migrations Work - Simple Explanation

## The Quick Answer

The migrations **already exist** as files in your backend repository:

```
../the-achievers-backend/prisma/migrations/
├─ 20261020144447_init/
│  └─ migration.sql          ← SQL file (CREATE TABLE "User" ...)
├─ 20261021141039_add_products/
│  └─ migration.sql          ← SQL file (CREATE TABLE "Product" ...)
├─ ... (12 more migration files)
```

These 14 migration files were created by your development team when they built the schema. They're **committed to git** - they're not generated dynamically.

---

## Where It Comes From

### Source
```
Backend Repository Location:
  the-achievers-backend/prisma/migrations/
  └─ 14 migration folders
     └─ Each contains a migration.sql file with SQL commands
```

### Example Migration File
```sql
-- migration.sql
CREATE TABLE "User" (
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("email")
);
```

---

## How It Knows Which Migrations to Run

Prisma uses a **tracking table** called `_prisma_migrations` in the database:

### The Tracking System

```
File System                          Database
────────────────────────────────────────────────────────────────
20261020144447_init/
├─ migration.sql         ────→  _prisma_migrations table
                                ├─ id: UUID
20261021141039_add_products/    ├─ migration_name: "init"
├─ migration.sql         ────→  ├─ finished_at: 2026-11-03...
                                └─ checksum: 26ea3ea134d0...
... (12 more)
```

### How It Works

1. **Prisma checks**: What migrations are in `_prisma_migrations` table?
2. **Prisma reads**: What migration files exist in the filesystem?
3. **Prisma compares**: Which ones are NOT in the database?
4. **Prisma runs**: Only the migrations not yet applied
5. **Prisma records**: Adds entry to `_prisma_migrations` for each one

---

## Step-by-Step Flow

### When you run: `npm run db:start`

```
1. Docker starts PostgreSQL container (port 5433)
   └─ Creates empty database "app_test"

2. You run: npm run test:docker
   └─ Triggers: npm run db:migrate
   └─ Runs: scripts/run-migrations.sh

3. Script detects Docker database (port 5433)
   └─ Runs: npx prisma migrate deploy

4. Prisma connects to localhost:5433 (Docker database)
   └─ Checks: _prisma_migrations table (EMPTY on first run)
   └─ Reads: 14 migration files from filesystem

5. For each of 14 migration files:
   ├─ File: 20261020144447_init/migration.sql
   │  ├─ Check: Is "init" in _prisma_migrations? NO
   │  ├─ Action: RUN SQL → CREATE TABLE "User"
   │  └─ Record: Add row to _prisma_migrations
   │
   ├─ File: 20261021141039_add_products/migration.sql
   │  ├─ Check: Is "add_products" in _prisma_migrations? NO
   │  ├─ Action: RUN SQL → CREATE TABLE "Product"
   │  └─ Record: Add row to _prisma_migrations
   │
   └─ ... (continue for all 14)

6. All 9 tables are created:
   ├─ User
   ├─ Product
   ├─ Cart
   ├─ CartItem
   ├─ Order
   ├─ OrderItem
   ├─ Admin
   ├─ UserAddresses
   └─ _prisma_migrations (auto-created by Prisma)

7. Test database is ready!
   └─ Same schema as development database
   └─ But completely empty (no data)
```

### Next time you run migrations

```
1. Prisma connects to database
2. Checks: _prisma_migrations table
3. Sees: 14 rows (all 14 migrations already applied)
4. Action: Skip all (nothing to run)
5. Result: Fast! Tests run immediately
```

---

## Two Separate Databases, Same Migrations

```
Development Database              Test Database
(localhost:5432)                   (localhost:5433)
─────────────────────────────────────────────────
Uses SAME migration files:  ../the-achievers-backend/prisma/migrations/

Dev DB                            Test DB
├─ Full schema                    ├─ Full schema (identical)
├─ Real data                      ├─ Empty initially
└─ Manual migration control       └─ Automatic migrations
```

**Key Point:** Both databases use the **exact same migration files**, but they're completely isolated from each other.

---

## Real-World Example

### First Time Running Tests

```bash
$ npm run db:start
✓ Database starts (empty)

$ npm run test:docker
✓ Migrations run (all 14)
✓ SQL executed: CREATE TABLE "User" ...
✓ SQL executed: CREATE TABLE "Product" ...
... (etc.)
✓ _prisma_migrations table has 14 records
✓ Schema is complete
✓ Tests run!

Result: 1000+ test accounts created in Docker database only
        Development database stays CLEAN
```

### Second Time Running Tests

```bash
$ npm run db:start
✓ Database starts

$ npm run test:docker
✓ Migrations check _prisma_migrations table
✓ Sees: "All 14 already applied"
✓ Skips migrations (fast!)
✓ Tests run immediately!

Result: Tests run fast because migrations already applied
```

---

## Safety Guarantees

✅ **Development Database is Safe**
- Located at localhost:**5432** (different port)
- Uses different DATABASE_URL
- Migrations never run on it (only test database)
- Your real data stays untouched

✅ **Test Database is Isolated**
- Located at localhost:**5433** (different port)
- Separate Docker container
- Separate volume
- Separate network
- Completely independent

✅ **Same Schema, No Data Sharing**
- Both get identical table structure from migrations
- No data is copied from one to the other
- Test database starts empty
- Tests populate it with test-only data

---

## What Happens if You Add a New Migration?

If your development team creates a new migration:

```
1. They create: backend/prisma/migrations/20261105000000_new_feature/
2. You run: npm run db:start
3. Prisma sees: New migration file in filesystem
4. Prisma checks: _prisma_migrations table (doesn't have this one)
5. Prisma runs: The new migration automatically
6. Your test database gets the new table/schema
```

No manual steps needed! Automatic detection.

---

## Summary

| Aspect | Answer |
|--------|--------|
| **Where from?** | Backend repo: `../the-achievers-backend/prisma/migrations/` |
| **How many?** | 14 migration files (committed files in git) |
| **How detected?** | Prisma checks `_prisma_migrations` tracking table |
| **First run?** | All 14 migrations run (~10 seconds) |
| **Second run?** | None run (already applied - skipped automatically) |
| **New migration?** | Automatically detected and run next time |
| **Dev DB affected?** | NO - completely separate (different port + DATABASE_URL) |
| **Data copied?** | NO - only schema structure is created |

---

## Key Takeaway

✨ **The migrations aren't created dynamically - they're committed files in your repository that already exist.** 

The system just:
1. Finds them (`../the-achievers-backend/prisma/migrations/`)
2. Checks which ones have been applied (`_prisma_migrations` table)
3. Runs only the new ones
4. Records which ones have been applied

Everything is automatic, safe, and isolated! 🎉
