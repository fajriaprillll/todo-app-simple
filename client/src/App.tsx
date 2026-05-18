import { AppProvider } from "@/components/providers/app-provider";
import { AppRouter } from "@/router";
import { CommandPalette } from "@/components/ui/command-palette";

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
      <CommandPalette />
    </AppProvider>
  );
}
