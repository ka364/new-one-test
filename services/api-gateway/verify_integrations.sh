#!/bin/bash

# 🧪 HADEROS Platform - Integration Verification Script
# Tests all integrations and endpoints

set -e  # Exit on error

echo "=================================="
echo "🧪 NOW SHOES - Integration Tests"
echo "=================================="
echo ""

BASE_URL="http://localhost:8000/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0

# Test function
run_test() {
    local test_name="$1"
    local command="$2"

    echo -n "Testing $test_name... "
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}FAILED${NC}"
    fi
}

echo "🔍 Checking API availability..."
run_test "API Health" "curl -f $BASE_URL/health"

echo ""
echo "📦 Testing Integration Status..."
run_test "Integration Config" "curl -f $BASE_URL/integrations/config/status"

echo ""
echo "🛒 Testing Shopify Integration..."
run_test "Shopify Status" "curl -f $BASE_URL/integrations/config/status | jq -e '.integrations.shopify'"

echo ""
echo "🚚 Testing Shipping Integrations..."
run_test "Shipping Rates" "curl -f -X POST $BASE_URL/integrations/shipping/rates -H 'Content-Type: application/json' -d '{\"origin_country\":\"SA\",\"origin_city\":\"Riyadh\",\"destination_country\":\"AE\",\"destination_city\":\"Dubai\",\"weight\":1.5}'"

echo ""
echo "� Testing Circuit Breaker..."
run_test "Circuit Breaker Status" "curl -f $BASE_URL/integrations/monitoring/circuit-breakers"

echo ""
echo "🧪 Running Circuit Breaker Tests..."
run_test "Circuit Breaker Unit Tests" "python test_circuit_breaker.py"

echo ""
echo "📊 Test Results:"
echo "=================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 All tests passed! System ready for production.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check configuration and try again.${NC}"
    exit 1
fi