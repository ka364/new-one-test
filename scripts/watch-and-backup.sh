#!/bin/bash

# ============================================
# HADEROS Watch & Auto-Backup Script
# ============================================
# يراقب التغييرات في الملفات ويرفعها تلقائياً
# ============================================

set -e

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/Users/ahmedmohamedshawkyatta/Documents/HADEROS-AI-CLOUD"
BACKUP_SCRIPT="$PROJECT_DIR/scripts/auto-backup.sh"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}👀 HADEROS Watch & Auto-Backup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✅ بدء المراقبة...${NC}"
echo -e "${YELLOW}💡 اضغط Ctrl+C للإيقاف${NC}"
echo ""

# التحقق من وجود fswatch (لـ macOS)
if command -v fswatch &> /dev/null; then
    echo -e "${GREEN}✅ استخدام fswatch للمراقبة${NC}"
    echo ""
    
    # مراقبة التغييرات
    fswatch -o "$PROJECT_DIR" | while read f; do
        echo -e "${BLUE}📝 تغيير تم اكتشافه...${NC}"
        sleep 2  # انتظر قليلاً لتجميع التغييرات
        "$BACKUP_SCRIPT"
    done
else
    echo -e "${YELLOW}⚠️  fswatch غير مثبت${NC}"
    echo -e "${BLUE}💡 تثبيت fswatch: brew install fswatch${NC}"
    echo ""
    echo -e "${YELLOW}🔄 استخدام وضع polling بدلاً من ذلك...${NC}"
    
    # وضع polling (أبطأ لكن يعمل بدون fswatch)
    while true; do
        sleep 30  # فحص كل 30 ثانية
        "$BACKUP_SCRIPT"
    done
fi

