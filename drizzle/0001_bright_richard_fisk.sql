CREATE TABLE `startbahn_configs` (
	`startbahn` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `votes` ADD `vote_type` text DEFAULT 'best_beer' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `votes_presentation_unique` ON `votes` (`voter_id`,`round_id`) WHERE "votes"."vote_type" = 'best_presentation';--> statement-breakpoint
CREATE INDEX `votes_round_id_idx` ON `votes` (`round_id`);--> statement-breakpoint
CREATE INDEX `votes_voter_round_type_idx` ON `votes` (`voter_id`,`round_id`,`vote_type`);