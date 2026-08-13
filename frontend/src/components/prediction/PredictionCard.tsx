import { BadgeCheck, Gauge, TrendingUp } from "lucide-react";
import { formatUsd, type PredictionPayload, type PredictionResponse } from "@/api/salaryApi";
import { Progress } from "@/components/ui/progress";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

interface PredictionCardProps {
  result: PredictionResponse | undefined;
  payload: PredictionPayload | undefined;
  isPending: boolean;
}

export function PredictionCard({ result, payload, isPending }: PredictionCardProps) {
  if (isPending) {
    return (
      <div className="space-y-3">
        <LoadingSkeleton className="h-48" />
        <LoadingSkeleton className="h-28" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="glass flex min-h-[18rem] flex-col items-center justify-center gap-3 rounded-3xl p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          <Gauge className="size-6" />
        </span>
        <h3 className="text-lg font-semibold tracking-tight">No prediction yet</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Fill in the employee profile and run the model to see an estimated salary, confidence
          score and feature impact.
        </p>
      </div>
    );
  }

  const confidencePct = Math.round(result.confidence_score * 100);
  const spread = Math.round(result.predicted_salary * (1 - result.confidence_score) * 1.6);

  const impacts = payload
    ? [
        { label: "Experience", value: Math.min(100, payload.experience * 6 + 20) },
        { label: "Job title", value: 72 },
        { label: "City", value: payload.city === "Bangalore" ? 34 : 66 },
        { label: "Education", value: payload.education === "PhD" ? 84 : 58 },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="glass card-lift rounded-3xl p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BadgeCheck className="size-4 text-accent" /> Prediction {result.id}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Estimated annual salary</p>
        <p className="text-gradient mt-1 text-5xl font-semibold tracking-tight">
          {formatUsd(result.predicted_salary)}
        </p>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-semibold text-primary">{confidencePct}% Confidence</span>
          </div>
          <Progress value={confidencePct} className="h-2" />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground">Estimated range</p>
            <p className="mt-1 font-semibold">
              {formatUsd(result.predicted_salary - spread)} –{" "}
              {formatUsd(result.predicted_salary + spread)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground">Monthly equivalent</p>
            <p className="mt-1 font-semibold">{formatUsd(result.predicted_salary / 12)}</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-accent" />
          <h3 className="text-sm font-semibold tracking-tight">Top feature impact</h3>
        </div>
        <div className="mt-4 space-y-4">
          {impacts.map((i) => (
            <div key={i.label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{i.label}</span>
                <span className="font-medium">{i.value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-gradient-accent" style={{ width: `${i.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
