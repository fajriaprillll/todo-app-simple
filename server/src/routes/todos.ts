import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import "../types";

export const todoRouter = new Hono();
todoRouter.use("*", authMiddleware);

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().nullable().optional(),
  position: z.number().int().optional(),
});

todoRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const todos = await prisma.todo.findMany({
    where: { userId },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      completed: true,
      priority: true,
      dueDate: true,
      position: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return c.json(todos);
});

todoRouter.get("/stats", async (c) => {
  const userId = c.get("userId");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [total, completed, active, byPriority, todayCompleted] =
    await Promise.all([
      prisma.todo.count({ where: { userId } }),
      prisma.todo.count({ where: { userId, completed: true } }),
      prisma.todo.count({ where: { userId, completed: false } }),
      prisma.todo.groupBy({
        by: ["priority"],
        where: { userId },
        _count: true,
      }),
      prisma.todo.count({
        where: {
          userId,
          completed: true,
          updatedAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

  const priorityCounts = { low: 0, medium: 0, high: 0 };
  for (const p of byPriority) {
    priorityCounts[p.priority as keyof typeof priorityCounts] = p._count;
  }

  return c.json({
    total,
    completed,
    active,
    percentage: total ? Math.round((completed / total) * 100) : 0,
    byPriority: priorityCounts,
    streak: 0,
    todayCompleted,
  });
});

todoRouter.post("/", zValidator("json", createSchema), async (c) => {
  const userId = c.get("userId");
  const data = c.req.valid("json");

  const maxPos = await prisma.todo.aggregate({
    where: { userId },
    _max: { position: true },
  });
  const nextPosition = (maxPos._max?.position ?? -1) + 1;

  const todo = await prisma.todo.create({
    data: {
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      userId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      position: nextPosition,
    },
  });

  return c.json(todo, 201);
});

todoRouter.patch("/:id", zValidator("json", updateSchema), async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const data = c.req.valid("json");

  // Prepare update data
  const updateData: Record<string, unknown> = { ...data };
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }

  // Atomically enforce ownership at DB layer
  const res = await prisma.todo.updateMany({ where: { id, userId }, data: updateData });
  if (res.count === 0) return c.json({ error: "Todo not found" }, 404);

  // Fetch updated row; defend against rare race where row was deleted after update
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) return c.json({ error: "Todo not found" }, 404);
  return c.json(todo);
});

todoRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  // Attempt delete; DB enforces ownership in where clause
  const del = await prisma.todo.deleteMany({ where: { id, userId } });
  if (del.count === 0) return c.json({ error: "Todo not found" }, 404);
  return c.json({ success: true });
});

const reorderSchema = z.object({
  ids: z.array(z.string()),
});

todoRouter.put("/reorder", zValidator("json", reorderSchema), async (c) => {
  const userId = c.get("userId");
  const { ids } = c.req.valid("json");

  const updates = ids.map((id, index) =>
    prisma.todo.updateMany({
      where: { id, userId },
      data: { position: index },
    })
  );

  await prisma.$transaction(updates);
  return c.json({ success: true });
});
