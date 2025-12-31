-- Migration: Create expenses tables with ltree integration
-- Description: Create all expense-related tables with ltree hierarchy support
-- Date: 2025-12-29

-- Create tech_vendors table
CREATE TABLE IF NOT EXISTS tech_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendors_is_active ON tech_vendors(is_active);
CREATE INDEX idx_vendors_name ON tech_vendors(name);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hierarchy_path ltree NOT NULL,
    hierarchy_id UUID,
    vendor_id UUID REFERENCES tech_vendors(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    billing_cycle VARCHAR(50) NOT NULL CHECK (billing_cycle IN (
        'monthly', 'quarterly', 'semi_annual', 'annual', 'one_time'
    )),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP',
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    is_active BOOLEAN DEFAULT true,
    auto_renew BOOLEAN DEFAULT true,
    payment_method VARCHAR(100),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to hierarchy
    CONSTRAINT fk_subscription_hierarchy 
        FOREIGN KEY (hierarchy_id) 
        REFERENCES scaling_hierarchy(id) 
        ON DELETE CASCADE
);

CREATE INDEX idx_subscriptions_hierarchy_path_gin ON subscriptions USING GIN (hierarchy_path);
CREATE INDEX idx_subscriptions_hierarchy_id ON subscriptions(hierarchy_id);
CREATE INDEX idx_subscriptions_vendor_id ON subscriptions(vendor_id);
CREATE INDEX idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX idx_subscriptions_next_billing_date ON subscriptions(next_billing_date) WHERE is_active = true;
CREATE INDEX idx_subscriptions_service_type ON subscriptions(service_type);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hierarchy_path ltree NOT NULL,
    hierarchy_id UUID,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES tech_vendors(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP',
    category VARCHAR(100) NOT NULL,
    expense_type VARCHAR(100) NOT NULL,
    expense_date DATE NOT NULL,
    due_date DATE,
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'paid', 'overdue', 'cancelled', 'refunded'
    )),
    payment_date DATE,
    payment_method VARCHAR(100),
    invoice_number VARCHAR(100),
    receipt_url VARCHAR(500),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    -- Foreign key to hierarchy
    CONSTRAINT fk_expense_hierarchy 
        FOREIGN KEY (hierarchy_id) 
        REFERENCES scaling_hierarchy(id) 
        ON DELETE CASCADE
);

CREATE INDEX idx_expenses_hierarchy_path_gin ON expenses USING GIN (hierarchy_path);
CREATE INDEX idx_expenses_hierarchy_id ON expenses(hierarchy_id);
CREATE INDEX idx_expenses_subscription_id ON expenses(subscription_id);
CREATE INDEX idx_expenses_vendor_id ON expenses(vendor_id);
CREATE INDEX idx_expenses_payment_status ON expenses(payment_status);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_expense_type ON expenses(expense_type);

-- Composite index for common queries
CREATE INDEX idx_expenses_path_date ON expenses(hierarchy_path, expense_date DESC);
CREATE INDEX idx_expenses_status_date ON expenses(payment_status, expense_date DESC);

-- Partial index for overdue expenses
CREATE INDEX idx_expenses_overdue ON expenses(due_date) 
    WHERE payment_status = 'pending' AND due_date < CURRENT_DATE;

-- Create vendor_invoices table
CREATE TABLE IF NOT EXISTS vendor_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hierarchy_path ltree NOT NULL,
    hierarchy_id UUID,
    vendor_id UUID REFERENCES tech_vendors(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP',
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'paid', 'partially_paid', 'overdue', 'cancelled'
    )),
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    payment_date DATE,
    notes TEXT,
    invoice_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_invoice_hierarchy 
        FOREIGN KEY (hierarchy_id) 
        REFERENCES scaling_hierarchy(id) 
        ON DELETE CASCADE
);

CREATE INDEX idx_invoices_hierarchy_path_gin ON vendor_invoices USING GIN (hierarchy_path);
CREATE INDEX idx_invoices_hierarchy_id ON vendor_invoices(hierarchy_id);
CREATE INDEX idx_invoices_vendor_id ON vendor_invoices(vendor_id);
CREATE INDEX idx_invoices_payment_status ON vendor_invoices(payment_status);
CREATE INDEX idx_invoices_due_date ON vendor_invoices(due_date);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hierarchy_path ltree NOT NULL,
    hierarchy_id UUID,
    expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES vendor_invoices(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP',
    payment_date DATE NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    transaction_id VARCHAR(255),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    CONSTRAINT fk_payment_hierarchy 
        FOREIGN KEY (hierarchy_id) 
        REFERENCES scaling_hierarchy(id) 
        ON DELETE CASCADE
);

CREATE INDEX idx_payments_hierarchy_path_gin ON payments USING GIN (hierarchy_path);
CREATE INDEX idx_payments_hierarchy_id ON payments(hierarchy_id);
CREATE INDEX idx_payments_expense_id ON payments(expense_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date DESC);

-- Create expense_budgets table
CREATE TABLE IF NOT EXISTS expense_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hierarchy_path ltree NOT NULL,
    hierarchy_id UUID,
    category VARCHAR(100) NOT NULL,
    budget_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    alert_threshold DECIMAL(5, 2) DEFAULT 80.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    CONSTRAINT fk_budget_hierarchy 
        FOREIGN KEY (hierarchy_id) 
        REFERENCES scaling_hierarchy(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT unique_budget_period 
        UNIQUE (hierarchy_path, category, period_start, period_end)
);

CREATE INDEX idx_budgets_hierarchy_path_gin ON expense_budgets USING GIN (hierarchy_path);
CREATE INDEX idx_budgets_hierarchy_id ON expense_budgets(hierarchy_id);
CREATE INDEX idx_budgets_category ON expense_budgets(category);
CREATE INDEX idx_budgets_period ON expense_budgets(period_start, period_end);

-- Partition by year for better performance
-- CREATE TABLE expense_budgets_2025 PARTITION OF expense_budgets
--     FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Create expense_alerts table
CREATE TABLE IF NOT EXISTS expense_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hierarchy_path ltree NOT NULL,
    hierarchy_id UUID,
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES expense_budgets(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL CHECK (alert_type IN (
        'budget_threshold', 'renewal_reminder', 'payment_overdue', 
        'price_increase', 'usage_limit'
    )),
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN (
        'low', 'medium', 'high', 'critical'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_alert_hierarchy 
        FOREIGN KEY (hierarchy_id) 
        REFERENCES scaling_hierarchy(id) 
        ON DELETE CASCADE
);

CREATE INDEX idx_alerts_hierarchy_path_gin ON expense_alerts USING GIN (hierarchy_path);
CREATE INDEX idx_alerts_hierarchy_id ON expense_alerts(hierarchy_id);
CREATE INDEX idx_alerts_expense_id ON expense_alerts(expense_id);
CREATE INDEX idx_alerts_subscription_id ON expense_alerts(subscription_id);
CREATE INDEX idx_alerts_budget_id ON expense_alerts(budget_id);
CREATE INDEX idx_alerts_is_resolved ON expense_alerts(is_resolved);
CREATE INDEX idx_alerts_severity ON expense_alerts(severity);
CREATE INDEX idx_alerts_alert_type ON expense_alerts(alert_type);

-- Partial index for active alerts
CREATE INDEX idx_alerts_active ON expense_alerts(created_at DESC) 
    WHERE is_resolved = false;

-- Create updated_at triggers for all tables
CREATE TRIGGER trigger_vendors_updated_at
    BEFORE UPDATE ON tech_vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_hierarchy_updated_at();

CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_hierarchy_updated_at();

CREATE TRIGGER trigger_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_hierarchy_updated_at();

CREATE TRIGGER trigger_invoices_updated_at
    BEFORE UPDATE ON vendor_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_hierarchy_updated_at();

CREATE TRIGGER trigger_budgets_updated_at
    BEFORE UPDATE ON expense_budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_hierarchy_updated_at();

-- Add comments
COMMENT ON TABLE expenses IS 'All expenses linked to hierarchy using ltree paths';
COMMENT ON TABLE subscriptions IS 'Recurring subscriptions linked to hierarchy';
COMMENT ON TABLE expense_budgets IS 'Budget limits for expense categories per hierarchy node';
COMMENT ON TABLE expense_alerts IS 'Alerts for budget thresholds, renewals, and overdue payments';
COMMENT ON COLUMN expenses.hierarchy_path IS 'ltree path for efficient hierarchical aggregation';
COMMENT ON INDEX idx_expenses_hierarchy_path_gin IS 'GIN index for fast hierarchical expense queries';
