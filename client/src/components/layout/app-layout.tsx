import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useAppStore } from "@/stores/app-store";
import { KeyboardShortcuts } from "@/components/ui/keyboard-shortcuts";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="flex min-h-screen w-full bg-background mesh-bg-subtle text-foreground overflow-hidden relative">
      {/* Sidebar */}
      <Sidebar />

      {/* Content Area Outer */}
      <div
        className={cn(
          "flex flex-1 flex-col min-h-screen min-w-0 transition-[padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          sidebarOpen ? "md:pl-60" : "md:pl-0"
        )}
      >
        {/* Topbar */}
        <Topbar />
        
        {/* Main scrollable page outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
      
      <KeyboardShortcuts />
    </div>
  );
}
