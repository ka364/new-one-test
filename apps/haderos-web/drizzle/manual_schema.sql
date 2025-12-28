-- Essential tables for simulation

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'customer',
  "loginMethod" VARCHAR(100),
  "lastSignedIn" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  permissions JSON,
  "isActive" INTEGER DEFAULT 1,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  "orderNumber" VARCHAR(100) UNIQUE DEFAULT gen_random_uuid()::text,
  "customerName" VARCHAR(255),
  "customerEmail" VARCHAR(255),
  "customerPhone" VARCHAR(50),
  "productName" VARCHAR(500),
  "productDescription" TEXT,
  quantity INTEGER DEFAULT 1,
  "unitPrice" DECIMAL(10,2),
  "totalAmount" DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EGP',
  status VARCHAR(50) DEFAULT 'pending',
  "paymentStatus" VARCHAR(50) DEFAULT 'pending',
  "shippingAddress" TEXT,
  notes TEXT,
  "createdBy" INTEGER REFERENCES users(id),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  "orderId" INTEGER REFERENCES orders(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EGP',
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  "paymentMethod" VARCHAR(100),
  "transactionReference" VARCHAR(255),
  "ethicalCheckStatus" VARCHAR(50) DEFAULT 'pending',
  "ethicalCheckBy" INTEGER REFERENCES users(id),
  "ethicalCheckAt" TIMESTAMP,
  "ethicalCheckNotes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "auditTrail" (
  id SERIAL PRIMARY KEY,
  "entityType" VARCHAR(100) NOT NULL,
  "entityId" INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  "performedBy" INTEGER REFERENCES users(id),
  "performedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changes JSON,
  "ipAddress" VARCHAR(50),
  "userAgent" TEXT,
  "decisionOutcome" VARCHAR(50),
  "ethicalScore" DECIMAL(5,2),
  "rulesApplied" JSON,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  "eventType" VARCHAR(100) NOT NULL,
  "entityType" VARCHAR(100),
  "entityId" INTEGER,
  payload JSON NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  "processedAt" TIMESTAMP,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES users(id),
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  "isRead" INTEGER DEFAULT 0,
  "readAt" TIMESTAMP,
  "relatedEntityType" VARCHAR(100),
  "relatedEntityId" INTEGER,
  priority VARCHAR(20) DEFAULT 'normal',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "agentInsights" (
  id SERIAL PRIMARY KEY,
  "agentType" VARCHAR(100) NOT NULL,
  "insightType" VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  "insightData" JSON,
  confidence DECIMAL(5,2),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'new',
  "reviewedBy" INTEGER REFERENCES users(id),
  "reviewedAt" TIMESTAMP,
  "reviewNotes" TEXT,
  "relatedEntityType" VARCHAR(100),
  "relatedEntityId" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_openid ON users("openId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders("customerEmail");
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions("orderId");
CREATE INDEX IF NOT EXISTS idx_audit_entity ON "auditTrail"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_insights_agent ON "agentInsights"("agentType");
