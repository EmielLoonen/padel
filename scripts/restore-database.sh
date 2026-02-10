#!/bin/bash

# Database Restore Script
# Restores a database dump to your local or remote database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Database Restore Script${NC}"
echo "======================"
echo ""

# Add PostgreSQL to PATH if installed via Homebrew (macOS)
if [ -d "/opt/homebrew/opt/postgresql@17/bin" ]; then
    export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
elif [ -d "/opt/homebrew/opt/postgresql@16/bin" ]; then
    export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
elif [ -d "/opt/homebrew/opt/postgresql@15/bin" ]; then
    export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
elif [ -d "/usr/local/opt/postgresql@17/bin" ]; then
    export PATH="/usr/local/opt/postgresql@17/bin:$PATH"
fi

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Backup file not provided${NC}"
    echo ""
    echo "Usage:"
    echo "  ./scripts/restore-database.sh <BACKUP_FILE> [DATABASE_URL]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/restore-database.sh ./backups/database_dump_20260205_095705.sql.gz"
    echo "  ./scripts/restore-database.sh ./backups/database_dump_20260205_095705.sql.gz 'postgresql://user:pass@localhost:5432/padel'"
    echo ""
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Try to get DATABASE_URL from various sources
if [ -n "$2" ]; then
    # DATABASE_URL provided as argument
    DATABASE_URL="$2"
    echo -e "${YELLOW}Using DATABASE_URL from argument${NC}"
elif [ -n "$DATABASE_URL" ]; then
    # DATABASE_URL from environment variable
    echo -e "${YELLOW}Using DATABASE_URL from environment variable${NC}"
elif [ -f "backend/.env" ]; then
    # Try to read from backend/.env
    DATABASE_URL=$(grep "^DATABASE_URL=" backend/.env | cut -d '=' -f2- | sed 's/^"//;s/"$//')
    if [ -n "$DATABASE_URL" ]; then
        echo -e "${YELLOW}Using DATABASE_URL from backend/.env${NC}"
    fi
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not found${NC}"
    echo ""
    echo "Please provide DATABASE_URL:"
    echo "  1. As second argument:"
    echo "     ./scripts/restore-database.sh $BACKUP_FILE 'postgresql://user:pass@localhost:5432/dbname'"
    echo ""
    echo "  2. Set environment variable:"
    echo "     export DATABASE_URL='postgresql://user:pass@localhost:5432/dbname'"
    echo "     ./scripts/restore-database.sh $BACKUP_FILE"
    echo ""
    echo "  3. Add to backend/.env file:"
    echo "     DATABASE_URL='postgresql://user:pass@localhost:5432/dbname'"
    echo "     ./scripts/restore-database.sh $BACKUP_FILE"
    echo ""
    exit 1
fi

echo -e "${RED}⚠️  WARNING: This will overwrite your database!${NC}"
echo "Backup file: $BACKUP_FILE"
echo "Database: ${DATABASE_URL%%@*}@***"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Restoring database...${NC}"

# Remove query parameters for parsing
CLEAN_URL="${DATABASE_URL%%\?*}"

# Parse the URL
if [[ $CLEAN_URL =~ postgresql://([^:]+):([^@]+)@([^:/]+)(:([0-9]+))?/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[5]:-5432}"
    DB_NAME="${BASH_REMATCH[6]}"
    
    # URL decode password if needed
    DB_PASS=$(printf '%b\n' "${DB_PASS//%/\\x}")
    
    echo "Connection details:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    
    # Set password for psql
    export PGPASSWORD="$DB_PASS"
    
    # Restore backup
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        echo -e "${YELLOW}Decompressing and restoring...${NC}"
        gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    else
        echo -e "${YELLOW}Restoring...${NC}"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
    fi
    
    # Check if restore was successful
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Restore failed${NC}"
        unset PGPASSWORD
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}✓ Database restored successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Run Prisma migrations (if needed):"
    echo "     cd backend && pnpm prisma migrate deploy"
    echo ""
    echo "  2. Regenerate Prisma Client:"
    echo "     cd backend && pnpm prisma generate"
    echo ""
    
    # Unset password
    unset PGPASSWORD
else
    echo -e "${RED}Error: Invalid DATABASE_URL format${NC}"
    echo "Expected format: postgresql://user:password@host[:port]/database[?query]"
    exit 1
fi
