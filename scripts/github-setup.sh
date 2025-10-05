#!/bin/bash

echo "🚀 GitHub Setup Script for Padel Coordinator"
echo "============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}Initializing Git repository...${NC}"
    git init
    echo -e "${GREEN}✓ Git initialized${NC}"
else
    echo -e "${GREEN}✓ Git already initialized${NC}"
fi

echo ""

# Check if there are any commits
if ! git rev-parse HEAD > /dev/null 2>&1; then
    echo -e "${YELLOW}Creating initial commit...${NC}"
    
    # Add all files
    git add .
    
    # Create initial commit
    git commit -m "Initial commit - Padel Match Coordinator

Features:
- User authentication & profiles with avatars
- Session management with court coordination
- RSVP system with waitlist support
- Guest player invitations
- In-app notifications
- Password management
- Dark theme UI (Spotify-inspired)
- Production-ready deployment config"
    
    echo -e "${GREEN}✓ Initial commit created${NC}"
else
    echo -e "${GREEN}✓ Repository already has commits${NC}"
fi

echo ""
echo "============================================="
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Create a new repository on GitHub:"
echo "   → Go to: https://github.com/new"
echo "   → Name: padel-coordinator"
echo "   → Description: Web app for coordinating padel matches"
echo "   → Keep it public (or private if you prefer)"
echo "   → DON'T initialize with README/license/gitignore"
echo "   → Click 'Create repository'"
echo ""
echo "2. Copy the commands GitHub shows you, OR run:"
echo "   ${YELLOW}git remote add origin https://github.com/YOUR-USERNAME/padel-coordinator.git${NC}"
echo "   ${YELLOW}git branch -M main${NC}"
echo "   ${YELLOW}git push -u origin main${NC}"
echo ""
echo "3. Your code will be on GitHub! 🎉"
echo ""
echo "============================================="
echo ""
echo "Need help? Check: docs/DEPLOYMENT_GUIDE.md"

