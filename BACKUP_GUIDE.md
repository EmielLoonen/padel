# Database Backup Guide

This guide explains how to backup and restore your production database.

## Prerequisites

- `pg_dump` and `psql` installed (PostgreSQL client tools)
- Access to your production `DATABASE_URL`

### Installing PostgreSQL Client Tools

**macOS:**
```bash
brew install postgresql@17
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql-client
```

**Windows:**
Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

## Creating a Backup

### Method 1: Using the Backup Script (Recommended)

```bash
# Provide DATABASE_URL as argument
./scripts/backup-production-db.sh 'postgresql://user:password@host:5432/dbname'

# Or set as environment variable
export DATABASE_URL='postgresql://user:password@host:5432/dbname'
./scripts/backup-production-db.sh
```

The backup will be saved to `./backups/production_backup_YYYYMMDD_HHMMSS.sql.gz`

### Method 2: Manual Backup

```bash
# Extract connection details from your DATABASE_URL
# Format: postgresql://user:password@host:port/database

export PGPASSWORD='your-password'
pg_dump -h your-host -p 5432 -U your-user -d your-database \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --format=plain \
    --file=backup_$(date +%Y%m%d_%H%M%S).sql

# Compress the backup
gzip backup_*.sql
```

### Method 3: Using Prisma Studio (For small databases)

If you have access to Prisma Studio in production:

```bash
cd backend
DATABASE_URL='your-production-url' npx prisma studio
```

Then manually export data, though this is not recommended for large databases.

## Restoring a Backup

### Using the Restore Script

```bash
./scripts/restore-production-db.sh ./backups/production_backup_20241119_120000.sql.gz 'postgresql://user:password@host:5432/dbname'
```

**⚠️ WARNING: This will overwrite your database!**

### Manual Restore

```bash
export PGPASSWORD='your-password'

# For compressed backups
gunzip -c backup.sql.gz | psql -h your-host -p 5432 -U your-user -d your-database

# For uncompressed backups
psql -h your-host -p 5432 -U your-user -d your-database < backup.sql
```

## Getting Your Production DATABASE_URL

### If using Neon:
1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to "Connection Details"
4. Copy the connection string

### If using Render:
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your database service
3. Go to "Info" tab
4. Copy the "Internal Database URL" or "External Database URL"

### If using Railway:
1. Go to [Railway Dashboard](https://railway.app)
2. Select your database service
3. Go to "Variables" tab
4. Copy the `DATABASE_URL` value

### If using Supabase:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to "Settings" → "Database"
4. Copy the connection string from "Connection string" section

## Backup Best Practices

1. **Regular Backups**: Create backups before major deployments or migrations
2. **Automated Backups**: Consider setting up automated daily backups
3. **Multiple Locations**: Store backups in multiple locations (local, cloud storage)
4. **Test Restores**: Periodically test restoring backups to ensure they work
5. **Version Control**: Don't commit backups to git (they're in .gitignore)

## Automated Backup Setup

### Using Cron (Linux/macOS)

Add to crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/your/project/scripts/backup-production-db.sh 'your-database-url' >> /path/to/logs/backup.log 2>&1
```

### Using GitHub Actions

Create `.github/workflows/backup-db.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup PostgreSQL
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      - name: Create Backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          ./scripts/backup-production-db.sh "$DATABASE_URL"
      - name: Upload Backup
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backups/*.sql.gz
          retention-days: 30
```

## Troubleshooting

### "pg_dump: command not found"
Install PostgreSQL client tools (see Prerequisites above)

### "Connection refused"
- Check if your IP is whitelisted in your database provider
- Verify DATABASE_URL is correct
- Check if database allows external connections

### "Permission denied"
- Ensure backup script is executable: `chmod +x scripts/backup-production-db.sh`
- Check file permissions on backup directory

### "Database does not exist"
- Verify database name in DATABASE_URL
- Check if database was created in your provider

## Security Notes

- Never commit DATABASE_URL or backups to git
- Store backups securely (encrypted if containing sensitive data)
- Use environment variables for DATABASE_URL
- Rotate backups regularly (keep last 7-30 days)

