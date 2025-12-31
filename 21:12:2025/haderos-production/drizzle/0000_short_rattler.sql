CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(255),
	`code` varchar(50) NOT NULL,
	`commission_rate` decimal(5,2) NOT NULL,
	`total_earnings` decimal(10,2) NOT NULL DEFAULT '0.00',
	`pending_earnings` decimal(10,2) NOT NULL DEFAULT '0.00',
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`joined_at` timestamp DEFAULT (now()),
	`last_activity` timestamp,
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `cod_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` varchar(50) NOT NULL,
	`customer_name` varchar(255) NOT NULL,
	`customer_phone` varchar(20) NOT NULL,
	`customer_email` varchar(255),
	`shipping_address` json NOT NULL,
	`order_amount` decimal(10,2) NOT NULL,
	`cod_amount` decimal(10,2) NOT NULL,
	`current_stage` varchar(50) NOT NULL DEFAULT 'pending',
	`stages` json NOT NULL,
	`tracking_number` varchar(100),
	`shipping_company_id` int,
	`allocated_shipping_point` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `cod_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `cod_orders_order_id_unique` UNIQUE(`order_id`)
);
--> statement-breakpoint
CREATE TABLE `cod_settlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` varchar(50) NOT NULL,
	`collected_amount` decimal(10,2) NOT NULL,
	`collection_date` timestamp,
	`settlement_date` timestamp,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `cod_settlements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cod_workflow_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` varchar(50) NOT NULL,
	`stage` varchar(50) NOT NULL,
	`description` text,
	`data` json,
	`agent_id` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `cod_workflow_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_streams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`stream_key` varchar(255) NOT NULL,
	`platform` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'scheduled',
	`scheduled_start` timestamp,
	`actual_start` timestamp,
	`actual_end` timestamp,
	`viewers_count` int DEFAULT 0,
	`orders_count` int DEFAULT 0,
	`revenue` decimal(10,2) DEFAULT '0.00',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `live_streams_id` PRIMARY KEY(`id`),
	CONSTRAINT `live_streams_stream_key_unique` UNIQUE(`stream_key`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`product_id` int NOT NULL,
	`variant_id` int,
	`quantity` int NOT NULL,
	`unit_price` decimal(10,2) NOT NULL,
	`total_price` decimal(10,2) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_number` varchar(50) NOT NULL,
	`customer_id` int,
	`affiliate_id` int,
	`total_amount` decimal(10,2) NOT NULL,
	`discount_amount` decimal(10,2) DEFAULT '0.00',
	`final_amount` decimal(10,2) NOT NULL,
	`payment_method` varchar(20) NOT NULL,
	`payment_status` varchar(20) NOT NULL DEFAULT 'pending',
	`order_status` varchar(20) NOT NULL DEFAULT 'pending',
	`shipping_status` varchar(20) NOT NULL DEFAULT 'pending',
	`shipping_address` json NOT NULL,
	`shipping_method` varchar(50),
	`shipping_cost` decimal(10,2),
	`items` json NOT NULL,
	`order_date` timestamp DEFAULT (now()),
	`estimated_delivery` timestamp,
	`actual_delivery` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_order_number_unique` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`subcategory` varchar(100),
	`brand` varchar(100),
	`cost_price` decimal(10,2) NOT NULL,
	`selling_price` decimal(10,2) NOT NULL,
	`wholesale_price` decimal(10,2),
	`current_stock` int NOT NULL DEFAULT 0,
	`min_stock_level` int NOT NULL DEFAULT 10,
	`max_stock_level` int NOT NULL DEFAULT 100,
	`reorder_point` int NOT NULL DEFAULT 20,
	`images` json,
	`specifications` json,
	`tags` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `shipping_companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(50) NOT NULL,
	`api_key` varchar(255),
	`api_secret` varchar(255),
	`base_url` varchar(255),
	`is_active` boolean NOT NULL DEFAULT true,
	`priority` int NOT NULL DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `shipping_companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `shipping_companies_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `shipping_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company_id` int NOT NULL,
	`level` varchar(20) NOT NULL,
	`level_id` varchar(100) NOT NULL,
	`total_shipments` int NOT NULL DEFAULT 0,
	`successful_shipments` int NOT NULL DEFAULT 0,
	`total_delivery_days` int NOT NULL DEFAULT 0,
	`total_customer_rating` int NOT NULL DEFAULT 0,
	`failure_reasons` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipping_performance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`contact_person` varchar(255),
	`phone` varchar(20),
	`email` varchar(255),
	`country` varchar(100),
	`lead_time` int NOT NULL DEFAULT 7,
	`min_order_quantity` int NOT NULL,
	`payment_terms` varchar(255),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level` varchar(20) NOT NULL,
	`module` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`data` json,
	`user_id` int,
	`ip_address` varchar(45),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `system_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `code_idx` ON `affiliates` (`code`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `affiliates` (`status`);--> statement-breakpoint
CREATE INDEX `order_id_idx` ON `cod_orders` (`order_id`);--> statement-breakpoint
CREATE INDEX `customer_phone_idx` ON `cod_orders` (`customer_phone`);--> statement-breakpoint
CREATE INDEX `current_stage_idx` ON `cod_orders` (`current_stage`);--> statement-breakpoint
CREATE INDEX `shipping_company_id_idx` ON `cod_orders` (`shipping_company_id`);--> statement-breakpoint
CREATE INDEX `order_id_idx` ON `cod_settlements` (`order_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `cod_settlements` (`status`);--> statement-breakpoint
CREATE INDEX `order_id_idx` ON `cod_workflow_logs` (`order_id`);--> statement-breakpoint
CREATE INDEX `stage_idx` ON `cod_workflow_logs` (`stage`);--> statement-breakpoint
CREATE INDEX `stream_key_idx` ON `live_streams` (`stream_key`);--> statement-breakpoint
CREATE INDEX `platform_idx` ON `live_streams` (`platform`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `live_streams` (`status`);--> statement-breakpoint
CREATE INDEX `order_id_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `product_id_idx` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `order_number_idx` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `customer_id_idx` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `affiliate_id_idx` ON `orders` (`affiliate_id`);--> statement-breakpoint
CREATE INDEX `order_status_idx` ON `orders` (`order_status`);--> statement-breakpoint
CREATE INDEX `sku_idx` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `code_idx` ON `shipping_companies` (`code`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `shipping_companies` (`is_active`);--> statement-breakpoint
CREATE INDEX `company_id_idx` ON `shipping_performance` (`company_id`);--> statement-breakpoint
CREATE INDEX `level_idx` ON `shipping_performance` (`level`,`level_id`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `suppliers` (`is_active`);--> statement-breakpoint
CREATE INDEX `level_idx` ON `system_logs` (`level`);--> statement-breakpoint
CREATE INDEX `module_idx` ON `system_logs` (`module`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `system_logs` (`created_at`);