import {
  initializeDevCycle,
  type DevCycleClient,
} from "@devcycle/nodejs-server-sdk";
import { OpenFeature, type Client } from "@openfeature/server-sdk";

// ** import config
import { env } from "@/config/index.ts";

const DEV_CYCLE_SDK_KEY = env.DEV_CYCLE_SDK_KEY;

if (!DEV_CYCLE_SDK_KEY) {
  throw new Error("DEV_CYCLE_SDK_KEY is not defined in environment variables.");
}

let devcycleClient: DevCycleClient;
let openFeatureClient: Client;

export const getDevCycleClient = () => devcycleClient;
export const getOpenFeatureClient = () => openFeatureClient;

export async function initializeDevCycleWithOpenFeature() {
  devcycleClient = initializeDevCycle(DEV_CYCLE_SDK_KEY, {
    logLevel: "info",
    configPollingIntervalMS: 5 * 1000, // Polling interval in milliseconds
    eventFlushIntervalMS: 1000, // Event flush interval in milliseconds
  });

  // Integrate DevCycle with OpenFeature
  await OpenFeature.setProviderAndWait(
    await devcycleClient.getOpenFeatureProvider()
  );
  openFeatureClient = OpenFeature.getClient();

  console.log("DevCycle and OpenFeature clients initialized successfully.");
  return { devcycleClient, openFeatureClient };
}
