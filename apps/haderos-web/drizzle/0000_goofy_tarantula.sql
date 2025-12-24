CREATE TABLE `account_generation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`month` varchar(7) NOT NULL,
	`accounts_generated` int NOT NULL,
	`generated_by` int NOT NULL,
	`excel_file_path` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `account_generation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agentInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentType` enum('financial','demand_planner','campaign_orchestrator','ethics_gatekeeper') NOT NULL,
	`insightType` varchar(100) NOT NULL,
	`title` varchar(200) NOT NULL,
	`titleAr` varchar(200),
	`description` text NOT NULL,
	`descriptionAr` text,
	`insightData` json NOT NULL,
	`confidence` decimal(5,2),
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('new','reviewed','actioned','dismissed') NOT NULL DEFAULT 'new',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`relatedEntityType` varchar(100),
	`relatedEntityId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditTrail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int NOT NULL,
	`action` enum('create','update','delete','approve','reject','review') NOT NULL,
	`actionDescription` text,
	`kaiaDecision` enum('approved','rejected','flagged','review_required'),
	`appliedRules` json,
	`decisionReason` text,
	`decisionReasonAr` text,
	`oldValues` json,
	`newValues` json,
	`performedBy` int NOT NULL,
	`performedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` text,
	CONSTRAINT `auditTrail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignName` varchar(200) NOT NULL,
	`campaignNameAr` varchar(200),
	`description` text,
	`descriptionAr` text,
	`type` enum('email','social_media','sms','multi_channel') NOT NULL,
	`status` enum('draft','scheduled','active','paused','completed','cancelled') NOT NULL DEFAULT 'draft',
	`budget` decimal(10,2),
	`spent` decimal(10,2) NOT NULL DEFAULT '0.00',
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`revenue` decimal(10,2) NOT NULL DEFAULT '0.00',
	`aiOptimizationEnabled` boolean NOT NULL DEFAULT true,
	`lastOptimizedAt` timestamp,
	`optimizationNotes` text,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`targetAudience` json,
	`campaignConfig` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`conversationId` varchar(100),
	`parentMessageId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_monthly_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`account_id` int NOT NULL,
	`data_type` varchar(100) NOT NULL,
	`data_json` json NOT NULL,
	`submitted_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_monthly_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ethicalRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleName` varchar(200) NOT NULL,
	`ruleNameAr` varchar(200),
	`ruleDescription` text NOT NULL,
	`ruleDescriptionAr` text,
	`ruleType` enum('sharia_financial','sharia_commercial','ethical_business','compliance','risk_management') NOT NULL,
	`category` varchar(100),
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`ruleLogic` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`autoApply` boolean NOT NULL DEFAULT true,
	`requiresReview` boolean NOT NULL DEFAULT false,
	`priority` int NOT NULL DEFAULT 100,
	`referenceSource` text,
	`referenceSourceAr` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ethicalRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`eventName` varchar(200) NOT NULL,
	`eventData` json NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`priority` int NOT NULL DEFAULT 100,
	`processedBy` varchar(100),
	`processedAt` timestamp,
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthly_employee_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_name` varchar(255) NOT NULL,
	`username` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`month` varchar(7) NOT NULL,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	`last_login_at` timestamp,
	CONSTRAINT `monthly_employee_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `monthly_employee_accounts_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('info','warning','error','success','critical') NOT NULL DEFAULT 'info',
	`title` varchar(200) NOT NULL,
	`titleAr` varchar(200),
	`message` text NOT NULL,
	`messageAr` text,
	`relatedEntityType` varchar(100),
	`relatedEntityId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`customerName` varchar(200) NOT NULL,
	`customerEmail` varchar(320),
	`customerPhone` varchar(20),
	`productName` varchar(300) NOT NULL,
	`productDescription` text,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','processing','confirmed','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`shippingAddress` text,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportName` varchar(200) NOT NULL,
	`reportNameAr` varchar(200),
	`reportType` enum('sales','financial','orders','transactions','ethical_compliance','custom') NOT NULL,
	`description` text,
	`descriptionAr` text,
	`reportConfig` json NOT NULL,
	`reportData` json,
	`isScheduled` boolean NOT NULL DEFAULT false,
	`scheduleFrequency` enum('daily','weekly','monthly','quarterly'),
	`nextRunAt` timestamp,
	`lastRunAt` timestamp,
	`status` enum('draft','generating','completed','failed') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionNumber` varchar(50) NOT NULL,
	`userId` int NOT NULL,
	`planName` varchar(200) NOT NULL,
	`planDescription` text,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`billingCycle` enum('monthly','quarterly','yearly') NOT NULL,
	`status` enum('active','paused','cancelled','expired') NOT NULL DEFAULT 'active',
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`nextBillingDate` timestamp,
	`cancelledAt` timestamp,
	`paymentMethod` varchar(50),
	`lastPaymentDate` timestamp,
	`lastPaymentAmount` decimal(10,2),
	`shariaCompliant` boolean NOT NULL DEFAULT true,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_subscriptionNumber_unique` UNIQUE(`subscriptionNumber`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionNumber` varchar(50) NOT NULL,
	`type` enum('income','expense','transfer','payment','refund','subscription') NOT NULL,
	`category` varchar(100),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`description` text,
	`relatedOrderId` int,
	`relatedSubscriptionId` int,
	`paymentMethod` varchar(50),
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`shariaCompliant` boolean NOT NULL DEFAULT true,
	`ethicalCheckStatus` enum('pending','approved','rejected','review_required') NOT NULL DEFAULT 'pending',
	`ethicalCheckNotes` text,
	`ethicalCheckBy` int,
	`ethicalCheckAt` timestamp,
	`metadata` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_transactionNumber_unique` UNIQUE(`transactionNumber`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`permissions` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `ai_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`suggestionType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`description` text,
	`descriptionAr` text,
	`suggestionData` json NOT NULL,
	`confidence` decimal(5,2) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`userFeedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	CONSTRAINT `ai_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dynamic_icons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`iconName` varchar(100) NOT NULL,
	`iconNameAr` varchar(100),
	`iconEmoji` varchar(10) NOT NULL,
	`taskType` varchar(100) NOT NULL,
	`description` text,
	`descriptionAr` text,
	`actionConfig` json NOT NULL,
	`usageCount` int NOT NULL DEFAULT 0,
	`lastUsed` timestamp,
	`isVisible` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dynamic_icons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `google_drive_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`filePath` text NOT NULL,
	`shareableLink` text,
	`purpose` varchar(255),
	`metadata` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastModified` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_drive_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_patterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskType` varchar(100) NOT NULL,
	`taskName` varchar(255) NOT NULL,
	`taskNameAr` varchar(255),
	`frequency` int NOT NULL DEFAULT 0,
	`lastUsed` timestamp NOT NULL DEFAULT (now()),
	`avgTimeSpent` int,
	`confidence` decimal(5,2) DEFAULT '0.00',
	`suggestedIcon` varchar(50),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `task_patterns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_behavior` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actionType` varchar(100) NOT NULL,
	`actionData` json,
	`context` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_behavior_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`preferredLanguage` varchar(10) NOT NULL DEFAULT 'ar',
	`theme` varchar(20) NOT NULL DEFAULT 'light',
	`notificationsEnabled` boolean NOT NULL DEFAULT true,
	`autoSuggestIcons` boolean NOT NULL DEFAULT true,
	`customSettings` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `content_calendar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`description` text,
	`contentType` enum('social_post','blog_article','video','infographic','newsletter','ad_campaign') NOT NULL,
	`platform` varchar(100),
	`scheduledDate` timestamp NOT NULL,
	`publishedDate` timestamp,
	`status` enum('draft','scheduled','published','archived') NOT NULL DEFAULT 'draft',
	`content` text,
	`hashtags` json,
	`mediaFiles` json,
	`views` int DEFAULT 0,
	`likes` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`shares` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`engagementRate` varchar(10),
	`relatedCampaignId` int,
	`relatedProductId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_calendar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`templateName` varchar(255) NOT NULL,
	`templateNameAr` varchar(255),
	`description` text,
	`category` varchar(100),
	`contentType` enum('social_post','blog_article','video_script','email','ad_copy') NOT NULL,
	`templateContent` text NOT NULL,
	`placeholders` json,
	`usageCount` int NOT NULL DEFAULT 0,
	`lastUsed` timestamp,
	`isPublic` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_image_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestNumber` varchar(50) NOT NULL,
	`requestedBy` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`productDescription` text,
	`productSKU` varchar(100),
	`imageType` enum('product_photo','lifestyle','detail_shot','360_view','video','infographic') NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`specifications` json,
	`urgency` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`deadline` timestamp,
	`notes` text,
	`status` enum('pending','assigned','in_progress','review','completed','cancelled') NOT NULL DEFAULT 'pending',
	`assignedTo` int,
	`assignedAt` timestamp,
	`completedImages` json,
	`completedAt` timestamp,
	`rating` int,
	`feedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_image_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_image_requests_requestNumber_unique` UNIQUE(`requestNumber`)
);
--> statement-breakpoint
CREATE TABLE `team_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromUserId` int NOT NULL,
	`toUserId` int,
	`toDepartment` varchar(100),
	`notificationType` enum('image_request','content_approval','task_assignment','deadline_reminder','feedback_request','general') NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`message` text NOT NULL,
	`messageAr` text,
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`actionRequired` boolean NOT NULL DEFAULT false,
	`actionUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_sales_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`report_date` timestamp NOT NULL,
	`now_orders_count` int DEFAULT 0,
	`now_pieces_count` int DEFAULT 0,
	`now_revenue` decimal(10,2) DEFAULT '0',
	`one_orders_count` int DEFAULT 0,
	`one_pieces_count` int DEFAULT 0,
	`one_revenue` decimal(10,2) DEFAULT '0',
	`factory_orders_count` int DEFAULT 0,
	`factory_pieces_count` int DEFAULT 0,
	`factory_revenue` decimal(10,2) DEFAULT '0',
	`external_orders_count` int DEFAULT 0,
	`external_pieces_count` int DEFAULT 0,
	`external_revenue` decimal(10,2) DEFAULT '0',
	`website_orders_count` int DEFAULT 0,
	`website_pieces_count` int DEFAULT 0,
	`website_revenue` decimal(10,2) DEFAULT '0',
	`total_orders_count` int DEFAULT 0,
	`total_pieces_count` int DEFAULT 0,
	`total_revenue` decimal(10,2) DEFAULT '0',
	`shipped_orders_count` int DEFAULT 0,
	`shipped_pieces_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `daily_sales_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `factory_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batch_number` varchar(100) NOT NULL,
	`product_id` int NOT NULL,
	`quantity` int NOT NULL,
	`supplier_price` decimal(10,2) NOT NULL,
	`total_cost` decimal(10,2) NOT NULL,
	`delivery_date` timestamp,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `factory_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`size` varchar(10),
	`color` varchar(50),
	`quantity` int NOT NULL DEFAULT 0,
	`min_stock_level` int DEFAULT 10,
	`location` varchar(100),
	`last_restocked` timestamp,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`product_id` int NOT NULL,
	`size` varchar(10),
	`color` varchar(50),
	`quantity` int NOT NULL DEFAULT 1,
	`unit_price` decimal(10,2) NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`old_status` varchar(50),
	`new_status` varchar(50) NOT NULL,
	`changed_by` int,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `order_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_size_charts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`size` varchar(10) NOT NULL,
	`length_cm` decimal(5,2),
	`width_cm` decimal(5,2),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_size_charts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model_code` varchar(50) NOT NULL,
	`supplier_price` decimal(10,2) NOT NULL,
	`selling_price` decimal(10,2),
	`category` varchar(50),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_model_code_unique` UNIQUE(`model_code`)
);
--> statement-breakpoint
CREATE TABLE `replacements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`original_order_id` int NOT NULL,
	`new_order_id` int,
	`reason` text NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `replacements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `returns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipment_id` int NOT NULL,
	`order_id` int NOT NULL,
	`return_reason` varchar(255) NOT NULL,
	`return_date` timestamp,
	`refund_amount` decimal(10,2),
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `returns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`shipping_company` varchar(50) NOT NULL,
	`waybill_number` varchar(100),
	`shipping_date` timestamp,
	`delivery_date` timestamp,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`shipping_cost` decimal(10,2),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventory_id` int NOT NULL,
	`alert_type` varchar(50) NOT NULL,
	`message` text NOT NULL,
	`is_resolved` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`resolved_at` timestamp,
	CONSTRAINT `stock_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account_generation_logs` ADD CONSTRAINT `account_generation_logs_generated_by_users_id_fk` FOREIGN KEY (`generated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_monthly_data` ADD CONSTRAINT `employee_monthly_data_account_id_monthly_employee_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `monthly_employee_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_suggestions` ADD CONSTRAINT `ai_suggestions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dynamic_icons` ADD CONSTRAINT `dynamic_icons_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `google_drive_files` ADD CONSTRAINT `google_drive_files_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `google_drive_files` ADD CONSTRAINT `google_drive_files_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task_patterns` ADD CONSTRAINT `task_patterns_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_behavior` ADD CONSTRAINT `user_behavior_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD CONSTRAINT `user_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_calendar` ADD CONSTRAINT `content_calendar_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_templates` ADD CONSTRAINT `content_templates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_image_requests` ADD CONSTRAINT `product_image_requests_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_image_requests` ADD CONSTRAINT `product_image_requests_assignedTo_users_id_fk` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_notifications` ADD CONSTRAINT `team_notifications_fromUserId_users_id_fk` FOREIGN KEY (`fromUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_notifications` ADD CONSTRAINT `team_notifications_toUserId_users_id_fk` FOREIGN KEY (`toUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `factory_batches` ADD CONSTRAINT `factory_batches_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_size_charts` ADD CONSTRAINT `product_size_charts_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `replacements` ADD CONSTRAINT `replacements_original_order_id_orders_id_fk` FOREIGN KEY (`original_order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `replacements` ADD CONSTRAINT `replacements_new_order_id_orders_id_fk` FOREIGN KEY (`new_order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `returns` ADD CONSTRAINT `returns_shipment_id_shipments_id_fk` FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `returns` ADD CONSTRAINT `returns_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_alerts` ADD CONSTRAINT `stock_alerts_inventory_id_inventory_id_fk` FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`) ON DELETE no action ON UPDATE no action;