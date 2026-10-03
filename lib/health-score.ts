import type { IncidentSeverity, IncidentStatus } from "@prisma/client";

type IncidentSummary = {
  status: IncidentStatus;
  severity: IncidentSeverity;
  createdAt: Date;
};

export type HealthScoreResult = {
  score: number;
  label: string;
  description: string;
  openThreats: number;
  recentReports: number;
};

export function calculateHealthScore(incidents: IncidentSummary[]): HealthScoreResult {
  let score = 100;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentReports = incidents.filter((i) => i.createdAt >= thirtyDaysAgo).length;
  const openThreats = incidents.filter((i) => i.status === "THREAT").length;
  const pending = incidents.filter((i) => i.status === "PENDING").length;

  score -= openThreats * 25;
  score -= pending * 5;
  score -= incidents.filter(
    (i) => i.severity === "HIGH" && i.status !== "SAFE",
  ).length * 10;

  score = Math.max(0, Math.min(100, score));

  let label = "Doskonały";
  let description = "Organizacja jest dobrze przygotowana na zagrożenia.";

  if (score < 40) {
    label = "Krytyczny";
    description = "Wykryto aktywne zagrożenia — uruchom procedurę kryzysową.";
  } else if (score < 70) {
    label = "Podwyższone ryzyko";
    description = "Pojawiły się podejrzane zgłoszenia — monitoruj sytuację.";
  } else if (score < 90) {
    label = "Stabilny";
    description = "Niewielkie ryzyko — kontynuuj edukację pracowników.";
  }

  return { score, label, description, openThreats, recentReports };
}
