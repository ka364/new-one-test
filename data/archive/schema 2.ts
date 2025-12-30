import { mysqlTable, mysqlSchema, AnyMySqlColumn, foreignKey, int, varchar, timestamp, mysqlEnum, text, json, decimal, datetime, index, date, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const accountGenerationLogs = mysqlTable("account_generation_logs", {
	id: int().autoincrement().notNull(),
	month: varchar({ length: 7 }).notNull(),
	accountsGenerated: int("accounts_generated").notNull(),
	generatedBy: int("generated_by").notNull().references(() => users.id),
	excelFilePath: varchar("excel_file_path", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
});

export const agentInsights = mysqlTable("agentInsights", {
	id: int().autoincrement().notNull(),
	agentType: mysqlEnum(['financial','demand_planner','campaign_orchestrator','ethics_gatekeeper']).notNull(),
	insightType: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	titleAr: varchar({ length: 200 }),
	description: text().notNull(),
	descriptionAr: text(),
	insightData: json().notNull(),
	confidence: decimal({ precision: 5, scale: 2 }),
	priority: mysqlEnum(['low','medium','high','critical']).default('medium').notNull(),
	status: mysqlEnum(['new','reviewed','actioned','dismissed']).default('new').notNull(),
	reviewedBy: int(),
	reviewedAt: timestamp({ mode: 'string' }),
	reviewNotes: text(),
	relatedEntityType: varchar({ length: 100 }),
	relatedEntityId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const aiSuggestions = mysqlTable("ai_suggestions", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	suggestionType: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	titleAr: varchar({ length: 255 }),
	description: text(),
	descriptionAr: text(),
	suggestionData: json().notNull(),
	confidence: decimal({ precision: 5, scale: 2 }).notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	userFeedback: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	respondedAt: timestamp({ mode: 'string' }),
});

export const auditTrail = mysqlTable("auditTrail", {
	id: int().autoincrement().notNull(),
	entityType: varchar({ length: 100 }).notNull(),
	entityId: int().notNull(),
	action: mysqlEnum(['create','update','delete','approve','reject','review']).notNull(),
	actionDescription: text(),
	kaiaDecision: mysqlEnum(['approved','rejected','flagged','review_required']),
	appliedRules: json(),
	decisionReason: text(),
	decisionReasonAr: text(),
	oldValues: json(),
	newValues: json(),
	performedBy: int().notNull(),
	performedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
});

export const campaigns = mysqlTable("campaigns", {
	id: int().autoincrement().notNull(),
	campaignName: varchar({ length: 200 }).notNull(),
	campaignNameAr: varchar({ length: 200 }),
	description: text(),
	descriptionAr: text(),
	type: mysqlEnum(['email','social_media','sms','multi_channel']).notNull(),
	status: mysqlEnum(['draft','scheduled','active','paused','completed','cancelled']).default('draft').notNull(),
	budget: decimal({ precision: 10, scale: 2 }),
	spent: decimal({ precision: 10, scale: 2 }).default('0.00').notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	impressions: int().default(0).notNull(),
	clicks: int().default(0).notNull(),
	conversions: int().default(0).notNull(),
	revenue: decimal({ precision: 10, scale: 2 }).default('0.00').notNull(),
	aiOptimizationEnabled: tinyint().default(1).notNull(),
	lastOptimizedAt: timestamp({ mode: 'string' }),
	optimizationNotes: text(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }),
	targetAudience: json(),
	campaignConfig: json(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const chatMessages = mysqlTable("chatMessages", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	role: mysqlEnum(['user','assistant','system']).notNull(),
	content: text().notNull(),
	conversationId: varchar({ length: 100 }),
	parentMessageId: int(),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const contentCalendar = mysqlTable("content_calendar", {
	id: int().autoincrement().notNull(),
	createdBy: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	titleAr: varchar({ length: 255 }),
	description: text(),
	contentType: mysqlEnum(['social_post','blog_article','video','infographic','newsletter','ad_campaign']).notNull(),
	platform: varchar({ length: 100 }),
	scheduledDate: timestamp({ mode: 'string' }).notNull(),
	publishedDate: timestamp({ mode: 'string' }),
	status: mysqlEnum(['draft','scheduled','published','archived']).default('draft').notNull(),
	content: text(),
	hashtags: json(),
	mediaFiles: json(),
	views: int().default(0),
	likes: int().default(0),
	comments: int().default(0),
	shares: int().default(0),
	clicks: int().default(0),
	engagementRate: varchar({ length: 10 }),
	relatedCampaignId: int(),
	relatedProductId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const contentTemplates = mysqlTable("content_templates", {
	id: int().autoincrement().notNull(),
	createdBy: int().notNull(),
	templateName: varchar({ length: 255 }).notNull(),
	templateNameAr: varchar({ length: 255 }),
	description: text(),
	category: varchar({ length: 100 }),
	contentType: mysqlEnum(['social_post','blog_article','video_script','email','ad_copy']).notNull(),
	templateContent: text().notNull(),
	placeholders: json(),
	usageCount: int().default(0).notNull(),
	lastUsed: timestamp({ mode: 'string' }),
	isPublic: tinyint().default(0).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const dailySalesReports = mysqlTable("daily_sales_reports", {
	id: int().autoincrement().notNull(),
	reportDate: timestamp("report_date", { mode: 'string' }).notNull(),
	nowOrdersCount: int("now_orders_count").default(0),
	nowPiecesCount: int("now_pieces_count").default(0),
	nowRevenue: decimal("now_revenue", { precision: 10, scale: 2 }).default('0'),
	oneOrdersCount: int("one_orders_count").default(0),
	onePiecesCount: int("one_pieces_count").default(0),
	oneRevenue: decimal("one_revenue", { precision: 10, scale: 2 }).default('0'),
	factoryOrdersCount: int("factory_orders_count").default(0),
	factoryPiecesCount: int("factory_pieces_count").default(0),
	factoryRevenue: decimal("factory_revenue", { precision: 10, scale: 2 }).default('0'),
	externalOrdersCount: int("external_orders_count").default(0),
	externalPiecesCount: int("external_pieces_count").default(0),
	externalRevenue: decimal("external_revenue", { precision: 10, scale: 2 }).default('0'),
	websiteOrdersCount: int("website_orders_count").default(0),
	websitePiecesCount: int("website_pieces_count").default(0),
	websiteRevenue: decimal("website_revenue", { precision: 10, scale: 2 }).default('0'),
	totalOrdersCount: int("total_orders_count").default(0),
	totalPiecesCount: int("total_pieces_count").default(0),
	totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default('0'),
	shippedOrdersCount: int("shipped_orders_count").default(0),
	shippedPiecesCount: int("shipped_pieces_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
});

export const documentVerificationLogs = mysqlTable("document_verification_logs", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull(),
	documentId: int("document_id"),
	verificationType: varchar("verification_type", { length: 100 }).notNull(),
	verificationResult: varchar("verification_result", { length: 50 }).notNull(),
	verificationScore: decimal("verification_score", { precision: 5, scale: 2 }),
	details: text(),
	errorMessage: text("error_message"),
	performedBy: int("performed_by"),
	performedAt: datetime("performed_at", { mode: 'string'}).notNull(),
});

export const dynamicIcons = mysqlTable("dynamic_icons", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	iconName: varchar({ length: 100 }).notNull(),
	iconNameAr: varchar({ length: 100 }),
	iconEmoji: varchar({ length: 10 }).notNull(),
	taskType: varchar({ length: 100 }).notNull(),
	description: text(),
	descriptionAr: text(),
	actionConfig: json().notNull(),
	usageCount: int().default(0).notNull(),
	lastUsed: timestamp({ mode: 'string' }),
	isVisible: tinyint().default(1).notNull(),
	displayOrder: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const employeeDocuments = mysqlTable("employee_documents", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull(),
	documentType: varchar("document_type", { length: 100 }).notNull(),
	documentName: varchar("document_name", { length: 255 }).notNull(),
	fileUrl: text("file_url").notNull(),
	fileKey: varchar("file_key", { length: 500 }).notNull(),
	fileSize: int("file_size"),
	mimeType: varchar("mime_type", { length: 100 }),
	isVerified: tinyint("is_verified").default(0),
	verificationStatus: varchar("verification_status", { length: 50 }).default('pending'),
	verificationScore: decimal("verification_score", { precision: 5, scale: 2 }),
	verificationNotes: text("verification_notes"),
	extractedData: text("extracted_data"),
	uploadedBy: int("uploaded_by"),
	uploadedAt: datetime("uploaded_at", { mode: 'string'}).notNull(),
	verifiedAt: datetime("verified_at", { mode: 'string'}),
	verifiedBy: int("verified_by"),
});

export const employeeMonthlyData = mysqlTable("employee_monthly_data", {
	id: int().autoincrement().notNull(),
	accountId: int("account_id").notNull().references(() => monthlyEmployeeAccounts.id),
	dataType: varchar("data_type", { length: 100 }).notNull(),
	dataJson: json("data_json").notNull(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const employees = mysqlTable("employees", {
	id: int().autoincrement().notNull(),
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
	hireDate: datetime("hire_date", { mode: 'string'}).notNull(),
	contractType: varchar("contract_type", { length: 50 }),
	isActive: tinyint("is_active").default(1),
	documentsVerified: tinyint("documents_verified").default(0),
	verificationStatus: varchar("verification_status", { length: 50 }).default('pending'),
	verificationNotes: text("verification_notes"),
	createdBy: int("created_by"),
	createdAt: datetime("created_at", { mode: 'string'}).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}),
	role: varchar({ length: 50 }).default('employee'),
	parentId: int("parent_id"),
	childrenCount: int("children_count").default(0),
},
(table) => [
	index("national_id").on(table.nationalId),
]);

export const ethicalRules = mysqlTable("ethicalRules", {
	id: int().autoincrement().notNull(),
	ruleName: varchar({ length: 200 }).notNull(),
	ruleNameAr: varchar({ length: 200 }),
	ruleDescription: text().notNull(),
	ruleDescriptionAr: text(),
	ruleType: mysqlEnum(['sharia_financial','sharia_commercial','ethical_business','compliance','risk_management']).notNull(),
	category: varchar({ length: 100 }),
	severity: mysqlEnum(['low','medium','high','critical']).default('medium').notNull(),
	ruleLogic: json().notNull(),
	isActive: tinyint().default(1).notNull(),
	autoApply: tinyint().default(1).notNull(),
	requiresReview: tinyint().default(0).notNull(),
	priority: int().default(100).notNull(),
	referenceSource: text(),
	referenceSourceAr: text(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const events = mysqlTable("events", {
	id: int().autoincrement().notNull(),
	eventType: varchar({ length: 100 }).notNull(),
	eventName: varchar({ length: 200 }).notNull(),
	eventData: json().notNull(),
	status: mysqlEnum(['pending','processing','completed','failed']).default('pending').notNull(),
	priority: int().default(100).notNull(),
	processedBy: varchar({ length: 100 }),
	processedAt: timestamp({ mode: 'string' }),
	errorMessage: text(),
	retryCount: int().default(0).notNull(),
	maxRetries: int().default(3).notNull(),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const externalShipments = mysqlTable("external_shipments", {
	id: int().autoincrement().notNull(),
	shippingCompany: varchar("shipping_company", { length: 50 }).notNull(),
	trackingNumber: varchar("tracking_number", { length: 100 }),
	orderNumber: varchar("order_number", { length: 100 }),
	customerName: varchar("customer_name", { length: 255 }),
	customerPhone: varchar("customer_phone", { length: 50 }),
	quantity: int().default(0),
	amount: decimal({ precision: 10, scale: 2 }).default('0'),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	shipmentDate: date("shipment_date", { mode: 'string' }),
	status: varchar({ length: 50 }).default('pending'),
	fileSource: varchar("file_source", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("idx_company").on(table.shippingCompany),
	index("idx_date").on(table.shipmentDate),
	index("idx_tracking").on(table.trackingNumber),
	index("idx_order").on(table.orderNumber),
]);

export const factoryBatches = mysqlTable("factory_batches", {
	id: int().autoincrement().notNull(),
	batchNumber: varchar("batch_number", { length: 100 }).notNull(),
	productId: int("product_id").notNull().references(() => products.id),
	quantity: int().notNull(),
	supplierPrice: decimal("supplier_price", { precision: 10, scale: 2 }).notNull(),
	totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
	deliveryDate: timestamp("delivery_date", { mode: 'string' }),
	status: varchar({ length: 50 }).default('pending').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
});

export const founderAccounts = mysqlTable("founder_accounts", {
	id: int().autoincrement().notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	username: varchar({ length: 100 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	role: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }),
	isActive: tinyint("is_active").default(1).notNull(),
	currentMonth: varchar("current_month", { length: 7 }).notNull(),
	passwordExpiresAt: timestamp("password_expires_at", { mode: 'string' }).notNull(),
	lastPasswordChangeAt: timestamp("last_password_change_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	permissions: json(),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	lastLoginIp: varchar("last_login_ip", { length: 45 }),
	loginCount: int("login_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("email").on(table.email),
	index("username").on(table.username),
]);

export const founderLoginHistory = mysqlTable("founder_login_history", {
	id: int().autoincrement().notNull(),
	founderId: int("founder_id").notNull().references(() => founderAccounts.id),
	loginAt: timestamp("login_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	success: tinyint().notNull(),
	failureReason: varchar("failure_reason", { length: 255 }),
	sessionId: varchar("session_id", { length: 255 }),
	sessionDuration: int("session_duration"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const googleDriveFiles = mysqlTable("google_drive_files", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	fileName: varchar({ length: 255 }).notNull(),
	fileType: varchar({ length: 50 }).notNull(),
	filePath: text().notNull(),
	shareableLink: text(),
	purpose: varchar({ length: 255 }),
	metadata: json(),
	createdBy: int().notNull().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	lastModified: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const imageEmbeddings = mysqlTable("image_embeddings", {
	id: int().autoincrement().notNull(),
	imageId: int("image_id").notNull().references(() => productImages.id),
	embeddingVector: text("embedding_vector").notNull(),
	modelName: varchar("model_name", { length: 100 }).notNull(),
	modelVersion: varchar("model_version", { length: 50 }).notNull(),
	vectorDimensions: int("vector_dimensions").notNull(),
	processingTime: int("processing_time"),
	confidence: decimal({ precision: 5, scale: 4 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("image_id_idx").on(table.imageId),
	index("model_idx").on(table.modelName, table.modelVersion),
]);

export const inventory = mysqlTable("inventory", {
	id: int().autoincrement().notNull(),
	productId: int("product_id").notNull().references(() => products.id),
	size: varchar({ length: 10 }),
	color: varchar({ length: 50 }),
	quantity: int().default(0).notNull(),
	minStockLevel: int("min_stock_level").default(10),
	location: varchar({ length: 100 }),
	lastRestocked: timestamp("last_restocked", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const monthlyEmployeeAccounts = mysqlTable("monthly_employee_accounts", {
	id: int().autoincrement().notNull(),
	employeeName: varchar("employee_name", { length: 255 }).notNull(),
	username: varchar({ length: 100 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	month: varchar({ length: 7 }).notNull(),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	email: varchar({ length: 255 }),
	emailVerified: tinyint("email_verified").default(0),
	otpCode: varchar("otp_code", { length: 6 }),
	otpExpiresAt: timestamp("otp_expires_at", { mode: 'string' }),
	otpAttempts: int("otp_attempts").default(0),
},
(table) => [
	index("username").on(table.username),
]);

export const notifications = mysqlTable("notifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	type: mysqlEnum(['info','warning','error','success','critical']).default('info').notNull(),
	title: varchar({ length: 200 }).notNull(),
	titleAr: varchar({ length: 200 }),
	message: text().notNull(),
	messageAr: text(),
	relatedEntityType: varchar({ length: 100 }),
	relatedEntityId: int(),
	isRead: tinyint().default(0).notNull(),
	readAt: timestamp({ mode: 'string' }),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const orderItems = mysqlTable("order_items", {
	id: int().autoincrement().notNull(),
	orderId: int("order_id").notNull().references(() => orders.id),
	productId: int("product_id").notNull().references(() => products.id),
	size: varchar({ length: 10 }),
	color: varchar({ length: 50 }),
	quantity: int().default(1).notNull(),
	unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
	subtotal: decimal({ precision: 10, scale: 2 }).notNull(),
});

export const orderStatusHistory = mysqlTable("order_status_history", {
	id: int().autoincrement().notNull(),
	orderId: int("order_id").notNull().references(() => orders.id),
	oldStatus: varchar("old_status", { length: 50 }),
	newStatus: varchar("new_status", { length: 50 }).notNull(),
	changedBy: int("changed_by"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
});

export const orders = mysqlTable("orders", {
	id: int().autoincrement().notNull(),
	orderNumber: varchar({ length: 50 }).notNull(),
	customerName: varchar({ length: 200 }).notNull(),
	customerEmail: varchar({ length: 320 }),
	customerPhone: varchar({ length: 20 }),
	productName: varchar({ length: 300 }).notNull(),
	productDescription: text(),
	quantity: int().default(1).notNull(),
	unitPrice: decimal({ precision: 10, scale: 2 }).notNull(),
	totalAmount: decimal({ precision: 10, scale: 2 }).notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	status: mysqlEnum(['pending','processing','confirmed','shipped','delivered','cancelled','refunded']).default('pending').notNull(),
	paymentStatus: mysqlEnum(['pending','paid','failed','refunded']).default('pending').notNull(),
	shippingAddress: text(),
	notes: text(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("orders_orderNumber_unique").on(table.orderNumber),
]);

export const otpVerifications = mysqlTable("otp_verifications", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id"),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	email: varchar({ length: 255 }),
	otpCode: varchar("otp_code", { length: 6 }).notNull(),
	method: mysqlEnum(['email','sms']).default('email').notNull(),
	expiresAt: datetime("expires_at", { mode: 'string'}).notNull(),
	verifiedAt: datetime("verified_at", { mode: 'string'}),
	latitude: decimal({ precision: 10, scale: 8 }),
	longitude: decimal({ precision: 11, scale: 8 }),
	ipAddress: varchar("ip_address", { length: 45 }),
	verificationAttempts: int("verification_attempts").default(0),
	createdAt: datetime("created_at", { mode: 'string'}).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("idx_phone").on(table.phoneNumber),
	index("idx_email").on(table.email),
	index("idx_otp").on(table.otpCode),
	index("idx_expires").on(table.expiresAt),
]);

export const productBarcodes = mysqlTable("product_barcodes", {
	id: int().autoincrement().notNull(),
	productId: int("product_id").notNull().references(() => products.id),
	barcodeType: varchar("barcode_type", { length: 50 }).notNull(),
	barcodeValue: varchar("barcode_value", { length: 255 }).notNull(),
	size: varchar({ length: 10 }),
	color: varchar({ length: 50 }),
	isActive: tinyint("is_active").default(1),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("product_id_idx").on(table.productId),
	index("barcode_value_idx").on(table.barcodeValue),
	index("barcode_value").on(table.barcodeValue),
]);

export const productImageRequests = mysqlTable("product_image_requests", {
	id: int().autoincrement().notNull(),
	requestNumber: varchar({ length: 50 }).notNull(),
	requestedBy: int().notNull(),
	productName: varchar({ length: 255 }).notNull(),
	productDescription: text(),
	productSku: varchar({ length: 100 }),
	imageType: mysqlEnum(['product_photo','lifestyle','detail_shot','360_view','video','infographic']).notNull(),
	quantity: int().default(1).notNull(),
	specifications: json(),
	urgency: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	deadline: timestamp({ mode: 'string' }),
	notes: text(),
	status: mysqlEnum(['pending','assigned','in_progress','review','completed','cancelled']).default('pending').notNull(),
	assignedTo: int(),
	assignedAt: timestamp({ mode: 'string' }),
	completedImages: json(),
	completedAt: timestamp({ mode: 'string' }),
	rating: int(),
	feedback: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("product_image_requests_requestNumber_unique").on(table.requestNumber),
]);

export const productImages = mysqlTable("product_images", {
	id: int().autoincrement().notNull(),
	productId: int("product_id").notNull().references(() => products.id),
	s3Url: varchar("s3_url", { length: 500 }).notNull(),
	s3Key: varchar("s3_key", { length: 255 }).notNull(),
	imageType: varchar("image_type", { length: 50 }).default('product').notNull(),
	isPrimary: tinyint("is_primary").default(0),
	sortOrder: int("sort_order").default(0),
	originalUrl: varchar("original_url", { length: 500 }),
	width: int(),
	height: int(),
	fileSize: int("file_size"),
	mimeType: varchar("mime_type", { length: 50 }),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("product_id_idx").on(table.productId),
	index("is_primary_idx").on(table.isPrimary),
]);

export const productSizeCharts = mysqlTable("product_size_charts", {
	id: int().autoincrement().notNull(),
	productId: int("product_id").notNull().references(() => products.id),
	size: varchar({ length: 10 }).notNull(),
	lengthCm: decimal("length_cm", { precision: 5, scale: 2 }),
	widthCm: decimal("width_cm", { precision: 5, scale: 2 }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const products = mysqlTable("products", {
	id: int().autoincrement().notNull(),
	modelCode: varchar("model_code", { length: 50 }).notNull(),
	supplierPrice: decimal("supplier_price", { precision: 10, scale: 2 }).notNull(),
	sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }),
	category: varchar({ length: 50 }),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("products_model_code_unique").on(table.modelCode),
]);

export const replacements = mysqlTable("replacements", {
	id: int().autoincrement().notNull(),
	originalOrderId: int("original_order_id").notNull().references(() => orders.id),
	newOrderId: int("new_order_id").references(() => orders.id),
	reason: text().notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	completedAt: timestamp("completed_at", { mode: 'string' }),
});

export const reports = mysqlTable("reports", {
	id: int().autoincrement().notNull(),
	reportName: varchar({ length: 200 }).notNull(),
	reportNameAr: varchar({ length: 200 }),
	reportType: mysqlEnum(['sales','financial','orders','transactions','ethical_compliance','custom']).notNull(),
	description: text(),
	descriptionAr: text(),
	reportConfig: json().notNull(),
	reportData: json(),
	isScheduled: tinyint().default(0).notNull(),
	scheduleFrequency: mysqlEnum(['daily','weekly','monthly','quarterly']),
	nextRunAt: timestamp({ mode: 'string' }),
	lastRunAt: timestamp({ mode: 'string' }),
	status: mysqlEnum(['draft','generating','completed','failed']).default('draft').notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const returns = mysqlTable("returns", {
	id: int().autoincrement().notNull(),
	shipmentId: int("shipment_id").notNull().references(() => shipments.id),
	orderId: int("order_id").notNull().references(() => orders.id),
	returnReason: varchar("return_reason", { length: 255 }).notNull(),
	returnDate: timestamp("return_date", { mode: 'string' }),
	refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
	status: varchar({ length: 50 }).default('pending').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
});

// Old shipments table removed - replaced with comprehensive shipping system below

export const shopifyConfig = mysqlTable("shopify_config", {
	id: int().autoincrement().notNull(),
	storeName: varchar("store_name", { length: 255 }).notNull(),
	accessToken: text("access_token").notNull(),
	apiVersion: varchar("api_version", { length: 50 }).default('2025-10').notNull(),
	isActive: tinyint("is_active").default(1).notNull(),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	autoSyncEnabled: tinyint("auto_sync_enabled").default(1).notNull(),
	syncIntervalMinutes: int("sync_interval_minutes").default(15).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const shopifyOrders = mysqlTable("shopify_orders", {
	id: int().autoincrement().notNull(),
	shopifyOrderId: varchar("shopify_order_id", { length: 255 }).notNull(),
	localOrderId: int("local_order_id").references(() => orders.id),
	orderNumber: int("order_number"),
	orderName: varchar("order_name", { length: 100 }),
	email: varchar({ length: 320 }),
	phone: varchar({ length: 20 }),
	totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
	subtotalPrice: decimal("subtotal_price", { precision: 10, scale: 2 }),
	totalTax: decimal("total_tax", { precision: 10, scale: 2 }),
	totalShipping: decimal("total_shipping", { precision: 10, scale: 2 }),
	currency: varchar({ length: 10 }).default('EGP'),
	financialStatus: mysqlEnum("financial_status", ['pending','authorized','paid','partially_paid','refunded','voided']),
	fulfillmentStatus: mysqlEnum("fulfillment_status", ['fulfilled','partial','unfulfilled','restocked']),
	customerData: json("customer_data"),
	shippingAddress: json("shipping_address"),
	lineItems: json("line_items"),
	syncStatus: mysqlEnum("sync_status", ['synced','pending','error']).default('pending').notNull(),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	syncError: text("sync_error"),
	trackingNumber: varchar("tracking_number", { length: 255 }),
	trackingCompany: varchar("tracking_company", { length: 100 }),
	trackingUrl: text("tracking_url"),
	fulfilledAt: timestamp("fulfilled_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("shopify_order_id").on(table.shopifyOrderId),
]);

export const shopifyProducts = mysqlTable("shopify_products", {
	id: int().autoincrement().notNull(),
	shopifyProductId: varchar("shopify_product_id", { length: 255 }).notNull(),
	localProductId: int("local_product_id").references(() => products.id),
	title: varchar({ length: 500 }),
	bodyHtml: text("body_html"),
	vendor: varchar({ length: 255 }),
	productType: varchar("product_type", { length: 255 }),
	handle: varchar({ length: 255 }),
	tags: text(),
	syncStatus: mysqlEnum("sync_status", ['synced','pending','error']).default('pending').notNull(),
	syncDirection: mysqlEnum("sync_direction", ['shopify_to_local','local_to_shopify','bidirectional']).default('bidirectional'),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	syncError: text("sync_error"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("shopify_product_id").on(table.shopifyProductId),
]);

export const shopifySyncLogs = mysqlTable("shopify_sync_logs", {
	id: int().autoincrement().notNull(),
	syncType: mysqlEnum("sync_type", ['products','inventory','orders','customers']).notNull(),
	direction: mysqlEnum(['shopify_to_local','local_to_shopify']).notNull(),
	status: mysqlEnum(['success','partial','error']).notNull(),
	itemsProcessed: int("items_processed").default(0),
	itemsSucceeded: int("items_succeeded").default(0),
	itemsFailed: int("items_failed").default(0),
	errorMessage: text("error_message"),
	errorDetails: json("error_details"),
	duration: int(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const shopifyVariants = mysqlTable("shopify_variants", {
	id: int().autoincrement().notNull(),
	shopifyVariantId: varchar("shopify_variant_id", { length: 255 }).notNull(),
	shopifyProductId: varchar("shopify_product_id", { length: 255 }).notNull(),
	localVariantId: int("local_variant_id"),
	title: varchar({ length: 255 }),
	price: decimal({ precision: 10, scale: 2 }),
	compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
	sku: varchar({ length: 255 }),
	barcode: varchar({ length: 255 }),
	inventoryQuantity: int("inventory_quantity").default(0),
	inventoryItemId: varchar("inventory_item_id", { length: 255 }),
	option1: varchar({ length: 255 }),
	option2: varchar({ length: 255 }),
	option3: varchar({ length: 255 }),
	syncStatus: mysqlEnum("sync_status", ['synced','pending','error']).default('pending').notNull(),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("shopify_variant_id").on(table.shopifyVariantId),
]);

export const shopifyWebhookLogs = mysqlTable("shopify_webhook_logs", {
	id: int().autoincrement().notNull(),
	topic: varchar({ length: 100 }).notNull(),
	shopifyId: varchar("shopify_id", { length: 255 }),
	payload: json().notNull(),
	headers: json(),
	processed: tinyint().default(0).notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	error: text(),
	retryCount: int("retry_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const stockAlerts = mysqlTable("stock_alerts", {
	id: int().autoincrement().notNull(),
	inventoryId: int("inventory_id").notNull().references(() => inventory.id),
	alertType: varchar("alert_type", { length: 50 }).notNull(),
	message: text().notNull(),
	isResolved: tinyint("is_resolved").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
});

export const subscriptions = mysqlTable("subscriptions", {
	id: int().autoincrement().notNull(),
	subscriptionNumber: varchar({ length: 50 }).notNull(),
	userId: int().notNull(),
	planName: varchar({ length: 200 }).notNull(),
	planDescription: text(),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	billingCycle: mysqlEnum(['monthly','quarterly','yearly']).notNull(),
	status: mysqlEnum(['active','paused','cancelled','expired']).default('active').notNull(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }),
	nextBillingDate: timestamp({ mode: 'string' }),
	cancelledAt: timestamp({ mode: 'string' }),
	paymentMethod: varchar({ length: 50 }),
	lastPaymentDate: timestamp({ mode: 'string' }),
	lastPaymentAmount: decimal({ precision: 10, scale: 2 }),
	shariaCompliant: tinyint().default(1).notNull(),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("subscriptions_subscriptionNumber_unique").on(table.subscriptionNumber),
]);

export const taskPatterns = mysqlTable("task_patterns", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	taskType: varchar({ length: 100 }).notNull(),
	taskName: varchar({ length: 255 }).notNull(),
	taskNameAr: varchar({ length: 255 }),
	frequency: int().default(0).notNull(),
	lastUsed: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	avgTimeSpent: int(),
	confidence: decimal({ precision: 5, scale: 2 }).default('0.00'),
	suggestedIcon: varchar({ length: 50 }),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const transactions = mysqlTable("transactions", {
	id: int().autoincrement().notNull(),
	transactionNumber: varchar({ length: 50 }).notNull(),
	type: mysqlEnum(['income','expense','transfer','payment','refund','subscription']).notNull(),
	category: varchar({ length: 100 }),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	description: text(),
	relatedOrderId: int(),
	relatedSubscriptionId: int(),
	paymentMethod: varchar({ length: 50 }),
	status: mysqlEnum(['pending','completed','failed','cancelled']).default('pending').notNull(),
	shariaCompliant: tinyint().default(1).notNull(),
	ethicalCheckStatus: mysqlEnum(['pending','approved','rejected','review_required']).default('pending').notNull(),
	ethicalCheckNotes: text(),
	ethicalCheckBy: int(),
	ethicalCheckAt: timestamp({ mode: 'string' }),
	metadata: json(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("transactions_transactionNumber_unique").on(table.transactionNumber),
]);

export const userBehavior = mysqlTable("user_behavior", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	actionType: varchar({ length: 100 }).notNull(),
	actionData: json(),
	context: json(),
	timestamp: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const userPreferences = mysqlTable("user_preferences", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	preferredLanguage: varchar({ length: 10 }).default('ar').notNull(),
	theme: varchar({ length: 20 }).default('light').notNull(),
	notificationsEnabled: tinyint().default(1).notNull(),
	autoSuggestIcons: tinyint().default(1).notNull(),
	customSettings: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId").on(table.userId),
]);

export const investors = mysqlTable("investors", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	company: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	passwordHash: varchar({ length: 255 }).notNull(),
	status: mysqlEnum(['pending','active','inactive']).default('active').notNull(),
	investmentInterest: decimal({ precision: 15, scale: 2 }),
	notes: text(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastLoginAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("investors_email_unique").on(table.email),
]);

export const investorActivity = mysqlTable("investor_activity", {
	id: int().autoincrement().notNull(),
	investorId: int().notNull().references(() => investors.id),
	actionType: mysqlEnum(['page_view','kaia_test','pitch_view','login','logout']).notNull(),
	pagePath: varchar({ length: 500 }),
	pageTitle: varchar({ length: 255 }),
	timeSpent: int().default(0),
	actionData: json(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("investor_activity_investor_id").on(table.investorId),
	index("investor_activity_action_type").on(table.actionType),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	permissions: json(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

export const visualSearchHistory = mysqlTable("visual_search_history", {
	id: int().autoincrement().notNull(),
	searchImageUrl: varchar("search_image_url", { length: 500 }),
	searchImageS3Key: varchar("search_image_s3_key", { length: 255 }),
	topResultProductId: int("top_result_product_id").references(() => products.id),
	topResultSimilarity: decimal("top_result_similarity", { precision: 5, scale: 4 }),
	totalResults: int("total_results"),
	userId: int("user_id"),
	userRole: varchar("user_role", { length: 50 }),
	searchContext: varchar("search_context", { length: 100 }),
	searchDuration: int("search_duration"),
	wasHelpful: tinyint("was_helpful"),
	selectedProductId: int("selected_product_id").references(() => products.id),
	searchedAt: timestamp("searched_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("searched_at_idx").on(table.searchedAt),
	index("user_id_idx").on(table.userId),
	index("context_idx").on(table.searchContext),
]);

// ============================================
// SHIPPING & LOGISTICS SYSTEM
// ============================================

export const shippingCompanies = mysqlTable("shipping_companies", {
  id: int().autoincrement().primaryKey(),
  name: varchar({ length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }),
  code: varchar({ length: 50 }).notNull().unique(),
  active: tinyint().default(1).notNull(),
  zonesConfig: json("zones_config").notNull(), // Zone pricing configuration
  codFeeConfig: json("cod_fee_config"), // COD fee configuration
  insuranceFeeConfig: json("insurance_fee_config"), // Insurance configuration
  returnFeePercentage: decimal("return_fee_percentage", { precision: 5, scale: 2 }).default('40.00'),
  exchangeFeePercentage: decimal("exchange_fee_percentage", { precision: 5, scale: 2 }).default('150.00'),
  bankTransfersPerWeek: int("bank_transfers_per_week").default(3),
  notes: text(),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const shippingZones = mysqlTable("shipping_zones", {
  id: int().autoincrement().primaryKey(),
  companyId: int("company_id").notNull().references(() => shippingCompanies.id),
  zoneName: varchar("zone_name", { length: 50 }).notNull(),
  zoneNumber: int("zone_number").notNull(),
  basePriceUpTo3Kg: decimal("base_price_up_to_3kg", { precision: 10, scale: 2 }).notNull(),
  additionalKgPrice: decimal("additional_kg_price", { precision: 10, scale: 2 }).notNull(),
  areas: json().notNull(), // Array of governorates/cities
  active: tinyint().default(1).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const shipments = mysqlTable("shipments", {
  id: int().autoincrement().primaryKey(),
  orderId: int("order_id").notNull().references(() => orders.id),
  companyId: int("company_id").notNull().references(() => shippingCompanies.id),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  zoneId: int("zone_id").notNull().references(() => shippingZones.id),
  weight: decimal({ precision: 10, scale: 2 }).notNull(), // in KG
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull(),
  codFee: decimal("cod_fee", { precision: 10, scale: 2 }).default('0.00'),
  insuranceFee: decimal("insurance_fee", { precision: 10, scale: 2 }).default('0.00'),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum(['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'lost', 'cancelled']).default('pending').notNull(),
  shippedAt: timestamp("shipped_at", { mode: 'string' }),
  deliveredAt: timestamp("delivered_at", { mode: 'string' }),
  returnedAt: timestamp("returned_at", { mode: 'string' }),
  returnReason: text("return_reason"),
  notes: text(),
  createdBy: int("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const shipmentReturns = mysqlTable("shipment_returns", {
  id: int().autoincrement().primaryKey(),
  shipmentId: int("shipment_id").notNull().references(() => shipments.id),
  returnType: mysqlEnum("return_type", ['full_return', 'exchange', 'delivery_failed']).notNull(),
  returnReason: text("return_reason"),
  returnCost: decimal("return_cost", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum(['pending', 'received', 'processed']).default('pending').notNull(),
  receivedAt: timestamp("received_at", { mode: 'string' }),
  processedBy: int("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at", { mode: 'string' }),
  notes: text(),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

// ============================================
// COLLECTIONS & PAYMENTS SYSTEM
// ============================================

export const collections = mysqlTable("collections", {
  id: int().autoincrement().primaryKey(),
  collectionType: mysqlEnum("collection_type", ['cash', 'bank_transfer']).notNull(),
  companyId: int("company_id").notNull().references(() => shippingCompanies.id),
  amount: decimal({ precision: 10, scale: 2 }).notNull(),
  collectionDate: date("collection_date").notNull(),
  receiptNumber: varchar("receipt_number", { length: 100 }),
  bankReference: varchar("bank_reference", { length: 100 }),
  status: mysqlEnum(['pending', 'confirmed', 'reconciled']).default('pending').notNull(),
  notes: text(),
  createdBy: int("created_by").notNull().references(() => users.id),
  confirmedBy: int("confirmed_by").references(() => users.id),
  confirmedAt: timestamp("confirmed_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const collectionItems = mysqlTable("collection_items", {
  id: int().autoincrement().primaryKey(),
  collectionId: int("collection_id").notNull().references(() => collections.id),
  orderId: int("order_id").notNull().references(() => orders.id),
  amount: decimal({ precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

// ============================================
// OPERATIONAL KPIs & METRICS
// ============================================

export const dailyOperationalMetrics = mysqlTable("daily_operational_metrics", {
  id: int().autoincrement().primaryKey(),
  date: date().notNull().unique(),
  
  // Orders
  ordersCreated: int("orders_created").default(0).notNull(),
  ordersCreatedValue: decimal("orders_created_value", { precision: 10, scale: 2 }).default('0.00').notNull(),
  ordersConfirmed: int("orders_confirmed").default(0).notNull(),
  ordersConfirmedValue: decimal("orders_confirmed_value", { precision: 10, scale: 2 }).default('0.00').notNull(),
  ordersShipped: int("orders_shipped").default(0).notNull(),
  ordersShippedValue: decimal("orders_shipped_value", { precision: 10, scale: 2 }).default('0.00').notNull(),
  ordersReturned: int("orders_returned").default(0).notNull(),
  ordersReturnedValue: decimal("orders_returned_value", { precision: 10, scale: 2 }).default('0.00').notNull(),
  ordersDelivered: int("orders_delivered").default(0).notNull(),
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
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

// ============================================
// AD CAMPAIGN PERFORMANCE
// ============================================

export const adCampaignPerformance = mysqlTable("ad_campaign_performance", {
  id: int().autoincrement().primaryKey(),
  date: date().notNull(),
  campaignName: varchar("campaign_name", { length: 200 }).notNull(),
  platform: mysqlEnum(['facebook', 'instagram', 'google', 'tiktok', 'snapchat', 'other']).notNull(),
  spend: decimal({ precision: 10, scale: 2 }).notNull(),
  results: int().default(0).notNull(),
  costPerResult: decimal("cost_per_result", { precision: 10, scale: 4 }).notNull(),
  reach: int().default(0),
  impressions: int().default(0),
  clicks: int().default(0),
  conversions: int().default(0),
  messagesStarted: int("messages_started").default(0),
  costPerMessage: decimal("cost_per_message", { precision: 10, scale: 2 }),
  active: tinyint().default(1).notNull(),
  notes: text(),
  createdBy: int("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

// ============================================
// EXPECTED REVENUE CALCULATOR
// ============================================

export const revenueForecasts = mysqlTable("revenue_forecasts", {
  id: int().autoincrement().primaryKey(),
  date: date().notNull(),
  adSpend: decimal("ad_spend", { precision: 10, scale: 2 }).notNull(),
  lastCampaignEfficiency: decimal("last_campaign_efficiency", { precision: 10, scale: 4 }).notNull(), // Cost per result
  expectedOrders: int("expected_orders").notNull(),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).notNull(),
  shipmentRate: decimal("shipment_rate", { precision: 5, scale: 2 }).notNull(), // % of orders actually shipped
  deliverySuccessRate: decimal("delivery_success_rate", { precision: 5, scale: 2 }).notNull(), // % delivered after returns
  expectedRevenue: decimal("expected_revenue", { precision: 10, scale: 2 }).notNull(),
  actualRevenue: decimal("actual_revenue", { precision: 10, scale: 2 }),
  variance: decimal({ precision: 10, scale: 2 }),
  variancePercentage: decimal("variance_percentage", { precision: 5, scale: 2 }),
  notes: text(),
  createdBy: int("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});
