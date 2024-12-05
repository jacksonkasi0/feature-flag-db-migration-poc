import {
  getDevCycleClient,
  getOpenFeatureClient,
} from "@/config/devcycle_config.ts";
import { DevCycleUser } from "@devcycle/nodejs-server-sdk"; // Import the DevCycleUser type

export async function evaluateFlags(userContext: {
  user_id: string;
  country: string;
}) {
  // Construct the DevCycleUser object
  const devCycleUser: DevCycleUser = {
    user_id: userContext.user_id,
    country: userContext.country,
  };

  const evaluationContext: Record<string, any> = {
    user_id: devCycleUser.user_id,
    country: devCycleUser.country,
  };

  const devCycleClient = getDevCycleClient();
  const openFeatureClient = getOpenFeatureClient();
  openFeatureClient.setContext(evaluationContext);

  const variables = devCycleClient.allVariables(devCycleUser);
  console.log(variables);

  // Evaluate flag for writing to the old database
  const writeToOldDB = await devCycleClient.variableValue(
    devCycleUser, // Pass the correct user object
    "write",
    true // Default value (write to old DB is enabled by default)
  );
  console.log("Write to old DB flag value:", writeToOldDB);

  // Evaluate flag for writing to the new database
  const writeToNewDB = await devCycleClient.variableValue(
    devCycleUser, // Pass the correct user object
    "write",
    false // Default value (write to new DB is disabled by default)
  );
  console.log("Write to new DB flag value:", writeToNewDB);

  // Evaluate flag for reading from the old database
  const readFromOldDB = await openFeatureClient.getBooleanValue(
    "read", // Flag key
    true, // Default value (read from old DB is disabled by default)
    evaluationContext // Transformed context
  );
  console.log("Read from old DB flag value:", readFromOldDB);

  // Evaluate flag for reading from the new database
  const readFromNewDB = await openFeatureClient.getBooleanValue(
    "read", // Flag key
    false, // Default value (read from new DB is disabled by default)
    evaluationContext // Transformed context
  );
  console.log("Read from new DB flag value:", readFromNewDB);

  // Return all evaluated flags
  return {
    writeToNewDB,
    writeToOldDB,
    readFromNewDB,
    readFromOldDB,
  };
}
