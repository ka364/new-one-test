-- Migration: Add Row-Level Security (RLS) Policies
-- Date: 2025-12-30
-- Purpose: Implement tenant isolation and data security at database level

-- Enable RLS on critical tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY users_tenant_isolation ON users
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::integer
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- Create RLS policies for products table
CREATE POLICY products_tenant_isolation ON products
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::integer
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- Create RLS policies for orders table
CREATE POLICY orders_tenant_isolation ON orders
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::integer
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- Create RLS policies for shipments table
CREATE POLICY shipments_tenant_isolation ON shipments
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::integer
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- Create RLS policies for invoices table
CREATE POLICY invoices_tenant_isolation ON invoices
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::integer
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- Create RLS policies for employees table
CREATE POLICY employees_tenant_isolation ON employees
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::integer
    OR current_setting('app.bypass_rls', true) = 'true'
  );

-- Create function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id integer)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to bypass RLS (for admin operations)
CREATE OR REPLACE FUNCTION bypass_rls(should_bypass boolean)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.bypass_rls', should_bypass::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION set_tenant_context(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION bypass_rls(boolean) TO admin;

-- Add comments
COMMENT ON POLICY users_tenant_isolation ON users IS 'Ensures users can only access data from their own tenant';
COMMENT ON POLICY products_tenant_isolation ON products IS 'Ensures products are isolated by tenant';
COMMENT ON POLICY orders_tenant_isolation ON orders IS 'Ensures orders are isolated by tenant';
COMMENT ON POLICY shipments_tenant_isolation ON shipments IS 'Ensures shipments are isolated by tenant';
COMMENT ON POLICY invoices_tenant_isolation ON invoices IS 'Ensures invoices are isolated by tenant';
COMMENT ON POLICY employees_tenant_isolation ON employees IS 'Ensures employees are isolated by tenant';
