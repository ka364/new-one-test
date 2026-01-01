#!/bin/bash

# ============================================
# HADEROS Auto-Backup Script
# ============================================
# نسخ احتياطي تلقائي للملفات الجديدة
# ينسخ الملفات إلى:
# 1. النسخة المحلية (git commit)
# 2. المستودع الرئيسي (origin)
# 3. المستودع الاحتياطي (backup)
# ============================================

set -e  # Exit on error

# الألوان للرسائل
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# المسار الأساسي للمشروع
PROJECT_DIR="/Users/ahmedmohamedshawkyatta/Documents/HADEROS-AI-CLOUD"
cd "$PROJECT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 HADEROS Auto-Backup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# التحقق من وجود git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git غير مثبت!${NC}"
    exit 1
fi

# التحقق من وجود remote backup
if ! git remote | grep -q "backup"; then
    echo -e "${YELLOW}⚠️  إضافة remote backup...${NC}"
    git remote add backup https://github.com/ka364/new-one-test.git
fi

# التحقق من حالة git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ هذا ليس مستودع git!${NC}"
    exit 1
fi

# عرض الملفات الجديدة والمعدلة
echo -e "${BLUE}📋 فحص الملفات الجديدة والمعدلة...${NC}"
NEW_FILES=$(git status --porcelain | grep "^??" | wc -l | tr -d ' ')
MODIFIED_FILES=$(git status --porcelain | grep "^ M" | wc -l | tr -d ' ')

if [ "$NEW_FILES" -eq 0 ] && [ "$MODIFIED_FILES" -eq 0 ]; then
    echo -e "${GREEN}✅ لا توجد ملفات جديدة أو معدلة${NC}"
    exit 0
fi

echo -e "${GREEN}📁 ملفات جديدة: $NEW_FILES${NC}"
echo -e "${GREEN}📝 ملفات معدلة: $MODIFIED_FILES${NC}"
echo ""

# إضافة جميع الملفات
echo -e "${BLUE}➕ إضافة الملفات إلى git...${NC}"
git add -A

# إنشاء commit
COMMIT_MESSAGE="Auto-backup: $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${BLUE}💾 إنشاء commit...${NC}"
git commit -m "$COMMIT_MESSAGE" || {
    echo -e "${YELLOW}⚠️  لا توجد تغييرات للـ commit${NC}"
    exit 0
}

echo -e "${GREEN}✅ Commit تم بنجاح: $COMMIT_MESSAGE${NC}"
echo ""

# النسخ إلى المستودع الرئيسي (origin)
echo -e "${BLUE}📤 رفع إلى المستودع الرئيسي (origin)...${NC}"
if git push origin main 2>&1 || git push origin master 2>&1; then
    echo -e "${GREEN}✅ تم الرفع إلى origin بنجاح${NC}"
else
    echo -e "${YELLOW}⚠️  فشل الرفع إلى origin (قد يكون هذا طبيعي)${NC}"
fi
echo ""

# النسخ إلى المستودع الاحتياطي (backup)
echo -e "${BLUE}💾 رفع إلى المستودع الاحتياطي (backup)...${NC}"
BRANCH=$(git branch --show-current)
if git push backup "$BRANCH" 2>&1 || git push backup main 2>&1 || git push backup master 2>&1; then
    echo -e "${GREEN}✅ تم الرفع إلى backup بنجاح${NC}"
else
    echo -e "${YELLOW}⚠️  محاولة إنشاء branch جديد في backup...${NC}"
    git push -u backup "$BRANCH" 2>&1 || git push -u backup main 2>&1 || {
        echo -e "${RED}❌ فشل الرفع إلى backup${NC}"
        echo -e "${YELLOW}💡 تأكد من:${NC}"
        echo -e "   1. المستودع موجود على GitHub"
        echo -e "   2. لديك صلاحيات الكتابة"
        echo -e "   3. الـ credentials صحيحة"
    }
fi
echo ""

# ملخص
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ النسخ الاحتياطي اكتمل!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}📊 الملخص:${NC}"
echo -e "   • ملفات جديدة: $NEW_FILES"
echo -e "   • ملفات معدلة: $MODIFIED_FILES"
echo -e "   • Commit: $COMMIT_MESSAGE"
echo -e "   • Branch: $BRANCH"
echo ""
echo -e "${BLUE}🔗 الروابط:${NC}"
echo -e "   • Origin: $(git remote get-url origin)"
echo -e "   • Backup: $(git remote get-url backup)"
echo ""

