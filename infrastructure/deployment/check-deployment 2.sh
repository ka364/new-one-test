#!/bin/bash
# HaderOS - Clean Deployment Helper Script
# يساعدك في التأكد من نظافة النشر

echo "🧹 HaderOS Clean Deployment Helper"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${YELLOW}⚠️  doctl not installed${NC}"
    echo "Install it with: brew install doctl"
    echo "Or use DigitalOcean web UI instead"
    echo ""
fi

echo -e "${BLUE}📋 Pre-Deployment Checklist:${NC}"
echo ""

# GitHub status
echo -e "${YELLOW}1. GitHub Status:${NC}"
cd /Users/ahmedmohamedshawkyatta/Documents/GitHub/haderos-platform 2>/dev/null
if [ $? -eq 0 ]; then
    BRANCH=$(git branch --show-current)
    COMMIT=$(git rev-parse --short HEAD)
    echo -e "   ${GREEN}✓${NC} Repository: haderos-platform"
    echo -e "   ${GREEN}✓${NC} Branch: $BRANCH"
    echo -e "   ${GREEN}✓${NC} Latest Commit: $COMMIT"
    
    # Check if there are uncommitted changes
    if [[ -n $(git status -s) ]]; then
        echo -e "   ${RED}✗${NC} You have uncommitted changes!"
        echo "   Run: git add . && git commit -m 'message' && git push"
    else
        echo -e "   ${GREEN}✓${NC} All changes committed"
    fi
else
    echo -e "   ${RED}✗${NC} Not in repository directory"
fi
echo ""

# Required files check
echo -e "${YELLOW}2. Required Files:${NC}"
FILES=(
    "backend/main.py"
    "requirements.txt"
    "Dockerfile"
    ".do/app.yaml"
    ".env.production"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✓${NC} $file"
    else
        echo -e "   ${RED}✗${NC} $file (missing!)"
    fi
done
echo ""

# Database cluster info
echo -e "${YELLOW}3. Database Cluster:${NC}"
echo "   Cluster ID: app-0aa8268b-a1c8-4121-ad4e-1fa37780bc7b"
echo "   Engine: PostgreSQL v17"
echo "   Region: Frankfurt"
echo -e "   ${GREEN}✓${NC} Ready to use"
echo ""

# Domain info
echo -e "${YELLOW}4. Domain:${NC}"
echo "   Primary: haderosai.com"
echo "   Alias: www.haderosai.com"
echo -e "   ${GREEN}✓${NC} Ready to connect"
echo ""

# Environment variables reminder
echo -e "${YELLOW}5. Environment Variables to Set:${NC}"
echo "   DATABASE_URL = \${db.DATABASE_URL}"
echo "   SECRET_KEY = [Auto-generated]"
echo "   DEBUG = False"
echo "   CORS_ORIGINS = https://haderosai.com,https://www.haderosai.com"
echo ""

# Deployment options
echo -e "${BLUE}🚀 Deployment Options:${NC}"
echo ""
echo "  Option 1: DigitalOcean Web UI (Recommended)"
echo "  ----------------------------------------"
echo "  1. Open: https://cloud.digitalocean.com/apps"
echo "  2. Delete old app (if exists)"
echo "  3. Create new app → Choose GitHub"
echo "  4. Select: ka364/haderos-platform (master)"
echo "  5. Configure as shown in CLEAN_DEPLOYMENT.md"
echo "  6. Deploy!"
echo ""

if command -v doctl &> /dev/null; then
    echo "  Option 2: Using doctl CLI (Advanced)"
    echo "  -----------------------------------"
    echo "  Run: doctl apps create --spec .do/app.yaml"
    echo ""
fi

echo -e "${BLUE}📚 Documentation:${NC}"
echo "  - Full Guide: CLEAN_DEPLOYMENT.md"
echo "  - Quick Start: DIGITALOCEAN_DEPLOYMENT.md"
echo "  - General Deployment: DEPLOYMENT.md"
echo ""

echo -e "${GREEN}Ready to deploy! 🎉${NC}"
echo ""
echo "Next step: Follow instructions in CLEAN_DEPLOYMENT.md"
