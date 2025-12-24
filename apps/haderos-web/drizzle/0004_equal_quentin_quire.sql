CREATE TABLE `founder_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`username` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` varchar(100) NOT NULL,
	`title` varchar(255),
	`is_active` boolean NOT NULL DEFAULT true,
	`current_month` varchar(7) NOT NULL,
	`password_expires_at` timestamp NOT NULL,
	`last_password_change_at` timestamp DEFAULT (now()),
	`permissions` json,
	`last_login_at` timestamp,
	`last_login_ip` varchar(45),
	`login_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `founder_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `founder_accounts_email_unique` UNIQUE(`email`),
	CONSTRAINT `founder_accounts_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `founder_login_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`founder_id` int NOT NULL,
	`login_at` timestamp NOT NULL DEFAULT (now()),
	`ip_address` varchar(45),
	`user_agent` text,
	`success` boolean NOT NULL,
	`failure_reason` varchar(255),
	`session_id` varchar(255),
	`session_duration` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `founder_login_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `founder_login_history` ADD CONSTRAINT `founder_login_history_founder_id_founder_accounts_id_fk` FOREIGN KEY (`founder_id`) REFERENCES `founder_accounts`(`id`) ON DELETE no action ON UPDATE no action;