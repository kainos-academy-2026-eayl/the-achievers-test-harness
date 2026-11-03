#!/bin/bash

# Migration runner for test database
# Runs Prisma migrations automatically when using Docker test database

set -e

# Check if we're using the Docker test database
if [[ "$DATABASE_URL" == *"localhost:5433"* ]] || [[ "$DATABASE_URL" == *"5433"* ]]; then
  echo "🔄 Detected Docker test database - running Prisma migrations..."
  
  # Run migrations in the backend directory
  cd ../the-achievers-backend
  
  # Run migrations with the test database URL
  DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy
  
  if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
  else
    echo "❌ Migrations failed"
    exit 1
  fi
  
  cd ../the-achievers-test-harness
else
  echo "ℹ️  Using development database - skipping migrations"
fi
