import type { AlertChannel, AlertChannelType, IncidentSeverity } from "@prisma/client";
import { getAppUrl, shouldSendAlert, type AlertSeverity } from "@/lib/alerts/config";
import { prisma } from "@/lib/prisma";

export type CriticalAlertPayload = {
  incidentId: string;
  organizationId: string;
  organizationName: string;
  reporterName: string;
  department?: string;
  severity: AlertSeverity;
  confidence: number;
  explanation: string;
  indicators: string[];
};

type ChannelRecord = Pick<
  AlertChannel,
  "id" | "name" | "type" | "webhookUrl" | "botToken" | "chatId" | "minSeverity"
>;

function buildMessage(payload: CriticalAlertPayload, appUrl: string) {
  const dept = payload.department ?? "nieznany";
  const link = `${appUrl}/dashboard`;
  const confidence = Math.round(payload.confidence * 100);

  const title = `🚨 UWAGA: Wykryto próbę phishingu w dziale ${dept}!`;
  const body =
    `*Organizacja:* ${payload.organizationName}\n` +
    `*Zgłosił:* ${payload.reporterName}\n` +
    `*Poziom:* ${payload.severity} (${confidence}% pewności)\n` +
    `*Analiza:* ${payload.explanation}\n` +
    `*Wskaźniki:* ${payload.indicators.slice(0, 3).join(", ")}\n` +
    `*Szczegóły:* ${link}`;

  return { title, body };
}

async function sendSlack(webhookUrl: string, title: string, body: string) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: title,
      blocks: [
        { type: "header", text: { type: "plain_text", text: title } },
        { type: "section", text: { type: "mrkdwn", text: body } },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Slack HTTP ${response.status}`);
}

async function sendDiscord(webhookUrl: string, title: string, body: string) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: title,
      embeds: [
        {
          title: "Cyber Strażnik — alert krytyczny",
          description: body,
          color: 0xdc2626,
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Discord HTTP ${response.status}`);
}

async function sendTelegram(token: string, chatId: string, title: string, body: string) {
  const text = `${title}\n\n${body}`;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    }),
  });
  if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
}

async function dispatchToChannel(
  channel: ChannelRecord,
  title: string,
  body: string,
): Promise<void> {
  switch (channel.type) {
    case "SLACK":
      if (!channel.webhookUrl) throw new Error("Brak URL webhooka Slack");
      await sendSlack(channel.webhookUrl, title, body);
      break;
    case "DISCORD":
      if (!channel.webhookUrl) throw new Error("Brak URL webhooka Discord");
      await sendDiscord(channel.webhookUrl, title, body);
      break;
    case "TELEGRAM":
      if (!channel.botToken || !channel.chatId) {
        throw new Error("Brak tokenu lub chat ID Telegram");
      }
      await sendTelegram(channel.botToken, channel.chatId, title, body);
      break;
  }
}

async function logDelivery(params: {
  organizationId: string;
  channelId?: string;
  incidentId?: string;
  channelName: string;
  channelType: AlertChannelType;
  status: "SUCCESS" | "FAILED";
  message?: string;
  errorMessage?: string;
}) {
  await prisma.alertDelivery.create({ data: params });
}

export async function sendToChannel(
  channel: ChannelRecord,
  payload: CriticalAlertPayload,
  options?: { incidentId?: string; isTest?: boolean },
): Promise<{ success: boolean; error?: string }> {
  const appUrl = getAppUrl();
  const { title, body } = buildMessage(payload, appUrl);
  const message = options?.isTest
    ? `[TEST] ${title}`
    : title;

  try {
    await dispatchToChannel(channel, message, body);
    await logDelivery({
      organizationId: payload.organizationId,
      channelId: channel.id,
      incidentId: options?.incidentId ?? payload.incidentId,
      channelName: channel.name,
      channelType: channel.type,
      status: "SUCCESS",
      message: message,
    });
    await prisma.alertChannel.update({
      where: { id: channel.id },
      data: { lastTestedAt: new Date(), lastTestStatus: "SUCCESS" },
    });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Błąd wysyłki";
    await logDelivery({
      organizationId: payload.organizationId,
      channelId: channel.id,
      incidentId: options?.incidentId ?? payload.incidentId,
      channelName: channel.name,
      channelType: channel.type,
      status: "FAILED",
      message: message,
      errorMessage,
    });
    await prisma.alertChannel.update({
      where: { id: channel.id },
      data: { lastTestedAt: new Date(), lastTestStatus: "FAILED" },
    });
    return { success: false, error: errorMessage };
  }
}

export async function sendCriticalThreatAlert(
  payload: CriticalAlertPayload,
): Promise<{ sent: boolean; channels: string[]; errors: string[] }> {
  const org = await prisma.organization.findUnique({
    where: { id: payload.organizationId },
    select: { alertsEnabled: true, alertMinSeverity: true },
  });

  if (!org?.alertsEnabled) {
    return { sent: false, channels: [], errors: [] };
  }

  if (!shouldSendAlert("THREAT", payload.severity, org.alertMinSeverity)) {
    return { sent: false, channels: [], errors: [] };
  }

  const channels = await prisma.alertChannel.findMany({
    where: { organizationId: payload.organizationId, isEnabled: true },
    select: {
      id: true,
      name: true,
      type: true,
      webhookUrl: true,
      botToken: true,
      chatId: true,
      minSeverity: true,
    },
  });

  if (channels.length === 0) {
    return { sent: false, channels: [], errors: ["Brak aktywnych kanałów alertów"] };
  }

  const eligible = channels.filter((channel) =>
    shouldSendAlert("THREAT", payload.severity, channel.minSeverity),
  );

  if (eligible.length === 0) {
    return { sent: false, channels: [], errors: [] };
  }

  const sentChannels: string[] = [];
  const errors: string[] = [];

  for (const channel of eligible) {
    const result = await sendToChannel(channel, payload, {
      incidentId: payload.incidentId,
    });
    if (result.success) {
      sentChannels.push(`${channelTypeLabel(channel.type)} · ${channel.name}`);
    } else if (result.error) {
      errors.push(`${channel.name}: ${result.error}`);
    }
  }

  return {
    sent: sentChannels.length > 0,
    channels: sentChannels,
    errors,
  };
}

export async function sendTestAlert(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  const channels = await prisma.alertChannel.findMany({
    where: { organizationId, isEnabled: true },
    select: {
      id: true,
      name: true,
      type: true,
      webhookUrl: true,
      botToken: true,
      chatId: true,
      minSeverity: true,
    },
  });

  const payload: CriticalAlertPayload = {
    incidentId: "test-alert",
    organizationId,
    organizationName: org?.name ?? "Organizacja",
    reporterName: "Administrator (test)",
    department: "Finanse",
    severity: "HIGH",
    confidence: 0.94,
    explanation: "To jest testowy alert webhooka Cyber Strażnika.",
    indicators: ["Presja czasowa", "Podejrzany link", "Prośba o dane logowania"],
  };

  const sentChannels: string[] = [];
  const errors: string[] = [];

  for (const channel of channels) {
    const result = await sendToChannel(channel, payload, { isTest: true });
    if (result.success) {
      sentChannels.push(`${channelTypeLabel(channel.type)} · ${channel.name}`);
    } else if (result.error) {
      errors.push(`${channel.name}: ${result.error}`);
    }
  }

  return { sent: sentChannels.length > 0, channels: sentChannels, errors };
}

export function channelTypeLabel(type: AlertChannelType): string {
  switch (type) {
    case "SLACK":
      return "Slack";
    case "DISCORD":
      return "Discord";
    case "TELEGRAM":
      return "Telegram";
  }
}

export async function getAlertDashboardData(organizationId: string) {
  const [organization, channels, deliveries, todayCount] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        alertsEnabled: true,
        alertMinSeverity: true,
        name: true,
      },
    }),
    prisma.alertChannel.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.alertDelivery.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.alertDelivery.count({
      where: {
        organizationId,
        status: "SUCCESS",
        createdAt: { gte: startOfToday() },
      },
    }),
  ]);

  const activeChannels = channels.filter((c) => c.isEnabled).length;

  return {
    organization,
    stats: {
      activeChannels,
      totalChannels: channels.length,
      alertsToday: todayCount,
      lastDelivery: deliveries[0] ?? null,
    },
    channels: channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      typeLabel: channelTypeLabel(channel.type),
      isEnabled: channel.isEnabled,
      minSeverity: channel.minSeverity,
      webhookUrlMasked: channel.webhookUrl
        ? `••••${channel.webhookUrl.slice(-12)}`
        : null,
      hasTelegramConfig: Boolean(channel.botToken && channel.chatId),
      lastTestedAt: channel.lastTestedAt,
      lastTestStatus: channel.lastTestStatus,
      createdAt: channel.createdAt,
    })),
    deliveries: deliveries.map((d) => ({
      id: d.id,
      channelName: d.channelName,
      channelType: d.channelType,
      typeLabel: channelTypeLabel(d.channelType),
      status: d.status,
      message: d.message,
      errorMessage: d.errorMessage,
      createdAt: d.createdAt,
    })),
    appUrl: getAppUrl(),
  };
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}
