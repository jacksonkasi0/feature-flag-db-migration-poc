import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

// ** import config
import { env } from "@/config/index.ts";

// ** import lib
import { evaluateFlags } from "@/lib/flags/feature_flags.ts";

// Configure connections for new and old databases
const newDbPool = new Pool({
  connectionString: env.DATABASE_URL,
});

const oldDbPool = new Pool({
  connectionString: env.OLD_DATABASE_URL,
});

// Create Drizzle instances for both databases
const newDb = drizzle(newDbPool);
const oldDb = drizzle(oldDbPool);

/**
 * A wrapper for the Drizzle ORM database object.
 * Dynamically chooses the correct database (new or old) based on feature flags.
 */
export const db: NodePgDatabase = new Proxy(newDb, {
  get(target, prop) {
    if (typeof target[prop as keyof typeof target] === "function") {
      return async (...args: any[]) => {
        // Evaluate feature flags
        const flags = await evaluateFlags(args[0]?.userContext || {});
        const { writeToNewDB, writeToOldDB, readFromNewDB, readFromOldDB } = flags;

        if (prop === "insert" || prop === "update" || prop === "delete") {
          // Write operations
          const promises = [];
          if (writeToNewDB) {
            promises.push((newDb as any)[prop](...args));
          }
          if (writeToOldDB) {
            promises.push((oldDb as any)[prop](...args));
          }
          return Promise.all(promises);
        } else if (prop === "select") {
          // Read operations
          let result: any = [];
          if (readFromNewDB) {
            result = result.concat(await (newDb as any)[prop](...args));
          }
          if (readFromOldDB) {
            result = result.concat(await (oldDb as any)[prop](...args));
          }
          return result;
        }

        // For other operations, default to the new database
        return (newDb as any)[prop](...args);
      };
    }

    // Return properties directly for non-function calls
    return target[prop as keyof typeof target];
  },
});