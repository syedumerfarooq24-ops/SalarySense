import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { salaryApi, type PredictionPayload, type PredictionResponse } from "@/api/salaryApi";

export const salaryKeys = {
  analytics: ["salary", "analytics"] as const,
  modelInfo: ["salary", "model-info"] as const,
  history: ["salary", "history"] as const,
  distribution: ["salary", "distribution"] as const,
  experience: ["salary", "experience"] as const,
  features: ["salary", "features"] as const,
};

export const analyticsQueryOptions = queryOptions({
  queryKey: salaryKeys.analytics,
  queryFn: () => salaryApi.getAnalytics(),
});

export const modelInfoQueryOptions = queryOptions({
  queryKey: salaryKeys.modelInfo,
  queryFn: () => salaryApi.getModelInfo(),
});

export const historyQueryOptions = queryOptions({
  queryKey: salaryKeys.history,
  queryFn: () => salaryApi.getHistory(),
});

export const distributionQueryOptions = queryOptions({
  queryKey: salaryKeys.distribution,
  queryFn: () => salaryApi.getSalaryDistribution(),
});

export const experienceQueryOptions = queryOptions({
  queryKey: salaryKeys.experience,
  queryFn: () => salaryApi.getExperienceCurve(),
});

export const featureImportanceQueryOptions = queryOptions({
  queryKey: salaryKeys.features,
  queryFn: () => salaryApi.getFeatureImportance(),
});

export const useAnalytics = () => useQuery(analyticsQueryOptions);
export const useModelInfo = () => useQuery(modelInfoQueryOptions);
export const useHistory = () => useQuery(historyQueryOptions);
export const useSalaryDistribution = () => useQuery(distributionQueryOptions);
export const useExperienceCurve = () => useQuery(experienceQueryOptions);
export const useFeatureImportance = () => useQuery(featureImportanceQueryOptions);

export function usePredictSalary(
  options?: { onSuccess?: (data: PredictionResponse) => void },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PredictionPayload) => salaryApi.predict(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.history });
      queryClient.invalidateQueries({ queryKey: salaryKeys.analytics });
      options?.onSuccess?.(data);
    },
  });
}
