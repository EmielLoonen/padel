#!/bin/bash

# Production Database Restore Script
# This script restores a backup to your PostgreSQL database (local or production)

set -e

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

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Production Database Restore Script${NC}"
echo "=================================="
echo ""

# Check if backup file and DATABASE_URL are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${YELLOW}Usage: ./scripts/restore-production-db.sh <BACKUP_FILE> <DATABASE_URL>${NC}"
    echo ""
    echo "Example:"
    echo "  ./scripts/restore-production-db.sh ./backups/production_backup_20241119_120000.sql.gz 'postgresql://user:pass@host:5432/dbname'"
    echo ""
    exit 1
fi

BACKUP_FILE="$1"
DATABASE_URL="$2"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}WARNING: This will overwrite your database!${NC}"
echo "Backup file: $BACKUP_FILE"
echo "Database URL: ${DATABASE_URL%%@*}@***"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Restoring backup...${NC}"

# Extract connection details from DATABASE_URL
# Handle various formats: with/without port, with query parameters, etc.

# Remove query parameters for parsing
CLEAN_URL="${DATABASE_URL%%\?*}"

# Parse the URL - handle both with and without port
if [[ $CLEAN_URL =~ postgresql://([^:]+):([^@]+)@([^:/]+)(:([0-9]+))?/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[5]:-5432}"  # Default to 5432 if not specified
    DB_NAME="${BASH_REMATCH[6]}"
    
    echo "Parsed connection details:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    
    # Set password for psql
    export PGPASSWORD="$DB_PASS"
    
    # Restore backup
    echo -e "${YELLOW}Restoring backup...${NC}"
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    else
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
    
    # Unset password
    unset PGPASSWORD
else
    echo -e "${RED}Error: Invalid DATABASE_URL format${NC}"
    echo "Expected format: postgresql://user:password@host[:port]/database[?query]"
    echo ""
    echo "Examples:"
    echo "  postgresql://user:pass@host:5432/dbname"
    echo "  postgresql://user:pass@host/dbname"
    echo "  postgresql://user:pass@localhost:5432/padel"
    exit 1
fi

