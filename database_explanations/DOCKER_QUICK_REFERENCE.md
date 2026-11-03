# Docker Test Database - Quick Reference

## 🚀 Quick Start (2 commands)

```bash
npm run db:start      # Start database (runs migrations automatically)
npm run test:docker   # Run tests against Docker database  
npm run db:stop       # Stop database when done (optional - can run multiple times)
```

**That's it!** Migrations run automatically before tests start.

## Available Commands

```bash
# Database Management
npm run db:start      # Start the test database container
npm run db:stop       # Stop the database container
npm run db:reset      # Delete all test data and start fresh
npm run db:status     # Show database container status
npm run db:migrate    # Manually run Prisma migrations (usually not needed)

# Testing
npm run test:docker   # Run all tests against Docker database (migrations run automatically)
npm run test:docker:reset  # Reset DB and run all tests

# Original database (still available)
npm test              # Run tests against development database
npm run test:api      # API tests only (development database)
npm run test:ui       # UI tests only (development database)
```

## 📊 What Changed

| Type | Item | Details |
|------|------|---------|
| **Created** | docker-compose.yml | Docker container config |
| **Created** | scripts/test-db.sh | Database management script |
| **Created** | scripts/init-test-db.sql | Database initialization |
| **Created** | .env.test | Test database credentials |
| **Modified** | package.json | Added 6 new npm scripts |
| **Modified** | README.md | Added Docker documentation |

## ✅ Verification Done

- ✅ Docker installed and working
- ✅ PostgreSQL image pulled successfully
- ✅ Container created and started
- ✅ Database connection verified
- ✅ Container stopped and cleaned up

## 🔄 How to Revert

**Stop using Docker (quickest):**
```bash
npm run db:stop
npm test  # Use development database as before
```

**Remove Docker setup completely:**
```bash
bash scripts/test-db.sh stop
git checkout package.json README.md
rm -rf docker-compose.yml scripts/ .env.test DOCKER_SETUP_*.md
```

## 🐳 Database Details

- **Container:** PostgreSQL 15 (Alpine)
- **Host Port:** 5433
- **Database:** app_test
- **Username:** testuser
- **Password:** testpassword

## 📖 Full Documentation

- `README.md` - Complete setup and testing guide
- `DOCKER_SETUP_CHANGELOG.md` - Detailed change log
- `DOCKER_SETUP_SUMMARY.md` - Complete summary with troubleshooting

## ⚠️ Important Notes

1. Database is **NOT** running in the background automatically
2. Start it with `npm run db:start` when you need it
3. Data persists in the Docker volume until you run `npm run db:reset`
4. Uses port **5433** (not 5432) to avoid conflicts

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Container won't start | Run `npm run db:stop` then `npm run db:start` |
| Connection refused | Wait 5-10 seconds, then try again |
| Port 5433 in use | Stop another PostgreSQL or change port in docker-compose.yml |
| Old test data | Run `npm run db:reset` |

---

**Everything is tested and ready to use!** 🎉
