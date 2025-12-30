#!/bin/bash

# 🚀 سكريبت التشغيل الشامل - HADEROS AI CLOUD
# آخر تحديث: 29 ديسمبر 2025

set -e

# ألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# رسم شعار
clear
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════╗
║                                           ║
║     🧠 HADEROS AI CLOUD                   ║
║     Bio-Inspired Business Platform        ║
║                                           ║
╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

# 1. التحقق من المتطلبات
echo -e "${YELLOW}🔍 التحقق من المتطلبات...${NC}"
echo ""

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}❌ Node.js غير مثبت${NC}"
    echo "يرجى تثبيت Node.js 20+ من: https://nodejs.org"
    exit 1
fi

# pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "${GREEN}✅ pnpm: ${PNPM_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠️  pnpm غير مثبت، جاري التثبيت...${NC}"
    npm install -g pnpm
    echo -e "${GREEN}✅ تم تثبيت pnpm${NC}"
fi

# PostgreSQL
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL: يعمل${NC}"
else
    echo -e "${RED}❌ PostgreSQL: غير متصل${NC}"
    echo -e "${YELLOW}يرجى تشغيل PostgreSQL أولاً${NC}"
    echo "  macOS: brew services start postgresql@15"
    echo "  Linux: sudo systemctl start postgresql"
    exit 1
fi

echo ""

# 2. التحقق من قاعدة البيانات
echo -e "${YELLOW}🗄️  التحقق من قاعدة البيانات...${NC}"
DB_NAME="haderos_dev"
DB_USER="${USER}"

if psql -U "${DB_USER}" -lqt | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
    echo -e "${GREEN}✅ قاعدة البيانات ${DB_NAME} موجودة${NC}"
else
    echo -e "${YELLOW}⚠️  قاعدة البيانات غير موجودة${NC}"
    echo -e "${BLUE}هل تريد تشغيل سكريبت إعداد قاعدة البيانات؟ (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${YELLOW}جاري تشغيل setup-db.sh...${NC}"
        bash setup-db.sh
    else
        echo -e "${RED}❌ لا يمكن المتابعة بدون قاعدة بيانات${NC}"
        exit 1
    fi
fi
echo ""

# 3. الانتقال إلى مجلد التطبيق
echo -e "${YELLOW}📂 الانتقال إلى apps/haderos-web...${NC}"
cd apps/haderos-web || exit 1
echo ""

# 4. التحقق من node_modules
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules موجود${NC}"
else
    echo -e "${YELLOW}📦 تثبيت المكتبات (قد يستغرق بضع دقائق)...${NC}"
    pnpm install
    echo -e "${GREEN}✅ تم تثبيت المكتبات${NC}"
fi
echo ""

# 5. التحقق من ملف .env
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ ملف .env موجود${NC}"
else
    echo -e "${YELLOW}⚠️  ملف .env غير موجود${NC}"
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}جاري نسخ .env.example إلى .env...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✅ تم إنشاء .env${NC}"
        echo -e "${BLUE}يرجى مراجعة .env وتحديث المتغيرات حسب الحاجة${NC}"
    else
        echo -e "${RED}❌ .env.example غير موجود${NC}"
        exit 1
    fi
fi
echo ""

# 6. عرض معلومات التطبيق
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📊 معلومات التطبيق  ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}الاسم:${NC} HADEROS AI CLOUD"
echo -e "${GREEN}الوضع:${NC} Development"
echo -e "${GREEN}المنفذ:${NC} 3000 (أو التالي المتاح)"
echo -e "${GREEN}قاعدة البيانات:${NC} ${DB_NAME}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 7. تشغيل التطبيق
echo -e "${GREEN}🚀 جاري تشغيل التطبيق...${NC}"
echo ""
echo -e "${YELLOW}للإيقاف: اضغط Ctrl+C${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# تشغيل pnpm dev
pnpm dev
