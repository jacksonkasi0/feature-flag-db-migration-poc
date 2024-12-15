import { Hono } from "@hono/hono";

// ** import routes
import { usersApi } from "./users/index.ts";

export const routes = new Hono();

routes.route("/users", usersApi);

