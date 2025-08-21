import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v4 as uuidv4 } from "uuid";

export type Voter = typeof voters.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type BeerRound = typeof beerRounds.$inferSelect;

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
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
