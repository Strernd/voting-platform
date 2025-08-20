import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { v4 as uuidv4 } from "uuid";

export type Voter = typeof voters.$inferSelect;
export type Vote = typeof votes.$inferSelect;

export const voters = sqliteTable("voters", {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  active: integer({ mode: "boolean" }).notNull().default(false),
});

export const votes = sqliteTable("votes", {
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  voterId: text("voter_id")
    .notNull()
    .references(() => voters.id),
  beerId: text().notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
