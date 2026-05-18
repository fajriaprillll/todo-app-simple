import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@test.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@test.com",
      password: hashed,
    },
  });

  const todos = [
    { title: "Review Q2 budget proposal", priority: "high", position: 0 },
    { title: "Update team onboarding docs", priority: "medium", position: 1 },
    { title: "Plan team offsite", priority: "low", position: 2, dueDate: new Date(Date.now() + 3 * 86400000) },
    { title: "Fix login bug on mobile", priority: "high", position: 3 },
    { title: "Write API integration tests", priority: "medium", position: 4 },
    { title: "Update dependencies", priority: "low", position: 5, completed: true },
    { title: "Refactor auth middleware", priority: "medium", position: 6 },
    { title: "Design system documentation", priority: "low", position: 7 },
    { title: "Sprint retrospective", priority: "medium", position: 8, dueDate: new Date(Date.now() + 5 * 86400000) },
    { title: "Deploy v2.1 to staging", priority: "high", position: 9, dueDate: new Date(Date.now() + 1 * 86400000) },
  ];

  for (const todo of todos) {
    await prisma.todo.upsert({
      where: { id: `seed-${todo.position}` },
      update: todo,
      create: {
        id: `seed-${todo.position}`,
        ...todo,
        userId: user.id,
        completed: todo.completed ?? false,
        priority: todo.priority as string,
      },
    });
  }

  console.log("Seeded: demo@test.com / password123");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
