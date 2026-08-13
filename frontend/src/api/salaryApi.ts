/**
 * Typed API layer for SalarySense AI.
 *
 * Every function tries the real backend first (VITE_API_URL) and falls back to
 * rich mock data, so swapping in FastAPI later requires zero component changes.
 */

export interface AnalyticsData {
  predictions_count: number;
  average_salary: number;
  max_salary: number;
  min_salary: number;
  average_experience: number;
  department_distribution: Record<string, number>;
  education_distribution: Record<string, number>;
}

export interface ModelInfoData {
  algorithm: string;
  r2_score: number;
  dataset_size: number;
  features: string[];
  version: string;
}

export interface PredictionPayload {
  age: number;
  gender: string;
  education: string;
  experience: number;
  department: string;
  job_title: string;
  company_size: string;
  employment_type: string;
  remote_work: boolean;
  city: string;
}

export interface PredictionResponse {
  predicted_salary: number;
  confidence_score: number;
  id: string;
}

export interface HistoryRecord {
  id: string;
  created_at: string;
  job_title: string;
  department: string;
  city: string;
  experience: number;
  predicted_salary: number;
  status: "completed" | "pending" | "failed";
}

export interface SalaryBucket {
  range: string;
  count: number;
}

export interface ExperiencePoint {
  experience: number;
  salary: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

const API_URL = import.meta.env["VITE_API_URL"];

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ---------------------------------- mocks --------------------------------- */

const DEPARTMENTS = [
  "Engineering",
  "Data Science",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Finance",
  "Human Resources",
];

const CITIES = [
  "San Francisco",
  "New York",
  "Austin",
  "Seattle",
  "Berlin",
  "London",
  "Bangalore",
  "Toronto",
];

const JOB_TITLES = [
  "Senior Software Engineer",
  "ML Engineer",
  "Data Analyst",
  "Product Manager",
  "UX Designer",
  "Growth Marketer",
  "Account Executive",
  "Financial Analyst",
  "People Partner",
  "Backend Engineer",
];

const mockAnalytics: AnalyticsData = {
  predictions_count: 12_847,
  average_salary: 112_480,
  max_salary: 268_900,
  min_salary: 41_200,
  average_experience: 7.4,
  department_distribution: {
    Engineering: 4210,
    "Data Science": 2180,
    Product: 1460,
    Design: 980,
    Marketing: 1120,
    Sales: 1340,
    Finance: 870,
    "Human Resources": 687,
  },
  education_distribution: {
    "High School": 640,
    Bachelor: 5810,
    Master: 4620,
    PhD: 1777,
  },
};

const mockModelInfo: ModelInfoData = {
  algorithm: "Gradient Boosted Regression (scikit-learn)",
  r2_score: 0.941,
  dataset_size: 48_600,
  features: [
    "age",
    "gender",
    "education",
    "experience",
    "department",
    "job_title",
    "company_size",
    "employment_type",
    "remote_work",
    "city",
  ],
  version: "v2.4.1",
};

function seeded(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const mockHistory: HistoryRecord[] = Array.from({ length: 28 }, (_, i) => {
  const dept = DEPARTMENTS[i % DEPARTMENTS.length]!;
  const experience = Math.round(seeded(i + 1) * 18 + 1);
  const base = 52_000 + experience * 5_400 + seeded(i + 7) * 60_000;
  const date = new Date(Date.UTC(2026, 6, 28) - i * 86_400_000 * 1.4);
  return {
    id: `pred_${(1000 + i).toString(36)}`,
    created_at: date.toISOString(),
    job_title: JOB_TITLES[i % JOB_TITLES.length]!,
    department: dept,
    city: CITIES[(i * 3) % CITIES.length]!,
    experience,
    predicted_salary: Math.round(base / 100) * 100,
    status: i % 11 === 5 ? "pending" : i % 17 === 9 ? "failed" : "completed",
  };
});

const mockSalaryDistribution: SalaryBucket[] = [
  { range: "40–60k", count: 820 },
  { range: "60–80k", count: 1740 },
  { range: "80–100k", count: 2960 },
  { range: "100–120k", count: 3180 },
  { range: "120–150k", count: 2270 },
  { range: "150–200k", count: 1310 },
  { range: "200k+", count: 567 },
];

const mockExperienceCurve: ExperiencePoint[] = Array.from({ length: 20 }, (_, i) => ({
  experience: i + 1,
  salary: Math.round((54_000 + (i + 1) * 6_200 + seeded(i * 5) * 9_000) / 100) * 100,
}));

const mockFeatureImportance: FeatureImportance[] = [
  { feature: "Years of Experience", importance: 0.31 },
  { feature: "Job Title", importance: 0.22 },
  { feature: "Department", importance: 0.16 },
  { feature: "City", importance: 0.12 },
  { feature: "Education", importance: 0.09 },
  { feature: "Company Size", importance: 0.06 },
  { feature: "Remote Work", importance: 0.04 },
];

/* --------------------------------- helpers -------------------------------- */

const EDUCATION_WEIGHT: Record<string, number> = {
  "High School": 0.86,
  Bachelor: 1,
  Master: 1.14,
  PhD: 1.27,
};

const DEPARTMENT_WEIGHT: Record<string, number> = {
  Engineering: 1.22,
  "Data Science": 1.25,
  Product: 1.16,
  Design: 1.04,
  Marketing: 0.98,
  Sales: 1.06,
  Finance: 1.08,
  "Human Resources": 0.92,
};

const CITY_WEIGHT: Record<string, number> = {
  "San Francisco": 1.34,
  "New York": 1.26,
  Seattle: 1.2,
  Austin: 1.08,
  Toronto: 1.0,
  London: 1.05,
  Berlin: 0.96,
  Bangalore: 0.62,
};

const SIZE_WEIGHT: Record<string, number> = {
  Startup: 0.94,
  Small: 0.97,
  Medium: 1.04,
  Large: 1.12,
  Enterprise: 1.19,
};

const TYPE_WEIGHT: Record<string, number> = {
  "Full-time": 1,
  "Part-time": 0.62,
  Contract: 1.08,
  Internship: 0.38,
};

function mockPredict(payload: PredictionPayload): PredictionResponse {
  const base = 46_000 + payload.experience * 6_100 + Math.max(0, payload.age - 22) * 480;
  const salary =
    base *
    (EDUCATION_WEIGHT[payload.education] ?? 1) *
    (DEPARTMENT_WEIGHT[payload.department] ?? 1) *
    (CITY_WEIGHT[payload.city] ?? 1) *
    (SIZE_WEIGHT[payload.company_size] ?? 1) *
    (TYPE_WEIGHT[payload.employment_type] ?? 1) *
    (payload.remote_work ? 1.03 : 1);

  const confidence = Math.min(
    0.97,
    0.82 + Math.min(payload.experience, 15) * 0.008 + (payload.job_title.length > 4 ? 0.03 : 0),
  );

  return {
    predicted_salary: Math.round(salary / 100) * 100,
    confidence_score: Number(confidence.toFixed(2)),
    id: `pred_${Date.now().toString(36)}`,
  };
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------- API ----------------------------------- */

export const salaryApi = {
  async getAnalytics(): Promise<AnalyticsData> {
    return (await request<AnalyticsData>("/analytics")) ?? mockAnalytics;
  },

  async getModelInfo(): Promise<ModelInfoData> {
    return (await request<ModelInfoData>("/model-info")) ?? mockModelInfo;
  },

  async getHistory(): Promise<HistoryRecord[]> {
    return (await request<HistoryRecord[]>("/history")) ?? mockHistory;
  },

  async getSalaryDistribution(): Promise<SalaryBucket[]> {
    return (await request<SalaryBucket[]>("/analytics/distribution")) ?? mockSalaryDistribution;
  },

  async getExperienceCurve(): Promise<ExperiencePoint[]> {
    return (await request<ExperiencePoint[]>("/analytics/experience")) ?? mockExperienceCurve;
  },

  async getFeatureImportance(): Promise<FeatureImportance[]> {
    return (await request<FeatureImportance[]>("/model-info/features")) ?? mockFeatureImportance;
  },

  async predict(payload: PredictionPayload): Promise<PredictionResponse> {
    const real = await request<PredictionResponse>("/predict", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (real) return real;
    await delay(900);
    return mockPredict(payload);
  },
};

export const FORM_OPTIONS = {
  departments: DEPARTMENTS,
  cities: CITIES,
  genders: ["Male", "Female", "Non-binary", "Prefer not to say"],
  education: ["High School", "Bachelor", "Master", "PhD"],
  companySizes: ["Startup", "Small", "Medium", "Large", "Enterprise"],
  employmentTypes: ["Full-time", "Part-time", "Contract", "Internship"],
};

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
