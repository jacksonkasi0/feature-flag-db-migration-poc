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
    if (prop === 'query') {
      // Return a Proxy over newDb.query
      const queryNewDb = newDb.query;
      const queryOldDb = oldDb.query;

      return new Proxy(queryNewDb, {
        get(queryTarget, modelProp) {
          if (typeof modelProp === 'string' && modelProp in queryNewDb) {
            const modelNewDb = queryNewDb[modelProp as keyof typeof queryNewDb];
            const modelOldDb = queryOldDb[modelProp as keyof typeof queryOldDb];

            if (modelNewDb && modelOldDb) {
              // Return a Proxy over the model methods
              return new Proxy(modelNewDb, {
                get(modelTarget, methodProp) {
                  if (typeof methodProp === 'string' && typeof modelTarget[methodProp as keyof typeof modelTarget] === 'function') {
                    // Intercept method calls like findMany, findFirst, etc.
                    return (...args: any[]) => {
                      const methodNewDb = modelNewDb[methodProp as keyof typeof modelNewDb] as Function;
                      const methodOldDb = modelOldDb[methodProp as keyof typeof modelOldDb] as Function;

                      const resultNewDb = methodNewDb.apply(modelNewDb, args);
                      const resultOldDb = methodOldDb.apply(modelOldDb, args);

                      // Return a proxy over the result to allow .withUserContext
                      return createDualQueryBuilder(
                        resultNewDb,
                        resultOldDb,
                        methodProp as string
                      );
                    };
                  } else {
                    // Return property directly
                    return modelTarget[methodProp as keyof typeof modelTarget];
                  }
                }
              });
            } else {
              // Return property directly
              return queryTarget[modelProp as keyof typeof queryTarget];
            }
          } else {
            // Return property directly
            return queryTarget[modelProp as keyof typeof queryTarget];
          }
        }
      });
    } else if (typeof target[prop as keyof typeof target] === "function") {
      // Methods that return query builders
      if (["select", "insert", "update", "delete"].includes(prop as string)) {
        return (...args: any[]) => {
          const queryBuilderNewDb = (newDb as any)[prop](...args);
          const queryBuilderOldDb = (oldDb as any)[prop](...args);

          // Return a proxy over the query builder
          return createDualQueryBuilder(
            queryBuilderNewDb,
            queryBuilderOldDb,
            prop as string
          );
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
  operationType: string,
  userContext: any = defaultUserContext
): any {
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'withUserContext') {
          return (newUserContext: any) => {
            // Return a new proxy with the updated userContext
            return createDualQueryBuilder(
              queryBuilderNewDb,
              queryBuilderOldDb,
              operationType,
              newUserContext
            );
          };
        } else if (prop === 'then') {
          return (onFulfilled: any, onRejected: any) => {
            return (async () => {
              // Debug log of the userContext
              console.debug('User context:', userContext);

              // Evaluate feature flags
              const flags = await evaluateFlags(userContext);

              // Debug log of the evaluated feature flags
              console.debug('Evaluated feature flags:', flags);

              const {
                writeToNewDB,
                writeToOldDB,
                readFromNewDB,
                readFromOldDB,
              } = flags;

              // Determine if the operation is read or write
              const isReadOperation = ["select", "findMany", "findFirst", "findUnique"].includes(operationType);

              if (isReadOperation) {
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

          if (
            typeof methodNewDb === 'function' &&
            typeof methodOldDb === 'function'
          ) {
            return (...args: any[]) => {
              const newQueryBuilderNewDb = methodNewDb.apply(queryBuilderNewDb, args);
              const newQueryBuilderOldDb = methodOldDb.apply(queryBuilderOldDb, args);
              return createDualQueryBuilder(
                newQueryBuilderNewDb,
                newQueryBuilderOldDb,
                operationType,
                userContext // Pass along the current userContext
              );
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
