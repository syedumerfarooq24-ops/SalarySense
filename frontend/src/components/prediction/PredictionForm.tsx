import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { FORM_OPTIONS, type PredictionPayload } from "@/api/salaryApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const initialPayload: PredictionPayload = {
  age: 30,
  gender: "Female",
  education: "Master",
  experience: 6,
  department: "Engineering",
  job_title: "Senior Software Engineer",
  company_size: "Large",
  employment_type: "Full-time",
  remote_work: true,
  city: "Berlin",
};

interface PredictionFormProps {
  onSubmit: (payload: PredictionPayload) => void;
  isPending: boolean;
}

export function PredictionForm({ onSubmit, isPending }: PredictionFormProps) {
  const [form, setForm] = useState<PredictionPayload>(initialPayload);

  const set = <K extends keyof PredictionPayload>(key: K, value: PredictionPayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="glass rounded-3xl p-5 sm:p-6"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Age</Label>
            <span className="text-sm font-semibold text-primary">{form.age}</span>
          </div>
          <Slider
            value={[form.age]}
            min={18}
            max={70}
            step={1}
            onValueChange={([v]) => set("age", v ?? 18)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Years of experience</Label>
            <span className="text-sm font-semibold text-accent">{form.experience}</span>
          </div>
          <Slider
            value={[form.experience]}
            min={0}
            max={40}
            step={1}
            onValueChange={([v]) => set("experience", v ?? 0)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Education level</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FORM_OPTIONS.education.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => set("education", level)}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-sm font-medium transition-all hover:-translate-y-0.5",
                  form.education === level
                    ? "border-primary/60 bg-primary/10 text-primary shadow-glow"
                    : "border-border/60 bg-secondary/40 text-muted-foreground",
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORM_OPTIONS.genders.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Department</Label>
          <Select value={form.department} onValueChange={(v) => set("department", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORM_OPTIONS.departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="job_title">Job title</Label>
          <Input
            id="job_title"
            value={form.job_title}
            onChange={(e) => set("job_title", e.target.value)}
            placeholder="e.g. Machine Learning Engineer"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>City</Label>
          <Select value={form.city} onValueChange={(v) => set("city", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORM_OPTIONS.cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Company size</Label>
          <Select value={form.company_size} onValueChange={(v) => set("company_size", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORM_OPTIONS.companySizes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Employment type</Label>
          <Select value={form.employment_type} onValueChange={(v) => set("employment_type", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORM_OPTIONS.employmentTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-secondary/40 px-4 py-3 md:col-span-2">
          <div>
            <Label htmlFor="remote">Remote work</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Fully remote roles adjust the regional pay factor.
            </p>
          </div>
          <Switch
            id="remote"
            checked={form.remote_work}
            onCheckedChange={(v) => set("remote_work", v)}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="mt-6 w-full rounded-2xl bg-gradient-accent py-6 text-base font-semibold text-background transition-shadow hover:shadow-glow"
      >
        {isPending ? (
          <>
            <Loader2 className="size-5 animate-spin" /> Predicting…
          </>
        ) : (
          <>
            <Wand2 className="size-5" /> Predict Salary
          </>
        )}
      </Button>
    </form>
  );
}
