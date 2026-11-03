#!/bin/bash

# Test database setup and management script

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( dirname "$SCRIPT_DIR" )"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
  echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Main functions
start_docker_db() {
  print_step "Starting test database container..."
  cd "$REPO_ROOT"
  docker-compose up -d test-db
  
  # Wait for database to be ready
  print_step "Waiting for database to be healthy..."
  sleep 2
  max_attempts=30
  attempt=0
  
  while [ $attempt -lt $max_attempts ]; do
    if docker exec achievers-test-db pg_isready -U testuser -d app_test > /dev/null 2>&1; then
      print_success "Database is ready!"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
  
  echo "Failed to start database after $max_attempts attempts"
  return 1
}

stop_docker_db() {
  print_step "Stopping test database container..."
  cd "$REPO_ROOT"
  docker-compose down
  print_success "Database stopped"
}

reset_docker_db() {
  print_step "Resetting test database..."
  cd "$REPO_ROOT"
  docker-compose down -v
  print_step "Starting fresh database..."
  docker-compose up -d test-db
  
  # Wait for database to be ready
  print_step "Waiting for database to be healthy..."
  sleep 2
  max_attempts=30
  attempt=0
  
  while [ $attempt -lt $max_attempts ]; do
    if docker exec achievers-test-db pg_isready -U testuser -d app_test > /dev/null 2>&1; then
      print_success "Database is ready!"
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
  start          Start the test database container
  stop           Stop the test database container
  reset          Stop and remove volumes, then start fresh
  status         Show database container status
  help           Show this help message

Examples:
  ./scripts/test-db.sh start
  ./scripts/test-db.sh reset before running tests
  ./scripts/test-db.sh stop after tests are complete
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
  help)
    show_help
    ;;
  *)
    echo "Unknown command: $1"
    show_help
    exit 1
    ;;
esac
