export const env = {
  DATABASE_URL: Deno.env.get("DATABASE_URL")!,
  OLD_DATABASE_URL: Deno.env.get("OLD_DATABASE_URL")!,
  BETTER_AUTH_SECRET: Deno.env.get("BETTER_AUTH_SECRET")!,
  ALLOWED_ORIGINS: Deno.env.get("ALLOWED_ORIGINS")!,
  DEV_CYCLE_SDK_KEY: Deno.env.get("DEV_CYCLE_SDK_KEY")!,
};
