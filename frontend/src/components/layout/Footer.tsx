import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-background/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-accent">
            <Sparkles className="size-4 text-background" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              <span className="text-gradient">SalarySense</span> AI
            </p>
            <p className="text-xs text-muted-foreground">
              Machine learning salary intelligence for modern teams.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/analytics" className="transition-colors hover:text-foreground">
            Analytics
          </Link>
          <Link to="/prediction" className="transition-colors hover:text-foreground">
            Prediction
          </Link>
          <Link to="/history" className="transition-colors hover:text-foreground">
            History
          </Link>
          <Link to="/about" className="transition-colors hover:text-foreground">
            About
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Model v2.4.1 · Demo data · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
