import { Activity, AlertTriangle, FileWarning } from "lucide-react";
import { HealthScoreCard } from "@/components/dashboard/health-score-card";
import { RecentIncidents } from "@/components/dashboard/recent-incidents";
import { Header } from "@/components/layout/header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getDemoOrganizationId } from "@/lib/demo-org";
import { calculateHealthScore } from "@/lib/health-score";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const organizationId = await getDemoOrganizationId();

  const [organization, incidents] = await Promise.all([
    prisma.organization.findUnique({ where: { id: organizationId } }),
    prisma.securityIncident.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const health = calculateHealthScore(incidents);
  const threats = incidents.filter((i) => i.status === "THREAT").length;
  const pending = incidents.filter((i) => i.status === "PENDING").length;

  return (
    <div>
      <Header
        title="Dashboard bezpieczeństwa"
        description={`Stan organizacji: ${organization?.name ?? "Demo"}. Monitoruj ryzyko i reaguj na incydenty.`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HealthScoreCard health={health} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              Aktywne zagrożenia
            </CardTitle>
            <p className="mt-3 text-3xl font-bold text-white">{threats}</p>
            <CardDescription>Otwarte incydenty typu THREAT</CardDescription>
          </Card>
          <Card>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileWarning className="h-4 w-4 text-amber-400" />
              Oczekujące
            </CardTitle>
            <p className="mt-3 text-3xl font-bold text-white">{pending}</p>
            <CardDescription>Wymagają weryfikacji administratora</CardDescription>
          </Card>
          <Card>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-cyan-400" />
              Zgłoszenia (30 dni)
            </CardTitle>
            <p className="mt-3 text-3xl font-bold text-white">{health.recentReports}</p>
            <CardDescription>Aktywność pracowników</CardDescription>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <RecentIncidents incidents={incidents.slice(0, 5)} />
      </div>
    </div>
  );
}
