# ⚡ Todo App
Full-stack todo application with authentication, drag-and-drop, analytics, and a modern UI.
![Stack](https://img.shields.io/badge/stack-React%20%7C%20Hono%20%7C%20Prisma%20%7C%20PostgreSQL-7c3aed)
## ✨ Features
- **🔐 Authentication** — Register/login with JWT (access + refresh tokens)
- **📝 CRUD Todos** — Create, read, update, delete tasks
- **🎯 Priority Levels** — Low / Medium / High with color-coded badges
- **📅 Due Dates** — Custom date picker, overdue warnings
- **🔍 Search & Filter** — Search by title, filter by status, sort by multiple criteria
- **↕️ Drag & Drop** — Reorder tasks manually with smooth animations
- **✏️ Inline Editing** — Double-click to edit, or use the edit modal
- **✅ Bulk Actions** — Select multiple tasks, batch complete or delete
- **📊 Analytics** — Dashboard with stats, progress ring, priority breakdown
- **🔥 Streak Tracking** — Daily completion streaks
- **🎉 Confetti** — Celebrate completing tasks
- **⌨️ Keyboard Shortcuts** — Press `?` to see all shortcuts
- **🌙 Dark / Light Mode** — Toggle theme with animation
- **💾 Export** — Export todos as JSON or CSV
- **🔎 Command Palette** — Press `⌘K` to quickly search todos
## 🛠️ Tech Stack
| Layer    | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend  | Hono (Node.js), TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth     | JWT (jsonwebtoken + bcryptjs) |
| State    | Zustand, TanStack React Query |
| UI       | Lucide React, Sonner, DnD Kit, Canvas Confetti |
| Validation | Zod |
## 🚀 Getting Started
### Prerequisites
- Node.js 18+
- PostgreSQL
### 1. Clone & Install
```bash
git clone https://github.com/fajriaprillll/todo-app-simple.git
cd todo-app-simple
# Server
cd server
npm install
# Client
cd ../client
npm install
2. Environment Variables
server/.env
DATABASE_URL="postgresql://user:password@localhost:5432/todoapp"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
client/.env
VITE_API_URL=http://localhost:3001
3. Database Setup
cd server
npx prisma migrate dev --name init
npm run db:seed    # optional seed data
4. Run
# Terminal 1 - Server
cd server
npm run dev
# Terminal 2 - Client
cd client
npm run dev
Visit http://localhost:5173 🎉
📸 Screenshots
 
Login
Todos
📁 Project Structure
todo-app/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/        # ProtectedRoute
│   │   │   ├── layout/      # AppLayout, Sidebar, Topbar
│   │   │   ├── providers/   # AppProvider (query, router, theme, auth)
│   │   │   └── ui/          # Button, Badge, Modal, Input, etc.
│   │   ├── lib/             # API client, queries, utils
│   │   ├── pages/           # Dashboard, Todos, Stats, Settings
│   │   ├── stores/          # Zustand stores (auth, app)
│   │   └── types/           # TypeScript types
│   └── ...
├── server/                  # Hono backend
│   ├── src/
│   │   ├── lib/             # Prisma client, JWT helpers
│   │   ├── middleware/       # Auth middleware
│   │   └── routes/          # Auth and Todo routes
│   └── prisma/              # Schema and seed
└── README.md
🧪 API Endpoints
Method	Path
POST	/auth/register
POST	/auth/login
POST	/auth/refresh
GET	/auth/me
GET	/todos
GET	/todos/stats
POST	/todos
PATCH	/todos/:id
DELETE	/todos/:id
PUT	/todos/reorder
📄 License
MIT
