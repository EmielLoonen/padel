#!/bin/bash

# Production Database Backup Script
# This script creates a backup of your production PostgreSQL database

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

echo -e "${GREEN}Production Database Backup Script${NC}"
echo "=================================="
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./scripts/backup-production-db.sh <DATABASE_URL>${NC}"
    echo ""
    echo "Example:"
    echo "  ./scripts/backup-production-db.sh 'postgresql://user:pass@host:5432/dbname'"
    echo ""
    echo "Or set DATABASE_URL environment variable:"
    echo "  export DATABASE_URL='postgresql://user:pass@host:5432/dbname'"
    echo "  ./scripts/backup-production-db.sh"
    echo ""
    exit 1
fi

DATABASE_URL="${1:-$DATABASE_URL}"

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not provided${NC}"
    exit 1
fi

# Create backups directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/production_backup_${TIMESTAMP}.sql"
BACKUP_FILE_COMPRESSED="$BACKUP_FILE.gz"

echo -e "${YELLOW}Creating backup...${NC}"
echo "Database URL: ${DATABASE_URL%%@*}@***" # Hide password in output
echo "Backup file: $BACKUP_FILE_COMPRESSED"
echo ""

# Use pg_dump to create backup
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
    
    # URL decode password if needed (handle special characters)
    DB_PASS=$(printf '%b\n' "${DB_PASS//%/\\x}")
    
    echo "Parsed connection details:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    
    # Set password for pg_dump
    export PGPASSWORD="$DB_PASS"
    
    # Create backup using pg_dump
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        --format=plain \
        --file="$BACKUP_FILE"
    
    # Check if pg_dump was successful
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: pg_dump failed${NC}"
        unset PGPASSWORD
        exit 1
    fi
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    
    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_FILE_COMPRESSED" | cut -f1)
    
    echo ""
    echo -e "${GREEN}✓ Backup created successfully!${NC}"
    echo "  File: $BACKUP_FILE_COMPRESSED"
    echo "  Size: $FILE_SIZE"
    echo ""
    echo -e "${YELLOW}To restore this backup:${NC}"
    echo "  ./scripts/restore-production-db.sh $BACKUP_FILE_COMPRESSED 'your-database-url'"
    echo ""
    
    # Unset password
    unset PGPASSWORD
else
    echo -e "${RED}Error: Invalid DATABASE_URL format${NC}"
    echo "Expected format: postgresql://user:password@host[:port]/database[?query]"
    echo ""
    echo "Examples:"
    echo "  postgresql://user:pass@host:5432/dbname"
    echo "  postgresql://user:pass@host/dbname"
    echo "  postgresql://user:pass@host/dbname?sslmode=require"
    echo ""
    echo "Your URL format: ${DATABASE_URL:0:50}..."
    exit 1
fi

