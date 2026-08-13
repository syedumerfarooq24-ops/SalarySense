import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, TrendingUp, Users, Target, Database, ArrowRight, BarChart3 } from "lucide-react";
import { formatUsd } from "@/api/salaryApi";
import { useAnalytics, useHistory, useModelInfo } from "@/hooks/useSalaryQueries";
import { StatisticCard } from "@/components/dashboard/StatisticCard";
import { RecentPredictions } from "@/components/dashboard/RecentPredictions";
import { StatSkeletonGrid } from "@/components/LoadingSkeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SalarySense AI — Employee Salary Prediction Dashboard" },
      {
        name: "description",
        content:
          "Predict employee salaries with machine learning and explore salary trends through interactive analytics dashboards.",
      },
      { property: "og:title", content: "SalarySense AI — Salary Prediction Dashboard" },
      {
        property: "og:description",
        content:
          "ML-powered employee salary predictions, confidence scoring and interactive salary analytics.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const analytics = useAnalytics();
  const modelInfo = useModelInfo();
  const history = useHistory();

  const isLoading = analytics.isLoading || modelInfo.isLoading;

  return (
    <div className="space-y-10">
      <section className="grid-backdrop glass relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" /> Powered by gradient boosted regression
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Employee <span className="text-gradient">Salary Prediction</span> Dashboard
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Predict employee salaries using Machine Learning and analyze salary trends through
          interactive visualizations.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/prediction"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-accent px-6 py-3 text-sm font-semibold text-background transition-all hover:-translate-y-1 hover:shadow-glow"
          >
            Predict Salary <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/analytics"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-1 hover:border-accent/50"
          >
            <BarChart3 className="size-4" /> View Analytics
          </Link>
        </div>
      </section>

      {isLoading ? (
        <StatSkeletonGrid />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatisticCard
            label="Total predictions"
            value={(analytics.data?.predictions_count ?? 0).toLocaleString("en-US")}
            hint="Generated across all departments"
            icon={Users}
          />
          <StatisticCard
            label="Average predicted salary"
            value={formatUsd(analytics.data?.average_salary ?? 0)}
            hint={`Range ${formatUsd(analytics.data?.min_salary ?? 0)} – ${formatUsd(analytics.data?.max_salary ?? 0)}`}
            icon={TrendingUp}
            tone="emerald"
          />
          <StatisticCard
            label="Model accuracy (R²)"
            value={`${((modelInfo.data?.r2_score ?? 0) * 100).toFixed(1)}%`}
            hint={modelInfo.data?.algorithm}
            icon={Target}
          />
          <StatisticCard
            label="Dataset records"
            value={(modelInfo.data?.dataset_size ?? 0).toLocaleString("en-US")}
            hint={`Model ${modelInfo.data?.version ?? ""}`}
            icon={Database}
            tone="emerald"
          />
        </div>
      )}

      <RecentPredictions records={history.data} isLoading={history.isLoading} />
    </div>
  );
}
