#!/bin/bash
# ============================================
# HADEROS - Generate Security Secrets
# توليد مفاتيح الأمان
# ============================================

echo "🔐 HADEROS Security Keys Generator"
echo "==================================="
echo ""

# Generate random 32-char hex strings
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

echo "📋 Copy these values to your .env file:"
echo ""
echo "JWT_SECRET=\"$JWT_SECRET\""
echo ""
echo "SESSION_SECRET=\"$SESSION_SECRET\""
echo ""
echo "ENCRYPTION_KEY=\"$ENCRYPTION_KEY\""
echo ""
echo "==================================="
echo "✅ Keys generated successfully!"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Save these keys securely"
echo "   - Never commit them to git"
echo "   - Use different keys for production"
echo ""
