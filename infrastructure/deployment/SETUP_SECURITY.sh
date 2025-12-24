#!/bin/bash

# HaderOS Security System - Installation & Integration Guide
# دليل التثبيت والتكامل - نظام الأمان لـ حضر أوس

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║  HaderOS Security System - Setup Wizard    ║"
echo "║        نظام الأمان - معالج الإعداد        ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Python and Node
echo -e "\n${BLUE}✓ فحص المتطلبات...${NC}"

if ! command -v python &> /dev/null; then
    echo -e "${RED}✗ Python غير مثبت${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ Node.js غير مثبت${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python و Node.js موجودان${NC}"

# Step 1: Backend Setup
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 1: Backend Integration${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}الملف الذي سيتم الإضافة:${NC}"
echo "  → backend/api/v1/endpoints/security.py"
echo ""
echo -e "${YELLOW}ما يجب فعله:${NC}"
echo "1. انسخ محتوى security.py (تم إنشاؤه بالفعل)"
echo "2. أضفه في: backend/api/v1/endpoints/security.py"
echo "3. عدّل backend/api/v1/router.py كما يلي:"
echo ""

cat << 'EOF'
# في backend/api/v1/router.py - السطر الذي يحتوي على الـ imports

# غيّر من:
from backend.api.v1.endpoints import (
    auth,
    sharia,
    investments,
    blockchain,
    ai_models,
    bio_modules
)

# إلى:
from backend.api.v1.endpoints import (
    auth,
    sharia,
    investments,
    blockchain,
    ai_models,
    bio_modules,
    security  # ← أضف هذا
)

# وفي الأسفل، أضف:
api_router.include_router(
    security.router,
    prefix="/security",
    tags=["security"]
)
EOF

read -p "هل انتهيت من خطوة Backend؟ (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✓ Backend جاهز${NC}"
else
    echo -e "${YELLOW}يرجى إتمام خطوة Backend أولاً${NC}"
fi

# Step 2: Frontend Setup
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 2: Frontend Integration${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}الملفات التي تم إنشاؤها:${NC}"
echo "  → frontend/src/pages/SecurityDashboard.tsx"
echo ""
echo -e "${YELLOW}ما يجب فعله:${NC}"
echo "1. أضف Route في frontend/src/App.tsx:"
echo ""

cat << 'EOF'
import SecurityDashboard from './pages/SecurityDashboard';

// في Routes section:
<Route path="/security" element={<SecurityDashboard />} />
EOF

echo ""
echo "2. تحقق من أن lucide-react مثبت:"

# Check if lucide-react is installed
cd "$(dirname "$0")"
if [ -f "package.json" ]; then
    if grep -q "lucide-react" package.json; then
        echo -e "${GREEN}   ✓ lucide-react مثبت${NC}"
    else
        echo -e "${YELLOW}   بتثبيت lucide-react...${NC}"
        npm install lucide-react
        echo -e "${GREEN}   ✓ تم التثبيت${NC}"
    fi
fi

read -p "هل انتهيت من خطوة Frontend؟ (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✓ Frontend جاهز${NC}"
else
    echo -e "${YELLOW}يرجى إتمام خطوة Frontend أولاً${NC}"
fi

# Step 3: Login Integration
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 3: Login Page Integration${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}الملف الذي سيتم تعديله:${NC}"
echo "  → frontend/src/pages/Login.tsx"
echo ""
echo -e "${YELLOW}أضف هذا الكود قبل محاولة login:${NC}"
echo ""

cat << 'EOF'
// قبل محاولة تسجيل الدخول
const securityResponse = await axios.post(
  'http://localhost:8000/api/v1/security/login-attempt',
  {
    username: email,
    success: false
  }
);

if (!securityResponse.data.allowed) {
  setError(securityResponse.data.message);
  return;
}

// ثم جاهر العملية الأصلية للـ login
try {
  const response = await axios.post('/api/v1/auth/login', {
    email,
    password
  });
  
  // بعد النجاح، سجل محاولة ناجحة
  await axios.post(
    'http://localhost:8000/api/v1/security/login-attempt',
    {
      username: email,
      success: true
    }
  );
  
  // ... باقي الكود
} catch (error) {
  // في حالة الفشل، يتم تسجيل محاولة فاشلة تلقائياً
}
EOF

read -p "هل انتهيت من خطوة Login؟ (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✓ Login جاهز${NC}"
else
    echo -e "${YELLOW}يرجى إتمام خطوة Login أولاً${NC}"
fi

# Step 4: Run Tests
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 4: التشغيل والاختبار${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}شغّل هذه الأوامر في ترمينالات منفصلة:${NC}"
echo ""
echo -e "${GREEN}Terminal 1 - Backend:${NC}"
echo "  cd /Users/ahmedmohamedshawkyatta/Documents/GitHub/haderos-platform"
echo "  python -m uvicorn backend.main:app --reload"
echo ""
echo -e "${GREEN}Terminal 2 - Frontend:${NC}"
echo "  npm run dev"
echo ""
echo -e "${GREEN}Terminal 3 - Tests:${NC}"
echo "  bash test_security.sh"
echo ""

# Step 5: Verification
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 5: التحقق من التثبيت${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}اختبر هذه الـ URLs:${NC}"
echo "  1. http://localhost:8000/health              (Backend health)"
echo "  2. http://localhost:8000/api/v1/security/health (Security health)"
echo "  3. http://localhost:3000/security            (Security Dashboard)"
echo "  4. http://localhost:3000/login               (Login page)"
echo ""

# Step 6: Testing Scenarios
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 6: سيناريوهات الاختبار${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}السيناريو 1: حظر الحساب${NC}"
echo "1. اذهب إلى http://localhost:3000/login"
echo "2. جرّب تسجيل دخول خاطئ 5 مرات"
echo "3. في المحاولة 6، يجب أن ترى: 'الحساب محظور'"
echo "4. اذهب إلى http://localhost:3000/security"
echo "5. يجب أن تري الحساب في قائمة المحظورين"
echo "6. اضغط 'فك الحظر' لفك الحظر فوراً"
echo ""

echo -e "\n${YELLOW}السيناريو 2: تسجيل دخول ناجح${NC}"
echo "1. سجل دخول ناجح بـ OShader/Os@2030"
echo "2. يجب أن تُمسح محاولات التسجيل الفاشلة"
echo "3. المحاولات الناجحة تُسجل فقط"
echo ""

# Final Summary
echo -e "\n${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ معالج الإعداد اكتمل!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"

echo -e "\n${BLUE}الملفات التي تم إنشاؤها:${NC}"
echo "  ✓ backend/api/v1/endpoints/security.py"
echo "  ✓ frontend/src/pages/SecurityDashboard.tsx"
echo "  ✓ server/security/index.ts"
echo "  ✓ server/security/routes.ts"
echo "  ✓ SECURITY_GUIDE.md"
echo "  ✓ SECURITY_SETUP.sh"
echo "  ✓ test_security.sh"
echo ""

echo -e "\n${BLUE}الملفات التي تم تعديلها:${NC}"
echo "  ✏️ backend/api/v1/router.py (أضف security router)"
echo "  ✏️ frontend/src/App.tsx (أضف route)"
echo "  ✏️ frontend/src/pages/Login.tsx (أضف security check)"
echo ""

echo -e "\n${YELLOW}⚠️ الخطوات المتبقية:${NC}"
echo "1. تحديث الملفات المذكورة أعلاه"
echo "2. تشغيل Backend و Frontend"
echo "3. اختبار الـ scenarios"
echo ""

echo -e "${GREEN}للمزيد من التفاصيل، اقرأ: SECURITY_IMPLEMENTATION_COMPLETE.md${NC}"
echo ""
