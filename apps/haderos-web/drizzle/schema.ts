// @ts-nocheck
import { pgTable, serial, varchar, text, timestamp, decimal, jsonb, integer, bigint, boolean, index, foreignKey, date, primaryKey, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const accountGenerationLogs = pgTable("account_generation_logs", {
	id: serial().notNull(),
	month: varchar({ length: 7 }).notNull(),
	accountsGenerated: integer("accounts_generated").notNull(),
	generatedBy: integer("generated_by").notNull().references(() => users.id),
	excelFilePath: varchar("excel_file_path", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const agentInsights = pgTable("agentInsights", {
	id: serial().notNull(),
	agentType: text().notNull(),
	insightType: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	titleAr: varchar({ length: 200 }),
	description: text().notNull(),
	descriptionAr: text(),
	insightData: jsonb("insight_data").notNull(),
	confidence: decimal({ precision: 5, scale: 2 }),
	priority: text().default('medium').notNull(),
	status: text().default('new').notNull(),
	reviewedBy: integer(),
	reviewedAt: timestamp({ mode: 'string' }),
	reviewNotes: text(),
	relatedEntityType: varchar({ length: 100 }),
	relatedEntityId: integer(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const aiSuggestions = pgTable("ai_suggestions", {
	id: serial().notNull(),
	userId: integer().notNull().references(() => users.id),
	suggestionType: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	titleAr: varchar({ length: 255 }),
	description: text(),
	descriptionAr: text(),
	suggestionData: jsonb("suggestion_data").notNull(),
	confidence: decimal({ precision: 5, scale: 2 }).notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	userFeedback: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	respondedAt: timestamp({ mode: 'string' }),
});

export const auditTrail = pgTable("auditTrail", {
	id: serial().notNull(),
	entityType: varchar({ length: 100 }).notNull(),
	entityId: integer().notNull(),
	action: text().notNull(),
	actionDescription: text(),
	kaiaDecision: text(),
	appliedRules: jsonb("applied_rules"),
	decisionReason: text(),
	decisionReasonAr: text(),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	performedBy: integer().notNull(),
	performedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
});

export const campaigns = pgTable("campaigns", {
	id: serial().notNull(),
	campaignName: varchar({ length: 200 }).notNull(),
	campaignNameAr: varchar({ length: 200 }),
	description: text(),
	descriptionAr: text(),
	type: text().notNull(),
	status: text().default('draft').notNull(),
	budget: decimal({ precision: 10, scale: 2 }),
	spent: decimal({ precision: 10, scale: 2 }).default('0.00').notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	impressions: integer().default(0).notNull(),
	clicks: integer().default(0).notNull(),
	conversions: integer().default(0).notNull(),
	revenue: decimal({ precision: 10, scale: 2 }).default('0.00').notNull(),
	aiOptimizationEnabled: integer().default(1).notNull(),
	lastOptimizedAt: timestamp({ mode: 'string' }),
	optimizationNotes: text(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }),
	targetAudience: jsonb("target_audience"),
	campaignConfig: jsonb("campaign_config"),
	createdBy: integer().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chatMessages", {
	id: serial().notNull(),
	userId: integer().notNull(),
	role: text().notNull(),
	content: text().notNull(),
	conversationId: varchar({ length: 100 }),
	parentMessageId: integer(),
	metadata: jsonb("metadata"),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const contentCalendar = pgTable("content_calendar", {
	id: serial().notNull(),
	createdBy: integer().notNull(),
	title: varchar({ length: 255 }).notNull(),
	titleAr: varchar({ length: 255 }),
	description: text(),
	contentType: text().notNull(),
	platform: varchar({ length: 100 }),
	scheduledDate: timestamp({ mode: 'string' }).notNull(),
	publishedDate: timestamp({ mode: 'string' }),
	status: text().default('draft').notNull(),
	content: text(),
	hashtags: jsonb("hashtags"),
	mediaFiles: jsonb("media_files"),
	views: integer().default(0),
	likes: integer().default(0),
	comments: integer().default(0),
	shares: integer().default(0),
	clicks: integer().default(0),
	engagementRate: varchar({ length: 10 }),
	relatedCampaignId: integer(),
	relatedProductId: integer(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const contentTemplates = pgTable("content_templates", {
	id: serial().notNull(),
	createdBy: integer().notNull(),
	templateName: varchar({ length: 255 }).notNull(),
	templateNameAr: varchar({ length: 255 }),
	description: text(),
	category: varchar({ length: 100 }),
	contentType: text().notNull(),
	templateContent: text().notNull(),
	placeholders: jsonb("placeholders"),
	usageCount: integer().default(0).notNull(),
	lastUsed: timestamp({ mode: 'string' }),
	isPublic: integer().default(0).notNull(),
	isActive: integer().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const dailySalesReports = pgTable("daily_sales_reports", {
	id: serial().notNull(),
	reportDate: timestamp("report_date", { mode: 'string' }).notNull(),
	nowOrdersCount: integer("now_orders_count").default(0),
	nowPiecesCount: integer("now_pieces_count").default(0),
	nowRevenue: decimal("now_revenue", { precision: 10, scale: 2 }).default('0'),
	oneOrdersCount: integer("one_orders_count").default(0),
	onePiecesCount: integer("one_pieces_count").default(0),
	oneRevenue: decimal("one_revenue", { precision: 10, scale: 2 }).default('0'),
	factoryOrdersCount: integer("factory_orders_count").default(0),
	factoryPiecesCount: integer("factory_pieces_count").default(0),
	factoryRevenue: decimal("factory_revenue", { precision: 10, scale: 2 }).default('0'),
	externalOrdersCount: integer("external_orders_count").default(0),
	externalPiecesCount: integer("external_pieces_count").default(0),
	externalRevenue: decimal("external_revenue", { precision: 10, scale: 2 }).default('0'),
	websiteOrdersCount: integer("website_orders_count").default(0),
	websitePiecesCount: integer("website_pieces_count").default(0),
	websiteRevenue: decimal("website_revenue", { precision: 10, scale: 2 }).default('0'),
	totalOrdersCount: integer("total_orders_count").default(0),
	totalPiecesCount: integer("total_pieces_count").default(0),
	totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default('0'),
	shippedOrdersCount: integer("shipped_orders_count").default(0),
	shippedPiecesCount: integer("shipped_pieces_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const documentVerificationLogs = pgTable("document_verification_logs", {
	id: serial().notNull(),
	employeeId: integer("employee_id").notNull(),
	documentId: integer("document_id"),
	verificationType: varchar("verification_type", { length: 100 }).notNull(),
	verificationResult: varchar("verification_result", { length: 50 }).notNull(),
	verificationScore: decimal("verification_score", { precision: 5, scale: 2 }),
	details: text(),
	errorMessage: text("error_message"),
	performedBy: integer("performed_by"),
	performedAt: timestamp("performed_at", { mode: 'string'}).notNull(),
});

export const dynamicIcons = pgTable("dynamic_icons", {
	id: serial().notNull(),
	userId: integer().notNull().references(() => users.id),
	iconName: varchar({ length: 100 }).notNull(),
	iconNameAr: varchar({ length: 100 }),
	iconEmoji: varchar({ length: 10 }).notNull(),
	taskType: varchar({ length: 100 }).notNull(),
	description: text(),
	descriptionAr: text(),
	actionConfig: jsonb("action_config").notNull(),
	usageCount: integer().default(0).notNull(),
	lastUsed: timestamp({ mode: 'string' }),
	isVisible: integer().default(1).notNull(),
	displayOrder: integer().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const employeeDocuments = pgTable("employee_documents", {
	id: serial().notNull(),
	employeeId: integer("employee_id").notNull(),
	documentType: varchar("document_type", { length: 100 }).notNull(),
	documentName: varchar("document_name", { length: 255 }).notNull(),
	fileUrl: text("file_url").notNull(),
	fileKey: varchar("file_key", { length: 500 }).notNull(),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type", { length: 100 }),
	isVerified: integer("is_verified").default(0),
	verificationStatus: varchar("verification_status", { length: 50 }).default('pending'),
	verificationScore: decimal("verification_score", { precision: 5, scale: 2 }),
	verificationNotes: text("verification_notes"),
	extractedData: text("extracted_data"),
	uploadedBy: integer("uploaded_by"),
	uploadedAt: timestamp("uploaded_at", { mode: 'string'}).notNull(),
	verifiedAt: timestamp("verified_at", { mode: 'string'}),
	verifiedBy: integer("verified_by"),
});

export const employeeMonthlyData = pgTable("employee_monthly_data", {
	id: serial().notNull(),
	accountId: integer("account_id").notNull().references(() => monthlyEmployeeAccounts.id),
	dataType: varchar("data_type", { length: 100 }).notNull(),
	dataJson: jsonb("data_json").notNull(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const employees = pgTable("employees", {
	id: serial().notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	nationalId: varchar("national_id", { length: 14 }).notNull(),
	dateOfBirth: varchar("date_of_birth", { length: 10 }),
	gender: varchar({ length: 10 }),
	religion: varchar({ length: 50 }),
	maritalStatus: varchar("marital_status", { length: 50 }),
	address: text(),
	governorate: varchar({ length: 100 }),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	email: varchar({ length: 255 }),
	jobTitle: varchar("job_title", { length: 255 }).notNull(),
	department: varchar({ length: 255 }).notNull(),
	salary: decimal({ precision: 10, scale: 2 }),
	hireDate: timestamp("hire_date", { mode: 'string'}).notNull(),
	contractType: varchar("contract_type", { length: 50 }),
	isActive: integer("is_active").default(1),
	documentsVerified: integer("documents_verified").default(0),
	verificationStatus: varchar("verification_status", { length: 50 }).default('pending'),
	verificationNotes: text("verification_notes"),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string'}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string'}),
	role: varchar({ length: 50 }).default('employee'),
	parentId: integer("parent_id"),
	childrenCount: integer("children_count").default(0),
},
(table) => [
	index("national_id").on(table.nationalId),
]);

export const ethicalRules = pgTable("ethicalRules", {
	id: serial().notNull(),
	ruleName: varchar({ length: 200 }).notNull(),
	ruleNameAr: varchar({ length: 200 }),
	ruleDescription: text().notNull(),
	ruleDescriptionAr: text(),
	ruleType: text().notNull(),
	category: varchar({ length: 100 }),
	severity: text().default('medium').notNull(),
	ruleLogic: jsonb("rule_logic").notNull(),
	isActive: integer().default(1).notNull(),
	autoApply: integer().default(1).notNull(),
	requiresReview: integer().default(0).notNull(),
	priority: integer().default(100).notNull(),
	referenceSource: text(),
	referenceSourceAr: text(),
	createdBy: integer().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const events = pgTable("events", {
	id: serial().notNull(),
	eventType: varchar({ length: 100 }).notNull(),
	eventName: varchar({ length: 200 }).notNull(),
	eventData: jsonb("event_data").notNull(),
	status: text().default('pending').notNull(),
	priority: integer().default(100).notNull(),
	processedBy: varchar({ length: 100 }),
	processedAt: timestamp({ mode: 'string' }),
	errorMessage: text(),
	retryCount: integer().default(0).notNull(),
	maxRetries: integer().default(3).notNull(),
	createdBy: integer(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const externalShipments = pgTable("external_shipments", {
	id: serial().notNull(),
	shippingCompany: varchar("shipping_company", { length: 50 }).notNull(),
	trackingNumber: varchar("tracking_number", { length: 100 }),
	orderNumber: varchar("order_number", { length: 100 }),
	customerName: varchar("customer_name", { length: 255 }),
	customerPhone: varchar("customer_phone", { length: 50 }),
	quantity: integer().default(0),
	amount: decimal({ precision: 10, scale: 2 }).default('0'),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	shipmentDate: date("shipment_date", { mode: 'string' }),
	status: varchar({ length: 50 }).default('pending'),
	fileSource: varchar("file_source", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("idx_company").on(table.shippingCompany),
	index("idx_date").on(table.shipmentDate),
	index("idx_tracking").on(table.trackingNumber),
	index("idx_order").on(table.orderNumber),
]);

export const factoryBatches = pgTable("factory_batches", {
	id: serial().notNull(),
	batchNumber: varchar("batch_number", { length: 100 }).notNull(),
	productId: integer("product_id").notNull().references(() => products.id),
	quantity: integer().notNull(),
	supplierPrice: decimal("supplier_price", { precision: 10, scale: 2 }).notNull(),
	totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
	deliveryDate: timestamp("delivery_date", { mode: 'string' }),
	status: varchar({ length: 50 }).default('pending').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const founderAccounts = pgTable("founder_accounts", {
	id: serial().notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	username: varchar({ length: 100 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	role: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }),
	isActive: integer("is_active").default(1).notNull(),
	currentMonth: varchar("current_month", { length: 7 }).notNull(),
	passwordExpiresAt: timestamp("password_expires_at", { mode: 'string' }).notNull(),
	lastPasswordChangeAt: timestamp("last_password_change_at", { mode: 'string' }).defaultNow(),
	permissions: jsonb("permissions"),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	lastLoginIp: varchar("last_login_ip", { length: 45 }),
	loginCount: integer("login_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("email").on(table.email),
	index("username").on(table.username),
]);

export const founderLoginHistory = pgTable("founder_login_history", {
	id: serial().notNull(),
	founderId: integer("founder_id").notNull().references(() => founderAccounts.id),
	loginAt: timestamp("login_at", { mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	success: integer().notNull(),
	failureReason: varchar("failure_reason", { length: 255 }),
	sessionId: varchar("session_id", { length: 255 }),
	sessionDuration: integer("session_duration"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const googleDriveFiles = pgTable("google_drive_files", {
	id: serial().notNull(),
	userId: integer().notNull().references(() => users.id),
	fileName: varchar({ length: 255 }).notNull(),
	fileType: varchar({ length: 50 }).notNull(),
	filePath: text().notNull(),
	shareableLink: text(),
	purpose: varchar({ length: 255 }),
	metadata: jsonb("metadata"),
	createdBy: integer().notNull().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastModified: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const imageEmbeddings = pgTable("image_embeddings", {
	id: serial().notNull(),
	imageId: integer("image_id").notNull().references(() => productImages.id),
	embeddingVector: text("embedding_vector").notNull(),
	modelName: varchar("model_name", { length: 100 }).notNull(),
	modelVersion: varchar("model_version", { length: 50 }).notNull(),
	vectorDimensions: integer("vector_dimensions").notNull(),
	processingTime: integer("processing_time"),
	confidence: decimal({ precision: 5, scale: 4 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("image_id_idx").on(table.imageId),
	index("model_idx").on(table.modelName, table.modelVersion),
]);

export const inventory = pgTable("inventory", {
	id: serial().notNull(),
	productId: integer("product_id").notNull().references(() => products.id),
	size: varchar({ length: 10 }),
	color: varchar({ length: 50 }),
	quantity: integer().default(0).notNull(),
	minStockLevel: integer("min_stock_level").default(10),
	location: varchar({ length: 100 }),
	lastRestocked: timestamp("last_restocked", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const monthlyEmployeeAccounts = pgTable("monthly_employee_accounts", {
	id: serial().notNull(),
	employeeName: varchar("employee_name", { length: 255 }).notNull(),
	username: varchar({ length: 100 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	month: varchar({ length: 7 }).notNull(),
	isActive: integer("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	email: varchar({ length: 255 }),
	emailVerified: integer("email_verified").default(0),
	otpCode: varchar("otp_code", { length: 6 }),
	otpExpiresAt: timestamp("otp_expires_at", { mode: 'string' }),
	otpAttempts: integer("otp_attempts").default(0),
},
(table) => [
	index("monthly_emp_accounts_username").on(table.username),
]);

export const notifications = pgTable("notifications", {
	id: serial().notNull(),
	userId: integer().notNull(),
	type: text().default('info').notNull(),
	title: varchar({ length: 200 }).notNull(),
	titleAr: varchar({ length: 200 }),
	message: text().notNull(),
	messageAr: text(),
	relatedEntityType: varchar({ length: 100 }),
	relatedEntityId: integer(),
	isRead: integer().default(0).notNull(),
	readAt: timestamp({ mode: 'string' }),
	metadata: jsonb("metadata"),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
	id: serial().notNull(),
	orderId: integer("order_id").notNull().references(() => orders.id),
	productId: integer("product_id").notNull().references(() => products.id),
	size: varchar({ length: 10 }),
	color: varchar({ length: 50 }),
	quantity: integer().default(1).notNull(),
	unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
	subtotal: decimal({ precision: 10, scale: 2 }).notNull(),
});

export const orderStatusHistory = pgTable("order_status_history", {
	id: serial().notNull(),
	orderId: integer("order_id").notNull().references(() => orders.id),
	oldStatus: varchar("old_status", { length: 50 }),
	newStatus: varchar("new_status", { length: 50 }).notNull(),
	changedBy: integer("changed_by"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const orders = pgTable("orders", {
	id: serial().notNull(),
	orderNumber: varchar({ length: 50 }).notNull(),
	customerName: varchar({ length: 200 }).notNull(),
	customerEmail: varchar({ length: 320 }),
	customerPhone: varchar({ length: 20 }),
	productName: varchar({ length: 300 }).notNull(),
	productDescription: text(),
	quantity: integer().default(1).notNull(),
	unitPrice: decimal({ precision: 10, scale: 2 }).notNull(),
	totalAmount: decimal({ precision: 10, scale: 2 }).notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	status: text().default('pending').notNull(),
	paymentStatus: text().default('pending').notNull(),
	shippingAddress: text(),
	notes: text(),
	createdBy: integer().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("orders_orderNumber_unique").on(table.orderNumber),
]);

export const otpVerifications = pgTable("otp_verifications", {
	id: serial().notNull(),
	employeeId: integer("employee_id"),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	email: varchar({ length: 255 }),
	otpCode: varchar("otp_code", { length: 6 }).notNull(),
	method: text().default('email').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string'}).notNull(),
	verifiedAt: timestamp("verified_at", { mode: 'string'}),
	latitude: decimal({ precision: 10, scale: 8 }),
	longitude: decimal({ precision: 11, scale: 8 }),
	ipAddress: varchar("ip_address", { length: 45 }),
	verificationAttempts: integer("verification_attempts").default(0),
	createdAt: timestamp("created_at", { mode: 'string'}).defaultNow(),
},
(table) => [
	index("idx_phone").on(table.phoneNumber),
	index("idx_email").on(table.email),
	index("idx_otp").on(table.otpCode),
	index("idx_expires").on(table.expiresAt),
]);

export const productBarcodes = pgTable("product_barcodes", {
	id: serial().notNull(),
	productId: integer("product_id").notNull().references(() => products.id),
	barcodeType: varchar("barcode_type", { length: 50 }).notNull(),
	barcodeValue: varchar("barcode_value", { length: 255 }).notNull(),
	size: varchar({ length: 10 }),
	color: varchar({ length: 50 }),
	isActive: integer("is_active").default(1),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("product_id_idx").on(table.productId),
	index("barcode_value_idx").on(table.barcodeValue),
	index("barcode_value").on(table.barcodeValue),
]);

export const productImageRequests = pgTable("product_image_requests", {
	id: serial().notNull(),
	requestNumber: varchar({ length: 50 }).notNull(),
	requestedBy: integer().notNull(),
	productName: varchar({ length: 255 }).notNull(),
	productDescription: text(),
	productSku: varchar({ length: 100 }),
	imageType: text().notNull(),
	quantity: integer().default(1).notNull(),
	specifications: jsonb("specifications"),
	urgency: text().default('medium').notNull(),
	deadline: timestamp({ mode: 'string' }),
	notes: text(),
	status: text().default('pending').notNull(),
	assignedTo: integer(),
	assignedAt: timestamp({ mode: 'string' }),
	completedImages: jsonb("completed_images"),
	completedAt: timestamp({ mode: 'string' }),
	rating: integer(),
	feedback: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("product_image_requests_requestNumber_unique").on(table.requestNumber),
]);

export const productImages = pgTable("product_images", {
	id: serial().notNull(),
	productId: integer("product_id").notNull().references(() => products.id),
	s3Url: varchar("s3_url", { length: 500 }).notNull(),
	s3Key: varchar("s3_key", { length: 255 }).notNull(),
	imageType: varchar("image_type", { length: 50 }).default('product').notNull(),
	isPrimary: integer("is_primary").default(0),
	sortOrder: integer("sort_order").default(0),
	originalUrl: varchar("original_url", { length: 500 }),
	width: integer(),
	height: integer(),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type", { length: 50 }),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("product_images_product_id_idx").on(table.productId),
	index("product_images_is_primary_idx").on(table.isPrimary),
]);

export const productSizeCharts = pgTable("product_size_charts", {
	id: serial().notNull(),
	productId: integer("product_id").notNull().references(() => products.id),
	size: varchar({ length: 10 }).notNull(),
	lengthCm: decimal("length_cm", { precision: 5, scale: 2 }),
	widthCm: decimal("width_cm", { precision: 5, scale: 2 }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const products = pgTable("products", {
	id: serial().notNull(),
	modelCode: varchar("model_code", { length: 50 }).notNull(),
	supplierPrice: decimal("supplier_price", { precision: 10, scale: 2 }).notNull(),
	sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }),
	category: varchar({ length: 50 }),
	isActive: integer("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("products_model_code_unique").on(table.modelCode),
]);

export const replacements = pgTable("replacements", {
	id: serial().notNull(),
	originalOrderId: integer("original_order_id").notNull().references(() => orders.id),
	newOrderId: integer("new_order_id").references(() => orders.id),
	reason: text().notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
});

export const reports = pgTable("reports", {
	id: serial().notNull(),
	reportName: varchar({ length: 200 }).notNull(),
	reportNameAr: varchar({ length: 200 }),
	reportType: text().notNull(),
	description: text(),
	descriptionAr: text(),
	reportConfig: jsonb("report_config").notNull(),
	reportData: jsonb("report_data"),
	isScheduled: integer().default(0).notNull(),
	scheduleFrequency: text(),
	nextRunAt: timestamp({ mode: 'string' }),
	lastRunAt: timestamp({ mode: 'string' }),
	status: text().default('draft').notNull(),
	createdBy: integer().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const returns = pgTable("returns", {
	id: serial().notNull(),
	shipmentId: integer("shipment_id").notNull().references(() => shipments.id),
	orderId: integer("order_id").notNull().references(() => orders.id),
	returnReason: varchar("return_reason", { length: 255 }).notNull(),
	returnDate: timestamp("return_date", { mode: 'string' }),
	refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
	status: varchar({ length: 50 }).default('pending').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// Old shipments table removed - replaced with comprehensive shipping system below

export const shopifyConfig = pgTable("shopify_config", {
	id: serial().notNull(),
	storeName: varchar("store_name", { length: 255 }).notNull(),
	accessToken: text("access_token").notNull(),
	apiVersion: varchar("api_version", { length: 50 }).default('2025-10').notNull(),
	isActive: integer("is_active").default(1).notNull(),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	autoSyncEnabled: integer("auto_sync_enabled").default(1).notNull(),
	syncIntervalMinutes: integer("sync_interval_minutes").default(15).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const shopifyOrders = pgTable("shopify_orders", {
	id: serial().notNull(),
	shopifyOrderId: varchar("shopify_order_id", { length: 255 }).notNull(),
	localOrderId: integer("local_order_id").references(() => orders.id),
	orderNumber: integer("order_number"),
	orderName: varchar("order_name", { length: 100 }),
	email: varchar({ length: 320 }),
	phone: varchar({ length: 20 }),
	totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
	subtotalPrice: decimal("subtotal_price", { precision: 10, scale: 2 }),
	totalTax: decimal("total_tax", { precision: 10, scale: 2 }),
	totalShipping: decimal("total_shipping", { precision: 10, scale: 2 }),
	currency: varchar({ length: 10 }).default('EGP'),
	financialStatus: text(),
	fulfillmentStatus: text(),
	customerData: jsonb("customer_data"),
	shippingAddress: jsonb("shipping_address"),
	lineItems: jsonb("line_items"),
	syncStatus: text().default('pending').notNull(),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	syncError: text("sync_error"),
	trackingNumber: varchar("tracking_number", { length: 255 }),
	trackingCompany: varchar("tracking_company", { length: 100 }),
	trackingUrl: text("tracking_url"),
	fulfilledAt: timestamp("fulfilled_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("shopify_order_id").on(table.shopifyOrderId),
]);

export const shopifyProducts = pgTable("shopify_products", {
	id: serial().notNull(),
	shopifyProductId: varchar("shopify_product_id", { length: 255 }).notNull(),
	localProductId: integer("local_product_id").references(() => products.id),
	title: varchar({ length: 500 }),
	bodyHtml: text("body_html"),
	vendor: varchar({ length: 255 }),
	productType: varchar("product_type", { length: 255 }),
	handle: varchar({ length: 255 }),
	tags: text(),
	syncStatus: text().default('pending').notNull(),
	syncDirection: text().default('bidirectional'),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	syncError: text("sync_error"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("shopify_product_id").on(table.shopifyProductId),
]);

export const shopifySyncLogs = pgTable("shopify_sync_logs", {
	id: serial().notNull(),
	syncType: text().notNull(),
	direction: text().notNull(),
	status: text().notNull(),
	itemsProcessed: integer("items_processed").default(0),
	itemsSucceeded: integer("items_succeeded").default(0),
	itemsFailed: integer("items_failed").default(0),
	errorMessage: text("error_message"),
	errorDetails: jsonb("error_details"),
	duration: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const shopifyVariants = pgTable("shopify_variants", {
	id: serial().notNull(),
	shopifyVariantId: varchar("shopify_variant_id", { length: 255 }).notNull(),
	shopifyProductId: varchar("shopify_product_id", { length: 255 }).notNull(),
	localVariantId: integer("local_variant_id"),
	title: varchar({ length: 255 }),
	price: decimal({ precision: 10, scale: 2 }),
	compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
	sku: varchar({ length: 255 }),
	barcode: varchar({ length: 255 }),
	inventoryQuantity: integer("inventory_quantity").default(0),
	inventoryItemId: varchar("inventory_item_id", { length: 255 }),
	option1: varchar({ length: 255 }),
	option2: varchar({ length: 255 }),
	option3: varchar({ length: 255 }),
	syncStatus: text().default('pending').notNull(),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("shopify_variant_id").on(table.shopifyVariantId),
]);

export const shopifyWebhookLogs = pgTable("shopify_webhook_logs", {
	id: serial().notNull(),
	topic: varchar({ length: 100 }).notNull(),
	shopifyId: varchar("shopify_id", { length: 255 }),
	payload: jsonb("payload").notNull(),
	headers: jsonb("headers"),
	processed: integer().default(0).notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	error: text(),
	retryCount: integer("retry_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const stockAlerts = pgTable("stock_alerts", {
	id: serial().notNull(),
	inventoryId: integer("inventory_id").notNull().references(() => inventory.id),
	alertType: varchar("alert_type", { length: 50 }).notNull(),
	message: text().notNull(),
	isResolved: integer("is_resolved").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
});

export const subscriptions = pgTable("subscriptions", {
	id: serial().notNull(),
	subscriptionNumber: varchar({ length: 50 }).notNull(),
	userId: integer().notNull(),
	planName: varchar({ length: 200 }).notNull(),
	planDescription: text(),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	billingCycle: text().notNull(),
	status: text().default('active').notNull(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }),
	nextBillingDate: timestamp({ mode: 'string' }),
	cancelledAt: timestamp({ mode: 'string' }),
	paymentMethod: varchar({ length: 50 }),
	lastPaymentDate: timestamp({ mode: 'string' }),
	lastPaymentAmount: decimal({ precision: 10, scale: 2 }),
	shariaCompliant: integer().default(1).notNull(),
	metadata: jsonb("metadata"),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("subscriptions_subscriptionNumber_unique").on(table.subscriptionNumber),
]);

export const taskPatterns = pgTable("task_patterns", {
	id: serial().notNull(),
	userId: integer().notNull().references(() => users.id),
	taskType: varchar({ length: 100 }).notNull(),
	taskName: varchar({ length: 255 }).notNull(),
	taskNameAr: varchar({ length: 255 }),
	frequency: integer().default(0).notNull(),
	lastUsed: timestamp({ mode: 'string' }).defaultNow().notNull(),
	avgTimeSpent: integer(),
	confidence: decimal({ precision: 5, scale: 2 }).default('0.00'),
	suggestedIcon: varchar({ length: 50 }),
	isActive: integer().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
	id: serial().notNull(),
	transactionNumber: varchar({ length: 50 }).notNull(),
	type: text().notNull(),
	category: varchar({ length: 100 }),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	description: text(),
	relatedOrderId: integer(),
	relatedSubscriptionId: integer(),
	paymentMethod: varchar({ length: 50 }),
	status: text().default('pending').notNull(),
	shariaCompliant: integer().default(1).notNull(),
	ethicalCheckStatus: text().default('pending').notNull(),
	ethicalCheckNotes: text(),
	ethicalCheckBy: integer(),
	ethicalCheckAt: timestamp({ mode: 'string' }),
	metadata: jsonb("metadata"),
	createdBy: integer().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("transactions_transactionNumber_unique").on(table.transactionNumber),
]);

export const userBehavior = pgTable("user_behavior", {
	id: serial().notNull(),
	userId: integer().notNull().references(() => users.id),
	actionType: varchar({ length: 100 }).notNull(),
	actionData: jsonb("action_data"),
	context: jsonb("context"),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
	id: serial().notNull(),
	userId: integer().notNull().references(() => users.id),
	preferredLanguage: varchar({ length: 10 }).default('ar').notNull(),
	theme: varchar({ length: 20 }).default('light').notNull(),
	notificationsEnabled: integer().default(1).notNull(),
	autoSuggestIcons: integer().default(1).notNull(),
	customSettings: jsonb("custom_settings"),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("userId").on(table.userId),
]);

export const investors = pgTable("investors", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	company: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	passwordHash: varchar({ length: 255 }).notNull(),
	status: text().default('active').notNull(),
	investmentInterest: decimal({ precision: 15, scale: 2 }),
	notes: text(),
	createdBy: integer().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastLoginAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("investors_email_unique").on(table.email),
]);

export const investorActivity = pgTable("investor_activity", {
	id: serial().notNull(),
	investorId: integer().notNull().references(() => investors.id),
	actionType: text().notNull(),
	pagePath: varchar({ length: 500 }),
	pageTitle: varchar({ length: 255 }),
	timeSpent: integer().default(0),
	actionData: jsonb("action_data"),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("investor_activity_investor_id").on(table.investorId),
	index("investor_activity_action_type").on(table.actionType),
]);

export const users = pgTable("users", {
	id: serial().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: text().default('user').notNull(),
	permissions: jsonb("permissions"),
	isActive: integer().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

export const visualSearchHistory = pgTable("visual_search_history", {
	id: serial().notNull(),
	searchImageUrl: varchar("search_image_url", { length: 500 }),
	searchImageS3Key: varchar("search_image_s3_key", { length: 255 }),
	topResultProductId: integer("top_result_product_id").references(() => products.id),
	topResultSimilarity: decimal("top_result_similarity", { precision: 5, scale: 4 }),
	totalResults: integer("total_results"),
	userId: integer("user_id"),
	userRole: varchar("user_role", { length: 50 }),
	searchContext: varchar("search_context", { length: 100 }),
	searchDuration: integer("search_duration"),
	wasHelpful: integer("was_helpful"),
	selectedProductId: integer("selected_product_id").references(() => products.id),
	searchedAt: timestamp("searched_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("searched_at_idx").on(table.searchedAt),
	index("user_id_idx").on(table.userId),
	index("context_idx").on(table.searchContext),
]);

// ============================================
// SHIPPING & LOGISTICS SYSTEM
// ============================================

export const shippingCompanies = pgTable("shipping_companies", {
  id: serial().primaryKey(),
  name: varchar({ length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }),
  code: varchar({ length: 50 }).notNull().unique(),
  active: integer().default(1).notNull(),
  zonesConfig: jsonb("zones_config").notNull(), // Zone pricing configuration
  codFeeConfig: jsonb("cod_fee_config"), // COD fee configuration
  insuranceFeeConfig: jsonb("insurance_fee_config"), // Insurance configuration
  returnFeePercentage: decimal("return_fee_percentage", { precision: 5, scale: 2 }).default('40.00'),
  exchangeFeePercentage: decimal("exchange_fee_percentage", { precision: 5, scale: 2 }).default('150.00'),
  bankTransfersPerWeek: integer("bank_transfers_per_week").default(3),
  notes: text(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const shippingZones = pgTable("shipping_zones", {
  id: serial().primaryKey(),
  companyId: integer("company_id").notNull().references(() => shippingCompanies.id),
  zoneName: varchar("zone_name", { length: 50 }).notNull(),
  zoneNumber: integer("zone_number").notNull(),
  basePriceUpTo3Kg: decimal("base_price_up_to_3kg", { precision: 10, scale: 2 }).notNull(),
  additionalKgPrice: decimal("additional_kg_price", { precision: 10, scale: 2 }).notNull(),
  areas: jsonb("areas").notNull(), // Array of governorates/cities
  active: integer().default(1).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const shipments = pgTable("shipments", {
  id: serial().primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  companyId: integer("company_id").notNull().references(() => shippingCompanies.id),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  zoneId: integer("zone_id").notNull().references(() => shippingZones.id),
  weight: decimal({ precision: 10, scale: 2 }).notNull(), // in KG
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull(),
  codFee: decimal("cod_fee", { precision: 10, scale: 2 }).default('0.00'),
  insuranceFee: decimal("insurance_fee", { precision: 10, scale: 2 }).default('0.00'),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  status: text().default('pending').notNull(),
  shippedAt: timestamp("shipped_at", { mode: 'string' }),
  deliveredAt: timestamp("delivered_at", { mode: 'string' }),
  returnedAt: timestamp("returned_at", { mode: 'string' }),
  returnReason: text("return_reason"),
  notes: text(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const shipmentReturns = pgTable("shipment_returns", {
  id: serial().primaryKey(),
  shipmentId: integer("shipment_id").notNull().references(() => shipments.id),
  returnType: text().notNull(),
  returnReason: text("return_reason"),
  returnCost: decimal("return_cost", { precision: 10, scale: 2 }).notNull(),
  status: text().default('pending').notNull(),
  receivedAt: timestamp("received_at", { mode: 'string' }),
  processedBy: integer("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at", { mode: 'string' }),
  notes: text(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

// ============================================
// COLLECTIONS & PAYMENTS SYSTEM
// ============================================

export const collections = pgTable("collections", {
  id: serial().primaryKey(),
  collectionType: text().notNull(),
  companyId: integer("company_id").notNull().references(() => shippingCompanies.id),
  amount: decimal({ precision: 10, scale: 2 }).notNull(),
  collectionDate: date("collection_date").notNull(),
  receiptNumber: varchar("receipt_number", { length: 100 }),
  bankReference: varchar("bank_reference", { length: 100 }),
  status: text().default('pending').notNull(),
  notes: text(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  confirmedBy: integer("confirmed_by").references(() => users.id),
  confirmedAt: timestamp("confirmed_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const collectionItems = pgTable("collection_items", {
  id: serial().primaryKey(),
  collectionId: integer("collection_id").notNull().references(() => collections.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  amount: decimal({ precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

// ============================================
// OPERATIONAL KPIs & METRICS
// ============================================

export const dailyOperationalMetrics = pgTable("daily_operational_metrics", {
  id: serial().primaryKey(),
  date: date().notNull().unique(),
  
  // Orders
  ordersCreated: integer("orders_created").default(0).notNull(),
  ordersCreatedValue: decimal("orders_created_value", { precision: 10, scale: 2 }).default('0.00').notNull(),
  ordersConfirmed: integer("orders_confirmed").default(0).notNull(),
  ordersConfirmedValue: decimal("orders_confirmed_value", { precision: 10, scale: 2 }).default('0.00').notNull(),
  ordersShipped: integer("orders_shipped").default(0).notNull(),
  ordersShippedValue: decimal("orders_shipped_value", { precision: 10, scale: 2 }).default('0.00').notNull(),
  ordersReturned: integer("orders_returned").default(0).notNull(),
  ordersReturnedValue: decimal("orders_returned_value", { precision: 10, scale: 2 }).default('0.00').notNull(),
  ordersDelivered: integer("orders_delivered").default(0).notNull(),
  ordersDeliveredValue: decimal("orders_delivered_value", { precision: 10, scale: 2 }).default('0.00').notNull(),
  
  // Collections
  totalCollection: decimal("total_collection", { precision: 10, scale: 2 }).default('0.00').notNull(),
  cashCollection: decimal("cash_collection", { precision: 10, scale: 2 }).default('0.00').notNull(),
  bankCollection: decimal("bank_collection", { precision: 10, scale: 2 }).default('0.00').notNull(),
  
  // Expenses
  operatingExpenses: decimal("operating_expenses", { precision: 10, scale: 2 }).default('0.00').notNull(),
  adSpend: decimal("ad_spend", { precision: 10, scale: 2 }).default('0.00').notNull(),
  treasuryPaid: decimal("treasury_paid", { precision: 10, scale: 2 }).default('0.00').notNull(),
  
  // KPIs (calculated)
  tcr: decimal({ precision: 5, scale: 2 }).default('0.00'), // Collection ÷ Created Orders
  tcc: decimal({ precision: 5, scale: 2 }).default('0.00'), // Collection ÷ Confirmed Orders
  tcs: decimal({ precision: 5, scale: 2 }).default('0.00'), // Collection ÷ Shipped Orders
  tcrn: decimal({ precision: 5, scale: 2 }).default('0.00'), // Collection ÷ Net Shipments (after returns)
  ocr: decimal({ precision: 5, scale: 2 }).default('0.00'), // Operating Expenses ÷ Collection
  adr: decimal({ precision: 5, scale: 2 }).default('0.00'), // Ad Spend ÷ Collection
  fdr: decimal({ precision: 5, scale: 2 }).default('0.00'), // Treasury Paid ÷ Collection
  
  calculatedAt: timestamp("calculated_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

// ============================================
// AD CAMPAIGN PERFORMANCE
// ============================================

export const adCampaignPerformance = pgTable("ad_campaign_performance", {
  id: serial().primaryKey(),
  date: date().notNull(),
  campaignName: varchar("campaign_name", { length: 200 }).notNull(),
  platform: text().notNull(),
  spend: decimal({ precision: 10, scale: 2 }).notNull(),
  results: integer().default(0).notNull(),
  costPerResult: decimal("cost_per_result", { precision: 10, scale: 4 }).notNull(),
  reach: integer().default(0),
  impressions: integer().default(0),
  clicks: integer().default(0),
  conversions: integer().default(0),
  messagesStarted: integer("messages_started").default(0),
  costPerMessage: decimal("cost_per_message", { precision: 10, scale: 2 }),
  active: integer().default(1).notNull(),
  notes: text(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

// ============================================
// EXPECTED REVENUE CALCULATOR
// ============================================

export const revenueForecasts = pgTable("revenue_forecasts", {
  id: serial().primaryKey(),
  date: date().notNull(),
  adSpend: decimal("ad_spend", { precision: 10, scale: 2 }).notNull(),
  lastCampaignEfficiency: decimal("last_campaign_efficiency", { precision: 10, scale: 4 }).notNull(), // Cost per result
  expectedOrders: integer("expected_orders").notNull(),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).notNull(),
  shipmentRate: decimal("shipment_rate", { precision: 5, scale: 2 }).notNull(), // % of orders actually shipped
  deliverySuccessRate: decimal("delivery_success_rate", { precision: 5, scale: 2 }).notNull(), // % delivered after returns
  expectedRevenue: decimal("expected_revenue", { precision: 10, scale: 2 }).notNull(),
  actualRevenue: decimal("actual_revenue", { precision: 10, scale: 2 }),
  variance: decimal({ precision: 10, scale: 2 }),
  variancePercentage: decimal("variance_percentage", { precision: 5, scale: 2 }),
  notes: text(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});


// ============================================
// PHASE 5: COD TRACKING SYSTEM
// ============================================

// 1. جدول شركات الشحن
export const shippingPartners = pgTable("shipping_partners", {
  id: serial().primaryKey(),
  name: varchar({ length: 50 }).notNull().unique(), // 'bosta', 'aramex', 'mylerz', 'gt_express'
  displayName: varchar("display_name", { length: 100 }).notNull(),
  logo: varchar({ length: 255 }),
  
  // التغطية الجغرافية (JSON Format)
  coverage: jsonb("coverage").$type<{
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
  
  // الأداء
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default('95.00'),
  totalShipments: integer("total_shipments").default(0),
  successfulDeliveries: integer("successful_deliveries").default(0),
  avgDeliveryTime: decimal("avg_delivery_time", { precision: 4, scale: 1 }).default('3.0'),
  complaintRate: decimal("complaint_rate", { precision: 4, scale: 2 }).default('0.02'),
  rating: decimal({ precision: 3, scale: 2 }).default('4.00'),
  
  // السعة
  dailyLimit: integer("daily_limit").default(1000),
  currentLoad: integer("current_load").default(0),
  peakHours: jsonb("peak_hours").$type<string[]>().default('[]'),
  
  // الجوانب المالية
  codFeePercentage: decimal("cod_fee_percentage", { precision: 5, scale: 2 }).default('2.50'),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default('25.00'),
  codFeeFixed: decimal("cod_fee_fixed", { precision: 10, scale: 2 }).default('5.00'),
  settlementDays: integer("settlement_days").default(7),
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).default('50000.00'),
  
  // إعدادات التوزيع
  allocationWeight: decimal("allocation_weight", { precision: 3, scale: 2 }).default('1.00'),
  priority: integer().default(1),
  autoAssign: integer("auto_assign").default(1),
  maxDailyAssignments: integer("max_daily_assignments").default(200),
  
  // حالة النشاط
  active: integer().default(1),
  suspended: integer().default(0),
  suspensionReason: text("suspension_reason"),
  
  // معلومات الاتصال
  accountManager: varchar("account_manager", { length: 100 }),
  phone: varchar({ length: 20 }),
  email: varchar({ length: 100 }),
  apiCredentials: jsonb("api_credentials").$type<{
    apiKey?: string;
    apiSecret?: string;
    baseUrl?: string;
  }>(),
  
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

// 2. جدول طلبات COD
export const codOrders = pgTable("cod_orders", {
  id: serial().primaryKey(),
  orderId: varchar("order_id", { length: 50 }).notNull().unique(),
  
  // معلومات العميل
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerEmail: varchar("customer_email", { length: 100 }),
  
  // العنوان
  shippingAddress: jsonb("shipping_address").$type<{
    governorate: string;
    city: string;
    area: string;
    street: string;
    building: string;
    floor: string;
    apartment: string;
    notes?: string;
  }>().notNull(),
  
  // المبلغ
  orderAmount: decimal("order_amount", { precision: 10, scale: 2 }).notNull(),
  codAmount: decimal("cod_amount", { precision: 10, scale: 2 }).notNull(),
  
  // مراحل COD (8 مراحل)
  stages: jsonb("stages").$type<{
    customerService?: {
      agentId: string;
      confirmed: boolean;
      callTimestamp: string | null;
      notes: string;
    };
    confirmation?: {
      agentId: string;
      called: boolean;
      confirmed: boolean;
      callTimestamp: string | null;
      customerNotes: string;
    };
    preparation?: {
      warehouseId: string;
      prepared: boolean;
      preparedAt: string | null;
      itemsReady: boolean;
      notes: string;
    };
    supplier?: {
      supplierId: string;
      supplied: boolean;
      suppliedAt: string | null;
      supplierNotes: string;
    };
    shipping?: {
      partnerId: number;
      pickedUp: boolean;
      pickedUpAt: string | null;
      driverName: string;
      trackingNumber: string;
    };
    delivery?: {
      delivered: boolean;
      deliveredAt: string | null;
      receiverName: string;
      receiverPhone: string;
      deliveryNotes: string;
    };
    collection?: {
      collected: boolean;
      collectedAt: string | null;
      collectedAmount: string;
      receiptNumber: string;
      collectionNotes: string;
    };
    settlement?: {
      settled: boolean;
      settledAt: string | null;
      transferDate: string | null;
      bankReference: string;
      settlementNotes: string;
    };
  }>().default('{}'),
  
  // التتبع
  currentStage: varchar("current_stage", { length: 50 }).default('pending'),
  status: text().default('pending'),
  
  // تخصيص الشحن
  shippingPartnerId: integer("shipping_partner_id").references(() => shippingPartners.id),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  
  // المواعيد
  estimatedDelivery: timestamp("estimated_delivery", { mode: 'string' }),
  actualDelivery: timestamp("actual_delivery", { mode: 'string' }),
  
  // إشعارات
  notifications: jsonb("notifications").$type<Array<{
    type: string;
    sentAt: string;
    channel: 'sms' | 'email' | 'whatsapp';
    status: 'sent' | 'failed' | 'pending';
  }>>().default('[]'),
  
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => [
  index("cod_orders_order_id").on(table.orderId),
  index("cod_orders_customer_phone").on(table.customerPhone),
  index("cod_orders_status").on(table.status),
  index("cod_orders_current_stage").on(table.currentStage),
]);

// 3. جدول تخصيص الشحن
export const shippingAllocations = pgTable("shipping_allocations", {
  id: serial().primaryKey(),
  codOrderId: integer("cod_order_id").references(() => codOrders.id),
  shippingPartnerId: integer("shipping_partner_id").references(() => shippingPartners.id),
  
  allocationScore: decimal("allocation_score", { precision: 5, scale: 2 }),
  allocationReason: text("allocation_reason"),
  
  // حالة الشحنة
  shipmentStatus: varchar("shipment_status", { length: 30 }).default('pending'),
  apiResponse: jsonb("api_response"),
  
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

// 4. جدول سجل التتبع
export const trackingLogs = pgTable("tracking_logs", {
  id: serial().primaryKey(),
  codOrderId: integer("cod_order_id").references(() => codOrders.id),
  shippingPartnerId: integer("shipping_partner_id").references(() => shippingPartners.id),
  
  stage: varchar({ length: 50 }).notNull(),
  status: varchar({ length: 30 }).notNull(),
  description: text(),
  agentId: varchar("agent_id", { length: 50 }),
  
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
  index("tracking_logs_cod_order_id").on(table.codOrderId),
  index("tracking_logs_stage").on(table.stage),
]);

// 5. جدول الفال باك
export const fallbackLogs = pgTable("fallback_logs", {
  id: serial().primaryKey(),
  originalPartnerId: integer("original_partner_id").references(() => shippingPartners.id),
  newPartnerId: integer("new_partner_id").references(() => shippingPartners.id),
  codOrderId: integer("cod_order_id").references(() => codOrders.id),
  
  reason: varchar({ length: 100 }).notNull(),
  details: jsonb("details"),
  
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});


// ============================================
// EGYPT ADMINISTRATIVE DIVISIONS
// ============================================

// Egypt Governorates (27)
export const egyptGovernorates = pgTable("egypt_governorates", {
  code: varchar({ length: 10 }).primaryKey(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  latitude: decimal({ precision: 10, scale: 7 }),
  longitude: decimal({ precision: 10, scale: 7 }),
  areaSqkm: decimal("area_sqkm", { precision: 10, scale: 2 }),
});

// Egypt Centers (365)
export const egyptCenters = pgTable("egypt_centers", {
  code: varchar({ length: 10 }).primaryKey(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  governorateCode: varchar("governorate_code", { length: 10 }).references(() => egyptGovernorates.code),
  governorateName: varchar("governorate_name", { length: 100 }),
  latitude: decimal({ precision: 10, scale: 7 }),
  longitude: decimal({ precision: 10, scale: 7 }),
  areaSqkm: decimal("area_sqkm", { precision: 10, scale: 2 }),
});

// Egypt Cities/Points (6,109)
export const egyptCities = pgTable("egypt_cities", {
  code: varchar({ length: 15 }).primaryKey(),
  nameEn: varchar("name_en", { length: 150 }).notNull(),
  nameAr: varchar("name_ar", { length: 150 }).notNull(),
  centerCode: varchar("center_code", { length: 10 }).references(() => egyptCenters.code),
  centerName: varchar("center_name", { length: 100 }),
  governorateName: varchar("governorate_name", { length: 100 }),
  latitude: decimal({ precision: 10, scale: 7 }),
  longitude: decimal({ precision: 10, scale: 7 }),
});

// ============================================
// SHIPPING PERFORMANCE TRACKING (3 LEVELS)
// ============================================

// Level 1: Performance by Point (most accurate)
export const shippingPerformanceByPoint = pgTable("shipping_performance_by_point", {
  id: serial().primaryKey(),
  companyId: integer("company_id").references(() => shippingPartners.id).notNull(),
  pointCode: varchar("point_code", { length: 15 }).references(() => egyptCities.code).notNull(),
  centerCode: varchar("center_code", { length: 10 }),
  governorateCode: varchar("governorate_code", { length: 10 }),
  pointName: varchar("point_name", { length: 150 }),
  
  totalShipments: integer("total_shipments").default(0),
  successfulShipments: integer("successful_shipments").default(0),
  failedShipments: integer("failed_shipments").default(0),
  
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default('0.00'),
  avgDeliveryDays: decimal("avg_delivery_days", { precision: 4, scale: 1 }).default('0.0'),
  customerSatisfaction: decimal("customer_satisfaction", { precision: 3, scale: 2 }).default('0.00'),
  avgPrice: decimal("avg_price", { precision: 10, scale: 2 }).default('0.00'),
  
  failedReasons: jsonb("failed_reasons"),
  lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
},
(table) => [
  index("perf_point_company_point").on(table.companyId, table.pointCode),
]);

// Level 2: Performance by Center (fallback 1)
export const shippingPerformanceByCenter = pgTable("shipping_performance_by_center", {
  id: serial().primaryKey(),
  companyId: integer("company_id").references(() => shippingPartners.id).notNull(),
  centerCode: varchar("center_code", { length: 10 }).references(() => egyptCenters.code).notNull(),
  governorateCode: varchar("governorate_code", { length: 10 }),
  centerName: varchar("center_name", { length: 100 }),
  
  totalShipments: integer("total_shipments").default(0),
  successfulShipments: integer("successful_shipments").default(0),
  failedShipments: integer("failed_shipments").default(0),
  
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default('0.00'),
  avgDeliveryDays: decimal("avg_delivery_days", { precision: 4, scale: 1 }).default('0.0'),
  customerSatisfaction: decimal("customer_satisfaction", { precision: 3, scale: 2 }).default('0.00'),
  avgPrice: decimal("avg_price", { precision: 10, scale: 2 }).default('0.00'),
  
  failedReasons: jsonb("failed_reasons"),
  lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
},
(table) => [
  index("perf_center_company_center").on(table.companyId, table.centerCode),
]);

// Level 3: Performance by Governorate (fallback 2)
export const shippingPerformanceByGovernorate = pgTable("shipping_performance_by_governorate", {
  id: serial().primaryKey(),
  companyId: integer("company_id").references(() => shippingPartners.id).notNull(),
  governorateCode: varchar("governorate_code", { length: 10 }).references(() => egyptGovernorates.code).notNull(),
  governorateName: varchar("governorate_name", { length: 100 }),
  
  totalShipments: integer("total_shipments").default(0),
  successfulShipments: integer("successful_shipments").default(0),
  failedShipments: integer("failed_shipments").default(0),
  
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default('0.00'),
  avgDeliveryDays: decimal("avg_delivery_days", { precision: 4, scale: 1 }).default('0.0'),
  customerSatisfaction: decimal("customer_satisfaction", { precision: 3, scale: 2 }).default('0.00'),
  avgPrice: decimal("avg_price", { precision: 10, scale: 2 }).default('0.00'),
  
  failedReasons: jsonb("failed_reasons"),
  lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
},
(table) => [
  index("perf_gov_company_gov").on(table.companyId, table.governorateCode),
]);

// ============================================
// SPREADSHEET COLLABORATION SCHEMA
// ============================================
export * from './schema-spreadsheet-collab';

// ============================================
// UNIFIED MESSAGING SYSTEM SCHEMA
// ============================================
export * from './schema-messaging';

// ============================================
// MARKETER TOOLS SCHEMA
// ============================================
export * from './schema-marketer-tools';

// ============================================
// UNIFIED PAYMENTS SCHEMA
// ============================================
export * from './schema-payments';

// ============================================
// WHATSAPP COMMERCE SCHEMA
// ============================================
export * from './schema-whatsapp-commerce';

// ============================================
// BNPL SCHEMA
// ============================================
export * from './schema-bnpl';

// ============================================
// TYPE EXPORTS
// ============================================
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;
export type Event = InferSelectModel<typeof events>;
export type InsertEvent = InferInsertModel<typeof events>;
