import {
  getDevCycleClient,
  getOpenFeatureClient,
} from "@/config/devcycle_config.ts";

export async function evaluateFlags(userContext: {
  user_id: string;
  country: string;
}) {
  const devCycleClient = getDevCycleClient();
  const openFeatureClient = getOpenFeatureClient();

  // Evaluate flag for writing to the new database
  const writeToNewDB = await devCycleClient.variableValue(
    "write-to-new-db",
    false, // Default value
    userContext
  );
  console.log("Write to new DB flag value:", writeToNewDB);

  // Evaluate flag for writing to the old database
  const writeToOldDB = await devCycleClient.variableValue(
    "write-to-old-db",
    true, // Default value (write to old DB is enabled by default)
    userContext
  );
  console.log("Write to old DB flag value:", writeToOldDB);

  // Evaluate flag for reading from the new database
  const readFromNewDB = await openFeatureClient.getBooleanValue(
    "read-from-new-db",
    false, // Default value
    userContext
  );
  console.log("Read from new DB flag value:", readFromNewDB);

  // Evaluate flag for reading from the old database
  const readFromOldDB = await openFeatureClient.getBooleanValue(
    "read-from-old-db",
    true, // Default value (read from old DB is enabled by default)
    userContext
  );
  console.log("Read from old DB flag value:", readFromOldDB);

  // Return all evaluated flags
  return {
    writeToNewDB,
    writeToOldDB,
    readFromNewDB,
    readFromOldDB,
  };
}
