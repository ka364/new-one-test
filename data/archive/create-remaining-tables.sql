-- Inventory table
CREATE TABLE IF NOT EXISTS `inventory` (
  `id` int AUTO_INCREMENT NOT NULL,
  `product_id` int NOT NULL,
  `size` varchar(10),
  `color` varchar(50),
  `quantity` int NOT NULL DEFAULT 0,
  `min_stock_level` int DEFAULT 10,
  `location` varchar(100),
  `last_restocked` timestamp,
  `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `inventory_id` PRIMARY KEY(`id`),
  CONSTRAINT `inventory_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
);

-- Orders table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int AUTO_INCREMENT NOT NULL,
  `order_number` varchar(100) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `phone1` varchar(20) NOT NULL,
  `phone2` varchar(20),
  `city` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `source` varchar(50) NOT NULL,
  `brand` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL,
  `shipping_cost` decimal(10,2) DEFAULT 0,
  `notes` text,
  `created_at` timestamp DEFAULT (now()),
  `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `orders_id` PRIMARY KEY(`id`),
  CONSTRAINT `orders_order_number_unique` UNIQUE(`order_number`)
);

-- Order Items table
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int AUTO_INCREMENT NOT NULL,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `size` varchar(10),
  `color` varchar(50),
  `quantity` int NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  CONSTRAINT `order_items_id` PRIMARY KEY(`id`),
  CONSTRAINT `order_items_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  CONSTRAINT `order_items_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
);

-- Shipments table
CREATE TABLE IF NOT EXISTS `shipments` (
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
  CONSTRAINT `shipments_id` PRIMARY KEY(`id`),
  CONSTRAINT `shipments_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`)
);

-- Returns table
CREATE TABLE IF NOT EXISTS `returns` (
  `id` int AUTO_INCREMENT NOT NULL,
  `shipment_id` int NOT NULL,
  `order_id` int NOT NULL,
  `return_reason` varchar(255) NOT NULL,
  `return_date` timestamp,
  `refund_amount` decimal(10,2),
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `notes` text,
  `created_at` timestamp DEFAULT (now()),
  CONSTRAINT `returns_id` PRIMARY KEY(`id`),
  CONSTRAINT `returns_shipment_id_fk` FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`),
  CONSTRAINT `returns_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`)
);

-- Factory Batches table
CREATE TABLE IF NOT EXISTS `factory_batches` (
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
  CONSTRAINT `factory_batches_id` PRIMARY KEY(`id`),
  CONSTRAINT `factory_batches_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
);

-- Daily Sales Reports table
CREATE TABLE IF NOT EXISTS `daily_sales_reports` (
  `id` int AUTO_INCREMENT NOT NULL,
  `report_date` timestamp NOT NULL,
  `now_orders_count` int DEFAULT 0,
  `now_pieces_count` int DEFAULT 0,
  `now_revenue` decimal(10,2) DEFAULT 0,
  `one_orders_count` int DEFAULT 0,
  `one_pieces_count` int DEFAULT 0,
  `one_revenue` decimal(10,2) DEFAULT 0,
  `factory_orders_count` int DEFAULT 0,
  `factory_pieces_count` int DEFAULT 0,
  `factory_revenue` decimal(10,2) DEFAULT 0,
  `external_orders_count` int DEFAULT 0,
  `external_pieces_count` int DEFAULT 0,
  `external_revenue` decimal(10,2) DEFAULT 0,
  `website_orders_count` int DEFAULT 0,
  `website_pieces_count` int DEFAULT 0,
  `website_revenue` decimal(10,2) DEFAULT 0,
  `total_orders_count` int DEFAULT 0,
  `total_pieces_count` int DEFAULT 0,
  `total_revenue` decimal(10,2) DEFAULT 0,
  `shipped_orders_count` int DEFAULT 0,
  `shipped_pieces_count` int DEFAULT 0,
  `created_at` timestamp DEFAULT (now()),
  CONSTRAINT `daily_sales_reports_id` PRIMARY KEY(`id`)
);

-- Stock Alerts table
CREATE TABLE IF NOT EXISTS `stock_alerts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `inventory_id` int NOT NULL,
  `alert_type` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `is_resolved` boolean DEFAULT false,
  `created_at` timestamp DEFAULT (now()),
  `resolved_at` timestamp,
  CONSTRAINT `stock_alerts_id` PRIMARY KEY(`id`),
  CONSTRAINT `stock_alerts_inventory_id_fk` FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`)
);

-- Order Status History table
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` int AUTO_INCREMENT NOT NULL,
  `order_id` int NOT NULL,
  `old_status` varchar(50),
  `new_status` varchar(50) NOT NULL,
  `changed_by` int,
  `notes` text,
  `created_at` timestamp DEFAULT (now()),
  CONSTRAINT `order_status_history_id` PRIMARY KEY(`id`),
  CONSTRAINT `order_status_history_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`)
);

-- Replacements table
CREATE TABLE IF NOT EXISTS `replacements` (
  `id` int AUTO_INCREMENT NOT NULL,
  `original_order_id` int NOT NULL,
  `new_order_id` int,
  `reason` text NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `created_at` timestamp DEFAULT (now()),
  `completed_at` timestamp,
  CONSTRAINT `replacements_id` PRIMARY KEY(`id`),
  CONSTRAINT `replacements_original_order_id_fk` FOREIGN KEY (`original_order_id`) REFERENCES `orders`(`id`),
  CONSTRAINT `replacements_new_order_id_fk` FOREIGN KEY (`new_order_id`) REFERENCES `orders`(`id`)
);
