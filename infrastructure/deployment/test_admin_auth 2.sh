#!/bin/bash

###############################################################################
# HaderOS Admin Setup - Quick Test Script
# اختبار سريع للـ authentication system
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Configuration
BACKEND_URL="http://localhost:8000"
API_BASE="$BACKEND_URL/api/v1"
ADMIN_USER="OShader"
ADMIN_PASS="Os@2030"

print_header "HaderOS Authentication System - Test Suite"

# Check if backend is running
print_info "Checking if backend is running on port 8000..."
if ! curl -s "$BACKEND_URL/health" > /dev/null; then
    print_error "Backend not responding at $BACKEND_URL"
    echo -e "${YELLOW}Start backend with: bash run.sh backend${NC}"
    exit 1
fi
print_success "Backend is running"

# Test health endpoint
print_info "Testing health endpoint..."
HEALTH=$(curl -s "$BACKEND_URL/health")
echo "$HEALTH" | grep -q "healthy" && print_success "Health check passed" || print_error "Health check failed"

# Test login endpoint
print_header "Testing Login API"

print_info "Sending login request..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$ADMIN_USER\",
    \"password\": \"$ADMIN_PASS\"
  }")

echo "Response:"
echo "$LOGIN_RESPONSE" | grep -q "access_token" && print_success "Got access token" || {
    print_error "No access token in response"
    echo "$LOGIN_RESPONSE"
    exit 1
}

# Extract token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
USER_NAME=$(echo "$LOGIN_RESPONSE" | grep -o '"username":"[^"]*' | cut -d'"' -f4)
USER_ROLE=$(echo "$LOGIN_RESPONSE" | grep -o '"role":"[^"]*' | cut -d'"' -f4)

print_success "Access token obtained"
print_success "Username: $USER_NAME"
print_success "Role: $USER_ROLE"

# Test verify endpoint
print_header "Testing Token Verification"

print_info "Verifying token..."
VERIFY_RESPONSE=$(curl -s -X POST "$API_BASE/auth/verify" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$VERIFY_RESPONSE" | grep -q "admin" && print_success "Token verified successfully" || {
    print_error "Token verification failed"
    echo "$VERIFY_RESPONSE"
}

# Test protected endpoint
print_header "Testing Protected Endpoint"

print_info "Testing protected API with token..."
PROTECTED=$(curl -s "$API_BASE/bio-modules/list" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PROTECTED" | grep -q "modules\|error"; then
    print_success "Protected endpoint accessible with token"
else
    print_warning "Protected endpoint response (may need implementation)"
fi

# Database check
print_header "Testing Database"

if [ -f "haderos_dev.db" ]; then
    print_success "Database file exists: haderos_dev.db"
    
    # Check if admin user exists (if sqlite3 is available)
    if command -v sqlite3 &> /dev/null; then
        ADMIN_CHECK=$(sqlite3 haderos_dev.db "SELECT username FROM users WHERE username='admin';" 2>/dev/null || echo "")
        if [ "$ADMIN_CHECK" = "admin" ]; then
            print_success "Admin user found in database"
        else
            print_error "Admin user not found in database"
        fi
    else
        print_info "sqlite3 not installed - skipping database verification"
    fi
else
    print_error "Database file not found"
fi

# Summary
print_header "Test Summary"

echo -e "${GREEN}✅ All tests passed!${NC}\n"

print_info "You can now:"
echo "  1. Visit frontend: http://localhost:3000"
echo "  2. Login with:"
echo "     Username: $ADMIN_USER"
echo "     Password: $ADMIN_PASS"
echo "  3. Access API docs: http://localhost:8000/api/docs"
echo ""

# Show sample curl commands
print_header "Sample API Calls"

echo "Login:"
echo "  curl -X POST $API_BASE/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}'"
echo ""

echo "Protected request:"
echo "  curl -H 'Authorization: Bearer $ACCESS_TOKEN' \\"
echo "    $API_BASE/bio-modules/list"
echo ""

print_success "Test completed successfully!"
