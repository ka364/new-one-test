CREATE TABLE `cod_orders` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`orderId` varchar(50) NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerPhone` varchar(20) NOT NULL,
	`customerEmail` varchar(255),
	`shippingAddress` json NOT NULL,
	`orderAmount` decimal(10,2) NOT NULL,
	`codAmount` decimal(10,2) NOT NULL,
	`currentStage` enum('pending','customerService','confirmation','preparation','supplier','shipping','delivery','collection','settlement') NOT NULL DEFAULT 'pending',
	`stages` json NOT NULL,
	`trackingNumber` varchar(100),
	`shippingCompany` varchar(100),
	`allocatedShippingPoint` json,
	`notifications` json,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cod_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `cod_orders_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `cod_workflow_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`orderId` varchar(50) NOT NULL,
	`stage` varchar(50) NOT NULL,
	`status` varchar(50) NOT NULL,
	`description` text,
	`data` json,
	`agentId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cod_workflow_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipping_performance` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`level` enum('point','center','governorate') NOT NULL,
	`levelId` varchar(100) NOT NULL,
	`levelName` varchar(255) NOT NULL,
	`totalShipments` int NOT NULL DEFAULT 0,
	`successfulShipments` int NOT NULL DEFAULT 0,
	`failedShipments` int NOT NULL DEFAULT 0,
	`returnedShipments` int NOT NULL DEFAULT 0,
	`totalDeliveryDays` int NOT NULL DEFAULT 0,
	`totalCustomerRating` int NOT NULL DEFAULT 0,
	`successRate` decimal(5,2) NOT NULL DEFAULT '0',
	`avgDeliveryDays` decimal(5,2) NOT NULL DEFAULT '0',
	`avgCustomerRating` decimal(3,2) NOT NULL DEFAULT '0',
	`avgPrice` decimal(10,2) NOT NULL DEFAULT '0',
	`failureReasons` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipping_performance_id` PRIMARY KEY(`id`),
	CONSTRAINT `sp_unique_performance` UNIQUE(`companyId`,`level`,`levelId`)
);
--> statement-breakpoint
CREATE INDEX `cod_order_id_idx` ON `cod_orders` (`orderId`);--> statement-breakpoint
CREATE INDEX `cod_customer_phone_idx` ON `cod_orders` (`customerPhone`);--> statement-breakpoint
CREATE INDEX `cod_current_stage_idx` ON `cod_orders` (`currentStage`);--> statement-breakpoint
CREATE INDEX `cod_status_idx` ON `cod_orders` (`status`);--> statement-breakpoint
CREATE INDEX `cod_tracking_number_idx` ON `cod_orders` (`trackingNumber`);--> statement-breakpoint
CREATE INDEX `cod_created_at_idx` ON `cod_orders` (`createdAt`);--> statement-breakpoint
CREATE INDEX `cwl_order_id_idx` ON `cod_workflow_logs` (`orderId`);--> statement-breakpoint
CREATE INDEX `cwl_stage_idx` ON `cod_workflow_logs` (`stage`);--> statement-breakpoint
CREATE INDEX `cwl_created_at_idx` ON `cod_workflow_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `sp_company_level_idx` ON `shipping_performance` (`companyId`,`level`,`levelId`);--> statement-breakpoint
CREATE INDEX `sp_level_id_idx` ON `shipping_performance` (`levelId`);--> statement-breakpoint
CREATE INDEX `sp_success_rate_idx` ON `shipping_performance` (`successRate`);