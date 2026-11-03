# Docker Setup - How to Revert (Step-by-Step)

If something goes wrong or you want to remove the Docker database setup, follow the appropriate option below.

## ⚠️ Quick Decision Tree

- **"I want to undo everything"** → Jump to [Complete Cleanup](#complete-cleanup-remove-everything)
- **"I want to stop using Docker but keep the files"** → Jump to [Disable Docker](#disable-docker-but-keep-files)
- **"The Docker container is stuck"** → Jump to [Emergency Cleanup](#emergency-cleanup-stuck-container)
- **"I made a mistake in Docker setup"** → Jump to [Rollback to Git](#rollback-to-previous-git-state)

---

## Option 1: Disable Docker (But Keep Files)

**Good for:** Temporarily disabling Docker while keeping the setup

### Steps:
```bash
# 1. Stop the running container
npm run db:stop

# 2. Verify it's stopped
npm run db:status

# 3. Run tests normally (uses development database)
npm test
```

### To Re-enable Later:
```bash
npm run db:start
npm run test:docker
```

---

## Option 2: Complete Cleanup (Remove Everything)

**Good for:** Removing all Docker setup files and configuration

### Steps:

```bash
# 1. Stop the database if running
npm run db:stop

# 2. Remove new script files
rm -rf scripts/

# 3. Remove new configuration files
rm docker-compose.yml
rm .env.test
rm DOCKER_SETUP_CHANGELOG.md
rm DOCKER_SETUP_SUMMARY.md
rm DOCKER_QUICK_REFERENCE.md
rm REVERT_GUIDE.md

# 4. Restore modified files from git
git checkout package.json
git checkout README.md

# 5. Verify cleanup is complete
git status
ls -la | grep -i docker  # Should show no docker files
```

### Verify:
- `npm test` should still work with your development database
- `npm run db:*` commands should not exist anymore

---

## Option 3: Rollback to Previous Git State

**Good for:** Reverting package.json and README.md to their previous versions

### Steps:

```bash
# 1. Stop database
npm run db:stop

# 2. See what changed
git diff package.json
git diff README.md

# 3. Restore to previous version
git checkout package.json README.md

# 4. Delete new Docker files (they're untracked)
rm -rf docker-compose.yml scripts/ .env.test DOCKER_SETUP_*.md REVERT_GUIDE.md

# 5. Verify
git status  # Should show only your existing changes
```

---

## Option 4: Emergency Cleanup (Stuck Container)

**Good for:** If the Docker container won't stop or is corrupted

### Steps:

```bash
# 1. Force stop the container
docker stop achievers-test-db || true

# 2. Force remove the container
docker rm achievers-test-db || true

# 3. Remove the volume (all data)
docker volume rm the-achievers-test-harness_test-db-volume || true

# 4. Remove the network
docker network rm the-achievers-test-harness_achievers-test-network || true

# 5. Verify everything is removed
docker ps -a | grep achievers-test-db  # Should show nothing
docker volume ls | grep test-db        # Should show nothing

# 6. Now run regular cleanup
npm run db:stop  # This should work now
# Then follow "Complete Cleanup" steps above
```

---

## Option 5: Selective Rollback

**Good for:** Keeping Docker but reverting specific files

### Remove Docker setup but keep modifications to package.json:
```bash
# Stop container
npm run db:stop

# Remove Docker-specific files
rm -rf docker-compose.yml scripts/ .env.test DOCKER_SETUP_*.md REVERT_GUIDE.md

# Keep package.json changes (you manually edited the npm scripts)
# But restore README.md
git checkout README.md
```

### Remove Docker setup but keep README modifications:
```bash
# Stop container
npm run db:stop

# Remove Docker-specific files
rm -rf docker-compose.yml scripts/ .env.test DOCKER_SETUP_*.md REVERT_GUIDE.md

# Restore package.json
git checkout package.json

# Keep README.md changes (you added Docker documentation)
```

---

## Verification Checklist

After reverting, verify everything works:

### ✓ Check Docker is gone:
```bash
docker ps -a | grep achievers-test-db    # Should be empty
npm run db:status 2>&1 | grep -i error    # Should show error (no such script)
```

### ✓ Check files are reverted:
```bash
git status                 # Should show expected remaining changes
ls -la | grep docker       # Should show nothing
ls -la | grep test-db      # Should show nothing
```

### ✓ Check tests still work:
```bash
npm test                   # Should work with development database
npm run test:api          # Should work
npm run test:ui           # Should work
```

### ✓ Check old npm scripts are gone:
```bash
npm run    # Lists all scripts - no db:start, db:stop, etc.
```

---

## Troubleshooting Revert Issues

### Issue: "Cannot remove files - permission denied"
**Solution:**
```bash
sudo rm -rf docker-compose.yml scripts/
sudo chown -R $USER .
```

### Issue: "git checkout fails - file not found"
**Solution:** The file might have been deleted in a previous commit. Check git log:
```bash
git log --oneline -- package.json
git checkout HEAD package.json
```

### Issue: "Docker still running after stop"
**Solution:** Force remove it:
```bash
docker kill achievers-test-db
docker rm -f achievers-test-db
docker volume rm the-achievers-test-harness_test-db-volume
```

### Issue: "npm scripts still show after package.json restore"
**Solution:** Clear npm cache:
```bash
npm cache clean --force
# Then restart your terminal or run:
hash -r  # Clear bash command cache
```

---

## If You Changed Your Mind (Want to Re-enable Docker)

Don't worry! The setup is still in git history. To restore:

```bash
# Check what you removed
git log --name-status | head -20

# Restore specific commits
git checkout <commit-hash> -- docker-compose.yml package.json README.md

# Or restore everything and start over:
git reset --hard <commit-before-removal>
```

---

## Need Help?

1. **Check git history:** `git log --oneline` to see what changed
2. **See current status:** `git status` and `git diff`
3. **Compare specific files:** `git diff package.json`, `git diff README.md`
4. **Undo a recent commit:** `git revert <commit-hash>` (creates new commit)
5. **Go back in time:** `git checkout <commit-hash>` (detached HEAD state)

---

## Summary

| Scenario | Command |
|----------|---------|
| Stop using Docker temporarily | `npm run db:stop` |
| Remove all Docker files | See "Complete Cleanup" above |
| Stuck container | See "Emergency Cleanup" above |
| Restore from git | `git checkout package.json README.md` |
| See what will be removed | `git status` and `git diff` |

**Most importantly:** You can always undo anything with git! The setup is fully reversible.
