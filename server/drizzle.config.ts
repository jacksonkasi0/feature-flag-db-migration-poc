import { defineConfig } from "drizzle-kit";

// ** import config
import { env } from "@/config/index.ts";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
