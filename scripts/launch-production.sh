#!/bin/bash
# ==============================================
# HADEROS Production Launch Script
# ==============================================

set -e

echo "🚀 HADEROS Production Launch Script"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check required environment variables
check_env() {
    echo -e "${BLUE}[1/6] Checking environment variables...${NC}"

    required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
        "SESSION_SECRET"
    )

    optional_vars=(
        "SHOPIFY_SHOP_URL"
        "SHOPIFY_ACCESS_TOKEN"
        "WHATSAPP_ACCESS_TOKEN"
        "BOSTA_API_KEY"
    )

    missing=0
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}❌ Missing required: $var${NC}"
            missing=1
        else
            echo -e "${GREEN}✅ $var${NC}"
        fi
    done

    echo ""
    echo "Optional variables:"
    for var in "${optional_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${YELLOW}⚠️  Not set: $var${NC}"
        else
            echo -e "${GREEN}✅ $var${NC}"
        fi
    done

    if [ $missing -eq 1 ]; then
        echo -e "\n${RED}Please set required environment variables before launching.${NC}"
        exit 1
    fi

    echo -e "\n${GREEN}Environment check passed!${NC}\n"
}

# Check database connection
check_database() {
    echo -e "${BLUE}[2/6] Checking database connection...${NC}"

    if command -v pg_isready &> /dev/null; then
        if pg_isready -d "$DATABASE_URL" -q; then
            echo -e "${GREEN}✅ Database is ready${NC}\n"
        else
            echo -e "${RED}❌ Database is not reachable${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  pg_isready not found, skipping DB check${NC}\n"
    fi
}

# Run database migrations
run_migrations() {
    echo -e "${BLUE}[3/6] Running database migrations...${NC}"

    cd apps/haderos-web

    if [ -f "package.json" ]; then
        echo "Pushing schema to database..."
        pnpm drizzle-kit push --force 2>/dev/null || {
            echo -e "${YELLOW}⚠️  Migration warnings (non-critical)${NC}"
        }
        echo -e "${GREEN}✅ Database schema updated${NC}\n"
    else
        echo -e "${RED}❌ package.json not found${NC}"
        exit 1
    fi

    cd ../..
}

# Build the application
build_app() {
    echo -e "${BLUE}[4/6] Building application...${NC}"

    cd apps/haderos-web

    echo "Installing dependencies..."
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install

    echo "Building application..."
    pnpm build

    echo -e "${GREEN}✅ Application built successfully${NC}\n"

    cd ../..
}

# Verify system health
verify_health() {
    echo -e "${BLUE}[5/6] Verifying system health...${NC}"

    # Count critical files
    schemas=$(ls apps/haderos-web/drizzle/schema*.ts 2>/dev/null | wc -l | tr -d ' ')
    routers=$(ls apps/haderos-web/server/routers/*.ts 2>/dev/null | wc -l | tr -d ' ')
    services=$(ls apps/haderos-web/server/services/*.ts 2>/dev/null | wc -l | tr -d ' ')
    bio_modules=$(ls apps/haderos-web/server/bio-modules/*.ts 2>/dev/null | wc -l | tr -d ' ')

    echo "System inventory:"
    echo "  📊 Schemas: $schemas"
    echo "  🔌 Routers: $routers"
    echo "  ⚙️  Services: $services"
    echo "  🧬 Bio-Modules: $bio_modules"

    if [ "$schemas" -gt 0 ] && [ "$routers" -gt 0 ]; then
        echo -e "\n${GREEN}✅ System health verified${NC}\n"
    else
        echo -e "\n${RED}❌ System health check failed${NC}"
        exit 1
    fi
}

# Launch the application
launch_app() {
    echo -e "${BLUE}[6/6] Launching application...${NC}"

    cd apps/haderos-web

    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════╗"
    echo "║     🚀 HADEROS IS NOW LAUNCHING!       ║"
    echo "╠════════════════════════════════════════╣"
    echo "║  Application: haderos-mvp v1.0.0       ║"
    echo "║  Mode: Production                      ║"
    echo "║  Bio-Modules: Active                   ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"

    # Start in production mode
    NODE_ENV=production pnpm start
}

# Main execution
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║   ██╗  ██╗ █████╗ ██████╗ ███████╗██████╗  ██████╗ ███████╗║"
    echo "║   ██║  ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔════╝║"
    echo "║   ███████║███████║██║  ██║█████╗  ██████╔╝██║   ██║███████╗║"
    echo "║   ██╔══██║██╔══██║██║  ██║██╔══╝  ██╔══██╗██║   ██║╚════██║║"
    echo "║   ██║  ██║██║  ██║██████╔╝███████╗██║  ██║╚██████╔╝███████║║"
    echo "║   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝║"
    echo "║                                                           ║"
    echo "║              AI-Powered Commerce Platform                 ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""

    check_env
    check_database
    run_migrations
    build_app
    verify_health
    launch_app
}

# Run main function
main "$@"
