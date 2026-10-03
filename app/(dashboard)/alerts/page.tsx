import { WebhookAdmin } from "@/components/alerts/webhook-admin";
import { Header } from "@/components/layout/header";
import { getWebhooksDashboard } from "@/app/actions/webhooks";

export default async function AlertsPage() {
  const data = await getWebhooksDashboard();

  return (
    <div>
      <Header
        title="Centrum alertów"
        description="Zarządzaj kanałami powiadomień, testuj webhooki i monitoruj historię dostaw w czasie rzeczywistym."
      />
      <WebhookAdmin data={data} />
    </div>
  );
}
