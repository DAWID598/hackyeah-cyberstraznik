import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { HealthScoreResult } from "@/lib/health-score";

export function HealthScoreCard({ health }: { health: HealthScoreResult }) {
  const color =
    health.score >= 90
      ? "text-emerald-400"
      : health.score >= 70
        ? "text-cyan-400"
        : health.score >= 40
          ? "text-amber-400"
          : "text-rose-400";

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-cyan-500/10 to-transparent" />
      <CardTitle>Health Score organizacji</CardTitle>
      <CardDescription>{health.description}</CardDescription>
      <div className="mt-6 flex items-end gap-4">
        <p className={`text-6xl font-bold ${color}`}>{health.score}</p>
        <div>
          <p className="text-xl font-semibold text-white">{health.label}</p>
          <p className="text-sm text-slate-400">skala 0–100</p>
        </div>
      </div>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${color.replace("text-", "bg-")}`}
          style={{ width: `${health.score}%` }}
        />
      </div>
    </Card>
  );
}
