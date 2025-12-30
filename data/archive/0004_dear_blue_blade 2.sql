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
ALTER TABLE `replacements` ADD CONSTRAINT `replacements_original_order_id_orders_id_fk` FOREIGN KEY (`original_order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `replacements` ADD CONSTRAINT `replacements_new_order_id_orders_id_fk` FOREIGN KEY (`new_order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `returns` ADD CONSTRAINT `returns_shipment_id_shipments_id_fk` FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `returns` ADD CONSTRAINT `returns_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_alerts` ADD CONSTRAINT `stock_alerts_inventory_id_inventory_id_fk` FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`) ON DELETE no action ON UPDATE no action;