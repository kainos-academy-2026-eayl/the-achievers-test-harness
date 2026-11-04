#!/bin/bash

# Sync migrations from dev database (5432) to test database (5433)
# This script uses the backend's Prisma installation to apply migrations
# to the test database, ensuring compatibility with the project's Prisma version

set -e

MIGRATIONS_DIR="../the-achievers-backend-actual/prisma/migrations"
BACKEND_DIR="../the-achievers-backend-actual"

if [ ! -d "$MIGRATIONS_DIR" ]; then
	echo "❌ Error: Migrations directory not found at $MIGRATIONS_DIR"
	echo "Make sure you're running this from the test-harness root directory"
	exit 1
fi

echo "📦 Syncing migrations from dev database schema to test database..."
echo "   Migration files: $MIGRATIONS_DIR"
echo "   Target database: postgresql://testuser@localhost:5433/app_test"
echo ""

# Run migrations on test database using backend's Prisma CLI
cd "$BACKEND_DIR"
DATABASE_URL="postgresql://testuser:testpassword@localhost:5433/app_test?schema=public" \
	npx prisma migrate deploy

cd - > /dev/null

echo ""
echo "✅ Migrations synced successfully!"
echo "   Test database is now up-to-date with the latest schema"
