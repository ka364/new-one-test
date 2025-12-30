#!/bin/bash

# 🔒 Security System Quick Test
# اختبار سريع لنظام الأمان

API_URL="http://localhost:8000/api/v1/security"
FRONTEND_URL="http://localhost:3000"

echo "🔒 اختبار نظام الأمان - HaderOS"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backend is running
echo -e "${BLUE}✓ فحص الـ Backend...${NC}"
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${RED}✗ الـ Backend لا يعمل على localhost:8000${NC}"
    echo "شغل: python -m uvicorn backend.main:app --reload"
    exit 1
fi
echo -e "${GREEN}✓ الـ Backend يعمل${NC}"

# Test 1: Single failed attempt
echo -e "\n${BLUE}Test 1: محاولة فاشلة واحدة${NC}"
curl -s -X POST "$API_URL/login-attempt" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","success":false}' | jq '.'

# Test 2: Multiple failed attempts (5)
echo -e "\n${BLUE}Test 2: 5 محاولات فاشلة (يجب أن يحظر الحساب)${NC}"
for i in {2..5}; do
  echo "محاولة $i..."
  curl -s -X POST "$API_URL/login-attempt" \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","success":false}' | jq '.message'
done

# Test 3: Try to login blocked user
echo -e "\n${BLUE}Test 3: محاولة تسجيل دخول حساب محظور${NC}"
curl -s -X POST "$API_URL/login-attempt" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","success":false}' | jq '.'

# Test 4: Get stats
echo -e "\n${BLUE}Test 4: احصائيات الأمان${NC}"
curl -s -X GET "$API_URL/stats" | jq '.'

# Test 5: Get blocked users
echo -e "\n${BLUE}Test 5: قائمة الحسابات المحظورة${NC}"
curl -s -X GET "$API_URL/blocked-users" | jq '.'

# Test 6: Unlock user
echo -e "\n${BLUE}Test 6: فك حظر الحساب${NC}"
curl -s -X POST "$API_URL/unlock-user/testuser" | jq '.'

# Test 7: Successful login after unlock
echo -e "\n${BLUE}Test 7: تسجيل دخول ناجح بعد فك الحظر${NC}"
curl -s -X POST "$API_URL/login-attempt" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","success":true}' | jq '.'

# Test 8: Clear all
echo -e "\n${BLUE}Test 8: مسح جميع البيانات${NC}"
curl -s -X POST "$API_URL/clear-all" | jq '.'

# Summary
echo -e "\n${GREEN}=================================="
echo "✅ اكتملت جميع الاختبارات!"
echo "==================================${NC}"

echo -e "\n${BLUE}الخطوة التالية:${NC}"
echo "1. افتح المتصفح: $FRONTEND_URL/security"
echo "2. جرّب تسجيل الدخول 5+ مرات برقم خاطئ"
echo "3. يجب أن ترى الحساب محظور في لوحة التحكم"

echo -e "\n${YELLOW}ملاحظات:${NC}"
echo "• إذا لم يعمل API، تأكد من:"
echo "  - الـ Backend يعمل على port 8000"
echo "  - الـ security endpoint تم إضافته للـ router"
echo "• إذا لم تعمل Dashboard، تأكد من:"
echo "  - الـ Frontend يعمل على port 3000"
echo "  - الـ SecurityDashboard تم import في App.tsx"
