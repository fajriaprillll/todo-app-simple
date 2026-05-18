import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="text-center max-w-sm animate-scale-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary border border-border/50">
          <span className="text-3xl font-bold text-muted-foreground/50">404</span>
        </div>
        <h1 className="text-xl font-bold text-foreground/80">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground/60">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Button>
          <Link to="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
