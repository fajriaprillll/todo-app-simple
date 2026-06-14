import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import "../types";

export const pomodoroRouter = new Hono();
pomodoroRouter.use("*", authMiddleware);

const sessionSchema = z.object({
  todoId: z.string().nullable().optional(),
  duration: z.number().int().positive().max(24 * 60 * 60),
  completed: z.boolean(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
});

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function calculateStreaks(days: Set<string>) {
  let longestStreak = 0;
  let runningStreak = 0;
  const orderedDays = Array.from(days).sort();

  for (let i = 0; i < orderedDays.length; i += 1) {
    const current = new Date(`${orderedDays[i]}T00:00:00.000Z`);
    const previous = i > 0 ? new Date(`${orderedDays[i - 1]}T00:00:00.000Z`) : null;
    const isConsecutive = previous
      ? dateKey(addDays(previous, 1)) === dateKey(current)
      : false;
    runningStreak = isConsecutive ? runningStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
  }

  const today = new Date();
  const todayKey = dateKey(today);
  const yesterdayKey = dateKey(addDays(today, -1));
  const startKey = days.has(todayKey) ? todayKey : days.has(yesterdayKey) ? yesterdayKey : null;
  let currentStreak = 0;
  if (startKey) {
    let cursor = new Date(`${startKey}T00:00:00.000Z`);
    while (days.has(dateKey(cursor))) {
      currentStreak += 1;
      cursor = addDays(cursor, -1);
    }
  }

  return { currentStreak, longestStreak };
}

pomodoroRouter.post("/session", zValidator("json", sessionSchema), async (c) => {
  const userId = c.get("userId");
  const data = c.req.valid("json");

  if (data.todoId) {
    const todo = await prisma.todo.findFirst({
      where: { id: data.todoId, userId },
      select: { id: true },
    });
    if (!todo) return c.json({ error: "Todo not found" }, 404);
  }

  const startedAt = data.startedAt ? new Date(data.startedAt) : new Date();
  const endedAt = data.endedAt ? new Date(data.endedAt) : new Date();
  const session = await prisma.focusSession.create({
    data: {
      userId,
      todoId: data.todoId || null,
      duration: data.duration,
      completed: data.completed,
      startedAt,
      endedAt,
    },
    include: {
      todo: { select: { id: true, title: true } },
    },
  });

  return c.json(session, 201);
});

pomodoroRouter.get("/history", async (c) => {
  const userId = c.get("userId");
  const sessions = await prisma.focusSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 20,
    include: {
      todo: { select: { id: true, title: true } },
    },
  });

  return c.json(sessions);
});

pomodoroRouter.get("/stats", async (c) => {
  const userId = c.get("userId");
  const sessions = await prisma.focusSession.findMany({
    where: { userId, completed: true },
    select: { duration: true, startedAt: true },
    orderBy: { startedAt: "asc" },
  });

  const completedDays = new Set(sessions.map((session) => dateKey(session.startedAt)));
  const { currentStreak, longestStreak } = calculateStreaks(completedDays);
  const totalFocusTime = sessions.reduce((total, session) => total + session.duration, 0);

  return c.json({
    currentStreak,
    longestStreak,
    totalFocusSessions: sessions.length,
    totalFocusTime,
  });
});
