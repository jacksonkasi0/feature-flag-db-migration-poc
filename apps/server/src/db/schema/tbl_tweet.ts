import { pgTable, serial, text, varchar, timestamp } from "drizzle-orm/pg-core";

import { user } from "@/db/schema/auth-schema.ts";

export const tweets = pgTable("tweets", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => user.id),
  createdAt: timestamp("created_at").defaultNow(),
});
