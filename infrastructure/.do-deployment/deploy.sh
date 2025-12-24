#!/bin/bash

# HaderOS Platform - DigitalOcean Deployment Script
# Local deployment management (separate from GitHub)
# Author: HaderOS Team
# Date: 2024-12-24

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}HaderOS Platform - DigitalOcean Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Configuration
APP_NAME="haderos"
REGION="fra"  # Frankfurt
GITHUB_REPO="ka364/haderos-platform"
GITHUB_BRANCH="master"
DB_CLUSTER_ID="app-0aa8268b-e1c8-4121-adfe-11a37780bc7b"
DOMAIN="haderosai.com"

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

# Check doctl (DigitalOcean CLI)
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}❌ doctl not found. Install: https://docs.digitalocean.com/reference/doctl/how-to/install/${NC}"
    exit 1
fi

# Check authentication
if ! doctl auth list > /dev/null 2>&1; then
    echo -e "${RED}❌ Not authenticated with DigitalOcean. Run: doctl auth init${NC}"
    exit 1
fi

echo -e "${GREEN}✅ doctl authenticated${NC}"

# Check jq (JSON processor)
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq not found. Install: brew install jq${NC}"
    exit 1
fi

echo -e "${GREEN}✅ jq installed${NC}"
echo ""

# Display current app status
echo -e "${YELLOW}📊 Current app status:${NC}"
doctl apps list --format Name,ID,Status --no-header | grep "$APP_NAME" || echo "No existing app found"
echo ""

# Menu for user choice
echo -e "${YELLOW}Choose action:${NC}"
echo "1) Delete old app (if exists) and deploy fresh"
echo "2) Create new app"
echo "3) Redeploy current app"
echo "4) View current app status"
echo "5) View app logs"
echo "6) Delete app"
echo ""
read -p "Enter choice (1-6): " choice

case $choice in
    1)
        echo -e "${YELLOW}🗑️  Deleting old app...${NC}"
        APP_ID=$(doctl apps list --format ID,Name --no-header | grep "$APP_NAME" | awk '{print $1}')
        if [ -n "$APP_ID" ]; then
            doctl apps delete "$APP_ID" --force
            echo -e "${GREEN}✅ Old app deleted${NC}"
            sleep 5
        fi
        
        echo -e "${YELLOW}🚀 Creating fresh app from GitHub...${NC}"
        doctl apps create \
            --spec app.yaml \
            --format Name,ID,Status
        echo -e "${GREEN}✅ Fresh app created${NC}"
        ;;
    
    2)
        echo -e "${YELLOW}🚀 Creating new app...${NC}"
        doctl apps create \
            --spec app.yaml \
            --format Name,ID,Status
        echo -e "${GREEN}✅ App created${NC}"
        ;;
    
    3)
        echo -e "${YELLOW}🔄 Redeploying app...${NC}"
        APP_ID=$(doctl apps list --format ID,Name --no-header | grep "$APP_NAME" | awk '{print $1}')
        if [ -n "$APP_ID" ]; then
            doctl apps update "$APP_ID" \
                --spec app.yaml \
                --format Name,ID,Status
            echo -e "${GREEN}✅ App redeployed${NC}"
        else
            echo -e "${RED}❌ App not found${NC}"
            exit 1
        fi
        ;;
    
    4)
        echo -e "${YELLOW}📊 App status:${NC}"
        doctl apps list --format Name,ID,Status,UpdatedAt --no-header | grep "$APP_NAME"
        echo ""
        APP_ID=$(doctl apps list --format ID,Name --no-header | grep "$APP_NAME" | awk '{print $1}')
        if [ -n "$APP_ID" ]; then
            echo -e "${BLUE}App Details:${NC}"
            doctl apps get "$APP_ID" --format Name,ID,Status,LastDeploymentError --no-header
        fi
        ;;
    
    5)
        echo -e "${YELLOW}📋 Fetching app logs...${NC}"
        APP_ID=$(doctl apps list --format ID,Name --no-header | grep "$APP_NAME" | awk '{print $1}')
        if [ -n "$APP_ID" ]; then
            doctl apps logs "$APP_ID" --tail 100
        else
            echo -e "${RED}❌ App not found${NC}"
            exit 1
        fi
        ;;
    
    6)
        echo -e "${RED}⚠️  WARNING: This will delete the app!${NC}"
        read -p "Type app name to confirm deletion: " confirm
        if [ "$confirm" = "$APP_NAME" ]; then
            APP_ID=$(doctl apps list --format ID,Name --no-header | grep "$APP_NAME" | awk '{print $1}')
            doctl apps delete "$APP_ID" --force
            echo -e "${GREEN}✅ App deleted${NC}"
        else
            echo -e "${YELLOW}❌ Deletion cancelled${NC}"
        fi
        ;;
    
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment operation completed!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Visit: https://cloud.digitalocean.com/apps to monitor deployment"
echo "2. Wait for status to change from 'DEPLOYING' to 'ACTIVE'"
echo "3. Test health: curl https://${DOMAIN}/health"
echo "4. View logs: doctl apps logs <app-id>"
echo ""
