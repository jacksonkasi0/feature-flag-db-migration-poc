// ** import db
import { db } from "@/db/index.ts";
import * as schema from "@/db/schema/index.ts";

// ** import 3pl
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// ** import config
import { env } from "@/config/index.ts";

// Define and export the Better Auth configuration
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or 'pg' or 'mysql'
    schema,
  }),
  secret: env.BETTER_AUTH_SECRET || undefined,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
});
