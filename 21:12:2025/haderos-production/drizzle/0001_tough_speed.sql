CREATE TABLE `affiliate_commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`orderId` int NOT NULL,
	`orderAmount` decimal(10,2) NOT NULL,
	`commissionRate` decimal(5,2) NOT NULL,
	`commissionAmount` decimal(10,2) NOT NULL,
	`status` enum('pending','approved','paid','cancelled') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliate_commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`affiliateCode` varchar(50) NOT NULL,
	`commissionRate` decimal(5,2) NOT NULL DEFAULT '10',
	`totalOrders` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(10,2) NOT NULL DEFAULT '0',
	`totalCommission` decimal(10,2) NOT NULL DEFAULT '0',
	`pendingCommission` decimal(10,2) NOT NULL DEFAULT '0',
	`paidCommission` decimal(10,2) NOT NULL DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `affiliates_affiliateCode_unique` UNIQUE(`affiliateCode`)
);
--> statement-breakpoint
CREATE TABLE `cod_collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`amountToCollect` decimal(10,2) NOT NULL,
	`amountCollected` decimal(10,2) NOT NULL DEFAULT '0',
	`collectionStatus` enum('pending','partial','collected','failed') NOT NULL DEFAULT 'pending',
	`shippingCompanyId` int,
	`driverName` varchar(255),
	`driverPhone` varchar(20),
	`collectedAt` timestamp,
	`settledAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cod_collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `cod_collections_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `cod_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codCollectionId` int NOT NULL,
	`transactionType` enum('collection','settlement','refund') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`transactionDate` timestamp NOT NULL DEFAULT (now()),
	`processedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cod_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `egyptian_centers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`centerCode` varchar(50) NOT NULL,
	`centerNameAr` varchar(255) NOT NULL,
	`centerNameEn` varchar(255),
	`governorateAr` varchar(100) NOT NULL,
	`governorateEn` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `egyptian_centers_id` PRIMARY KEY(`id`),
	CONSTRAINT `egyptian_centers_centerCode_unique` UNIQUE(`centerCode`)
);
--> statement-breakpoint
CREATE TABLE `group_deal_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupDealId` int NOT NULL,
	`orderId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `group_deal_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`originalPrice` decimal(10,2) NOT NULL,
	`discountedPrice` decimal(10,2) NOT NULL,
	`discountPercentage` decimal(5,2) NOT NULL,
	`minimumOrders` int NOT NULL DEFAULT 10,
	`currentOrders` int NOT NULL DEFAULT 0,
	`maximumOrders` int,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`status` enum('active','completed','cancelled','expired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `group_deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`currentStock` int NOT NULL DEFAULT 0,
	`reservedStock` int NOT NULL DEFAULT 0,
	`availableStock` int NOT NULL DEFAULT 0,
	`minimumStock` int NOT NULL DEFAULT 10,
	`maximumStock` int NOT NULL DEFAULT 100,
	`reorderPoint` int NOT NULL DEFAULT 20,
	`lastRestocked` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_productId_unique` UNIQUE(`productId`)
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`movementType` enum('in','out','adjustment','reserved','released') NOT NULL,
	`quantity` int NOT NULL,
	`previousStock` int NOT NULL,
	`newStock` int NOT NULL,
	`referenceType` varchar(50),
	`referenceId` int,
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_stream_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`liveStreamId` int NOT NULL,
	`orderId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_stream_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_streams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`streamUrl` text,
	`facebookLiveUrl` text,
	`youtubeLiveUrl` text,
	`status` enum('scheduled','live','ended') NOT NULL DEFAULT 'scheduled',
	`startedAt` timestamp,
	`endedAt` timestamp,
	`viewerCount` int DEFAULT 0,
	`orderCount` int DEFAULT 0,
	`totalRevenue` decimal(10,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `live_streams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`previousStatus` varchar(50),
	`newStatus` varchar(50) NOT NULL,
	`changedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`customerId` int,
	`customerName` varchar(255) NOT NULL,
	`customerPhone` varchar(20) NOT NULL,
	`customerAddress` text NOT NULL,
	`governorate` varchar(100) NOT NULL,
	`city` varchar(100) NOT NULL,
	`centerCode` varchar(50),
	`totalAmount` decimal(10,2) NOT NULL,
	`shippingCost` decimal(10,2) NOT NULL DEFAULT '0',
	`discount` decimal(10,2) NOT NULL DEFAULT '0',
	`finalAmount` decimal(10,2) NOT NULL,
	`paymentMethod` enum('cod','prepaid','wallet') NOT NULL DEFAULT 'cod',
	`paymentStatus` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`orderStatus` enum('pending','confirmed','preparing','ready_to_ship','shipped','out_for_delivery','delivered','cancelled','returned') NOT NULL DEFAULT 'pending',
	`source` enum('website','live_stream','whatsapp','phone','affiliate','trader') NOT NULL DEFAULT 'website',
	`affiliateId` int,
	`traderId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`confirmedAt` timestamp,
	`shippedAt` timestamp,
	`deliveredAt` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`paymentMethod` enum('cod','paymob','fawry','wallet') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('pending','processing','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`transactionId` varchar(255),
	`paymentGatewayResponse` text,
	`paidAt` timestamp,
	`refundedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameAr` varchar(255) NOT NULL,
	`nameEn` varchar(255),
	`descriptionAr` text,
	`descriptionEn` text,
	`sku` varchar(100),
	`price` decimal(10,2) NOT NULL,
	`costPrice` decimal(10,2),
	`imageUrl` text,
	`category` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`shippingCompanyId` int NOT NULL,
	`trackingNumber` varchar(100),
	`shippingStatus` enum('pending','picked_up','in_transit','out_for_delivery','delivered','failed','returned') NOT NULL DEFAULT 'pending',
	`labelUrl` text,
	`estimatedDeliveryDate` timestamp,
	`actualDeliveryDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`),
	CONSTRAINT `shipments_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `shipping_companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameAr` varchar(255) NOT NULL,
	`nameEn` varchar(255),
	`code` varchar(50) NOT NULL,
	`apiEndpoint` text,
	`apiKey` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`baseCost` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipping_companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `shipping_companies_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `shipping_company_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shippingCompanyId` int NOT NULL,
	`centerCode` varchar(50) NOT NULL,
	`totalShipments` int NOT NULL DEFAULT 0,
	`successfulDeliveries` int NOT NULL DEFAULT 0,
	`failedDeliveries` int NOT NULL DEFAULT 0,
	`averageDeliveryTime` int,
	`performanceScore` decimal(5,2),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipping_company_performance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`orderStatus` enum('pending','confirmed','shipped','received','cancelled') NOT NULL DEFAULT 'pending',
	`expectedDeliveryDate` timestamp,
	`actualDeliveryDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `supplier_orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameAr` varchar(255) NOT NULL,
	`nameEn` varchar(255),
	`contactPerson` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`address` text,
	`country` varchar(100),
	`supplierType` enum('local','chinese','other') NOT NULL DEFAULT 'local',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trader_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`traderId` int NOT NULL,
	`productId` int NOT NULL,
	`customPrice` decimal(10,2),
	`predictedSales` int,
	`actualSales` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trader_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `traders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`businessType` varchar(100),
	`taxId` varchar(100),
	`discountRate` decimal(5,2) NOT NULL DEFAULT '0',
	`totalOrders` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(10,2) NOT NULL DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `traders_id` PRIMARY KEY(`id`),
	CONSTRAINT `traders_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int,
	`customerPhone` varchar(20) NOT NULL,
	`messageType` enum('order_confirmation','shipping_update','delivery_notification','promotion','custom') NOT NULL,
	`messageContent` text NOT NULL,
	`status` enum('pending','sent','delivered','read','failed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','manager','employee','affiliate','trader','customer') NOT NULL DEFAULT 'customer';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
CREATE INDEX `affiliate_idx` ON `affiliate_commissions` (`affiliateId`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `affiliate_commissions` (`orderId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `affiliate_commissions` (`status`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `affiliates` (`userId`);--> statement-breakpoint
CREATE INDEX `code_idx` ON `affiliates` (`affiliateCode`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `cod_collections` (`orderId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `cod_collections` (`collectionStatus`);--> statement-breakpoint
CREATE INDEX `shipping_company_idx` ON `cod_collections` (`shippingCompanyId`);--> statement-breakpoint
CREATE INDEX `collection_idx` ON `cod_transactions` (`codCollectionId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `cod_transactions` (`transactionType`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `cod_transactions` (`transactionDate`);--> statement-breakpoint
CREATE INDEX `code_idx` ON `egyptian_centers` (`centerCode`);--> statement-breakpoint
CREATE INDEX `governorate_idx` ON `egyptian_centers` (`governorateAr`);--> statement-breakpoint
CREATE INDEX `deal_idx` ON `group_deal_orders` (`groupDealId`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `group_deal_orders` (`orderId`);--> statement-breakpoint
CREATE INDEX `product_idx` ON `group_deals` (`productId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `group_deals` (`status`);--> statement-breakpoint
CREATE INDEX `end_date_idx` ON `group_deals` (`endDate`);--> statement-breakpoint
CREATE INDEX `product_idx` ON `inventory` (`productId`);--> statement-breakpoint
CREATE INDEX `product_idx` ON `inventory_movements` (`productId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `inventory_movements` (`movementType`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `inventory_movements` (`createdAt`);--> statement-breakpoint
CREATE INDEX `stream_idx` ON `live_stream_orders` (`liveStreamId`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `live_stream_orders` (`orderId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `live_streams` (`status`);--> statement-breakpoint
CREATE INDEX `started_at_idx` ON `live_streams` (`startedAt`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `product_idx` ON `order_items` (`productId`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `order_status_history` (`orderId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `order_status_history` (`createdAt`);--> statement-breakpoint
CREATE INDEX `order_number_idx` ON `orders` (`orderNumber`);--> statement-breakpoint
CREATE INDEX `customer_phone_idx` ON `orders` (`customerPhone`);--> statement-breakpoint
CREATE INDEX `order_status_idx` ON `orders` (`orderStatus`);--> statement-breakpoint
CREATE INDEX `payment_method_idx` ON `orders` (`paymentMethod`);--> statement-breakpoint
CREATE INDEX `source_idx` ON `orders` (`source`);--> statement-breakpoint
CREATE INDEX `affiliate_idx` ON `orders` (`affiliateId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `orders` (`createdAt`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `payments` (`orderId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `method_idx` ON `payments` (`paymentMethod`);--> statement-breakpoint
CREATE INDEX `sku_idx` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `shipments` (`orderId`);--> statement-breakpoint
CREATE INDEX `tracking_idx` ON `shipments` (`trackingNumber`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `shipments` (`shippingStatus`);--> statement-breakpoint
CREATE INDEX `company_idx` ON `shipments` (`shippingCompanyId`);--> statement-breakpoint
CREATE INDEX `code_idx` ON `shipping_companies` (`code`);--> statement-breakpoint
CREATE INDEX `company_idx` ON `shipping_company_performance` (`shippingCompanyId`);--> statement-breakpoint
CREATE INDEX `center_idx` ON `shipping_company_performance` (`centerCode`);--> statement-breakpoint
CREATE INDEX `score_idx` ON `shipping_company_performance` (`performanceScore`);--> statement-breakpoint
CREATE INDEX `supplier_idx` ON `supplier_orders` (`supplierId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `supplier_orders` (`orderStatus`);--> statement-breakpoint
CREATE INDEX `order_number_idx` ON `supplier_orders` (`orderNumber`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `suppliers` (`supplierType`);--> statement-breakpoint
CREATE INDEX `trader_idx` ON `trader_products` (`traderId`);--> statement-breakpoint
CREATE INDEX `product_idx` ON `trader_products` (`productId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `traders` (`userId`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `whatsapp_messages` (`orderId`);--> statement-breakpoint
CREATE INDEX `phone_idx` ON `whatsapp_messages` (`customerPhone`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `whatsapp_messages` (`status`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `whatsapp_messages` (`messageType`);--> statement-breakpoint
CREATE INDEX `phone_idx` ON `users` (`phone`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);