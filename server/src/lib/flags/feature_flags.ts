import {
  getDevCycleClient,
  getOpenFeatureClient,
} from "@/config/devcycle_config.ts";
import { DevCycleUser } from "@devcycle/nodejs-server-sdk"; // Import the DevCycleUser type

export async function evaluateFlags(userContext: {
  user_id: string;
  country: string;
}) {
  const devCycleClient = getDevCycleClient();
  const openFeatureClient = getOpenFeatureClient();

  // Construct the DevCycleUser object
  const devCycleUser: DevCycleUser = {
    user_id: userContext.user_id,
    country: userContext.country,
  };

  const evaluationContext: Record<string, any> = {
    user_id: devCycleUser.user_id,
    country: devCycleUser.country,
  };

  // Evaluate flag for writing to the new database
  const writeToNewDB = await devCycleClient.variableValue(
    devCycleUser, // Pass the correct user object
    "write-to-new-db",
    false // Default value
  );
  console.log("Write to new DB flag value:", writeToNewDB);

  // Evaluate flag for writing to the old database
  const writeToOldDB = await devCycleClient.variableValue(
    devCycleUser, // Pass the correct user object
    "write-to-old-db",
    true // Default value (write to old DB is enabled by default)
  );
  console.log("Write to old DB flag value:", writeToOldDB);

  // Evaluate flag for reading from the new database
  const readFromNewDB = await openFeatureClient.getBooleanValue(
    "read-from-new-db", // Flag key
    false, // Default value
    evaluationContext // Transformed context
  );
  console.log("Read from new DB flag value:", readFromNewDB);

  // Evaluate flag for reading from the old database
  const readFromOldDB = await openFeatureClient.getBooleanValue(
    "read-from-old-db", // Flag key
    true, // Default value
    evaluationContext // Transformed context
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
