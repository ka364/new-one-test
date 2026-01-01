#!/bin/bash
# ==============================================
# HADEROS - Documentation Generator
# سكريبت توليد التوثيق التلقائي
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
echo "║         HADEROS - Documentation Generator                 ║"
echo "║              سكريبت توليد التوثيق                         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"
APP_DIR="$PROJECT_ROOT/apps/haderos-web"

# ==============================================
# 1. Count Statistics
# ==============================================
echo -e "${BLUE}[1/5] جاري حساب الإحصائيات...${NC}"

# Count files
SCHEMA_COUNT=$(find "$APP_DIR/drizzle" -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
ROUTER_COUNT=$(find "$APP_DIR/server/routers" -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
BIO_MODULE_COUNT=$(find "$APP_DIR/server" -path "*bio*" -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')

# Count lines of code (excluding node_modules)
if command -v cloc &> /dev/null; then
    LOC=$(cloc "$APP_DIR/src" "$APP_DIR/server" --quiet --csv 2>/dev/null | tail -1 | cut -d',' -f5)
else
    LOC=$(find "$APP_DIR/src" "$APP_DIR/server" -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
fi

echo -e "${GREEN}✅ الإحصائيات:${NC}"
echo "   - Schemas: $SCHEMA_COUNT"
echo "   - Routers: $ROUTER_COUNT"
echo "   - Bio-Modules: $BIO_MODULE_COUNT"
echo "   - Lines of Code: $LOC"

# ==============================================
# 2. Generate API Documentation
# ==============================================
echo ""
echo -e "${BLUE}[2/5] جاري توليد توثيق الـ API...${NC}"

API_DOC="$DOCS_DIR/generated/API_ENDPOINTS.md"
mkdir -p "$DOCS_DIR/generated"

cat > "$API_DOC" << 'HEADER'
# 🔌 API Endpoints - Auto-Generated
# توثيق الـ API - مُولّد تلقائياً

> ⚠️ هذا الملف مُولّد تلقائياً. لا تعدّله يدوياً.
>
> آخر توليد: $(date '+%Y-%m-%d %H:%M:%S')

---

HEADER

# Extract router names and endpoints
echo "## 📋 قائمة الـ Routers" >> "$API_DOC"
echo "" >> "$API_DOC"
echo "| Router | الملف | عدد الـ Endpoints |" >> "$API_DOC"
echo "|--------|-------|-------------------|" >> "$API_DOC"

for router_file in "$APP_DIR/server/routers"/*.ts; do
    if [ -f "$router_file" ]; then
        router_name=$(basename "$router_file" .ts)
        endpoint_count=$(grep -c "publicProcedure\|protectedProcedure" "$router_file" 2>/dev/null || echo "0")
        echo "| \`$router_name\` | \`routers/$router_name.ts\` | $endpoint_count |" >> "$API_DOC"
    fi
done

echo -e "${GREEN}✅ تم توليد: $API_DOC${NC}"

# ==============================================
# 3. Generate Schema Documentation
# ==============================================
echo ""
echo -e "${BLUE}[3/5] جاري توليد توثيق الـ Schema...${NC}"

SCHEMA_DOC="$DOCS_DIR/generated/DATABASE_SCHEMA.md"

cat > "$SCHEMA_DOC" << 'HEADER'
# 🗄️ Database Schema - Auto-Generated
# توثيق قاعدة البيانات - مُولّد تلقائياً

> ⚠️ هذا الملف مُولّد تلقائياً. لا تعدّله يدوياً.

---

## 📋 قائمة الجداول

HEADER

for schema_file in "$APP_DIR/drizzle"/*.ts; do
    if [ -f "$schema_file" ]; then
        schema_name=$(basename "$schema_file" .ts)
        table_count=$(grep -c "pgTable\|mysqlTable\|sqliteTable" "$schema_file" 2>/dev/null || echo "0")
        echo "### \`$schema_name\`" >> "$SCHEMA_DOC"
        echo "- الملف: \`drizzle/$schema_name.ts\`" >> "$SCHEMA_DOC"
        echo "- عدد الجداول: $table_count" >> "$SCHEMA_DOC"
        echo "" >> "$SCHEMA_DOC"
    fi
done

echo -e "${GREEN}✅ تم توليد: $SCHEMA_DOC${NC}"

# ==============================================
# 4. Generate Statistics Report
# ==============================================
echo ""
echo -e "${BLUE}[4/5] جاري توليد تقرير الإحصائيات...${NC}"

STATS_DOC="$DOCS_DIR/generated/STATISTICS.md"

cat > "$STATS_DOC" << EOF
# 📊 إحصائيات المشروع - Auto-Generated
# Project Statistics - مُولّد تلقائياً

> آخر تحديث: $(date '+%Y-%m-%d %H:%M:%S')

---

## 📈 ملخص الإحصائيات

| المقياس | القيمة |
|---------|--------|
| 📁 **Database Schemas** | $SCHEMA_COUNT ملف |
| 🔌 **API Routers** | $ROUTER_COUNT ملف |
| 🧬 **Bio-Modules** | $BIO_MODULE_COUNT ملف |
| 📝 **Lines of Code** | ~$LOC سطر |
| 📅 **آخر تحديث** | $(date '+%Y-%m-%d') |

---

## 📂 هيكل المشروع

\`\`\`
apps/haderos-web/
├── src/           # React components
├── server/        # Backend (tRPC)
│   ├── routers/   # $ROUTER_COUNT router
│   └── services/  # Business logic
└── drizzle/       # $SCHEMA_COUNT schema
\`\`\`

---

## 🔄 Git Statistics

\`\`\`
$(cd "$PROJECT_ROOT" && git log --oneline -10 2>/dev/null || echo "Git info not available")
\`\`\`

EOF

echo -e "${GREEN}✅ تم توليد: $STATS_DOC${NC}"

# ==============================================
# 5. Update Version Info
# ==============================================
echo ""
echo -e "${BLUE}[5/5] جاري تحديث معلومات الإصدار...${NC}"

VERSION_FILE="$DOCS_DIR/generated/VERSION_INFO.md"

# Get version from package.json
VERSION=$(cat "$APP_DIR/package.json" 2>/dev/null | grep '"version"' | head -1 | sed 's/.*"version": "\(.*\)".*/\1/' || echo "1.0.0")
LAST_COMMIT=$(cd "$PROJECT_ROOT" && git log -1 --format="%H" 2>/dev/null || echo "unknown")
LAST_COMMIT_DATE=$(cd "$PROJECT_ROOT" && git log -1 --format="%ci" 2>/dev/null || echo "unknown")
BRANCH=$(cd "$PROJECT_ROOT" && git branch --show-current 2>/dev/null || echo "main")

cat > "$VERSION_FILE" << EOF
# 🏷️ Version Info - Auto-Generated

| المعلومة | القيمة |
|----------|--------|
| **الإصدار** | v$VERSION |
| **الفرع** | $BRANCH |
| **آخر Commit** | \`${LAST_COMMIT:0:8}\` |
| **تاريخ آخر Commit** | $LAST_COMMIT_DATE |
| **تاريخ التوليد** | $(date '+%Y-%m-%d %H:%M:%S') |

EOF

echo -e "${GREEN}✅ تم توليد: $VERSION_FILE${NC}"

# ==============================================
# Summary
# ==============================================
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              ✅ اكتمل توليد التوثيق!                      ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║                                                           ║"
echo "║  الملفات المُولّدة:                                       ║"
echo "║  • docs/generated/API_ENDPOINTS.md                        ║"
echo "║  • docs/generated/DATABASE_SCHEMA.md                      ║"
echo "║  • docs/generated/STATISTICS.md                           ║"
echo "║  • docs/generated/VERSION_INFO.md                         ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
