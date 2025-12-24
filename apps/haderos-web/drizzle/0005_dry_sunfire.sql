CREATE TABLE `shopify_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`store_name` varchar(255) NOT NULL,
	`access_token` text NOT NULL,
	`api_version` varchar(50) NOT NULL DEFAULT '2025-10',
	`is_active` boolean NOT NULL DEFAULT true,
	`last_sync_at` timestamp,
	`auto_sync_enabled` boolean NOT NULL DEFAULT true,
	`sync_interval_minutes` int NOT NULL DEFAULT 15,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopify_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shopify_sync_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sync_type` enum('products','inventory','orders','customers') NOT NULL,
	`direction` enum('shopify_to_local','local_to_shopify') NOT NULL,
	`status` enum('success','partial','error') NOT NULL,
	`items_processed` int DEFAULT 0,
	`items_succeeded` int DEFAULT 0,
	`items_failed` int DEFAULT 0,
	`error_message` text,
	`error_details` json,
	`duration` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shopify_sync_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shopify_webhook_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic` varchar(100) NOT NULL,
	`shopify_id` varchar(255),
	`payload` json NOT NULL,
	`headers` json,
	`processed` boolean NOT NULL DEFAULT false,
	`processed_at` timestamp,
	`error` text,
	`retry_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shopify_webhook_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shopify_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int,
	`shopify_order_id` varchar(50) NOT NULL,
	`shopify_order_number` varchar(100) NOT NULL,
	`customer_email` varchar(255),
	`customer_phone` varchar(50),
	`total_price` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'EGP',
	`financial_status` varchar(50),
	`fulfillment_status` varchar(50),
	`order_data` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopify_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `shopify_orders_shopify_order_id_unique` UNIQUE(`shopify_order_id`)
);
--> statement-breakpoint
CREATE TABLE `shopify_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`shopify_product_id` varchar(50) NOT NULL,
	`name_ar` varchar(255) NOT NULL,
	`name_en` varchar(255) NOT NULL,
	`description_ar` text,
	`description_en` text,
	`images` json,
	`sizes` json,
	`colors` json,
	`barcode` varchar(100),
	`shopify_url` varchar(500),
	`last_synced_at` timestamp DEFAULT (now()),
	`sync_status` varchar(50) NOT NULL DEFAULT 'synced',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopify_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `shopify_products_shopify_product_id_unique` UNIQUE(`shopify_product_id`)
);
--> statement-breakpoint
CREATE TABLE `shopify_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shopify_product_table_id` int NOT NULL,
	`shopify_variant_id` varchar(50) NOT NULL,
	`inventory_id` int,
	`sku` varchar(100) NOT NULL,
	`size` varchar(50),
	`color` varchar(50),
	`price` decimal(10,2) NOT NULL,
	`compare_at_price` decimal(10,2),
	`inventory_quantity` int NOT NULL DEFAULT 0,
	`last_synced_at` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopify_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `shopify_variants_shopify_variant_id_unique` UNIQUE(`shopify_variant_id`)
);
--> statement-breakpoint
ALTER TABLE `monthly_employee_accounts` ADD `email` varchar(255);--> statement-breakpoint
ALTER TABLE `monthly_employee_accounts` ADD `email_verified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `monthly_employee_accounts` ADD `otp_code` varchar(6);--> statement-breakpoint
ALTER TABLE `monthly_employee_accounts` ADD `otp_expires_at` timestamp;--> statement-breakpoint
ALTER TABLE `monthly_employee_accounts` ADD `otp_attempts` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `shopify_orders` ADD CONSTRAINT `shopify_orders_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shopify_products` ADD CONSTRAINT `shopify_products_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shopify_variants` ADD CONSTRAINT `shopify_variants_shopify_product_table_id_shopify_products_id_fk` FOREIGN KEY (`shopify_product_table_id`) REFERENCES `shopify_products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shopify_variants` ADD CONSTRAINT `shopify_variants_inventory_id_inventory_id_fk` FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`) ON DELETE no action ON UPDATE no action;