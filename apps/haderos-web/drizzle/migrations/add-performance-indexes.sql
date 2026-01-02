-- ============================================
-- Database Performance Optimization
-- Phase 3: Add Performance Indexes
-- ============================================
-- Date: December 30, 2025
-- Purpose: Add indexes for frequently queried columns
-- ============================================

-- ============================================
-- ORDERS TABLE INDEXES
-- ============================================

-- Index for order status queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_orders_status 
  ON orders(status) 
  WHERE status IS NOT NULL;

-- Index for payment status queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
  ON orders(payment_status) 
  WHERE payment_status IS NOT NULL;

-- Index for customer phone lookups (Egyptian market)
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone 
  ON orders(customer_phone) 
  WHERE customer_phone IS NOT NULL;

-- Index for customer email lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_email 
  ON orders(customer_email) 
  WHERE customer_email IS NOT NULL;

-- Composite index for status + created_at (common dashboard queries)
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
  ON orders(status, created_at DESC);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
  ON orders(created_at DESC);

-- Index for updated_at (for sync operations)
CREATE INDEX IF NOT EXISTS idx_orders_updated_at 
  ON orders(updated_at DESC);

-- ============================================
-- ORDER ITEMS TABLE INDEXES
-- ============================================

-- Index for order lookups (foreign key)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
  ON order_items(order_id);

-- Index for product lookups (foreign key)
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
  ON order_items(product_id);

-- Composite index for order + product (common join)
CREATE INDEX IF NOT EXISTS idx_order_items_order_product 
  ON order_items(order_id, product_id);

-- ============================================
-- PRODUCTS TABLE INDEXES
-- ============================================

-- Index for model code lookups (unique identifier)
-- Note: Already has unique index, but adding for completeness
CREATE INDEX IF NOT EXISTS idx_products_model_code 
  ON products(model_code) 
  WHERE model_code IS NOT NULL;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category 
  ON products(category) 
  WHERE category IS NOT NULL;

-- Index for active products (most common filter)
CREATE INDEX IF NOT EXISTS idx_products_is_active 
  ON products(is_active) 
  WHERE is_active = 1;

-- Composite index for active products by category
CREATE INDEX IF NOT EXISTS idx_products_active_category 
  ON products(is_active, category) 
  WHERE is_active = 1;

-- Index for created_at (for recent products)
CREATE INDEX IF NOT EXISTS idx_products_created_at 
  ON products(created_at DESC);

-- ============================================
-- PAYMENT TRANSACTIONS TABLE INDEXES
-- ============================================

-- Index for transaction number lookups (unique identifier)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_number 
  ON payment_transactions(transaction_number) 
  WHERE transaction_number IS NOT NULL;

-- Index for order lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id 
  ON payment_transactions(order_id);

-- Index for order number lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_number 
  ON payment_transactions(order_number) 
  WHERE order_number IS NOT NULL;

-- Index for status filtering (most common filter)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status 
  ON payment_transactions(status) 
  WHERE status IS NOT NULL;

-- Index for provider code filtering
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_code 
  ON payment_transactions(provider_code) 
  WHERE provider_code IS NOT NULL;

-- Composite index for status + created_at (common dashboard queries)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_created 
  ON payment_transactions(status, created_at DESC);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at 
  ON payment_transactions(created_at DESC);

-- Index for completed_at (for settlement queries)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_completed_at 
  ON payment_transactions(completed_at DESC) 
  WHERE completed_at IS NOT NULL;

-- ============================================
-- COD ORDERS TABLE INDEXES
-- ============================================

-- Index for order ID lookups (unique identifier)
CREATE INDEX IF NOT EXISTS idx_cod_orders_order_id 
  ON cod_orders(order_id) 
  WHERE order_id IS NOT NULL;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_cod_orders_status 
  ON cod_orders(status) 
  WHERE status IS NOT NULL;

-- Index for current stage filtering
CREATE INDEX IF NOT EXISTS idx_cod_orders_current_stage 
  ON cod_orders(current_stage) 
  WHERE current_stage IS NOT NULL;

-- Index for customer phone lookups
CREATE INDEX IF NOT EXISTS idx_cod_orders_customer_phone 
  ON cod_orders(customer_phone) 
  WHERE customer_phone IS NOT NULL;

-- Composite index for status + stage (common filters)
CREATE INDEX IF NOT EXISTS idx_cod_orders_status_stage 
  ON cod_orders(status, current_stage);

-- Composite index for status + created_at (common dashboard queries)
CREATE INDEX IF NOT EXISTS idx_cod_orders_status_created 
  ON cod_orders(status, created_at DESC);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_cod_orders_created_at 
  ON cod_orders(created_at DESC);

-- Index for shipping partner lookups
CREATE INDEX IF NOT EXISTS idx_cod_orders_shipping_partner_id 
  ON cod_orders(shipping_partner_id) 
  WHERE shipping_partner_id IS NOT NULL;

-- ============================================
-- INVENTORY TABLE INDEXES
-- ============================================

-- Index for product lookups (foreign key)
CREATE INDEX IF NOT EXISTS idx_inventory_product_id 
  ON inventory(product_id);

-- Index for location filtering
CREATE INDEX IF NOT EXISTS idx_inventory_location 
  ON inventory(location) 
  WHERE location IS NOT NULL;

-- Composite index for product + location (common queries)
CREATE INDEX IF NOT EXISTS idx_inventory_product_location 
  ON inventory(product_id, location);

-- Index for low stock queries (quantity < min_stock_level)
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock 
  ON inventory(product_id, quantity) 
  WHERE quantity < min_stock_level;

-- Index for last restocked (for replenishment queries)
CREATE INDEX IF NOT EXISTS idx_inventory_last_restocked 
  ON inventory(last_restocked DESC) 
  WHERE last_restocked IS NOT NULL;

-- ============================================
-- TRACKING LOGS TABLE INDEXES
-- ============================================

-- Index for COD order lookups
CREATE INDEX IF NOT EXISTS idx_tracking_logs_cod_order_id 
  ON tracking_logs(cod_order_id);

-- Index for stage filtering
CREATE INDEX IF NOT EXISTS idx_tracking_logs_stage 
  ON tracking_logs(stage) 
  WHERE stage IS NOT NULL;

-- Composite index for order + created_at (common queries)
CREATE INDEX IF NOT EXISTS idx_tracking_logs_order_created 
  ON tracking_logs(cod_order_id, created_at DESC);

-- ============================================
-- SHIPPING PARTNERS TABLE INDEXES
-- ============================================

-- Index for active partners (most common filter)
CREATE INDEX IF NOT EXISTS idx_shipping_partners_active 
  ON shipping_partners(active) 
  WHERE active = 1;

-- Index for suspended partners
CREATE INDEX IF NOT EXISTS idx_shipping_partners_suspended 
  ON shipping_partners(suspended) 
  WHERE suspended = 1;

-- ============================================
-- ANALYZE TABLES (Update Statistics)
-- ============================================

-- Update table statistics for query planner
ANALYZE orders;
ANALYZE order_items;
ANALYZE products;
ANALYZE payment_transactions;
ANALYZE cod_orders;
ANALYZE inventory;
ANALYZE tracking_logs;
ANALYZE shipping_partners;

-- ============================================
-- NOTES
-- ============================================
-- 1. All indexes use IF NOT EXISTS to prevent errors on re-run
-- 2. Partial indexes (WHERE clauses) reduce index size and improve performance
-- 3. Composite indexes support multi-column queries efficiently
-- 4. DESC indexes optimize ORDER BY DESC queries
-- 5. ANALYZE updates statistics for better query planning
-- ============================================

