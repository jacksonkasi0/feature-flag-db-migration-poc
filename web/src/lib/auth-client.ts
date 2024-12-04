import { createAuthClient } from "better-auth/react";

// ** import config
import { env } from "@/app/config";

export const authClient = createAuthClient({
  baseURL: env.AUTH_URL,
});

export const { signIn, signOut, signUp, useSession } = authClient;
