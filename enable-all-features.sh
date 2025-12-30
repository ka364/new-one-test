#!/bin/bash

# 🚀 سكريبت تفعيل جميع الميزات المتقدمة - HADEROS AI CLOUD
# آخر تحديث: 29 ديسمبر 2025

set -e

# ألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

clear
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════╗
║                                           ║
║   🧬 تفعيل الميزات المتقدمة               ║
║   HADEROS AI CLOUD                        ║
║                                           ║
╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

DB_NAME="haderos_dev"
DB_USER="${USER}"
ENV_FILE="apps/haderos-web/.env"

echo -e "${YELLOW}هذا السكريبت سيقوم بتفعيل جميع الميزات المتقدمة:${NC}"
echo ""
echo "  1️⃣  KAIA - محرك الامتثال الشرعي"
echo "  2️⃣  Sentinel - نظام المراقبة"
echo "  3️⃣  Bio-Modules - الوحدات الحيوية"
echo "  4️⃣  AI Chat - الدردشة الذكية (يحتاج API Key)"
echo "  5️⃣  Blockchain - تكامل البلوكشين (تجريبي)"
echo ""
echo -e "${PURPLE}هل تريد المتابعة؟ (y/n)${NC}"
read -r response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "تم الإلغاء."
    exit 0
fi
echo ""

# ========================================
# 1. التحقق من قاعدة البيانات
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  1️⃣  التحقق من قاعدة البيانات  ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if ! psql -U "${DB_USER}" -lqt | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
    echo -e "${RED}❌ قاعدة البيانات ${DB_NAME} غير موجودة${NC}"
    echo "يرجى تشغيل ./setup-db.sh أولاً"
    exit 1
fi
echo -e "${GREEN}✅ قاعدة البيانات موجودة${NC}"
echo ""

# ========================================
# 2. إنشاء جداول KAIA
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  2️⃣  إعداد KAIA (محرك الشريعة)  ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📋 إنشاء جدول القواعد الشرعية..."
psql -U "${DB_USER}" -d "${DB_NAME}" << 'EOF'

-- إنشاء جدول القواعد الأخلاقية
CREATE TABLE IF NOT EXISTS ethical_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_name_ar VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    description TEXT,
    description_ar TEXT,
    logic_expression TEXT,
    is_active BOOLEAN DEFAULT true,
    requires_review BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إضافة قواعد شرعية أساسية
INSERT INTO ethical_rules (rule_name, rule_name_ar, category, severity, description, description_ar, is_active, requires_review) VALUES
('No Interest (Riba)', 'منع الربا', 'riba', 'critical', 'Prohibit interest-bearing transactions', 'منع المعاملات الربوية', true, true),
('No Gambling (Maysir)', 'منع الميسر', 'maysir', 'critical', 'Prohibit gambling transactions', 'منع المعاملات القمارية', true, true),
('No Excessive Uncertainty (Gharar)', 'منع الغرر الفاحش', 'gharar', 'high', 'Prohibit transactions with excessive uncertainty', 'منع المعاملات ذات الغرر الفاحش', true, true),
('Halal Products Only', 'منتجات حلال فقط', 'haram_goods', 'critical', 'Only allow trading of Halal products', 'السماح فقط بتداول المنتجات الحلال', true, true),
('Fair Pricing', 'التسعير العادل', 'justice', 'medium', 'Ensure fair and transparent pricing', 'ضمان التسعير العادل والشفاف', true, false),
('Clear Contract Terms', 'شروط عقد واضحة', 'gharar', 'medium', 'All contract terms must be clear and well-defined', 'يجب أن تكون جميع شروط العقد واضحة ومحددة', true, false)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_ethical_rules_category ON ethical_rules(category);
CREATE INDEX IF NOT EXISTS idx_ethical_rules_active ON ethical_rules(is_active);

EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ تم إنشاء جدول القواعد الشرعية${NC}"
else
    echo -e "${RED}❌ فشل في إنشاء جدول القواعد${NC}"
fi
echo ""

# ========================================
# 3. إنشاء جداول Sentinel
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  3️⃣  إعداد Sentinel (المراقبة)  ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📋 إنشاء جداول المراقبة..."
psql -U "${DB_USER}" -d "${DB_NAME}" << 'EOF'

-- جدول المقاييس
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    metric_value DECIMAL(15, 2),
    metric_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100)
);

-- جدول التنبيهات
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_ar TEXT,
    metadata JSONB,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by INTEGER,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الشذوذات
CREATE TABLE IF NOT EXISTS anomalies (
    id SERIAL PRIMARY KEY,
    anomaly_type VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    detected_value DECIMAL(15, 2),
    expected_value DECIMAL(15, 2),
    deviation_percentage DECIMAL(5, 2),
    metadata JSONB,
    is_acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_type ON system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_anomalies_type ON anomalies(anomaly_type);

-- إضافة بيانات تجريبية
INSERT INTO system_metrics (metric_type, metric_name, metric_value, source) VALUES
('performance', 'response_time', 245.50, 'web_server'),
('performance', 'cpu_usage', 45.20, 'system'),
('performance', 'memory_usage', 62.80, 'system'),
('business', 'orders_today', 127, 'orders_system'),
('business', 'revenue_today', 15420.50, 'orders_system');

EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ تم إنشاء جداول المراقبة${NC}"
else
    echo -e "${RED}❌ فشل في إنشاء جداول المراقبة${NC}"
fi
echo ""

# ========================================
# 4. تحديث ملف .env
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  4️⃣  تحديث ملف .env  ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ ! -f "${ENV_FILE}" ]; then
    echo -e "${RED}❌ ملف .env غير موجود${NC}"
    exit 1
fi

# تفعيل KAIA
if grep -q "^ENABLE_KAIA=" "${ENV_FILE}"; then
    sed -i '' 's/^ENABLE_KAIA=.*/ENABLE_KAIA=true/' "${ENV_FILE}"
    echo -e "${GREEN}✅ تم تفعيل KAIA${NC}"
else
    echo "ENABLE_KAIA=true" >> "${ENV_FILE}"
    echo -e "${GREEN}✅ تم إضافة وتفعيل KAIA${NC}"
fi

# تفعيل Sentinel
if grep -q "^ENABLE_SENTINEL=" "${ENV_FILE}"; then
    sed -i '' 's/^ENABLE_SENTINEL=.*/ENABLE_SENTINEL=true/' "${ENV_FILE}"
    echo -e "${GREEN}✅ تم تفعيل Sentinel${NC}"
else
    echo "ENABLE_SENTINEL=true" >> "${ENV_FILE}"
    echo -e "${GREEN}✅ تم إضافة وتفعيل Sentinel${NC}"
fi

# تفعيل Bio-Modules
if grep -q "^ENABLE_BIO_MODULES=" "${ENV_FILE}"; then
    sed -i '' 's/^ENABLE_BIO_MODULES=.*/ENABLE_BIO_MODULES=true/' "${ENV_FILE}"
    echo -e "${GREEN}✅ تم تفعيل Bio-Modules${NC}"
else
    echo "ENABLE_BIO_MODULES=true" >> "${ENV_FILE}"
    echo -e "${GREEN}✅ تم إضافة وتفعيل Bio-Modules${NC}"
fi

echo ""

# ========================================
# 5. AI Chat (اختياري)
# ========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  5️⃣  إعداد AI Chat (اختياري)  ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}هل لديك OpenAI API Key أو Anthropic API Key؟ (y/n)${NC}"
read -r has_ai_key

if [[ "$has_ai_key" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "اختر المزود:"
    echo "  1. OpenAI (GPT)"
    echo "  2. Anthropic (Claude)"
    echo ""
    echo -n "اختيارك (1 أو 2): "
    read -r ai_provider

    echo ""
    echo "أدخل API Key:"
    read -r api_key

    if [ "$ai_provider" = "1" ]; then
        if grep -q "^OPENAI_API_KEY=" "${ENV_FILE}"; then
            sed -i '' "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=${api_key}|" "${ENV_FILE}"
        else
            echo "OPENAI_API_KEY=${api_key}" >> "${ENV_FILE}"
        fi
        echo -e "${GREEN}✅ تم إضافة OpenAI API Key${NC}"
    elif [ "$ai_provider" = "2" ]; then
        if grep -q "^ANTHROPIC_API_KEY=" "${ENV_FILE}"; then
            sed -i '' "s|^ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=${api_key}|" "${ENV_FILE}"
        else
            echo "ANTHROPIC_API_KEY=${api_key}" >> "${ENV_FILE}"
        fi
        echo -e "${GREEN}✅ تم إضافة Anthropic API Key${NC}"
    fi

    # تفعيل AI Chat
    if grep -q "^ENABLE_AI_CHAT=" "${ENV_FILE}"; then
        sed -i '' 's/^ENABLE_AI_CHAT=.*/ENABLE_AI_CHAT=true/' "${ENV_FILE}"
    else
        echo "ENABLE_AI_CHAT=true" >> "${ENV_FILE}"
    fi
    echo -e "${GREEN}✅ تم تفعيل AI Chat${NC}"
else
    echo -e "${YELLOW}⏭️  تخطي AI Chat (يمكن تفعيله لاحقاً)${NC}"
fi
echo ""

# ========================================
# 6. الملخص النهائي
# ========================================
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ اكتمل التفعيل بنجاح!  ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 الميزات المفعّلة:${NC}"
echo ""
echo "  🟢 KAIA - محرك الامتثال الشرعي"
echo "  🟢 Sentinel - نظام المراقبة"
echo "  🟢 Bio-Modules - الوحدات الحيوية"
if [[ "$has_ai_key" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "  🟢 AI Chat - الدردشة الذكية"
else
    echo "  ⚪ AI Chat - معطل (يحتاج API Key)"
fi
echo ""
echo -e "${BLUE}🚀 الخطوة التالية:${NC}"
echo "  cd apps/haderos-web"
echo "  pnpm dev"
echo ""
echo -e "${BLUE}🔗 الوصول:${NC}"
echo "  http://localhost:3000"
echo "  http://localhost:3000/dashboard/kaia"
echo "  http://localhost:3000/dashboard/sentinel"
echo "  http://localhost:3000/dashboard/bio-modules"
echo ""
echo -e "${PURPLE}📚 للمزيد من المعلومات:${NC}"
echo "  اقرأ: ENABLE_ADVANCED_FEATURES.md"
echo ""
