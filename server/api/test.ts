import { Hono } from "hono";
import { handle } from "hono/vercel";

export const runtime = "nodejs";

const app = new Hono();

app.get("/api/test", (c) => {
  return c.json({
    status: "ok",
    message: "Hono on Vercel is working!",
    env: {
      NODE_ENV: process.env.NODE_ENV,
      HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    }
  });
});

export default handle(app);
