#!/bin/bash
# ==============================================
# HADEROS - Full Setup Script
# سكريبت الإعداد الكامل
# ==============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ██╗  ██╗ █████╗ ██████╗ ███████╗██████╗  ██████╗ ███████╗║"
echo "║   ██║  ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔════╝║"
echo "║   ███████║███████║██║  ██║█████╗  ██████╔╝██║   ██║███████╗║"
echo "║   ██╔══██║██╔══██║██║  ██║██╔══╝  ██╔══██╗██║   ██║╚════██║║"
echo "║   ██║  ██║██║  ██║██████╔╝███████╗██║  ██║╚██████╔╝███████║║"
echo "║   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝║"
echo "║                                                           ║"
echo "║              Full Setup Script v1.0                       ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Step counter
step=1
total_steps=8

show_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}[$step/$total_steps] $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    step=$((step + 1))
}

# Check prerequisites
show_step "فحص المتطلبات الأساسية..."

echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js غير مثبت. يرجى تثبيته أولاً.${NC}"
    echo "   brew install node  # macOS"
    exit 1
fi
node_version=$(node -v)
echo -e "${GREEN}✅ Node.js: $node_version${NC}"

echo "Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm غير مثبت. جاري التثبيت...${NC}"
    npm install -g pnpm
fi
pnpm_version=$(pnpm -v)
echo -e "${GREEN}✅ pnpm: $pnpm_version${NC}"

echo "Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL غير مثبت أو غير في PATH${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL: موجود${NC}"
fi

# Install dependencies
show_step "تثبيت الحزم..."

cd apps/haderos-web
echo "Installing dependencies in apps/haderos-web..."
pnpm install
echo -e "${GREEN}✅ تم تثبيت الحزم${NC}"

cd ../..

# Setup environment file
show_step "إعداد ملف البيئة..."

if [ -f "apps/haderos-web/.env" ]; then
    echo -e "${YELLOW}⚠️  ملف .env موجود بالفعل${NC}"
    read -p "هل تريد إعادة إنشائه؟ (y/n): " recreate
    if [ "$recreate" = "y" ]; then
        cp apps/haderos-web/.env.production.ready apps/haderos-web/.env
        echo -e "${GREEN}✅ تم إنشاء ملف .env جديد${NC}"
    fi
else
    cp apps/haderos-web/.env.production.ready apps/haderos-web/.env
    echo -e "${GREEN}✅ تم إنشاء ملف .env${NC}"
fi

# Generate security keys
show_step "توليد مفاتيح الأمان..."

JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Update .env file with generated keys
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/JWT_SECRET=\"\"/JWT_SECRET=\"$JWT_SECRET\"/" apps/haderos-web/.env
    sed -i '' "s/SESSION_SECRET=\"\"/SESSION_SECRET=\"$SESSION_SECRET\"/" apps/haderos-web/.env
    sed -i '' "s/ENCRYPTION_KEY=\"\"/ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"/" apps/haderos-web/.env
else
    # Linux
    sed -i "s/JWT_SECRET=\"\"/JWT_SECRET=\"$JWT_SECRET\"/" apps/haderos-web/.env
    sed -i "s/SESSION_SECRET=\"\"/SESSION_SECRET=\"$SESSION_SECRET\"/" apps/haderos-web/.env
    sed -i "s/ENCRYPTION_KEY=\"\"/ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"/" apps/haderos-web/.env
fi

echo -e "${GREEN}✅ تم توليد وإضافة مفاتيح الأمان${NC}"

# Database setup
show_step "إعداد قاعدة البيانات..."

echo ""
echo "هل لديك رابط قاعدة بيانات PostgreSQL؟"
echo "مثال: postgresql://user:password@localhost:5432/haderos_db"
echo ""
read -p "أدخل رابط قاعدة البيانات (أو اضغط Enter للتخطي): " db_url

if [ -n "$db_url" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|DATABASE_URL=\"\"|DATABASE_URL=\"$db_url\"|" apps/haderos-web/.env
    else
        sed -i "s|DATABASE_URL=\"\"|DATABASE_URL=\"$db_url\"|" apps/haderos-web/.env
    fi
    echo -e "${GREEN}✅ تم إضافة رابط قاعدة البيانات${NC}"

    # Try to push schema
    echo "جاري تطبيق Schema على قاعدة البيانات..."
    cd apps/haderos-web
    if pnpm drizzle-kit push --force 2>/dev/null; then
        echo -e "${GREEN}✅ تم تطبيق Schema بنجاح${NC}"
    else
        echo -e "${YELLOW}⚠️  لم نتمكن من تطبيق Schema. تحقق من اتصال قاعدة البيانات.${NC}"
    fi
    cd ../..
else
    echo -e "${YELLOW}⚠️  تم تخطي إعداد قاعدة البيانات${NC}"
    echo "   يجب إضافة DATABASE_URL يدوياً في apps/haderos-web/.env"
fi

# Shopify setup (optional)
show_step "إعداد Shopify (اختياري)..."

echo ""
read -p "هل تريد إعداد Shopify الآن؟ (y/n): " setup_shopify

if [ "$setup_shopify" = "y" ]; then
    read -p "أدخل Shopify Shop URL (مثال: mystore.myshopify.com): " shopify_url
    read -p "أدخل Shopify Access Token: " shopify_token

    if [ -n "$shopify_url" ] && [ -n "$shopify_token" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|SHOPIFY_SHOP_URL=\"\"|SHOPIFY_SHOP_URL=\"$shopify_url\"|" apps/haderos-web/.env
            sed -i '' "s|SHOPIFY_ACCESS_TOKEN=\"\"|SHOPIFY_ACCESS_TOKEN=\"$shopify_token\"|" apps/haderos-web/.env
        else
            sed -i "s|SHOPIFY_SHOP_URL=\"\"|SHOPIFY_SHOP_URL=\"$shopify_url\"|" apps/haderos-web/.env
            sed -i "s|SHOPIFY_ACCESS_TOKEN=\"\"|SHOPIFY_ACCESS_TOKEN=\"$shopify_token\"|" apps/haderos-web/.env
        fi
        echo -e "${GREEN}✅ تم إعداد Shopify${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  تم تخطي إعداد Shopify${NC}"
fi

# Build application
show_step "بناء التطبيق..."

cd apps/haderos-web
echo "Building application..."
if pnpm build 2>/dev/null; then
    echo -e "${GREEN}✅ تم بناء التطبيق بنجاح${NC}"
else
    echo -e "${YELLOW}⚠️  فشل البناء. قد تحتاج لإعداد قاعدة البيانات أولاً.${NC}"
fi
cd ../..

# Run health check
show_step "فحص الصحة النهائي..."

if [ -f "scripts/health-check.sh" ]; then
    chmod +x scripts/health-check.sh
    ./scripts/health-check.sh
else
    echo -e "${YELLOW}⚠️  ملف health-check.sh غير موجود${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║              ✅ اكتمل الإعداد بنجاح!                      ║"
echo "║                                                           ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║                                                           ║"
echo "║  الخطوات التالية:                                         ║"
echo "║                                                           ║"
echo "║  1. راجع الإعدادات في: apps/haderos-web/.env              ║"
echo "║                                                           ║"
echo "║  2. لتشغيل التطبيق:                                       ║"
echo "║     cd apps/haderos-web                                   ║"
echo "║     pnpm dev      # للتطوير                               ║"
echo "║     pnpm start    # للإنتاج                               ║"
echo "║                                                           ║"
echo "║  3. افتح: http://localhost:3000                           ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Ask to start
read -p "هل تريد تشغيل التطبيق الآن؟ (y/n): " start_now

if [ "$start_now" = "y" ]; then
    cd apps/haderos-web
    echo ""
    echo -e "${CYAN}🚀 جاري تشغيل HADEROS...${NC}"
    echo ""
    pnpm dev
fi
