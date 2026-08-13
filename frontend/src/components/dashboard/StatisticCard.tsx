import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatisticCardProps {
  label: string;
  value: string;
  hint?: string | undefined;
  icon: LucideIcon;
  tone?: "cyan" | "emerald";
}

export function StatisticCard({ label, value, hint, icon: Icon, tone = "cyan" }: StatisticCardProps) {
  return (
    <div className="glass card-lift rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl border",
            tone === "cyan"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-accent/30 bg-accent/10 text-accent",
          )}
        >
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
