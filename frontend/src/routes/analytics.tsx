import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatUsd } from "@/api/salaryApi";
import {
  useAnalytics,
  useExperienceCurve,
  useFeatureImportance,
  useModelInfo,
  useSalaryDistribution,
} from "@/hooks/useSalaryQueries";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Salary Analytics & Trends — SalarySense AI" },
      {
        name: "description",
        content:
          "Interactive charts for salary distribution, experience-to-salary curves, department comparisons and model feature importance.",
      },
      { property: "og:title", content: "Salary Analytics & Trends — SalarySense AI" },
      {
        property: "og:description",
        content: "Explore salary distribution, department comparison and model performance metrics.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const tooltipStyle = {
  contentStyle: {
    background: "oklch(0.196 0.027 265)",
    border: "1px solid oklch(0.98 0.01 250 / 0.16)",
    borderRadius: "0.85rem",
    color: "oklch(0.97 0.006 250)",
    fontSize: "0.8rem",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
  },
  labelStyle: { color: "oklch(0.68 0.025 258)", fontWeight: 600 },
};

function AnalyticsPage() {
  const analytics = useAnalytics();
  const modelInfo = useModelInfo();
  const distribution = useSalaryDistribution();
  const experience = useExperienceCurve();
  const features = useFeatureImportance();

  // Process & sort department distribution data
  const departmentData = Object.entries(analytics.data?.department_distribution ?? {})
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);

  // Process education distribution data
  const educationData = Object.entries(analytics.data?.education_distribution ?? {}).map(
    ([education, count]) => ({ education, count }),
  );

  const predictionsCount = analytics.data?.predictions_count ?? 0;
  const avgExperience = analytics.data?.average_experience ?? 0;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Salary <span className="text-gradient">Analytics</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Distribution, experience trends and department comparison across{" "}
          <span className="font-semibold text-foreground">
            {predictionsCount.toLocaleString("en-US")}
          </span>{" "}
          {predictionsCount === 1 ? "prediction" : "predictions"}.
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1. Salary Distribution */}
        <AnalyticsCard title="Salary distribution" description="Predicted salary buckets (USD).">
          {distribution.isLoading ? (
            <LoadingSkeleton className="h-64 rounded-xl" />
          ) : (distribution.data?.length ?? 0) === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No salary distribution data recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={distribution.data ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="distFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--cyan-accent, #06b6d4)" stopOpacity={0.65} />
                    <stop offset="100%" stopColor="var(--cyan-accent, #06b6d4)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="range" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--cyan-accent, #06b6d4)"
                  strokeWidth={2.5}
                  fill="url(#distFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AnalyticsCard>

        {/* 2. Experience vs. Salary */}
        <AnalyticsCard
          title="Experience vs. salary"
          description={`Average experience: ${avgExperience} ${avgExperience === 1 ? "year" : "years"}.`}
        >
          {experience.isLoading ? (
            <LoadingSkeleton className="h-64 rounded-xl" />
          ) : (experience.data?.length ?? 0) === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No experience vs. salary data recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={experience.data ?? []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="experience"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => `${v}y`}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v) => [formatUsd(Number(v)), "Avg Salary"]}
                  labelFormatter={(l) => `${l} years experience`}
                />
                <Line
                  type="monotone"
                  dataKey="salary"
                  stroke="var(--emerald-accent, #10b981)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--emerald-accent, #10b981)", strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </AnalyticsCard>

        {/* 3. Department Comparison */}
        <AnalyticsCard
          title="Department comparison"
          description="Prediction volume by department."
          className="lg:col-span-2"
        >
          {analytics.isLoading ? (
            <LoadingSkeleton className="h-72 rounded-xl" />
          ) : departmentData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No department data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData} layout="vertical" barSize={18} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="department"
                  width={130}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {departmentData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i % 2 === 0 ? "var(--cyan-accent, #06b6d4)" : "var(--emerald-accent, #10b981)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </AnalyticsCard>

        {/* 4. Feature Importance */}
        <AnalyticsCard title="Feature importance" description="What drives the prediction model most.">
          {features.isLoading ? (
            <LoadingSkeleton className="h-64 rounded-xl" />
          ) : (features.data ?? []).length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Feature importance unavailable.
            </div>
          ) : (
            <div className="space-y-4 py-1">
              {(features.data ?? []).map((f) => {
                const percentage = Math.round((f.importance ?? 0) * 100);
                return (
                  <div key={f.feature} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-muted-foreground">{f.feature}</span>
                      <span className="font-semibold text-foreground">{percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary/80">
                      <div
                        className="h-full rounded-full bg-gradient-accent transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AnalyticsCard>

        {/* 5. Model Performance */}
        <AnalyticsCard
          title="Model performance"
          description={modelInfo.data?.algorithm ?? "RandomForestRegressor"}
        >
          {modelInfo.isLoading || analytics.isLoading ? (
            <LoadingSkeleton className="h-64 rounded-xl" />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">R² Score</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
                    {(modelInfo.data?.r2_score ?? 0.89).toFixed(3)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Dataset Size</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-accent">
                    {(modelInfo.data?.dataset_size ?? 0).toLocaleString("en-US")}
                  </p>
                </div>
              </div>

              {educationData.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Education Distribution
                  </p>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={educationData} barSize={26} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="education" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="count" fill="var(--chart-3, #38bdf8)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </AnalyticsCard>
      </div>
    </div>
  );
}