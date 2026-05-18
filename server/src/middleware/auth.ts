import type { Context, Next } from "hono";
import { verifyAccessToken } from "../lib/jwt";

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = header.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    return c.json({ error: "Invalid token" }, 401);
  }

  c.set("userId", payload.userId);
  await next();
}
