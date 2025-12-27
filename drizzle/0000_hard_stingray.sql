CREATE TABLE `beer_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`beer_id` text NOT NULL,
	`startbahn` integer NOT NULL,
	`round_id` integer NOT NULL,
	`reinheitsgebot` integer DEFAULT false NOT NULL,
	`checked_in_at` text NOT NULL,
	FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `beer_registrations_beer_id_unique` ON `beer_registrations` (`beer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `beer_registrations_startbahn_round_id_unique` ON `beer_registrations` (`startbahn`,`round_id`);--> statement-breakpoint
CREATE TABLE `beer_rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`beer_id` text NOT NULL,
	`round_id` integer NOT NULL,
	FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `competition_settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`voting_enabled` integer DEFAULT false NOT NULL,
	`startbahn_count` integer DEFAULT 50 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `voters` (
	`id` text PRIMARY KEY NOT NULL,
	`active` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`voter_id` text NOT NULL,
	`beerId` text NOT NULL,
	`round_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`voter_id`) REFERENCES `voters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON UPDATE no action ON DELETE no action
);
