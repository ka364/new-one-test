#!/bin/bash

# 🗄️ سكريبت تهيئة قاعدة البيانات - HADEROS AI CLOUD
# آخر تحديث: 29 ديسمبر 2025

set -e  # Exit on any error

# ألوان للطباعة
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🗄️  تهيئة قاعدة البيانات - HADEROS AI  ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. التحقق من PostgreSQL
echo -e "${YELLOW}🔍 التحقق من PostgreSQL...${NC}"
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL يعمل بنجاح${NC}"
else
    echo -e "${RED}❌ PostgreSQL غير متصل${NC}"
    echo -e "${YELLOW}جاري تشغيل PostgreSQL...${NC}"

    # محاولة تشغيل PostgreSQL
    if command -v brew &> /dev/null; then
        brew services start postgresql@15
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
    else
        echo -e "${RED}❌ لم نتمكن من تشغيل PostgreSQL تلقائياً${NC}"
        echo "يرجى تشغيل PostgreSQL يدوياً وإعادة تشغيل السكريبت"
        exit 1
    fi

    # انتظار 3 ثوانٍ للتشغيل
    sleep 3

    # التحقق مرة أخرى
    if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL يعمل الآن${NC}"
    else
        echo -e "${RED}❌ فشل في تشغيل PostgreSQL${NC}"
        exit 1
    fi
fi
echo ""

# 2. الحصول على معلومات المستخدم
echo -e "${YELLOW}📝 معلومات قاعدة البيانات:${NC}"
DB_USER="${USER}"
DB_NAME="haderos_dev"
DB_HOST="localhost"
DB_PORT="5432"

echo "  المستخدم: ${DB_USER}"
echo "  قاعدة البيانات: ${DB_NAME}"
echo "  المضيف: ${DB_HOST}"
echo "  المنفذ: ${DB_PORT}"
echo ""

# 3. التحقق من وجود قاعدة البيانات
echo -e "${YELLOW}🔍 التحقق من قاعدة البيانات...${NC}"
if psql -U "${DB_USER}" -lqt | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
    echo -e "${GREEN}✅ قاعدة البيانات ${DB_NAME} موجودة بالفعل${NC}"
else
    echo -e "${YELLOW}📦 إنشاء قاعدة البيانات ${DB_NAME}...${NC}"
    createdb -U "${DB_USER}" "${DB_NAME}"
    echo -e "${GREEN}✅ تم إنشاء قاعدة البيانات بنجاح${NC}"
fi
echo ""

# 4. إنشاء الجداول الأساسية
echo -e "${YELLOW}📋 إنشاء الجداول الأساسية...${NC}"
psql -U "${DB_USER}" -d "${DB_NAME}" << 'EOF'

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    open_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar VARCHAR(500),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    position VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    salary DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2),
    stock INTEGER DEFAULT 0,
    category VARCHAR(100),
    brand VARCHAR(100),
    size VARCHAR(50),
    color VARCHAR(50),
    image_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    shipping_address JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create shipments table
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    tracking_number VARCHAR(255) UNIQUE,
    carrier VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP',
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    kaia_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Insert test data
INSERT INTO users (open_id, name, email, role) VALUES
    ('admin_001', 'مدير النظام', 'admin@haderos.ai', 'admin'),
    ('user_001', 'مستخدم تجريبي', 'user@haderos.ai', 'user')
ON CONFLICT (open_id) DO NOTHING;

INSERT INTO employees (employee_id, name, email, position, department, hire_date, salary, status) VALUES
    ('EMP001', 'أحمد محمد', 'ahmed@haderos.ai', 'مدير', 'الإدارة', CURRENT_DATE, 15000.00, 'active'),
    ('EMP002', 'سارة علي', 'sara@haderos.ai', 'محاسب', 'المالية', CURRENT_DATE, 8000.00, 'active'),
    ('EMP003', 'محمود حسن', 'mahmoud@haderos.ai', 'مندوب مبيعات', 'المبيعات', CURRENT_DATE, 6000.00, 'active')
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO products (sku, name, name_ar, description, price, cost, stock, category, brand, status) VALUES
    ('SHOE001', 'Classic Sneaker', 'حذاء رياضي كلاسيكي', 'Comfortable everyday sneaker', 299.99, 150.00, 50, 'shoes', 'Nike', 'active'),
    ('SHOE002', 'Running Shoe Pro', 'حذاء جري احترافي', 'Professional running shoe', 499.99, 250.00, 30, 'shoes', 'Adidas', 'active'),
    ('SHOE003', 'Casual Loafer', 'حذاء كاجوال', 'Elegant casual loafer', 349.99, 175.00, 40, 'shoes', 'Clarks', 'active')
ON CONFLICT (sku) DO NOTHING;

EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ تم إنشاء الجداول بنجاح${NC}"
else
    echo -e "${RED}❌ فشل في إنشاء الجداول${NC}"
    exit 1
fi
echo ""

# 5. التحقق من الجداول
echo -e "${YELLOW}🔍 التحقق من الجداول المنشأة...${NC}"
TABLE_COUNT=$(psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
echo -e "${GREEN}✅ تم إنشاء ${TABLE_COUNT} جدول${NC}"
echo ""

# 6. عرض الجداول
echo -e "${YELLOW}📋 الجداول الموجودة:${NC}"
psql -U "${DB_USER}" -d "${DB_NAME}" -c "\dt"
echo ""

# 7. تحديث ملف .env
echo -e "${YELLOW}📝 تحديث ملف .env...${NC}"
ENV_FILE="apps/haderos-web/.env"

if [ -f "${ENV_FILE}" ]; then
    # التحقق من وجود DATABASE_URL
    if grep -q "^DATABASE_URL=" "${ENV_FILE}"; then
        echo -e "${GREEN}✅ DATABASE_URL موجود بالفعل في .env${NC}"
    else
        echo "DATABASE_URL=postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}" >> "${ENV_FILE}"
        echo -e "${GREEN}✅ تم إضافة DATABASE_URL إلى .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  ملف .env غير موجود${NC}"
    echo "يرجى نسخ .env.example إلى .env"
fi
echo ""

# 8. النجاح
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ تمت تهيئة قاعدة البيانات بنجاح!  ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 معلومات الاتصال:${NC}"
echo "  قاعدة البيانات: ${DB_NAME}"
echo "  المستخدم: ${DB_USER}"
echo "  المضيف: ${DB_HOST}:${DB_PORT}"
echo ""
echo -e "${BLUE}🚀 الخطوة التالية:${NC}"
echo "  cd apps/haderos-web"
echo "  pnpm install"
echo "  pnpm dev"
echo ""
echo -e "${BLUE}🔗 الوصول إلى قاعدة البيانات:${NC}"
echo "  psql -U ${DB_USER} -d ${DB_NAME}"
echo ""
