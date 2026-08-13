import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatUsd, type HistoryRecord } from "@/api/salaryApi";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DepartmentBadge } from "@/components/dashboard/RecentPredictions";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

const STATUS_TONE: Record<HistoryRecord["status"], string> = {
  completed: "border-accent/40 bg-accent/10 text-accent",
  pending: "border-chart-4/40 bg-chart-4/10 text-chart-4",
  failed: "border-destructive/40 bg-destructive/10 text-destructive",
};

interface HistoryTableProps {
  records: HistoryRecord[] | undefined;
  isLoading: boolean;
}

export function HistoryTable({ records, isLoading }: HistoryTableProps) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [city, setCity] = useState("all");

  const departments = useMemo(
    () => Array.from(new Set((records ?? []).map((r) => r.department))).sort(),
    [records],
  );
  const cities = useMemo(
    () => Array.from(new Set((records ?? []).map((r) => r.city))).sort(),
    [records],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (records ?? []).filter((r) => {
      const matchesQuery =
        !q || r.job_title.toLowerCase().includes(q) || r.department.toLowerCase().includes(q);
      return (
        matchesQuery &&
        (department === "all" || r.department === department) &&
        (city === "all" || r.city === city)
      );
    });
  }, [records, search, department, city]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title or department"
            className="pl-9"
          />
        </div>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="md:w-44">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Showing {filtered.length} of {(records ?? []).length} predictions
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Employee / title</th>
              <th className="pb-3 font-medium">Department</th>
              <th className="pb-3 font-medium">Experience</th>
              <th className="pb-3 text-right font-medium">Predicted salary</th>
              <th className="pb-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border/40 transition-colors last:border-0 hover:bg-secondary/40"
              >
                <td className="py-3 text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="py-3">
                  <p className="font-medium">{r.job_title}</p>
                  <p className="text-xs text-muted-foreground">{r.city}</p>
                </td>
                <td className="py-3">
                  <DepartmentBadge department={r.department} />
                </td>
                <td className="py-3 text-muted-foreground">{r.experience} yrs</td>
                <td className="py-3 text-right font-semibold text-accent">
                  {formatUsd(r.predicted_salary)}
                </td>
                <td className="py-3 text-right">
                  <Badge variant="outline" className={STATUS_TONE[r.status]}>
                    {r.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">
                  No predictions match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
