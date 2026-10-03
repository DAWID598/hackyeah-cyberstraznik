import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SEVERITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { IncidentSeverity, IncidentStatus } from "@prisma/client";

type Incident = {
  id: string;
  title: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  aiVerdict: string | null;
  createdAt: Date;
};

function statusVariant(status: IncidentStatus) {
  if (status === "SAFE") return "safe";
  if (status === "THREAT") return "threat";
  return "pending";
}

export function RecentIncidents({ incidents }: { incidents: Incident[] }) {
  return (
    <Card>
      <CardTitle>Ostatnie zgłoszenia</CardTitle>
      <CardDescription>
        Historia analiz podejrzanych wiadomości w organizacji.
      </CardDescription>

      <div className="mt-6 space-y-3">
        {incidents.length === 0 ? (
          <p className="text-sm text-slate-500">Brak zgłoszeń — to dobry znak.</p>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <div>
                <p className="font-medium text-slate-100">
                  {incident.title ?? "Podejrzana wiadomość"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(incident.createdAt)}
                  {incident.aiVerdict ? ` · ${incident.aiVerdict}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={statusVariant(incident.status)}>
                  {STATUS_LABELS[incident.status]}
                </Badge>
                <Badge variant="neutral">{SEVERITY_LABELS[incident.severity]}</Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
