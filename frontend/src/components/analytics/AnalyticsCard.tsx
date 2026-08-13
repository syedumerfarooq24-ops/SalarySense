import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  description?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
  action?: ReactNode | undefined;
}

export function AnalyticsCard({ title, description, children, className, action }: AnalyticsCardProps) {
  return (
    <section className={cn("glass card-lift rounded-3xl p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
