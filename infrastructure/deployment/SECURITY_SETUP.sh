#!/bin/bash

# HaderOS Security System - Setup Guide
# نظام الأمان المبسط للنسخة المحلية

echo "🔒 إعداد نظام الأمان المبسط"
echo "================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}الخطوة 1: الملفات المنشأة${NC}"
echo "✓ server/security/index.ts (SecurityManager - 320 بايت)"
echo "✓ server/security/routes.ts (API Routes)"
echo "✓ frontend/src/pages/SecurityDashboard.tsx (UI Dashboard)"

echo -e "\n${BLUE}الخطوة 2: دمج Security Routes في الـ Backend${NC}"
echo "أضف هذا الكود في server/main.ts أو server/index.ts:"
echo ""
echo "import securityRoutes from './security/routes';"
echo "app.use('/api/security', securityRoutes);"
echo ""

echo -e "\n${BLUE}الخطوة 3: دمج Security Dashboard في Frontend${NC}"
echo "أضف هذا الكود في frontend/src/App.tsx أو src/pages:"
echo ""
echo "import SecurityDashboard from './pages/SecurityDashboard';"
echo ""
echo "// في Routes:"
echo "<Route path=\"/security\" element={<SecurityDashboard />} />"
echo ""

echo -e "\n${BLUE}الخطوة 4: استدعاء Security Check في Login${NC}"
echo "أضف هذا الكود في frontend/src/pages/Login.tsx:"
echo ""
cat << 'EOF'
// Before login attempt
const response = await axios.post('/api/security/login-attempt', {
  username: email,
  success: false // or true after successful login
});

if (!response.data.allowed) {
  setError(response.data.message);
  return;
}
EOF
echo ""

echo -e "\n${BLUE}الخطوة 5: قم بالاختبار${NC}"
echo "1. شغل الـ Backend: python -m uvicorn backend.main:app --reload"
echo "2. شغل الـ Frontend: npm run dev"
echo "3. ادخل http://localhost:3000/security"
echo "4. حاول تسجيل الدخول 5+ مرات برقم مستخدم خاطئ"
echo "5. يجب أن ترى الحساب محظور في لوحة التحكم"

echo -e "\n${BLUE}المميزات:${NC}"
echo "✓ تتبع محاولات التسجيل"
echo "✓ حظر الحسابات بعد 5 محاولات فاشلة (15 دقيقة)"
echo "✓ حظر IP بعد 10 محاولات فاشلة (30 دقيقة)"
echo "✓ واجهة سهلة لفك الحظر"
echo "✓ إحصائيات فورية"
echo "✓ بيانات في الذاكرة فقط (مناسب للاختبار)"

echo -e "\n${YELLOW}⚠️ ملاحظات:${NC}"
echo "• البيانات تُحذف عند إعادة تشغيل الخادم"
echo "• نظام مبسط يركز على سهولة التطوير"
echo "• يمكن توسيعه لاحقاً"

echo -e "\n${GREEN}✅ تم! النظام جاهز للاستخدام${NC}"
