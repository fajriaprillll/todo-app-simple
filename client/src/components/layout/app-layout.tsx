import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useAppStore } from "@/stores/app-store";
import { KeyboardShortcuts } from "@/components/ui/keyboard-shortcuts";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="flex min-h-screen mesh-bg">
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col transition-[margin] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          sidebarOpen && "md:ml-60"
        )}
      >
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <KeyboardShortcuts />
    </div>
  );
}
