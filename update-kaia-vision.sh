#!/bin/bash

# 🧠 تحديث KAIA للمفهوم الصحيح
# من: نظام فقهي تقليدي
# إلى: نظام حوكمة متقدم مستنير بالقرآن

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════╗
║                                           ║
║   🧠 KAIA - التحديث الجوهري              ║
║   من فقه تقليدي → حوكمة عصرية            ║
║                                           ║
╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

DB_NAME="haderos_dev"
DB_USER="${USER}"

echo -e "${YELLOW}هذا السكريبت سيقوم بـ:${NC}"
echo ""
echo "  1️⃣  حذف المفهوم القديم (فحص شرعي تقليدي)"
echo "  2️⃣  إنشاء المفهوم الجديد (حوكمة متقدمة مستنيرة)"
echo "  3️⃣  إضافة قاعدة بيانات أفضل الممارسات العالمية"
echo "  4️⃣  إضافة المبادئ القرآنية المباشرة فقط"
echo ""
echo -e "${BLUE}المتابعة؟ (y/n)${NC}"
read -r response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "تم الإلغاء."
    exit 0
fi
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🔄 تحديث قاعدة بيانات KAIA  ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

psql -U "${DB_USER}" -d "${DB_NAME}" << 'EOSQL'

-- ========================================
-- حذف المفهوم القديم
-- ========================================
DROP TABLE IF EXISTS ethical_rules CASCADE;
DROP TABLE IF EXISTS sharia_rules CASCADE;
DROP TABLE IF EXISTS compliance_checks CASCADE;

-- ========================================
-- المفهوم الجديد: أفضل الممارسات الحديثة
-- ========================================
CREATE TABLE modern_best_practices (
    id SERIAL PRIMARY KEY,

    -- التصنيف
    domain VARCHAR(100) NOT NULL,  -- HR, Operations, Finance, Strategy, etc.
    subdomain VARCHAR(100),
    practice_name VARCHAR(255) NOT NULL,
    practice_name_ar VARCHAR(255),

    -- المحتوى
    description TEXT NOT NULL,
    description_ar TEXT,
    why_it_works TEXT,  -- لماذا هذه الممارسة فعالة؟
    when_to_use TEXT,   -- متى تستخدم؟

    -- الأدلة العلمية
    source VARCHAR(255) NOT NULL,  -- Harvard, MIT, McKinsey, Google, etc.
    source_type VARCHAR(50),  -- Academic, Industry, Research
    evidence_level VARCHAR(10) NOT NULL,  -- A (قوي جداً), B (قوي), C (متوسط)
    effectiveness_score DECIMAL(3, 2),  -- 0.00 to 10.00
    research_references JSONB,  -- مراجع البحوث

    -- التطبيق
    implementation_guide JSONB,  -- دليل التطبيق
    prerequisites JSONB,  -- المتطلبات الأساسية
    success_metrics JSONB,  -- مقاييس النجاح
    common_pitfalls JSONB,  -- الأخطاء الشائعة
    success_cases JSONB,  -- حالات نجاح

    -- البيانات الوصفية
    tags VARCHAR(255)[],  -- وسوم للبحث
    industry VARCHAR(100),  -- الصناعة
    company_size VARCHAR(50),  -- حجم الشركة المناسب

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mbp_domain ON modern_best_practices(domain);
CREATE INDEX idx_mbp_evidence ON modern_best_practices(evidence_level);
CREATE INDEX idx_mbp_effectiveness ON modern_best_practices(effectiveness_score);
CREATE INDEX idx_mbp_tags ON modern_best_practices USING GIN(tags);

-- ========================================
-- المبادئ القرآنية المباشرة فقط
-- ========================================
CREATE TABLE quranic_principles (
    id SERIAL PRIMARY KEY,

    -- المبدأ
    principle_name VARCHAR(100) NOT NULL,
    principle_name_ar VARCHAR(100) NOT NULL,
    category VARCHAR(50),  -- Justice, Honesty, Fairness, etc.

    -- النصوص القرآنية المباشرة فقط
    quranic_verses JSONB NOT NULL,  -- الآيات القرآنية
    verses_translation JSONB,  -- الترجمات

    -- الشرح البسيط
    description TEXT,
    description_ar TEXT,
    modern_interpretation TEXT,  -- التفسير العصري

    -- معايير الفحص
    check_criteria JSONB,  -- كيف نفحص التوافق؟
    check_questions JSONB,  -- أسئلة الفحص

    -- أمثلة
    compliant_examples JSONB,  -- أمثلة متوافقة
    violation_examples JSONB,  -- أمثلة مخالفة

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qp_category ON quranic_principles(category);
CREATE INDEX idx_qp_name ON quranic_principles(principle_name);

-- ========================================
-- قرارات KAIA
-- ========================================
CREATE TABLE kaia_decisions (
    id SERIAL PRIMARY KEY,

    -- السياق
    decision_type VARCHAR(100),  -- Strategic, Operational, Tactical
    decision_context TEXT NOT NULL,
    decision_description TEXT,

    -- البحث في أفضل الممارسات
    best_practices_researched JSONB,  -- الممارسات المدروسة
    best_practices_used INTEGER[],  -- IDs من modern_best_practices
    research_summary TEXT,  -- ملخص البحث

    -- الأدلة العلمية
    research_evidence JSONB,
    evidence_strength VARCHAR(10),  -- A, B, C

    -- الفلترة القرآنية
    quranic_principles_checked INTEGER[],  -- IDs من quranic_principles
    quranic_check_result JSONB,  -- نتيجة الفحص
    quranic_compliance BOOLEAN,  -- متوافق؟
    quranic_notes TEXT,  -- ملاحظات

    -- القرار النهائي
    final_recommendation TEXT NOT NULL,
    approved BOOLEAN NOT NULL,
    reasoning TEXT NOT NULL,
    confidence_score DECIMAL(3, 2),  -- 0.00 to 10.00

    -- البيانات الوصفية
    made_by INTEGER,  -- user_id
    reviewed_by INTEGER,  -- user_id
    implementation_status VARCHAR(50),  -- Pending, Approved, Implemented

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kd_type ON kaia_decisions(decision_type);
CREATE INDEX idx_kd_approved ON kaia_decisions(approved);
CREATE INDEX idx_kd_created ON kaia_decisions(created_at);

-- ========================================
-- إضافة المبادئ القرآنية الأساسية
-- ========================================
INSERT INTO quranic_principles (
    principle_name,
    principle_name_ar,
    category,
    quranic_verses,
    description,
    description_ar,
    check_criteria
) VALUES
(
    'Justice',
    'العدل',
    'core',
    '[
        {"verse": "إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ", "surah": "النحل", "number": 90},
        {"verse": "اعْدِلُوا هُوَ أَقْرَبُ لِلتَّقْوَىٰ", "surah": "المائدة", "number": 8}
    ]'::jsonb,
    'Fairness and justice in all dealings',
    'العدل والإنصاف في جميع المعاملات',
    '["هل القرار عادل لجميع الأطراف؟", "هل يحقق توزيع عادل للحقوق والواجبات؟", "هل يعامل الجميع بمساواة؟"]'::jsonb
),
(
    'Honesty',
    'الصدق',
    'core',
    '[
        {"verse": "يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ", "surah": "التوبة", "number": 119}
    ]'::jsonb,
    'Truthfulness in words and actions',
    'الصدق في القول والعمل',
    '["هل المعلومات المقدمة صادقة؟", "هل يوجد خداع أو تضليل؟", "هل الوعود واقعية وصادقة؟"]'::jsonb
),
(
    'Contract Fulfillment',
    'الوفاء بالعقود',
    'core',
    '[
        {"verse": "يَا أَيُّهَا الَّذِينَ آمَنُوا أَوْفُوا بِالْعُقُودِ", "surah": "المائدة", "number": 1}
    ]'::jsonb,
    'Fulfilling all contracts and commitments',
    'الوفاء بجميع العقود والالتزامات',
    '["هل يتم الوفاء بجميع الالتزامات؟", "هل الشروط واضحة ومتفق عليها؟", "هل يوجد التزام بالوعود؟"]'::jsonb
),
(
    'Anti-Oppression',
    'النهي عن الظلم',
    'prohibition',
    '[
        {"verse": "وَلَا تَظْلِمُونَ فَتِيلًا", "surah": "النساء", "number": 77},
        {"verse": "إِنَّ اللَّهَ لَا يُحِبُّ الظَّالِمِينَ", "surah": "آل عمران", "number": 57}
    ]'::jsonb,
    'Prohibition of all forms of oppression',
    'منع الظلم بجميع أشكاله',
    '["هل يوجد ظلم لأي طرف؟", "هل يتم استغلال ضعف أحد؟", "هل هناك إكراه أو إجبار؟"]'::jsonb
),
(
    'Anti-Fraud',
    'النهي عن الغش',
    'prohibition',
    '[
        {"verse": "وَيْلٌ لِّلْمُطَفِّفِينَ", "surah": "المطففين", "number": 1},
        {"verse": "وَلَا تَأْكُلُوا أَمْوَالَكُم بَيْنَكُم بِالْبَاطِلِ", "surah": "البقرة", "number": 188}
    ]'::jsonb,
    'Prohibition of fraud and deception',
    'منع الغش والخداع في المعاملات',
    '["هل يوجد غش أو تدليس؟", "هل المعلومات كاملة وشفافة؟", "هل يتم إخفاء عيوب؟"]'::jsonb
);

-- ========================================
-- إضافة أفضل الممارسات الحديثة
-- ========================================
INSERT INTO modern_best_practices (
    domain,
    practice_name,
    practice_name_ar,
    description,
    source,
    evidence_level,
    effectiveness_score,
    implementation_guide
) VALUES
(
    'HR',
    'Performance-Based Compensation',
    'التعويضات القائمة على الأداء',
    'نظام تعويضات يربط الأجر بالأداء الفعلي، مع معايير واضحة وقابلة للقياس',
    'Harvard Business Review, 200+ studies',
    'A',
    8.5,
    '{"steps": ["تحديد KPIs واضحة", "إنشاء معايير موضوعية", "تقييم منتظم", "شفافية كاملة"], "duration": "3-6 months"}'::jsonb
),
(
    'Operations',
    'Lean Management',
    'الإدارة النحيفة',
    'نظام إدارة يركز على القيمة وتقليل الهدر، مستوحى من نظام تويوتا للإنتاج',
    'Toyota Production System, MIT Research',
    'A',
    9.0,
    '{"steps": ["تحديد القيمة", "رسم تدفق القيمة", "إنشاء التدفق", "السحب", "السعي للكمال"], "duration": "6-12 months"}'::jsonb
),
(
    'Strategy',
    'OKRs (Objectives & Key Results)',
    'الأهداف والنتائج الرئيسية',
    'نظام تحديد أهداف طموح مع نتائج رئيسية قابلة للقياس، مستخدم في Google وIntel',
    'Google, Intel, "Measure What Matters" by John Doerr',
    'A',
    8.7,
    '{"steps": ["تحديد 3-5 أهداف", "تحديد 3-5 نتائج رئيسية لكل هدف", "مراجعة ربع سنوية", "شفافية كاملة"], "cycle": "quarterly"}'::jsonb
),
(
    'Management',
    'Data-Driven Decision Making',
    'اتخاذ القرارات القائمة على البيانات',
    'استخدام البيانات والتحليلات لاتخاذ قرارات أفضل بدلاً من الاعتماد على الحدس فقط',
    'McKinsey Global Institute, MIT Sloan',
    'A',
    9.2,
    '{"steps": ["جمع البيانات ذات الصلة", "تحليل البيانات", "استخلاص الرؤى", "اتخاذ القرار", "قياس النتائج"], "tools": ["Analytics", "BI", "ML"]}'::jsonb
),
(
    'Culture',
    'Psychological Safety',
    'الأمان النفسي',
    'خلق بيئة عمل يشعر فيها الجميع بالراحة في التعبير عن آرائهم والمخاطرة دون خوف',
    'Google Project Aristotle, Amy Edmondson (Harvard)',
    'A',
    9.5,
    '{"steps": ["القيادة بالقدوة", "تشجيع الأسئلة", "الاعتراف بالأخطاء", "الاستماع النشط"], "impact": "زيادة الابتكار والأداء"}'::jsonb
);

EOSQL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ تم تحديث KAIA بنجاح!${NC}"
else
    echo -e "${RED}❌ فشل في التحديث${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ اكتمل التحديث الجوهري لـ KAIA!  ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 ما تم إنجازه:${NC}"
echo ""
echo "  ❌ حذف: المفهوم القديم (فحص شرعي تقليدي)"
echo "  ✅ إضافة: قاعدة بيانات أفضل الممارسات العالمية"
echo "  ✅ إضافة: المبادئ القرآنية المباشرة فقط"
echo "  ✅ إضافة: نظام قرارات KAIA الذكي"
echo ""
echo -e "${BLUE}📚 البيانات المضافة:${NC}"
echo "  - 5 مبادئ قرآنية أساسية"
echo "  - 5 أفضل ممارسات عالمية"
echo ""
echo -e "${BLUE}🎯 المفهوم الجديد:${NC}"
echo "  KAIA = أفضل العلوم الحديثة + فلترة قرآنية بسيطة"
echo ""
echo -e "${BLUE}📖 للمزيد:${NC}"
echo "  اقرأ: KAIA_TRUE_VISION.md"
echo ""
