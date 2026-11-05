#!/bin/bash

# Test database setup and management script

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( dirname "$SCRIPT_DIR" )"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
  echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Start database
start_docker_db() {
  print_step "Starting test database container..."
  cd "$REPO_ROOT"
  docker-compose up -d test-db
  
  print_step "Waiting for database to be healthy..."
  sleep 2
  max_attempts=30
  attempt=0
  
  while [ $attempt -lt $max_attempts ]; do
    if docker exec achievers-test-db pg_isready -U testuser -d app_test > /dev/null 2>&1; then
      print_success "Database is ready!"
      
      print_step "Syncing migrations..."
      cd "$REPO_ROOT"
      bash scripts/sync-migrations.sh
      
      print_step "Seeding database..."
      cd "$REPO_ROOT/../the-achievers-backend"
      DATABASE_URL="postgresql://testuser:testpassword@localhost:5433/app_test?schema=public" \
        npx prisma db seed
      
      print_success "Database setup complete!"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
  
  echo "Failed to start database after $max_attempts attempts"
  return 1
}

# Full test run (start → migrate → seed → test → reset → stop)
full_test_run() {
  print_step "Starting full test run..."
  
  # Start database
  print_step "1/5 Starting database..."
  start_docker_db
  
  # Run tests
  print_step "2/5 Running tests..."
  cd "$REPO_ROOT"
  # Failing tests must not skip the reset and shutdown below.
  test_exit=0
  npm test || test_exit=$?
  
  # Reset database
  print_step "3/5 Resetting database..."
  cd "$REPO_ROOT"
  docker-compose down -v
  docker-compose up -d test-db
  
  print_step "4/5 Waiting for database..."
  sleep 2
  max_attempts=30
  attempt=0
  
  while [ $attempt -lt $max_attempts ]; do
    if docker exec achievers-test-db pg_isready -U testuser -d app_test > /dev/null 2>&1; then
      print_success "Database is ready!"
      break
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
  
  # Apply migrations
  print_step "5/5 Applying migrations and seeding..."
  cd "$REPO_ROOT"
  bash scripts/sync-migrations.sh
  
  cd "$REPO_ROOT/../the-achievers-backend"
  DATABASE_URL="postgresql://testuser:testpassword@localhost:5433/app_test?schema=public" \
    npx prisma db seed
  
  # Stop database
  print_step "Stopping database..."
  cd "$REPO_ROOT"
  docker-compose down
  
  if [ "$test_exit" -ne 0 ]; then
    echo "Tests failed (exit code $test_exit); database was reset and stopped."
    return "$test_exit"
  fi
  
  print_success "Full test run complete!"
}

# Stop database
stop_docker_db() {
  print_step "Stopping test database container..."
  cd "$REPO_ROOT"
  docker-compose down
  print_success "Database stopped"
}

# Reset database
reset_docker_db() {
  print_step "Resetting test database..."
  cd "$REPO_ROOT"
  docker-compose down -v
  print_step "Starting fresh database..."
  docker-compose up -d test-db
  
  print_step "Waiting for database to be healthy..."
  sleep 2
  max_attempts=30
  attempt=0
  
  while [ $attempt -lt $max_attempts ]; do
    if docker exec achievers-test-db pg_isready -U testuser -d app_test > /dev/null 2>&1; then
      print_success "Database is ready!"
      
      print_step "Syncing migrations..."
      cd "$REPO_ROOT"
      bash scripts/sync-migrations.sh
      
      print_step "Seeding database..."
      cd "$REPO_ROOT/../the-achievers-backend"
      DATABASE_URL="postgresql://testuser:testpassword@localhost:5433/app_test?schema=public" \
        npx prisma db seed
      
      print_success "Database reset and seeded!"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
  
  echo "Failed to start database after $max_attempts attempts"
  return 1
}

status_docker_db() {
  print_step "Checking database status..."
  cd "$REPO_ROOT"
  docker-compose ps test-db
}

show_help() {
  cat << EOF
Test Database Management Script

Usage: ./scripts/test-db.sh [command]

Commands:
  start          Start and setup test database (migrate & seed)
  stop           Stop the test database container
  reset          Reset database (clear, migrate & seed)
  status         Show database container status
  test           Full test run (start → migrate → seed → test → reset → stop)
  help           Show this help message

Examples:
  ./scripts/test-db.sh start
  ./scripts/test-db.sh test       (full automated test run)
  ./scripts/test-db.sh reset
  ./scripts/test-db.sh stop

EOF
}

# Main script logic
case "${1:-help}" in
  start)
    start_docker_db
    ;;
  stop)
    stop_docker_db
    ;;
  reset)
    reset_docker_db
    ;;
  status)
    status_docker_db
    ;;
  test)
    full_test_run
    ;;
  help)
    show_help
    ;;
  *)
    echo "Unknown command: $1"
    show_help
    exit 1
    ;;
esac
