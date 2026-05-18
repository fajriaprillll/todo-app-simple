import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { authMiddleware } from "../middleware/auth";
import "../types";

export const authRouter = new Hono();

const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/register", zValidator("json", registerSchema), async (c) => {
  const { name, email, password } = c.req.valid("json");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return c.json({ error: "Email already in use" }, 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return c.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, image: null },
  });
});

authRouter.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return c.json({ error: "Invalid credentials" }, 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return c.json({ error: "Invalid credentials" }, 401);

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return c.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, image: null },
  });
});

authRouter.post("/refresh", async (c) => {
  const { refreshToken } = await c.req.json();
  if (!refreshToken) return c.json({ error: "Refresh token required" }, 400);

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return c.json({ error: "Invalid refresh token" }, 401);

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });
  if (!stored || stored.expiresAt < new Date()) {
    return c.json({ error: "Refresh token expired" }, 401);
  }

  const accessToken = signAccessToken(payload.userId);
  const newRefreshToken = signRefreshToken(payload.userId);

  await prisma.refreshToken.delete({ where: { id: stored.id } });
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: payload.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return c.json({ accessToken, refreshToken: newRefreshToken });
});

authRouter.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json({ ...user, image: null });
});
