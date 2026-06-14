import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRouter } from "./routes/auth";
import { pomodoroRouter } from "./routes/pomodoro";
import { todoRouter } from "./routes/todos";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin) return "http://localhost:5173";
      if (
        origin.startsWith("http://localhost:") ||
        origin.endsWith(".vercel.app") ||
        origin === process.env.FRONTEND_URL
      ) {
        return origin;
      }
      return "http://localhost:5173";
    },
    credentials: true,
  })
);

app.route("/auth", authRouter);
app.route("/todos", todoRouter);
app.route("/pomodoro", pomodoroRouter);

app.get("/health", (c) => c.json({ status: "ok" }));

app.onError((err, c) => {
  console.error(err);
  return c.json({
    error: err.message,
    stack: err.stack,
  }, 500);
});

export default app;
