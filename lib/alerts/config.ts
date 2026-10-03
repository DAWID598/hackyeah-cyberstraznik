import type { IncidentSeverity } from "@prisma/client";

export type AlertSeverity = IncidentSeverity;

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

export function shouldSendAlert(
  status: "SAFE" | "THREAT" | "PENDING",
  severity: AlertSeverity,
  minSeverity: AlertSeverity,
): boolean {
  return status === "THREAT" && SEVERITY_RANK[severity] >= SEVERITY_RANK[minSeverity];
}

export function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export function maskSecret(value?: string | null): string {
  if (!value) return "—";
  if (value.length <= 8) return "••••••••";
  return `••••${value.slice(-8)}`;
}
