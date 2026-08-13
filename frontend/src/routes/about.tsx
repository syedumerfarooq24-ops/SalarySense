import { createFileRoute } from "@tanstack/react-router";
import {
  Database,
  Filter,
  BrainCircuit,
  Server,
  Boxes,
  MonitorSmartphone,
  Target,
  Gauge,
  Layers,
} from "lucide-react";
import { useModelInfo } from "@/hooks/useSalaryQueries";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About SalarySense AI — Architecture & ML Workflow" },
      {
        name: "description",
        content:
          "How SalarySense AI works: dataset preprocessing, a scikit-learn regression model, API layer and a React analytics interface.",
      },
      { property: "og:title", content: "About SalarySense AI" },
      {
        property: "og:description",
        content: "The architecture, ML workflow and tech stack behind SalarySense AI.",
      },
    ],
  }),
  component: AboutPage,
});

const workflow = [
  { icon: Database, title: "Dataset", detail: "48.6k anonymized compensation records" },
  { icon: Filter, title: "Preprocessing", detail: "Encoding, scaling, outlier trimming" },
  { icon: BrainCircuit, title: "Scikit-Learn model", detail: "Gradient boosted regression" },
  { icon: Server, title: "API layer", detail: "Typed prediction endpoints" },
  { icon: Boxes, title: "Data store", detail: "Persisted prediction history" },
  { icon: MonitorSmartphone, title: "React UI", detail: "Dashboard, analytics & history" },
];

const stack = [
  { name: "React 19 + TypeScript", detail: "Typed component architecture" },
  { name: "TanStack Router", detail: "File-based, type-safe routing" },
  { name: "TanStack Query v5", detail: "Cached, non-polling data layer" },
  { name: "Tailwind CSS v4", detail: "Token-driven design system" },
  { name: "shadcn/ui", detail: "Accessible primitives" },
  { name: "Recharts", detail: "Interactive visualizations" },
];

function AboutPage() {
  const modelInfo = useModelInfo();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          About <span className="text-gradient">SalarySense AI</span>
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          SalarySense AI turns historical compensation data into instant, explainable salary
          estimates. The interface is fully typed and driven by a cached query layer, so every
          screen reads from a single data contract that maps 1:1 to the prediction service.
        </p>
      </header>

      <section className="glass rounded-3xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">ML workflow</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {workflow.map((step, i) => (
            <div
              key={step.title}
              className="card-lift relative rounded-2xl border border-border/60 bg-secondary/40 p-4"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-accent text-background">
                <step.icon className="size-4.5" />
              </span>
              <p className="mt-3 text-sm font-semibold">{step.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>
              <span className="absolute right-3 top-3 text-xs font-medium text-muted-foreground">
                0{i + 1}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsCard title="Model specification" description={modelInfo.data?.algorithm}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <Target className="size-4 text-primary" />
              <p className="mt-2 text-xs text-muted-foreground">R² score</p>
              <p className="text-xl font-semibold">
                {(modelInfo.data?.r2_score ?? 0).toFixed(3)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <Layers className="size-4 text-accent" />
              <p className="mt-2 text-xs text-muted-foreground">Features</p>
              <p className="text-xl font-semibold">{modelInfo.data?.features.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <Gauge className="size-4 text-primary" />
              <p className="mt-2 text-xs text-muted-foreground">Version</p>
              <p className="text-xl font-semibold">{modelInfo.data?.version ?? "—"}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(modelInfo.data?.features ?? []).map((f) => (
              <span
                key={f}
                className="rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-xs text-muted-foreground"
              >
                {f}
              </span>
            ))}
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Tech stack" description="Frontend architecture in production shape.">
          <div className="grid gap-3 sm:grid-cols-2">
            {stack.map((s) => (
              <div
                key={s.name}
                className="card-lift rounded-2xl border border-border/60 bg-secondary/40 p-4"
              >
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
              </div>
            ))}
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}
