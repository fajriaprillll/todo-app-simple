import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useAppStore } from "@/stores/app-store";
import { KeyboardShortcuts } from "@/components/ui/keyboard-shortcuts";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { focusMode, sidebarOpen } = useAppStore();

  return (
    <div className="flex min-h-screen w-full bg-background mesh-bg-subtle text-foreground overflow-hidden relative">
      {/* Sidebar */}
      {!focusMode && <Sidebar />}

      {/* Content Area Outer */}
      <div
        className={cn(
          "flex flex-1 flex-col min-h-screen min-w-0 transition-[padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          !focusMode && sidebarOpen ? "md:pl-60" : "md:pl-0"
        )}
      >
        {/* Topbar */}
        {!focusMode && <Topbar />}
        
        {/* Main scrollable page outlet */}
        <main className={cn("flex-1 overflow-y-auto min-w-0", focusMode ? "p-4 md:p-6" : "p-4 md:p-6 lg:p-8")}>
          <Outlet />
        </main>
      </div>
      
      {!focusMode && <KeyboardShortcuts />}
    </div>
  );
}
