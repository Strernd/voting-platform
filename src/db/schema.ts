import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { v4 as uuidv4 } from "uuid";

export const VOTE_TYPES = {
  BEST_BEER: "best_beer",
  BEST_PRESENTATION: "best_presentation",
} as const;

export type VoteType = (typeof VOTE_TYPES)[keyof typeof VOTE_TYPES];

export type Voter = typeof voters.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type BeerRound = typeof beerRounds.$inferSelect;
export type CompetitionSettings = typeof competitionSettings.$inferSelect;
export type BeerRegistration = typeof beerRegistrations.$inferSelect;
export type StartbahnConfig = typeof startbahnConfigs.$inferSelect;

export const voters = sqliteTable("voters", {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  active: integer({ mode: "boolean" }).notNull().default(false),
});

export const rounds = sqliteTable("rounds", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  active: integer({ mode: "boolean" }).notNull().default(false),
});

export const beerRounds = sqliteTable("beer_rounds", {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  beerId: text("beer_id").notNull(),
  roundId: integer("round_id")
    .notNull()
    .references(() => rounds.id),
});

export const votes = sqliteTable("votes", {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  voterId: text("voter_id")
    .notNull()
    .references(() => voters.id),
  beerId: text().notNull(),
  roundId: integer("round_id")
    .notNull()
    .references(() => rounds.id),
  voteType: text("vote_type").notNull().default("best_beer"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const competitionSettings = sqliteTable("competition_settings", {
  id: integer().primaryKey().default(1),
  votingEnabled: integer("voting_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  startbahnCount: integer("startbahn_count").notNull().default(50),
});

export const beerRegistrations = sqliteTable(
  "beer_registrations",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    beerId: text("beer_id").notNull().unique(),
    startbahn: integer().notNull(),
    roundId: integer("round_id")
      .notNull()
      .references(() => rounds.id),
    reinheitsgebot: integer({ mode: "boolean" }).notNull().default(false),
    checkedInAt: text("checked_in_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [unique().on(table.startbahn, table.roundId)]
);

export const startbahnConfigs = sqliteTable("startbahn_configs", {
  startbahn: integer().primaryKey(),
  name: text().notNull(),
});
