# Test Database - Quick Start

## One-Command Testing

Run everything automatically: start database → run migrations → seed data → run tests → reset → stop

```bash
npm run db:test
```

That's it! Your test database will:
1. Start a Docker PostgreSQL container
2. Apply all 14 migrations from your dev database schema
3. Seed with 1 admin user + 14 test products
4. Run all your tests (API + UI)
5. Reset the database
6. Shut down cleanly

## Manual Commands

If you prefer step-by-step control:

```bash
npm run db:start      # Start + migrate + seed (database ready to test)
npm test              # Run tests (can run multiple times)
npm run db:reset      # Clear data + fresh migrations + reseed
npm run db:stop       # Shut down the container
```

## What Gets Seeded

Every time you start or reset the database:
- **1 Admin User:** admin@example.com
- **14 Products:** With names, descriptions, prices, stock, and ratings

## Port

Test database runs on **port 5433** (development database is on 5432)

Your tests automatically connect to the test database. No configuration needed.

## That's All You Need to Know

Everything else is handled automatically. Just run `npm run db:test` when you want a complete test cycle!
