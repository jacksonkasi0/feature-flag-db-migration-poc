import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { env } from "@/config/index.ts";
import * as schema from "@/db/schema/index.ts";
import { evaluateFlags } from "@/lib/flags/feature_flags.ts";

// Create Drizzle instances for both databases with the schema
const newDb: NodePgDatabase<typeof schema> = drizzle(env.DATABASE_URL!, {
  schema,
});

const oldDb: NodePgDatabase<typeof schema> = drizzle(env.OLD_DATABASE_URL!, {
  schema,
});

// Default user context
const defaultUserContext = {
  user_id: "anonymous", // Default user ID
  country: "unknown",   // Default country
};

/**
 * A wrapper for the Drizzle ORM database object.
 * Dynamically chooses the correct database (new or old) based on feature flags.
 * Uses a default user context if not explicitly provided.
 */
export const db: NodePgDatabase<typeof schema> = new Proxy(newDb, {
  get(target, prop) {
    if (typeof target[prop as keyof typeof target] === "function") {
      // Methods that return query builders
      if (["select", "insert", "update", "delete"].includes(prop as string)) {
        return (...args: any[]) => {
          const queryBuilderNewDb = (newDb as any)[prop](...args);
          const queryBuilderOldDb = (oldDb as any)[prop](...args);

          // Return a proxy over the query builder
          return createDualQueryBuilder(queryBuilderNewDb, queryBuilderOldDb, prop as string);
        };
      } else {
        // For other functions, default to the new database
        return (...args: any[]) => {
          return (newDb as any)[prop](...args);
        };
      }
    } else {
      // Return properties directly for non-function calls
      return target[prop as keyof typeof target];
    }
  },
});

function createDualQueryBuilder(
  queryBuilderNewDb: any,
  queryBuilderOldDb: any,
  operationType: string
): any {
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'then') {
          return (onFulfilled: any, onRejected: any) => {
            return (async () => {
              // Extract userContext
              const userContext = defaultUserContext; // Adjust as needed or extract from somewhere if provided

              // Evaluate feature flags
              const flags = await evaluateFlags(userContext);
              const {
                writeToNewDB,
                writeToOldDB,
                readFromNewDB,
                readFromOldDB,
              } = flags;

              if (operationType === "select") {
                // Read operation
                let results: any[] = [];
                if (readFromNewDB) {
                  results = results.concat(
                    await queryBuilderNewDb
                  );
                }
                if (readFromOldDB) {
                  results = results.concat(
                    await queryBuilderOldDb
                  );
                }
                return results;
              } else {
                // Write operation
                const promises = [];
                if (writeToNewDB) {
                  promises.push(queryBuilderNewDb);
                }
                if (writeToOldDB) {
                  promises.push(queryBuilderOldDb);
                }
                return Promise.all(promises);
              }
            })().then(onFulfilled, onRejected);
          };
        } else {
          // For chainable methods, apply them to both query builders
          const methodNewDb = queryBuilderNewDb[prop];
          const methodOldDb = queryBuilderOldDb[prop];

          if (typeof methodNewDb === 'function' && typeof methodOldDb === 'function') {
            return (...args: any[]) => {
              const newQueryBuilderNewDb = methodNewDb.apply(queryBuilderNewDb, args);
              const newQueryBuilderOldDb = methodOldDb.apply(queryBuilderOldDb, args);
              return createDualQueryBuilder(newQueryBuilderNewDb, newQueryBuilderOldDb, operationType);
            };
          } else {
            // Return property from newDb's query builder
            return methodNewDb;
          }
        }
      },
    }
  );
}
