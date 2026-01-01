#!/bin/bash
# ==============================================
# HADEROS Integration Verification Script
# ==============================================

echo "🔗 HADEROS Integration Verification"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Shopify Integration
echo -e "${BLUE}🛒 Shopify Integration${NC}"
echo "----------------------"

if [ -n "$SHOPIFY_SHOP_URL" ] && [ -n "$SHOPIFY_ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✅ Shopify credentials configured${NC}"

    # Test Shopify API connection
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN" \
        "https://$SHOPIFY_SHOP_URL/admin/api/2024-01/shop.json" 2>/dev/null)

    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅ Shopify API connection successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Shopify API returned: $response${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Shopify credentials not configured${NC}"
    echo "   Set SHOPIFY_SHOP_URL and SHOPIFY_ACCESS_TOKEN"
fi
echo ""

# 2. WhatsApp Business Integration
echo -e "${BLUE}💬 WhatsApp Business Integration${NC}"
echo "---------------------------------"

if [ -n "$WHATSAPP_ACCESS_TOKEN" ] && [ -n "$WHATSAPP_PHONE_NUMBER_ID" ]; then
    echo -e "${GREEN}✅ WhatsApp credentials configured${NC}"

    # Test WhatsApp API connection
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
        "https://graph.facebook.com/v18.0/$WHATSAPP_PHONE_NUMBER_ID" 2>/dev/null)

    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅ WhatsApp API connection successful${NC}"
    else
        echo -e "${YELLOW}⚠️  WhatsApp API returned: $response${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  WhatsApp credentials not configured${NC}"
    echo "   Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID"
fi
echo ""

# 3. Bosta Shipping Integration
echo -e "${BLUE}📦 Bosta Shipping Integration${NC}"
echo "------------------------------"

if [ -n "$BOSTA_API_KEY" ]; then
    echo -e "${GREEN}✅ Bosta API key configured${NC}"

    # Test Bosta API connection
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: $BOSTA_API_KEY" \
        "https://app.bosta.co/api/v2/cities" 2>/dev/null)

    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅ Bosta API connection successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Bosta API returned: $response${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Bosta API key not configured${NC}"
    echo "   Set BOSTA_API_KEY"
fi
echo ""

# 4. J&T Express Integration
echo -e "${BLUE}🚚 J&T Express Integration${NC}"
echo "--------------------------"

if [ -n "$JNT_API_KEY" ]; then
    echo -e "${GREEN}✅ J&T API key configured${NC}"
else
    echo -e "${YELLOW}⚠️  J&T API key not configured${NC}"
    echo "   Set JNT_API_KEY"
fi
echo ""

# 5. Payment Integrations
echo -e "${BLUE}💳 Payment Integrations${NC}"
echo "-----------------------"

# InstaPay
if [ -n "$INSTAPAY_API_KEY" ]; then
    echo -e "${GREEN}✅ InstaPay configured${NC}"
else
    echo -e "${YELLOW}⚠️  InstaPay not configured${NC}"
fi

# PayMob
if [ -n "$PAYMOB_API_KEY" ]; then
    echo -e "${GREEN}✅ PayMob configured${NC}"
else
    echo -e "${YELLOW}⚠️  PayMob not configured${NC}"
fi

# Fawry
if [ -n "$FAWRY_MERCHANT_CODE" ]; then
    echo -e "${GREEN}✅ Fawry configured${NC}"
else
    echo -e "${YELLOW}⚠️  Fawry not configured${NC}"
fi
echo ""

# 6. Database Connection
echo -e "${BLUE}🗄️  Database Connection${NC}"
echo "-----------------------"

if [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}✅ Database URL configured${NC}"

    if command -v pg_isready &> /dev/null; then
        if pg_isready -d "$DATABASE_URL" -q 2>/dev/null; then
            echo -e "${GREEN}✅ Database connection successful${NC}"
        else
            echo -e "${YELLOW}⚠️  Cannot connect to database${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  pg_isready not available for connection test${NC}"
    fi
else
    echo -e "${RED}❌ DATABASE_URL not configured${NC}"
fi
echo ""

# 7. Code Integration Check
echo -e "${BLUE}📝 Code Integration Files${NC}"
echo "-------------------------"

integrations=(
    "apps/haderos-web/server/integrations/shopify-api.ts"
    "apps/haderos-web/server/integrations/bosta-api.ts"
    "apps/haderos-web/server/integrations/whatsapp-business.ts"
    "apps/haderos-web/server/integrations/instapay.ts"
    "apps/haderos-web/server/integrations/mobile-wallets.ts"
    "apps/haderos-web/server/services/unified-payment.service.ts"
    "apps/haderos-web/server/services/shopify-webhook.service.ts"
)

for file in "${integrations[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $(basename $file)${NC}"
    else
        echo -e "${YELLOW}⚠️  $(basename $file) not found${NC}"
    fi
done
echo ""

# Summary
echo "═══════════════════════════════════════════"
echo ""
echo -e "${BLUE}Integration Summary:${NC}"
echo ""
echo "  🛒 Shopify:     $([ -n "$SHOPIFY_ACCESS_TOKEN" ] && echo -e "${GREEN}Ready${NC}" || echo -e "${YELLOW}Not Configured${NC}")"
echo "  💬 WhatsApp:    $([ -n "$WHATSAPP_ACCESS_TOKEN" ] && echo -e "${GREEN}Ready${NC}" || echo -e "${YELLOW}Not Configured${NC}")"
echo "  📦 Bosta:       $([ -n "$BOSTA_API_KEY" ] && echo -e "${GREEN}Ready${NC}" || echo -e "${YELLOW}Not Configured${NC}")"
echo "  🚚 J&T:         $([ -n "$JNT_API_KEY" ] && echo -e "${GREEN}Ready${NC}" || echo -e "${YELLOW}Not Configured${NC}")"
echo "  💳 InstaPay:    $([ -n "$INSTAPAY_API_KEY" ] && echo -e "${GREEN}Ready${NC}" || echo -e "${YELLOW}Not Configured${NC}")"
echo "  💳 PayMob:      $([ -n "$PAYMOB_API_KEY" ] && echo -e "${GREEN}Ready${NC}" || echo -e "${YELLOW}Not Configured${NC}")"
echo "  🗄️  Database:    $([ -n "$DATABASE_URL" ] && echo -e "${GREEN}Ready${NC}" || echo -e "${RED}Missing${NC}")"
echo ""
