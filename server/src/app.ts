import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRouter } from "./routes/auth";
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

app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
