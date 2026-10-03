"use client";

import { useState, useTransition } from "react";
import {
  Bell,
  BellOff,
  Loader2,
  Plus,
  Radio,
  Send,
  Trash2,
  Zap,
} from "lucide-react";
import {
  createWebhookChannel,
  deleteWebhookChannel,
  testAllWebhooks,
  testWebhookChannel,
  toggleWebhookChannel,
  updateAlertSettings,
} from "@/app/actions/webhooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { WebhookForm } from "@/components/alerts/webhook-form";
import { formatDate } from "@/lib/utils";

type DashboardData = Awaited<
  ReturnType<typeof import("@/app/actions/webhooks").getWebhooksDashboard>
>;

export function WebhookAdmin({ data }: { data: DashboardData }) {
  const [showForm, setShowForm] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const alertsEnabled = data.organization?.alertsEnabled ?? true;
  const minSeverity = data.organization?.alertMinSeverity ?? "HIGH";

  function handleToggleAlerts() {
    startTransition(async () => {
      await updateAlertSettings({
        alertsEnabled: !alertsEnabled,
        alertMinSeverity: minSeverity,
      });
    });
  }

  function handleSeverityChange(value: string) {
    startTransition(async () => {
      await updateAlertSettings({
        alertsEnabled,
        alertMinSeverity: value as "LOW" | "MEDIUM" | "HIGH",
      });
    });
  }

  function handleTestAll() {
    setTestResult(null);
    startTransition(async () => {
      const result = await testAllWebhooks();
      if (result.success) {
        setTestResult(`Wysłano na: ${result.channels.join(", ")}`);
      } else {
        setTestResult(result.errors.join(", ") || "Brak aktywnych kanałów.");
      }
    });
  }

  function handleTestChannel(id: string) {
    startTransition(async () => {
      const result = await testWebhookChannel(id);
      setTestResult(result.success ? "Test wysłany pomyślnie." : result.error ?? "Błąd testu.");
    });
  }

  function handleToggleChannel(id: string, enabled: boolean) {
    startTransition(async () => {
      await toggleWebhookChannel(id, enabled);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteWebhookChannel(id);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Aktywne kanały"
          value={data.stats.activeChannels}
          hint={`${data.stats.totalChannels} skonfigurowanych`}
          icon={<Radio className="h-5 w-5 text-cyan-400" />}
        />
        <StatCard
          label="Alerty dziś"
          value={data.stats.alertsToday}
          hint="Pomyślnie dostarczone"
          icon={<Zap className="h-5 w-5 text-amber-400" />}
        />
        <StatCard
          label="Status systemu"
          value={alertsEnabled ? "Włączone" : "Wyłączone"}
          hint={`Próg globalny: ${minSeverity}`}
          icon={
            alertsEnabled ? (
              <Bell className="h-5 w-5 text-emerald-400" />
            ) : (
              <BellOff className="h-5 w-5 text-slate-400" />
            )
          }
        />
        <StatCard
          label="Ostatni alert"
          value={
            data.stats.lastDelivery
              ? data.stats.lastDelivery.status === "SUCCESS"
                ? "OK"
                : "Błąd"
              : "—"
          }
          hint={
            data.stats.lastDelivery
              ? formatDate(data.stats.lastDelivery.createdAt)
              : "Brak historii"
          }
          icon={<Send className="h-5 w-5 text-rose-400" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Kanały powiadomień</CardTitle>
              <CardDescription>
                Zarządzaj webhookami Slack, Discord i Telegram z poziomu panelu.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={handleTestAll} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Test wszystkich
              </Button>
              <Button size="sm" onClick={() => setShowForm((v) => !v)}>
                <Plus className="h-4 w-4" />
                Dodaj kanał
              </Button>
            </div>
          </div>

          {showForm ? (
            <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4">
              <WebhookForm
                onSubmit={async (values) => {
                  const result = await createWebhookChannel(values);
                  if (result.success) setShowForm(false);
                  return result;
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          ) : null}

          {testResult ? (
            <p className="mt-4 text-sm text-slate-300">{testResult}</p>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Kanał</th>
                  <th className="px-4 py-3 font-medium">Typ</th>
                  <th className="px-4 py-3 font-medium">Próg</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Brak kanałów. Dodaj pierwszy webhook, aby otrzymywać alerty na żywo.
                    </td>
                  </tr>
                ) : (
                  data.channels.map((channel) => (
                    <tr key={channel.id} className="border-t border-slate-800/80">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-100">{channel.name}</p>
                        <p className="text-xs text-slate-500">
                          {channel.webhookUrlMasked ?? "Telegram bot"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{channel.typeLabel}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{channel.minSeverity}+</td>
                      <td className="px-4 py-3">
                        <Badge variant={channel.isEnabled ? "safe" : "pending"}>
                          {channel.isEnabled ? "Aktywny" : "Wyłączony"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleTestChannel(channel.id)}
                          >
                            Test
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() =>
                              handleToggleChannel(channel.id, !channel.isEnabled)
                            }
                          >
                            {channel.isEnabled ? "Wyłącz" : "Włącz"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleDelete(channel.id)}
                          >
                            <Trash2 className="h-4 w-4 text-rose-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle>Ustawienia globalne</CardTitle>
            <CardDescription>Dotyczą całej organizacji.</CardDescription>
            <div className="mt-4 space-y-4">
              <label className="flex items-center justify-between gap-4 text-sm text-slate-300">
                Alerty włączone
                <Button
                  variant={alertsEnabled ? "primary" : "secondary"}
                  size="sm"
                  disabled={isPending}
                  onClick={handleToggleAlerts}
                >
                  {alertsEnabled ? "Tak" : "Nie"}
                </Button>
              </label>
              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Domyślny próg organizacji
                </label>
                <select
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  value={minSeverity}
                  disabled={isPending}
                  onChange={(e) => handleSeverityChange(e.target.value)}
                >
                  <option value="LOW">LOW — wszystkie zagrożenia</option>
                  <option value="MEDIUM">MEDIUM+</option>
                  <option value="HIGH">HIGH — tylko krytyczne</option>
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Historia dostaw</CardTitle>
            <CardDescription>Ostatnie 15 powiadomień.</CardDescription>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {data.deliveries.length === 0 ? (
                <p className="text-sm text-slate-500">Brak wpisów w historii.</p>
              ) : (
                data.deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-200">
                        {delivery.channelName}
                      </p>
                      <Badge
                        variant={delivery.status === "SUCCESS" ? "safe" : "threat"}
                      >
                        {delivery.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {delivery.typeLabel} · {formatDate(delivery.createdAt)}
                    </p>
                    {delivery.errorMessage ? (
                      <p className="mt-1 text-xs text-rose-400">{delivery.errorMessage}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        {icon}
      </div>
    </Card>
  );
}
