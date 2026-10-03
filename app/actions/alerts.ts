"use server";

import { getDemoOrganizationId } from "@/lib/demo-org";
import { getAlertDashboardData, sendTestAlert } from "@/lib/alerts/webhook";

export async function getAlertsStatus() {
  const organizationId = await getDemoOrganizationId();
  const data = await getAlertDashboardData(organizationId);
  return {
    configured: data.stats.activeChannels > 0,
    channels: data.channels.filter((c) => c.isEnabled).map((c) => c.typeLabel),
    minSeverity: data.organization?.alertMinSeverity ?? "HIGH",
    appUrl: data.appUrl,
  };
}

export async function testWebhookAlert() {
  try {
    const organizationId = await getDemoOrganizationId();
    const result = await sendTestAlert(organizationId);
    return {
      success: result.sent,
      channels: result.channels,
      errors: result.errors,
    };
  } catch (error) {
    return {
      success: false,
      channels: [] as string[],
      errors: [error instanceof Error ? error.message : "Błąd wysyłki testu"],
    };
  }
}
