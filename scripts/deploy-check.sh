#!/bin/bash

echo "🔍 Padel Coordinator - Pre-Deployment Check"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✓ Node.js version is compatible (v$(node -v))${NC}"
else
    echo -e "${RED}✗ Node.js version too old. Need v18 or higher${NC}"
    exit 1
fi

echo ""

# Check if dependencies are installed
echo "2. Checking dependencies..."
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ Backend dependencies not installed. Run: cd backend && npm install${NC}"
fi

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ Frontend dependencies not installed. Run: cd frontend && npm install${NC}"
fi

echo ""

# Check if .env files exist
echo "3. Checking environment files..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ Backend .env exists${NC}"
else
    echo -e "${YELLOW}⚠ Backend .env missing${NC}"
fi

echo ""

# Test backend build
echo "4. Testing backend build..."
cd backend
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend builds successfully${NC}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi
cd ..

echo ""

# Test frontend build
echo "5. Testing frontend build..."
cd frontend
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend builds successfully${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi
cd ..

echo ""

# Check Prisma migrations
echo "6. Checking database migrations..."
cd backend
MIGRATIONS=$(ls prisma/migrations 2>/dev/null | wc -l)
if [ "$MIGRATIONS" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $MIGRATIONS migration(s)${NC}"
else
    echo -e "${YELLOW}⚠ No migrations found${NC}"
fi
cd ..

echo ""

# Generate JWT Secret
echo "7. Generate JWT Secret for production..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo -e "${GREEN}Your JWT Secret (save this for deployment):${NC}"
echo "$JWT_SECRET"

echo ""
echo "==========================================="
echo -e "${GREEN}✅ Pre-deployment check complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Create database on Neon.tech"
echo "2. Deploy to Render using render.yaml"
echo "3. Add DATABASE_URL to Render environment"
echo "4. Add JWT_SECRET to Render environment"
echo "5. Run migrations on Render shell"
echo ""
echo "See docs/DEPLOYMENT_GUIDE.md for detailed instructions"

