import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";

// ** import lib
import { auth } from "@/lib/auth.ts";

// ** import config
import { initializeDevCycleWithOpenFeature } from "@/config/devcycle_config.ts";

// ** import routes
// import { routes } from "@/routers";

const app = new Hono();

await initializeDevCycleWithOpenFeature()

// Enable CORS for your frontend
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    maxAge: 600,
    credentials: true,
  })
);

app.get("/", (c) => c.text("Hello⚡"));

// Auth route
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

// app.route("/api", routes);

Deno.serve(app.fetch);
