import { Hono } from "@hono/hono";

// ** import db
import { db } from "@/db/index.ts";
import { user } from "@/db/schema/index.ts";

export const usersApi = new Hono();

usersApi.get("/get-all", async (c) => {
  try {
    // Fetch users from the database
    const users = await db.select().from(user);

    return c.json(
      {
        success: true,
        message: "Successfully fetched all users",
        data: users,
      },
      200
    );
  } catch (error) {
    // Enhanced error handling with proper logging
    console.error(`Error in - usersApi GET /get-all :`, error);

    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return c.json(
      {
        success: false,
        message: "Failed to fetch users.",
        error: errorMessage,
      },
      500
    );
  }
});
