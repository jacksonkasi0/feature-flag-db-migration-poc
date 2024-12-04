// ** import db
import { db } from "@/db/index.ts";

// ** import 3pl
import { migrate } from "drizzle-orm/node-postgres/migrator";

const main = async () => {
  try {
    await migrate(db, {
      migrationsFolder: "./drizzle", // Path to your migrations folder
    });

    console.log("Migration successful");
  } catch (error) {
    console.error("Migration failed:", error);
    Deno.exit(1); // End process
  }
};

await main();
