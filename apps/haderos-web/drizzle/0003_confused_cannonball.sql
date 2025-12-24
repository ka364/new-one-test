CREATE TABLE `image_embeddings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`image_id` int NOT NULL,
	`embedding_vector` text NOT NULL,
	`model_name` varchar(100) NOT NULL,
	`model_version` varchar(50) NOT NULL,
	`vector_dimensions` int NOT NULL,
	`processing_time` int,
	`confidence` decimal(5,4),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `image_embeddings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_barcodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`barcode_type` varchar(50) NOT NULL,
	`barcode_value` varchar(255) NOT NULL,
	`size` varchar(10),
	`color` varchar(50),
	`is_active` boolean DEFAULT true,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_barcodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_barcodes_barcode_value_unique` UNIQUE(`barcode_value`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`s3_url` varchar(500) NOT NULL,
	`s3_key` varchar(255) NOT NULL,
	`image_type` varchar(50) NOT NULL DEFAULT 'product',
	`is_primary` boolean DEFAULT false,
	`sort_order` int DEFAULT 0,
	`original_url` varchar(500),
	`width` int,
	`height` int,
	`file_size` int,
	`mime_type` varchar(50),
	`uploaded_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visual_search_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`search_image_url` varchar(500),
	`search_image_s3_key` varchar(255),
	`top_result_product_id` int,
	`top_result_similarity` decimal(5,4),
	`total_results` int,
	`user_id` int,
	`user_role` varchar(50),
	`search_context` varchar(100),
	`search_duration` int,
	`was_helpful` boolean,
	`selected_product_id` int,
	`searched_at` timestamp DEFAULT (now()),
	CONSTRAINT `visual_search_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `image_embeddings` ADD CONSTRAINT `image_embeddings_image_id_product_images_id_fk` FOREIGN KEY (`image_id`) REFERENCES `product_images`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_barcodes` ADD CONSTRAINT `product_barcodes_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visual_search_history` ADD CONSTRAINT `visual_search_history_top_result_product_id_products_id_fk` FOREIGN KEY (`top_result_product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visual_search_history` ADD CONSTRAINT `visual_search_history_selected_product_id_products_id_fk` FOREIGN KEY (`selected_product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `image_id_idx` ON `image_embeddings` (`image_id`);--> statement-breakpoint
CREATE INDEX `model_idx` ON `image_embeddings` (`model_name`,`model_version`);--> statement-breakpoint
CREATE INDEX `product_id_idx` ON `product_barcodes` (`product_id`);--> statement-breakpoint
CREATE INDEX `barcode_value_idx` ON `product_barcodes` (`barcode_value`);--> statement-breakpoint
CREATE INDEX `product_id_idx` ON `product_images` (`product_id`);--> statement-breakpoint
CREATE INDEX `is_primary_idx` ON `product_images` (`is_primary`);--> statement-breakpoint
CREATE INDEX `searched_at_idx` ON `visual_search_history` (`searched_at`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `visual_search_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `context_idx` ON `visual_search_history` (`search_context`);