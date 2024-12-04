import { sql } from "drizzle-orm";
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  name: text("name"),
  created: timestamp("created"),
  updated: timestamp("updated"),
  deleted: timestamp("deleted"),
});
