#!/bin/bash
# ==============================================
# HADEROS System Health Check Script
# ==============================================

echo "🏥 HADEROS Health Check"
echo "======================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Track overall health
overall_health=0
total_checks=0

check() {
    local name=$1
    local status=$2
    total_checks=$((total_checks + 1))

    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✅ $name${NC}"
        overall_health=$((overall_health + 1))
    else
        echo -e "${RED}❌ $name${NC}"
    fi
}

warn() {
    local name=$1
    echo -e "${YELLOW}⚠️  $name${NC}"
}

# 1. File System Health
echo -e "\n${BLUE}📁 File System Health${NC}"
echo "----------------------"

# Check critical directories
[ -d "apps/haderos-web" ]
check "App directory exists" $?

[ -d "apps/haderos-web/drizzle" ]
check "Schema directory exists" $?

[ -d "apps/haderos-web/server" ]
check "Server directory exists" $?

[ -d "apps/haderos-web/server/bio-modules" ]
check "Bio-modules directory exists" $?

# 2. Schema Files
echo -e "\n${BLUE}📊 Database Schemas${NC}"
echo "-------------------"

schema_count=$(ls apps/haderos-web/drizzle/schema*.ts 2>/dev/null | wc -l | tr -d ' ')
[ "$schema_count" -ge 30 ]
check "Schema files present ($schema_count files)" $?

# Check critical schemas
[ -f "apps/haderos-web/drizzle/schema.ts" ]
check "Main schema exists" $?

[ -f "apps/haderos-web/drizzle/schema-payments.ts" ]
check "Payments schema exists" $?

[ -f "apps/haderos-web/drizzle/schema-bnpl.ts" ]
check "BNPL schema exists" $?

# 3. Routers
echo -e "\n${BLUE}🔌 API Routers${NC}"
echo "--------------"

router_count=$(ls apps/haderos-web/server/routers/*.ts 2>/dev/null | wc -l | tr -d ' ')
[ "$router_count" -ge 50 ]
check "Router files present ($router_count files)" $?

# Check critical routers
for router in orders products payment shopify whatsapp-commerce bnpl; do
    [ -f "apps/haderos-web/server/routers/$router.ts" ]
    check "Router: $router" $?
done

# 4. Bio-Modules
echo -e "\n${BLUE}🧬 Bio-Modules${NC}"
echo "--------------"

bio_count=$(ls apps/haderos-web/server/bio-modules/*.ts 2>/dev/null | wc -l | tr -d ' ')
[ "$bio_count" -ge 40 ]
check "Bio-module files present ($bio_count files)" $?

# Check core bio-modules
for module in tardigrade chameleon cephalopod mycelium corvid ant; do
    [ -f "apps/haderos-web/server/bio-modules/$module.ts" ]
    check "Bio-module: $module" $?
done

# 5. Services
echo -e "\n${BLUE}⚙️  Services${NC}"
echo "-----------"

service_count=$(ls apps/haderos-web/server/services/*.ts 2>/dev/null | wc -l | tr -d ' ')
[ "$service_count" -ge 20 ]
check "Service files present ($service_count files)" $?

# Check critical services
[ -f "apps/haderos-web/server/services/shopify-webhook.service.ts" ]
check "Shopify webhook service" $?

[ -f "apps/haderos-web/server/services/unified-payment.service.ts" ]
check "Unified payment service" $?

# 6. Integrations
echo -e "\n${BLUE}🔗 Integrations${NC}"
echo "---------------"

integration_count=$(ls apps/haderos-web/server/integrations/*.ts 2>/dev/null | wc -l | tr -d ' ')
[ "$integration_count" -ge 10 ]
check "Integration files present ($integration_count files)" $?

for integration in shopify-api bosta-api whatsapp-business; do
    [ -f "apps/haderos-web/server/integrations/$integration.ts" ]
    check "Integration: $integration" $?
done

# 7. Documentation
echo -e "\n${BLUE}📚 Documentation${NC}"
echo "----------------"

doc_count=$(ls docs/*.md 2>/dev/null | wc -l | tr -d ' ')
[ "$doc_count" -ge 10 ]
check "Documentation files present ($doc_count files)" $?

[ -f "LAUNCH_READINESS.md" ]
check "Launch readiness report exists" $?

# 8. Configuration Files
echo -e "\n${BLUE}⚙️  Configuration${NC}"
echo "----------------"

[ -f "apps/haderos-web/package.json" ]
check "package.json exists" $?

[ -f "apps/haderos-web/tsconfig.json" ]
check "tsconfig.json exists" $?

# 9. Git Status
echo -e "\n${BLUE}📦 Git Status${NC}"
echo "-------------"

if [ -d ".git" ]; then
    check "Git repository initialized" 0

    uncommitted=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    [ "$uncommitted" -eq 0 ]
    if [ $? -eq 0 ]; then
        check "No uncommitted changes" 0
    else
        warn "Uncommitted changes: $uncommitted files"
    fi

    current_branch=$(git branch --show-current 2>/dev/null)
    echo "   Current branch: $current_branch"
else
    check "Git repository initialized" 1
fi

# Summary
echo ""
echo "═══════════════════════════════════════════"
echo ""

health_percent=$((overall_health * 100 / total_checks))

if [ $health_percent -ge 90 ]; then
    echo -e "${GREEN}🎉 System Health: EXCELLENT ($health_percent%)${NC}"
    echo -e "${GREEN}   $overall_health/$total_checks checks passed${NC}"
    echo ""
    echo -e "${GREEN}✅ HADEROS is ready for production!${NC}"
elif [ $health_percent -ge 70 ]; then
    echo -e "${YELLOW}⚠️  System Health: GOOD ($health_percent%)${NC}"
    echo -e "${YELLOW}   $overall_health/$total_checks checks passed${NC}"
    echo ""
    echo -e "${YELLOW}Review failed checks before launching.${NC}"
else
    echo -e "${RED}❌ System Health: NEEDS ATTENTION ($health_percent%)${NC}"
    echo -e "${RED}   $overall_health/$total_checks checks passed${NC}"
    echo ""
    echo -e "${RED}Fix critical issues before launching.${NC}"
fi

echo ""
