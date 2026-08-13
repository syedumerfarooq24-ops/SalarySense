import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import type { PredictionPayload, PredictionResponse } from "@/api/salaryApi";
import { formatUsd } from "@/api/salaryApi";
import { usePredictSalary } from "@/hooks/useSalaryQueries";
import { PredictionForm } from "@/components/prediction/PredictionForm";
import { PredictionCard } from "@/components/prediction/PredictionCard";

export const Route = createFileRoute("/prediction")({
  head: () => ({
    meta: [
      { title: "Predict a Salary — SalarySense AI" },
      {
        name: "description",
        content:
          "Enter an employee profile and get an ML-estimated annual salary with confidence score and feature impact breakdown.",
      },
      { property: "og:title", content: "Predict a Salary — SalarySense AI" },
      {
        property: "og:description",
        content: "ML salary estimates with confidence scoring and feature impact indicators.",
      },
    ],
  }),
  component: PredictionPage,
});

function PredictionPage() {
  const [payload, setPayload] = useState<PredictionPayload>();
  const [result, setResult] = useState<PredictionResponse>();

  const predict = usePredictSalary({
    onSuccess: (data) => {
      setResult(data);
      toast.success("Prediction generated", {
        description: `Estimated salary ${formatUsd(data.predicted_salary)} · ${Math.round(
          data.confidence_score * 100,
        )}% confidence`,
      });
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Salary <span className="text-gradient">Prediction</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Describe the role and profile — the model returns an estimated annual salary, a confidence
          score and the features driving the result.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PredictionForm
          isPending={predict.isPending}
          onSubmit={(p) => {
            setPayload(p);
            predict.mutate(p);
          }}
        />
        <PredictionCard result={result} payload={payload} isPending={predict.isPending} />
      </div>
    </div>
  );
}
