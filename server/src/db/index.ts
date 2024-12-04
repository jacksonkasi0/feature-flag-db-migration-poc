import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "@/config/index.ts";

export const db = drizzle(env.DATABASE_URL!);
