# Database Dump Quick Guide

Quick reference for creating database backups before making significant changes (like recalculating ratings).

## Quick Start

### Option 1: Using the dump script (Easiest)

If you have `DATABASE_URL` in `backend/.env`:

```bash
./scripts/dump-database.sh
```

Or provide the database URL directly:

```bash
./scripts/dump-database.sh 'postgresql://user:password@host:5432/dbname'
```

### Option 2: Using the production backup script

```bash
./scripts/backup-production-db.sh 'postgresql://user:password@host:5432/dbname'
```

### Option 3: Manual dump

```bash
export PGPASSWORD='your-password'
pg_dump -h your-host -p 5432 -U your-user -d your-database \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --format=plain \
    --file=backup_$(date +%Y%m%d_%H%M%S).sql

gzip backup_*.sql
```

## Where Backups Are Saved

All backups are saved to: `./backups/`

- Format: `database_dump_YYYYMMDD_HHMMSS.sql.gz`
- Example: `database_dump_20250125_143022.sql.gz`

## Before Recalculating Ratings

**Always create a backup first!**

```bash
# 1. Create backup
./scripts/dump-database.sh

# 2. Verify backup was created
ls -lh backups/

# 3. Then proceed with rating recalculation
# (via API or script)
```

## Getting Your DATABASE_URL

### From Render Dashboard:
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your database service
3. Go to "Info" tab
4. Copy the "Internal Database URL" or "External Database URL"

### From Neon Console:
1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to "Connection Details"
4. Copy the connection string

### From backend/.env:
```bash
cat backend/.env | grep DATABASE_URL
```

## Restoring a Backup

```bash
./scripts/restore-production-db.sh ./backups/database_dump_20250125_143022.sql.gz 'your-database-url'
```

⚠️ **WARNING**: Restoring will overwrite your current database!

## Prerequisites

Make sure you have PostgreSQL client tools installed:

**macOS:**
```bash
brew install postgresql@17
```

**Linux:**
```bash
sudo apt-get install postgresql-client
```

**Windows:**
Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

## Troubleshooting

### "pg_dump: command not found"
Install PostgreSQL client tools (see Prerequisites above)

### "Permission denied"
Make script executable:
```bash
chmod +x scripts/dump-database.sh
```

### "Connection refused"
- Check if your IP is whitelisted in your database provider
- Verify DATABASE_URL is correct
- Check if database allows external connections

## Related Documentation

- [Backup Guide](./BACKUP_GUIDE.md) - Comprehensive backup documentation
- [Recalculate Ratings](./RECALCULATE_RATINGS.md) - How to recalculate ratings
