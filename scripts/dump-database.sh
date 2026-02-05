#!/bin/bash

# Database Dump Script
# Creates a backup of your database (reads DATABASE_URL from backend/.env or accepts as argument)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Database Dump Script${NC}"
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

# Try to get DATABASE_URL from various sources
if [ -n "$1" ]; then
    # DATABASE_URL provided as argument
    DATABASE_URL="$1"
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
    echo "Usage options:"
    echo "  1. Provide as argument:"
    echo "     ./scripts/dump-database.sh 'postgresql://user:pass@host:5432/dbname'"
    echo ""
    echo "  2. Set environment variable:"
    echo "     export DATABASE_URL='postgresql://user:pass@host:5432/dbname'"
    echo "     ./scripts/dump-database.sh"
    echo ""
    echo "  3. Add to backend/.env file:"
    echo "     DATABASE_URL='postgresql://user:pass@host:5432/dbname'"
    echo "     ./scripts/dump-database.sh"
    echo ""
    exit 1
fi

# Create backups directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/database_dump_${TIMESTAMP}.sql"
BACKUP_FILE_COMPRESSED="$BACKUP_FILE.gz"

echo -e "${YELLOW}Creating database dump...${NC}"
echo "Database: ${DATABASE_URL%%@*}@***" # Hide password in output
echo "Output: $BACKUP_FILE_COMPRESSED"
echo ""

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
    
    # Set password for pg_dump
    export PGPASSWORD="$DB_PASS"
    
    # Create dump using pg_dump
    echo -e "${YELLOW}Dumping database...${NC}"
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
    
    # Compress the dump
    echo -e "${YELLOW}Compressing dump...${NC}"
    gzip "$BACKUP_FILE"
    
    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_FILE_COMPRESSED" | cut -f1)
    
    echo ""
    echo -e "${GREEN}✓ Database dump created successfully!${NC}"
    echo "  File: $BACKUP_FILE_COMPRESSED"
    echo "  Size: $FILE_SIZE"
    echo ""
    echo -e "${BLUE}To restore this dump:${NC}"
    echo "  ./scripts/restore-production-db.sh $BACKUP_FILE_COMPRESSED 'your-database-url'"
    echo ""
    echo -e "${YELLOW}Note:${NC} Keep this backup safe! It contains all your data."
    echo ""
    
    # Unset password
    unset PGPASSWORD
else
    echo -e "${RED}Error: Invalid DATABASE_URL format${NC}"
    echo "Expected format: postgresql://user:password@host[:port]/database[?query]"
    exit 1
fi
