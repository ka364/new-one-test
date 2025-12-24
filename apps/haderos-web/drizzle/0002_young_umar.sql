CREATE TABLE `advertising_expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('facebook','instagram','google','tiktok','snapchat','other') NOT NULL,
	`campaign_name` varchar(255) NOT NULL,
	`campaign_id` varchar(255),
	`date` timestamp NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'EGP',
	`impressions` int,
	`clicks` int,
	`conversions` int,
	`revenue` decimal(10,2),
	`cpc` decimal(8,4),
	`cpm` decimal(8,4),
	`cpa` decimal(10,2),
	`roas` decimal(8,2),
	`status` enum('active','paused','completed') DEFAULT 'active',
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advertising_expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`date` timestamp NOT NULL,
	`status` enum('present','absent','late','half_day','leave','holiday') NOT NULL,
	`check_in` timestamp,
	`check_out` timestamp,
	`hours_worked` decimal(5,2),
	`overtime_hours` decimal(5,2) DEFAULT '0.00',
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_number` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(255),
	`national_id` varchar(20),
	`department` enum('sales','home_based','factory','management','logistics') NOT NULL,
	`position` varchar(100),
	`hire_date` timestamp NOT NULL,
	`base_salary` decimal(10,2) NOT NULL,
	`allowances` decimal(8,2) DEFAULT '0.00',
	`commission_rate` decimal(5,2),
	`commission_type` enum('per_order','percentage','tiered'),
	`status` enum('active','on_leave','suspended','terminated') DEFAULT 'active',
	`bank_name` varchar(100),
	`bank_account` varchar(50),
	`insurance_number` varchar(50),
	`insurance_amount` decimal(8,2),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_employee_number_unique` UNIQUE(`employee_number`)
);
--> statement-breakpoint
CREATE TABLE `factory_supply_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_number` varchar(100) NOT NULL,
	`supplier_name` varchar(255) NOT NULL,
	`supplier_contact` varchar(20),
	`items` json NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	`shipping_cost` decimal(8,2) DEFAULT '0.00',
	`total_cost` decimal(12,2) NOT NULL,
	`expected_delivery_date` timestamp,
	`actual_delivery_date` timestamp,
	`status` enum('pending','confirmed','in_production','shipped','delivered','cancelled') DEFAULT 'pending',
	`payment_status` enum('pending','partial','paid') DEFAULT 'pending',
	`paid_amount` decimal(12,2) DEFAULT '0.00',
	`inspection_status` enum('pending','passed','failed','partial'),
	`inspection_notes` text,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `factory_supply_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `factory_supply_orders_order_number_unique` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `financial_summary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`period` varchar(7) NOT NULL,
	`period_type` enum('daily','weekly','monthly','quarterly','yearly') DEFAULT 'monthly',
	`total_revenue` decimal(15,2) NOT NULL,
	`b2c_revenue` decimal(15,2) DEFAULT '0.00',
	`b2b_revenue` decimal(15,2) DEFAULT '0.00',
	`cogs` decimal(15,2) NOT NULL,
	`gross_profit` decimal(15,2) NOT NULL,
	`gross_margin` decimal(5,2),
	`employee_expenses` decimal(12,2) DEFAULT '0.00',
	`advertising_expenses` decimal(12,2) DEFAULT '0.00',
	`subscription_expenses` decimal(10,2) DEFAULT '0.00',
	`shipping_expenses` decimal(10,2) DEFAULT '0.00',
	`operational_expenses` decimal(10,2) DEFAULT '0.00',
	`total_expenses` decimal(15,2) NOT NULL,
	`net_profit` decimal(15,2) NOT NULL,
	`net_margin` decimal(5,2),
	`cash_inflow` decimal(15,2) NOT NULL,
	`cash_outflow` decimal(15,2) NOT NULL,
	`net_cash_flow` decimal(15,2) NOT NULL,
	`total_orders` int DEFAULT 0,
	`average_order_value` decimal(10,2),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financial_summary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operational_expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('rent','utilities','maintenance','supplies','transportation','packaging','miscellaneous') NOT NULL,
	`description` varchar(500) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'EGP',
	`expense_date` timestamp NOT NULL,
	`payment_method` enum('cash','bank_transfer','credit_card','check'),
	`payment_reference` varchar(255),
	`approved_by` int,
	`approval_date` timestamp,
	`receipt_url` text,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operational_expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`pay_period_start` timestamp NOT NULL,
	`pay_period_end` timestamp NOT NULL,
	`base_salary` decimal(10,2) NOT NULL,
	`allowances` decimal(8,2) DEFAULT '0.00',
	`commission` decimal(10,2) DEFAULT '0.00',
	`bonus` decimal(8,2) DEFAULT '0.00',
	`overtime` decimal(8,2) DEFAULT '0.00',
	`absences` decimal(8,2) DEFAULT '0.00',
	`advances` decimal(8,2) DEFAULT '0.00',
	`insurance` decimal(8,2) DEFAULT '0.00',
	`penalties` decimal(8,2) DEFAULT '0.00',
	`gross_pay` decimal(10,2) NOT NULL,
	`total_deductions` decimal(10,2) NOT NULL,
	`net_pay` decimal(10,2) NOT NULL,
	`payment_status` enum('pending','paid','cancelled') DEFAULT 'pending',
	`payment_date` timestamp,
	`payment_method` enum('cash','bank_transfer','check'),
	`payment_reference` varchar(255),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payroll_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payroll` ADD CONSTRAINT `payroll_employee_id_employees_id_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `platform_idx` ON `advertising_expenses` (`platform`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `advertising_expenses` (`date`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `advertising_expenses` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `employee_idx` ON `attendance` (`employee_id`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `attendance` (`date`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `attendance` (`status`);--> statement-breakpoint
CREATE INDEX `employee_number_idx` ON `employees` (`employee_number`);--> statement-breakpoint
CREATE INDEX `department_idx` ON `employees` (`department`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `employees` (`status`);--> statement-breakpoint
CREATE INDEX `order_number_idx` ON `factory_supply_orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `factory_supply_orders` (`status`);--> statement-breakpoint
CREATE INDEX `delivery_idx` ON `factory_supply_orders` (`expected_delivery_date`);--> statement-breakpoint
CREATE INDEX `period_idx` ON `financial_summary` (`period`);--> statement-breakpoint
CREATE INDEX `period_type_idx` ON `financial_summary` (`period_type`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `operational_expenses` (`category`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `operational_expenses` (`expense_date`);--> statement-breakpoint
CREATE INDEX `employee_idx` ON `payroll` (`employee_id`);--> statement-breakpoint
CREATE INDEX `month_idx` ON `payroll` (`month`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `payroll` (`payment_status`);