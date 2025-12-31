import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== جداول COD ====================
export const codOrders = mysqlTable('cod_orders', {
  id: int('id').primaryKey().autoincrement(),
  orderId: varchar('order_id', { length: 50 }).unique().notNull(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  shippingAddress: json('shipping_address').$type<{
    governorate: string;
    center: string;
    point: string;
    street: string;
    building: string;
    floor: string;
    apartment: string;
  }>().notNull(),
  orderAmount: decimal('order_amount', { precision: 10, scale: 2 }).notNull(),
  codAmount: decimal('cod_amount', { precision: 10, scale: 2 }).notNull(),
  
  // مراحل COD
  currentStage: varchar('current_stage', { length: 50 }).notNull().default('pending'),
  stages: json('stages').$type<Record<string, any>>().notNull(),
  
  // معلومات الشحن
  trackingNumber: varchar('tracking_number', { length: 100 }),
  shippingCompanyId: int('shipping_company_id'),
  allocatedShippingPoint: json('allocated_shipping_point').$type<{
    level: string;
    levelId: string;
    companyId: number;
    score: number;
  }>(),
  
  // التواريخ
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orderIdIdx: index('order_id_idx').on(table.orderId),
  customerPhoneIdx: index('customer_phone_idx').on(table.customerPhone),
  currentStageIdx: index('current_stage_idx').on(table.currentStage),
  shippingCompanyIdIdx: index('shipping_company_id_idx').on(table.shippingCompanyId),
}));

export const codWorkflowLogs = mysqlTable('cod_workflow_logs', {
  id: int('id').primaryKey().autoincrement(),
  orderId: varchar('order_id', { length: 50 }).notNull(),
  stage: varchar('stage', { length: 50 }).notNull(),
  description: text('description'),
  data: json('data').$type<Record<string, any>>(),
  agentId: varchar('agent_id', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orderIdIdx: index('order_id_idx').on(table.orderId),
  stageIdx: index('stage_idx').on(table.stage),
}));

export const codSettlements = mysqlTable('cod_settlements', {
  id: int('id').primaryKey().autoincrement(),
  orderId: varchar('order_id', { length: 50 }).notNull(),
  collectedAmount: decimal('collected_amount', { precision: 10, scale: 2 }).notNull(),
  collectionDate: timestamp('collection_date'),
  settlementDate: timestamp('settlement_date'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orderIdIdx: index('order_id_idx').on(table.orderId),
  statusIdx: index('status_idx').on(table.status),
}));

// ==================== جداول الطلبات ====================
export const orders = mysqlTable('orders', {
  id: int('id').primaryKey().autoincrement(),
  orderNumber: varchar('order_number', { length: 50 }).unique().notNull(),
  customerId: int('customer_id'),
  affiliateId: int('affiliate_id'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0.00'),
  finalAmount: decimal('final_amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('pending'),
  orderStatus: varchar('order_status', { length: 20 }).notNull().default('pending'),
  shippingStatus: varchar('shipping_status', { length: 20 }).notNull().default('pending'),
  
  // معلومات الشحن
  shippingAddress: json('shipping_address').$type<{
    governorate: string;
    center: string;
    street: string;
    building: string;
  }>().notNull(),
  shippingMethod: varchar('shipping_method', { length: 50 }),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }),
  
  // معلومات المنتجات
  items: json('items').$type<Array<{
    productId: number;
    quantity: number;
    price: number;
  }>>().notNull(),
  
  // التواريخ
  orderDate: timestamp('order_date').defaultNow(),
  estimatedDelivery: timestamp('estimated_delivery'),
  actualDelivery: timestamp('actual_delivery'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  orderNumberIdx: index('order_number_idx').on(table.orderNumber),
  customerIdIdx: index('customer_id_idx').on(table.customerId),
  affiliateIdIdx: index('affiliate_id_idx').on(table.affiliateId),
  orderStatusIdx: index('order_status_idx').on(table.orderStatus),
}));

export const orderItems = mysqlTable('order_items', {
  id: int('id').primaryKey().autoincrement(),
  orderId: int('order_id').notNull(),
  productId: int('product_id').notNull(),
  variantId: int('variant_id'),
  quantity: int('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orderIdIdx: index('order_id_idx').on(table.orderId),
  productIdIdx: index('product_id_idx').on(table.productId),
}));

// ==================== جداول الشحن ====================
export const shippingCompanies = mysqlTable('shipping_companies', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  apiKey: varchar('api_key', { length: 255 }),
  apiSecret: varchar('api_secret', { length: 255 }),
  baseUrl: varchar('base_url', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  priority: int('priority').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  codeIdx: index('code_idx').on(table.code),
  isActiveIdx: index('is_active_idx').on(table.isActive),
}));

export const shippingPerformance = mysqlTable('shipping_performance', {
  id: int('id').primaryKey().autoincrement(),
  companyId: int('company_id').notNull(),
  level: varchar('level', { length: 20 }).notNull(), // point, center, governorate
  levelId: varchar('level_id', { length: 100 }).notNull(),
  totalShipments: int('total_shipments').notNull().default(0),
  successfulShipments: int('successful_shipments').notNull().default(0),
  totalDeliveryDays: int('total_delivery_days').notNull().default(0),
  totalCustomerRating: int('total_customer_rating').notNull().default(0),
  failureReasons: json('failure_reasons').$type<Record<string, number>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  companyIdIdx: index('company_id_idx').on(table.companyId),
  levelIdx: index('level_idx').on(table.level, table.levelId),
}));

// ==================== جداول المخزون ====================
export const products = mysqlTable('products', {
  id: int('id').primaryKey().autoincrement(),
  sku: varchar('sku', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  subcategory: varchar('subcategory', { length: 100 }),
  brand: varchar('brand', { length: 100 }),
  
  // الأسعار
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
  wholesalePrice: decimal('wholesale_price', { precision: 10, scale: 2 }),
  
  // المخزون
  currentStock: int('current_stock').notNull().default(0),
  minStockLevel: int('min_stock_level').notNull().default(10),
  maxStockLevel: int('max_stock_level').notNull().default(100),
  reorderPoint: int('reorder_point').notNull().default(20),
  
  // الصور والمعلومات
  images: json('images').$type<string[]>(),
  specifications: json('specifications').$type<Record<string, any>>(),
  tags: json('tags').$type<string[]>(),
  
  // التواريخ
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  skuIdx: index('sku_idx').on(table.sku),
  categoryIdx: index('category_idx').on(table.category),
}));

// ==================== جداول المسوقين ====================
export const affiliates = mysqlTable('affiliates', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  code: varchar('code', { length: 50 }).unique().notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull(),
  totalEarnings: decimal('total_earnings', { precision: 10, scale: 2 }).notNull().default('0.00'),
  pendingEarnings: decimal('pending_earnings', { precision: 10, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  joinedAt: timestamp('joined_at').defaultNow(),
  lastActivity: timestamp('last_activity'),
}, (table) => ({
  codeIdx: index('code_idx').on(table.code),
  statusIdx: index('status_idx').on(table.status),
}));

// ==================== جداول Live Showroom ====================
export const liveStreams = mysqlTable('live_streams', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  streamKey: varchar('stream_key', { length: 255 }).unique().notNull(),
  platform: varchar('platform', { length: 50 }).notNull(), // facebook, youtube, tiktok
  status: varchar('status', { length: 20 }).notNull().default('scheduled'),
  scheduledStart: timestamp('scheduled_start'),
  actualStart: timestamp('actual_start'),
  actualEnd: timestamp('actual_end'),
  viewersCount: int('viewers_count').default(0),
  ordersCount: int('orders_count').default(0),
  revenue: decimal('revenue', { precision: 10, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  streamKeyIdx: index('stream_key_idx').on(table.streamKey),
  platformIdx: index('platform_idx').on(table.platform),
  statusIdx: index('status_idx').on(table.status),
}));

// ==================== جداول C2M ====================
export const suppliers = mysqlTable('suppliers', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  country: varchar('country', { length: 100 }),
  leadTime: int('lead_time').notNull().default(7),
  minOrderQuantity: int('min_order_quantity').notNull(),
  paymentTerms: varchar('payment_terms', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  isActiveIdx: index('is_active_idx').on(table.isActive),
}));

// ==================== جداول Transactions ====================
export const transactions = mysqlTable('transactions', {
  id: int('id').primaryKey().autoincrement(),
  transactionNumber: varchar('transaction_number', { length: 50 }).unique().notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  category: varchar('category', { length: 100 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  description: text('description'),
  relatedOrderId: int('related_order_id'),
  relatedSubscriptionId: int('related_subscription_id'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  shariaCompliant: boolean('sharia_compliant').default(true).notNull(),
  ethicalCheckStatus: varchar('ethical_check_status', { length: 20 }).default('pending').notNull(),
  ethicalCheckNotes: text('ethical_check_notes'),
  ethicalCheckBy: int('ethical_check_by'),
  ethicalCheckAt: timestamp('ethical_check_at'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  transactionNumberIdx: index('transaction_number_idx').on(table.transactionNumber),
  statusIdx: index('status_idx').on(table.status),
}));

// ==================== جداول Ethical Rules ====================
export const ethicalRules = mysqlTable('ethical_rules', {
  id: int('id').primaryKey().autoincrement(),
  ruleName: varchar('rule_name', { length: 200 }).notNull(),
  ruleNameAr: varchar('rule_name_ar', { length: 200 }),
  ruleDescription: text('rule_description').notNull(),
  ruleDescriptionAr: text('rule_description_ar'),
  ruleType: varchar('rule_type', { length: 50 }).notNull(),
  category: varchar('category', { length: 100 }),
  severity: varchar('severity', { length: 20 }).default('medium').notNull(),
  ruleLogic: json('rule_logic').$type<Record<string, any>>().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  autoApply: boolean('auto_apply').default(true).notNull(),
  requiresReview: boolean('requires_review').default(false).notNull(),
  priority: int('priority').default(100).notNull(),
  referenceSource: text('reference_source'),
  referenceSourceAr: text('reference_source_ar'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ==================== جداول Audit Trail ====================
export const auditTrail = mysqlTable('audit_trail', {
  id: int('id').primaryKey().autoincrement(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: int('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  actionDescription: text('action_description'),
  kaiaDecision: varchar('kaia_decision', { length: 50 }),
  appliedRules: json('applied_rules').$type<any[]>(),
  decisionReason: text('decision_reason'),
  decisionReasonAr: text('decision_reason_ar'),
  oldValues: json('old_values').$type<Record<string, any>>(),
  newValues: json('new_values').$type<Record<string, any>>(),
  performedBy: int('performed_by').notNull(),
  performedAt: timestamp('performed_at').defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
}, (table) => ({
  entityIdx: index('entity_idx').on(table.entityType, table.entityId),
  performedByIdx: index('performed_by_idx').on(table.performedBy),
}));

// ==================== جداول Events ====================
export const events = mysqlTable('events', {
  id: int('id').primaryKey().autoincrement(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventName: varchar('event_name', { length: 200 }).notNull(),
  eventData: json('event_data').$type<Record<string, any>>().notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  priority: int('priority').default(100).notNull(),
  processedBy: varchar('processed_by', { length: 100 }),
  processedAt: timestamp('processed_at'),
  errorMessage: text('error_message'),
  retryCount: int('retry_count').default(0).notNull(),
  maxRetries: int('max_retries').default(3).notNull(),
  createdBy: int('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  statusIdx: index('status_idx').on(table.status),
  eventTypeIdx: index('event_type_idx').on(table.eventType),
}));

// ==================== جداول Notifications ====================
export const notifications = mysqlTable('notifications', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  type: varchar('type', { length: 20 }).default('info').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  titleAr: varchar('title_ar', { length: 200 }),
  message: text('message').notNull(),
  messageAr: text('message_ar'),
  relatedEntityType: varchar('related_entity_type', { length: 100 }),
  relatedEntityId: int('related_entity_id'),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  isReadIdx: index('is_read_idx').on(table.isRead),
}));

// ==================== جداول Reports ====================
export const reports = mysqlTable('reports', {
  id: int('id').primaryKey().autoincrement(),
  reportName: varchar('report_name', { length: 200 }).notNull(),
  reportNameAr: varchar('report_name_ar', { length: 200 }),
  reportType: varchar('report_type', { length: 50 }).notNull(),
  description: text('description'),
  descriptionAr: text('description_ar'),
  reportConfig: json('report_config').$type<Record<string, any>>().notNull(),
  reportData: json('report_data').$type<Record<string, any>>(),
  isScheduled: boolean('is_scheduled').default(false).notNull(),
  scheduleFrequency: varchar('schedule_frequency', { length: 50 }),
  nextRunAt: timestamp('next_run_at'),
  lastRunAt: timestamp('last_run_at'),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ==================== جداول Subscriptions ====================
export const subscriptions = mysqlTable('subscriptions', {
  id: int('id').primaryKey().autoincrement(),
  subscriptionNumber: varchar('subscription_number', { length: 50 }).unique().notNull(),
  userId: int('user_id').notNull(),
  planName: varchar('plan_name', { length: 200 }).notNull(),
  planDescription: text('plan_description'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  billingCycle: varchar('billing_cycle', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  nextBillingDate: timestamp('next_billing_date'),
  cancelledAt: timestamp('cancelled_at'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  lastPaymentDate: timestamp('last_payment_date'),
  lastPaymentAmount: decimal('last_payment_amount', { precision: 10, scale: 2 }),
  shariaCompliant: boolean('sharia_compliant').default(true).notNull(),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  subscriptionNumberIdx: index('subscription_number_idx').on(table.subscriptionNumber),
  userIdIdx: index('user_id_idx').on(table.userId),
}));

// ==================== جداول Campaigns ====================
export const campaigns = mysqlTable('campaigns', {
  id: int('id').primaryKey().autoincrement(),
  campaignName: varchar('campaign_name', { length: 200 }).notNull(),
  campaignNameAr: varchar('campaign_name_ar', { length: 200 }),
  description: text('description'),
  descriptionAr: text('description_ar'),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  budget: decimal('budget', { precision: 10, scale: 2 }),
  spent: decimal('spent', { precision: 10, scale: 2 }).default('0.00').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  impressions: int('impressions').default(0).notNull(),
  clicks: int('clicks').default(0).notNull(),
  conversions: int('conversions').default(0).notNull(),
  revenue: decimal('revenue', { precision: 10, scale: 2 }).default('0.00').notNull(),
  aiOptimizationEnabled: boolean('ai_optimization_enabled').default(true).notNull(),
  lastOptimizedAt: timestamp('last_optimized_at'),
  optimizationNotes: text('optimization_notes'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  targetAudience: json('target_audience').$type<Record<string, any>>(),
  campaignConfig: json('campaign_config').$type<Record<string, any>>(),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ==================== جداول Agent Insights ====================
export const agentInsights = mysqlTable('agent_insights', {
  id: int('id').primaryKey().autoincrement(),
  agentType: varchar('agent_type', { length: 50 }).notNull(),
  insightType: varchar('insight_type', { length: 100 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  titleAr: varchar('title_ar', { length: 200 }),
  description: text('description').notNull(),
  descriptionAr: text('description_ar'),
  insightData: json('insight_data').$type<Record<string, any>>().notNull(),
  confidence: decimal('confidence', { precision: 5, scale: 2 }),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(),
  status: varchar('status', { length: 20 }).default('new').notNull(),
  reviewedBy: int('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  relatedEntityType: varchar('related_entity_type', { length: 100 }),
  relatedEntityId: int('related_entity_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// ==================== جداول Chat Messages ====================
export const chatMessages = mysqlTable('chat_messages', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  conversationId: varchar('conversation_id', { length: 100 }),
  parentMessageId: int('parent_message_id'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  conversationIdIdx: index('conversation_id_idx').on(table.conversationId),
}));

// ==================== جداول Smart Shipping ====================
export const shippingPartners = mysqlTable('shipping_partners', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).unique().notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  logo: varchar('logo', { length: 255 }),
  coverage: json('coverage').$type<{
    governorates: string[];
    areas: Array<{
      governorate: string;
      cities: string[];
      deliveryTime: number;
      successRate: number;
      cost: number;
      active: boolean;
    }>;
  }>(),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }).default('95.00'),
  totalShipments: int('total_shipments').default(0),
  successfulDeliveries: int('successful_deliveries').default(0),
  avgDeliveryTime: decimal('avg_delivery_time', { precision: 4, scale: 1 }).default('3.0'),
  complaintRate: decimal('complaint_rate', { precision: 4, scale: 2 }).default('0.02'),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('4.00'),
  dailyLimit: int('daily_limit').default(1000),
  currentLoad: int('current_load').default(0),
  peakHours: json('peak_hours').$type<string[]>(),
  codFeePercentage: decimal('cod_fee_percentage', { precision: 5, scale: 2 }).default('2.50'),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('25.00'),
  codFeeFixed: decimal('cod_fee_fixed', { precision: 10, scale: 2 }).default('5.00'),
  settlementDays: int('settlement_days').default(7),
  creditLimit: decimal('credit_limit', { precision: 10, scale: 2 }).default('50000.00'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const shippingAllocations = mysqlTable('shipping_allocations', {
  id: int('id').primaryKey().autoincrement(),
  codOrderId: int('cod_order_id'),
  shippingPartnerId: int('shipping_partner_id'),
  allocationScore: decimal('allocation_score', { precision: 5, scale: 2 }),
  allocationReason: text('allocation_reason'),
  shipmentStatus: varchar('shipment_status', { length: 30 }).default('pending'),
  apiResponse: json('api_response').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  codOrderIdIdx: index('cod_order_id_idx').on(table.codOrderId),
  shippingPartnerIdIdx: index('shipping_partner_id_idx').on(table.shippingPartnerId),
}));

export const fallbackLogs = mysqlTable('fallback_logs', {
  id: int('id').primaryKey().autoincrement(),
  originalPartnerId: int('original_partner_id'),
  newPartnerId: int('new_partner_id'),
  codOrderId: int('cod_order_id'),
  reason: varchar('reason', { length: 100 }).notNull(),
  details: json('details').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  codOrderIdIdx: index('cod_order_id_idx').on(table.codOrderId),
}));

export const trackingLogs = mysqlTable('tracking_logs', {
  id: int('id').primaryKey().autoincrement(),
  codOrderId: int('cod_order_id'),
  shippingPartnerId: int('shipping_partner_id'),
  stage: varchar('stage', { length: 50 }).notNull(),
  status: varchar('status', { length: 30 }).notNull(),
  description: text('description'),
  agentId: varchar('agent_id', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  codOrderIdIdx: index('tracking_logs_cod_order_id').on(table.codOrderId),
  stageIdx: index('tracking_logs_stage').on(table.stage),
}));

export const shippingPerformanceByGovernorate = mysqlTable('shipping_performance_by_governorate', {
  id: int('id').primaryKey().autoincrement(),
  companyId: int('company_id').notNull(),
  governorateCode: varchar('governorate_code', { length: 10 }).notNull(),
  governorateName: varchar('governorate_name', { length: 100 }),
  totalShipments: int('total_shipments').default(0),
  successfulShipments: int('successful_shipments').default(0),
  failedShipments: int('failed_shipments').default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }).default('0.00'),
  avgDeliveryDays: decimal('avg_delivery_days', { precision: 4, scale: 1 }).default('0.0'),
  customerSatisfaction: decimal('customer_satisfaction', { precision: 3, scale: 2 }).default('0.00'),
  avgPrice: decimal('avg_price', { precision: 10, scale: 2 }).default('0.00'),
  failedReasons: json('failed_reasons').$type<Record<string, any>>(),
  lastUpdated: timestamp('last_updated').defaultNow(),
}, (table) => ({
  perfGovCompanyGov: index('perf_gov_company_gov').on(table.companyId, table.governorateCode),
}));

export const shippingPerformanceByCenter = mysqlTable('shipping_performance_by_center', {
  id: int('id').primaryKey().autoincrement(),
  companyId: int('company_id').notNull(),
  centerCode: varchar('center_code', { length: 10 }).notNull(),
  governorateCode: varchar('governorate_code', { length: 10 }),
  centerName: varchar('center_name', { length: 100 }),
  totalShipments: int('total_shipments').default(0),
  successfulShipments: int('successful_shipments').default(0),
  failedShipments: int('failed_shipments').default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }).default('0.00'),
  avgDeliveryDays: decimal('avg_delivery_days', { precision: 4, scale: 1 }).default('0.0'),
  customerSatisfaction: decimal('customer_satisfaction', { precision: 3, scale: 2 }).default('0.00'),
  avgPrice: decimal('avg_price', { precision: 10, scale: 2 }).default('0.00'),
  failedReasons: json('failed_reasons').$type<Record<string, any>>(),
  lastUpdated: timestamp('last_updated').defaultNow(),
}, (table) => ({
  perfCenterCompanyCenter: index('perf_center_company_center').on(table.companyId, table.centerCode),
}));

export const shippingPerformanceByPoint = mysqlTable('shipping_performance_by_point', {
  id: int('id').primaryKey().autoincrement(),
  companyId: int('company_id').notNull(),
  pointCode: varchar('point_code', { length: 15 }).notNull(),
  centerCode: varchar('center_code', { length: 10 }),
  governorateCode: varchar('governorate_code', { length: 10 }),
  pointName: varchar('point_name', { length: 150 }),
  totalShipments: int('total_shipments').default(0),
  successfulShipments: int('successful_shipments').default(0),
  failedShipments: int('failed_shipments').default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }).default('0.00'),
  avgDeliveryDays: decimal('avg_delivery_days', { precision: 4, scale: 1 }).default('0.0'),
  customerSatisfaction: decimal('customer_satisfaction', { precision: 3, scale: 2 }).default('0.00'),
  avgPrice: decimal('avg_price', { precision: 10, scale: 2 }).default('0.00'),
  failedReasons: json('failed_reasons').$type<Record<string, any>>(),
  lastUpdated: timestamp('last_updated').defaultNow(),
}, (table) => ({
  perfPointCompanyPoint: index('perf_point_company_point').on(table.companyId, table.pointCode),
}));

// ==================== جداول Visual Search ====================
export const productImages = mysqlTable('product_images', {
  id: int('id').primaryKey().autoincrement(),
  productId: int('product_id').notNull(),
  s3Url: varchar('s3_url', { length: 500 }).notNull(),
  s3Key: varchar('s3_key', { length: 255 }).notNull(),
  imageType: varchar('image_type', { length: 50 }).default('product').notNull(),
  isPrimary: boolean('is_primary').default(false),
  sortOrder: int('sort_order').default(0),
  originalUrl: varchar('original_url', { length: 500 }),
  width: int('width'),
  height: int('height'),
  fileSize: int('file_size'),
  mimeType: varchar('mime_type', { length: 50 }),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  productIdIdx: index('product_id_idx').on(table.productId),
  isPrimaryIdx: index('is_primary_idx').on(table.isPrimary),
}));

export const imageEmbeddings = mysqlTable('image_embeddings', {
  id: int('id').primaryKey().autoincrement(),
  imageId: int('image_id').notNull(),
  embeddingVector: text('embedding_vector').notNull(),
  modelName: varchar('model_name', { length: 100 }).notNull(),
  modelVersion: varchar('model_version', { length: 50 }).notNull(),
  vectorDimensions: int('vector_dimensions').notNull(),
  processingTime: int('processing_time'),
  confidence: decimal('confidence', { precision: 5, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  imageIdIdx: index('image_id_idx').on(table.imageId),
  modelIdx: index('model_idx').on(table.modelName, table.modelVersion),
}));

export const visualSearchHistory = mysqlTable('visual_search_history', {
  id: int('id').primaryKey().autoincrement(),
  searchImageUrl: varchar('search_image_url', { length: 500 }),
  searchImageS3Key: varchar('search_image_s3_key', { length: 255 }),
  topResultProductId: int('top_result_product_id'),
  topResultSimilarity: decimal('top_result_similarity', { precision: 5, scale: 4 }),
  totalResults: int('total_results'),
  userId: int('user_id'),
  userRole: varchar('user_role', { length: 50 }),
  searchContext: varchar('search_context', { length: 100 }),
  searchDuration: int('search_duration'),
  wasHelpful: boolean('was_helpful'),
  selectedProductId: int('selected_product_id'),
  searchedAt: timestamp('searched_at').defaultNow(),
}, (table) => ({
  searchedAtIdx: index('searched_at_idx').on(table.searchedAt),
  userIdIdx: index('user_id_idx').on(table.userId),
  contextIdx: index('context_idx').on(table.searchContext),
}));

// ==================== جداول Founder Accounts ====================
export const founderAccounts = mysqlTable('founder_accounts', {
  id: int('id').primaryKey().autoincrement(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 320 }).notNull(),
  username: varchar('username', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  currentMonth: varchar('current_month', { length: 7 }).notNull(),
  passwordExpiresAt: timestamp('password_expires_at').notNull(),
  lastPasswordChangeAt: timestamp('last_password_change_at').defaultNow(),
  permissions: json('permissions').$type<Record<string, any>>(),
  lastLoginAt: timestamp('last_login_at'),
  lastLoginIp: varchar('last_login_ip', { length: 45 }),
  loginCount: int('login_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  usernameIdx: index('username_idx').on(table.username),
}));

export const founderLoginHistory = mysqlTable('founder_login_history', {
  id: int('id').primaryKey().autoincrement(),
  founderId: int('founder_id').notNull(),
  loginAt: timestamp('login_at').defaultNow().notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  success: boolean('success').notNull(),
  failureReason: varchar('failure_reason', { length: 255 }),
  sessionId: varchar('session_id', { length: 255 }),
  sessionDuration: int('session_duration'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  founderIdIdx: index('founder_id_idx').on(table.founderId),
}));

// ==================== جداول Employee Accounts ====================
export const monthlyEmployeeAccounts = mysqlTable('monthly_employee_accounts', {
  id: int('id').primaryKey().autoincrement(),
  employeeName: varchar('employee_name', { length: 255 }).notNull(),
  username: varchar('username', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  month: varchar('month', { length: 7 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  lastLoginAt: timestamp('last_login_at'),
  email: varchar('email', { length: 255 }),
  emailVerified: boolean('email_verified').default(false),
  otpCode: varchar('otp_code', { length: 6 }),
  otpExpiresAt: timestamp('otp_expires_at'),
  otpAttempts: int('otp_attempts').default(0),
}, (table) => ({
  usernameIdx: index('username_idx').on(table.username),
}));

export const employeeMonthlyData = mysqlTable('employee_monthly_data', {
  id: int('id').primaryKey().autoincrement(),
  accountId: int('account_id').notNull(),
  dataType: varchar('data_type', { length: 100 }).notNull(),
  dataJson: json('data_json').$type<Record<string, any>>().notNull(),
  submittedAt: timestamp('submitted_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  accountIdIdx: index('account_id_idx').on(table.accountId),
}));

export const accountGenerationLogs = mysqlTable('account_generation_logs', {
  id: int('id').primaryKey().autoincrement(),
  month: varchar('month', { length: 7 }).notNull(),
  accountsGenerated: int('accounts_generated').notNull(),
  generatedBy: int('generated_by').notNull(),
  excelFilePath: varchar('excel_file_path', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==================== جداول Investors ====================
export const investors = mysqlTable('investors', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone: varchar('phone', { length: 20 }),
  investmentAmount: decimal('investment_amount', { precision: 15, scale: 2 }).notNull(),
  equityPercentage: decimal('equity_percentage', { precision: 5, scale: 2 }),
  investmentDate: timestamp('investment_date').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const investorActivity = mysqlTable('investor_activity', {
  id: int('id').primaryKey().autoincrement(),
  investorId: int('investor_id').notNull(),
  activityType: varchar('activity_type', { length: 50 }).notNull(),
  description: text('description'),
  amount: decimal('amount', { precision: 15, scale: 2 }),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  investorIdIdx: index('investor_id_idx').on(table.investorId),
}));

// ==================== جداول النظام ====================
export const systemLogs = mysqlTable('system_logs', {
  id: int('id').primaryKey().autoincrement(),
  level: varchar('level', { length: 20 }).notNull(), // info, warning, error
  module: varchar('module', { length: 100 }).notNull(),
  message: text('message').notNull(),
  data: json('data').$type<Record<string, any>>(),
  userId: int('user_id'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  levelIdx: index('level_idx').on(table.level),
  moduleIdx: index('module_idx').on(table.module),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// ==================== العلاقات ====================
export const codOrdersRelations = relations(codOrders, ({ many }) => ({
  workflowLogs: many(codWorkflowLogs),
  settlements: many(codSettlements),
}));

export const codWorkflowLogsRelations = relations(codWorkflowLogs, ({ one }) => ({
  order: one(codOrders, {
    fields: [codWorkflowLogs.orderId],
    references: [codOrders.orderId],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export const shippingCompaniesRelations = relations(shippingCompanies, ({ many }) => ({
  performances: many(shippingPerformance),
}));

// تصدير جميع الجداول
export const tables = {
  users,
  codOrders,
  codWorkflowLogs,
  codSettlements,
  orders,
  orderItems,
  shippingCompanies,
  shippingPerformance,
  products,
  affiliates,
  liveStreams,
  suppliers,
  transactions,
  ethicalRules,
  auditTrail,
  events,
  notifications,
  reports,
  subscriptions,
  campaigns,
  agentInsights,
  chatMessages,
  shippingPartners,
  shippingAllocations,
  fallbackLogs,
  trackingLogs,
  shippingPerformanceByGovernorate,
  shippingPerformanceByCenter,
  shippingPerformanceByPoint,
  productImages,
  imageEmbeddings,
  visualSearchHistory,
  founderAccounts,
  founderLoginHistory,
  monthlyEmployeeAccounts,
  employeeMonthlyData,
  accountGenerationLogs,
  investors,
  investorActivity,
  systemLogs,
  shippingZones,
  shipments,
  shipmentReturns,
  collections,
  collectionItems,
  dailyOperationalMetrics,
  adCampaignPerformance,
  revenueForecasts,
};

// ==================== Shipping Zones & Shipments ====================
export const shippingZones = mysqlTable('shipping_zones', {
  id: int('id').primaryKey().autoincrement(),
  companyId: int('company_id').notNull(),
  zoneName: varchar('zone_name', { length: 50 }).notNull(),
  zoneNumber: int('zone_number').notNull(),
  basePriceUpTo3Kg: decimal('base_price_up_to_3kg', { precision: 10, scale: 2 }).notNull(),
  additionalKgPrice: decimal('additional_kg_price', { precision: 10, scale: 2 }).notNull(),
  areas: json('areas').$type<any[]>().notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const shipments = mysqlTable('shipments', {
  id: int('id').primaryKey().autoincrement(),
  orderId: int('order_id').notNull(),
  companyId: int('company_id').notNull(),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  zoneId: int('zone_id').notNull(),
  weight: decimal('weight', { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).notNull(),
  codFee: decimal('cod_fee', { precision: 10, scale: 2 }).default('0.00'),
  insuranceFee: decimal('insurance_fee', { precision: 10, scale: 2 }).default('0.00'),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('pending').notNull(),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  returnedAt: timestamp('returned_at'),
  returnReason: text('return_reason'),
  notes: text('notes'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const shipmentReturns = mysqlTable('shipment_returns', {
  id: int('id').primaryKey().autoincrement(),
  shipmentId: int('shipment_id').notNull(),
  returnType: text('return_type').notNull(),
  returnReason: text('return_reason'),
  returnCost: decimal('return_cost', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('pending').notNull(),
  receivedAt: timestamp('received_at'),
  processedBy: int('processed_by'),
  processedAt: timestamp('processed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const collections = mysqlTable('collections', {
  id: int('id').primaryKey().autoincrement(),
  collectionType: text('collection_type').notNull(),
  companyId: int('company_id').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  collectionDate: date('collection_date').notNull(),
  receiptNumber: varchar('receipt_number', { length: 100 }),
  bankReference: varchar('bank_reference', { length: 100 }),
  status: text('status').default('pending').notNull(),
  notes: text('notes'),
  createdBy: int('created_by').notNull(),
  confirmedBy: int('confirmed_by'),
  confirmedAt: timestamp('confirmed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const collectionItems = mysqlTable('collection_items', {
  id: int('id').primaryKey().autoincrement(),
  collectionId: int('collection_id').notNull(),
  orderId: int('order_id').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==================== Operational Metrics ====================
export const dailyOperationalMetrics = mysqlTable('daily_operational_metrics', {
  id: int('id').primaryKey().autoincrement(),
  date: date('date').notNull().unique(),
  
  // Orders
  ordersCreated: int('orders_created').default(0).notNull(),
  ordersCreatedValue: decimal('orders_created_value', { precision: 10, scale: 2 }).default('0.00').notNull(),
  ordersConfirmed: int('orders_confirmed').default(0).notNull(),
  ordersConfirmedValue: decimal('orders_confirmed_value', { precision: 10, scale: 2 }).default('0.00').notNull(),
  ordersShipped: int('orders_shipped').default(0).notNull(),
  ordersShippedValue: decimal('orders_shipped_value', { precision: 10, scale: 2 }).default('0.00').notNull(),
  ordersReturned: int('orders_returned').default(0).notNull(),
  ordersReturnedValue: decimal('orders_returned_value', { precision: 10, scale: 2 }).default('0.00').notNull(),
  ordersDelivered: int('orders_delivered').default(0).notNull(),
  ordersDeliveredValue: decimal('orders_delivered_value', { precision: 10, scale: 2 }).default('0.00').notNull(),
  
  // Collections
  totalCollection: decimal('total_collection', { precision: 10, scale: 2 }).default('0.00').notNull(),
  cashCollection: decimal('cash_collection', { precision: 10, scale: 2 }).default('0.00').notNull(),
  bankCollection: decimal('bank_collection', { precision: 10, scale: 2 }).default('0.00').notNull(),
  
  // Expenses
  operatingExpenses: decimal('operating_expenses', { precision: 10, scale: 2 }).default('0.00').notNull(),
  adSpend: decimal('ad_spend', { precision: 10, scale: 2 }).default('0.00').notNull(),
  treasuryPaid: decimal('treasury_paid', { precision: 10, scale: 2 }).default('0.00').notNull(),
  
  // KPIs (calculated)
  tcr: decimal('tcr', { precision: 5, scale: 2 }).default('0.00'),
  tcc: decimal('tcc', { precision: 5, scale: 2 }).default('0.00'),
  tcs: decimal('tcs', { precision: 5, scale: 2 }).default('0.00'),
  tcrn: decimal('tcrn', { precision: 5, scale: 2 }).default('0.00'),
  ocr: decimal('ocr', { precision: 5, scale: 2 }).default('0.00'),
  adr: decimal('adr', { precision: 5, scale: 2 }).default('0.00'),
  fdr: decimal('fdr', { precision: 5, scale: 2 }).default('0.00'),
  
  calculatedAt: timestamp('calculated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const adCampaignPerformance = mysqlTable('ad_campaign_performance', {
  id: int('id').primaryKey().autoincrement(),
  date: date('date').notNull(),
  campaignName: varchar('campaign_name', { length: 200 }).notNull(),
  platform: text('platform').notNull(),
  spend: decimal('spend', { precision: 10, scale: 2 }).notNull(),
  results: int('results').default(0).notNull(),
  costPerResult: decimal('cost_per_result', { precision: 10, scale: 4 }).notNull(),
  reach: int('reach').default(0),
  impressions: int('impressions').default(0),
  clicks: int('clicks').default(0),
  conversions: int('conversions').default(0),
  messagesStarted: int('messages_started').default(0),
  costPerMessage: decimal('cost_per_message', { precision: 10, scale: 2 }),
  active: boolean('active').default(true).notNull(),
  notes: text('notes'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const revenueForecasts = mysqlTable('revenue_forecasts', {
  id: int('id').primaryKey().autoincrement(),
  date: date('date').notNull(),
  adSpend: decimal('ad_spend', { precision: 10, scale: 2 }).notNull(),
  lastCampaignEfficiency: decimal('last_campaign_efficiency', { precision: 10, scale: 4 }).notNull(),
  expectedOrders: int('expected_orders').notNull(),
  averageOrderValue: decimal('average_order_value', { precision: 10, scale: 2 }).notNull(),
  shipmentRate: decimal('shipment_rate', { precision: 5, scale: 2 }).notNull(),
  deliverySuccessRate: decimal('delivery_success_rate', { precision: 5, scale: 2 }).notNull(),
  expectedRevenue: decimal('expected_revenue', { precision: 10, scale: 2 }).notNull(),
  actualRevenue: decimal('actual_revenue', { precision: 10, scale: 2 }),
  variance: decimal('variance', { precision: 10, scale: 2 }),
  variancePercentage: decimal('variance_percentage', { precision: 5, scale: 2 }),
  notes: text('notes'),
  createdBy: int('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});
