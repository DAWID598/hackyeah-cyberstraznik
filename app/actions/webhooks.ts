"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AlertChannelType, IncidentSeverity } from "@prisma/client";
import { getDemoOrganizationId } from "@/lib/demo-org";
import {
  getAlertDashboardData,
  sendTestAlert,
  sendToChannel,
} from "@/lib/alerts/webhook";
import { prisma } from "@/lib/prisma";

const channelSchema = z.object({
  name: z.string().trim().min(2, "Nazwa musi mieć co najmniej 2 znaki."),
  type: z.enum(["SLACK", "DISCORD", "TELEGRAM"]),
  webhookUrl: z.string().trim().optional(),
  botToken: z.string().trim().optional(),
  chatId: z.string().trim().optional(),
  minSeverity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  isEnabled: z.boolean().optional(),
});

function validateChannelInput(
  data: z.infer<typeof channelSchema>,
): string | null {
  if (data.type === "SLACK" || data.type === "DISCORD") {
    if (!data.webhookUrl?.startsWith("https://")) {
      return "Podaj poprawny URL webhooka (https://...).";
    }
  }
  if (data.type === "TELEGRAM") {
    if (!data.botToken || !data.chatId) {
      return "Telegram wymaga tokenu bota i chat ID.";
    }
  }
  return null;
}

export async function getWebhooksDashboard() {
  const organizationId = await getDemoOrganizationId();
  return getAlertDashboardData(organizationId);
}

export async function createWebhookChannel(input: z.infer<typeof channelSchema>) {
  const parsed = channelSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message };
  }

  const validationError = validateChannelInput(parsed.data);
  if (validationError) return { success: false as const, error: validationError };

  const organizationId = await getDemoOrganizationId();

  await prisma.alertChannel.create({
    data: {
      organizationId,
      name: parsed.data.name,
      type: parsed.data.type as AlertChannelType,
      webhookUrl: parsed.data.webhookUrl || null,
      botToken: parsed.data.botToken || null,
      chatId: parsed.data.chatId || null,
      minSeverity: parsed.data.minSeverity as IncidentSeverity,
      isEnabled: parsed.data.isEnabled ?? true,
    },
  });

  revalidatePath("/alerts");
  return { success: true as const };
}

export async function updateWebhookChannel(
  id: string,
  input: z.infer<typeof channelSchema>,
) {
  const parsed = channelSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message };
  }

  const validationError = validateChannelInput(parsed.data);
  if (validationError) return { success: false as const, error: validationError };

  const organizationId = await getDemoOrganizationId();

  const existing = await prisma.alertChannel.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return { success: false as const, error: "Kanał nie istnieje." };

  await prisma.alertChannel.update({
    where: { id },
    data: {
      name: parsed.data.name,
      type: parsed.data.type as AlertChannelType,
      webhookUrl: parsed.data.webhookUrl || null,
      botToken: parsed.data.botToken || null,
      chatId: parsed.data.chatId || null,
      minSeverity: parsed.data.minSeverity as IncidentSeverity,
      isEnabled: parsed.data.isEnabled ?? existing.isEnabled,
    },
  });

  revalidatePath("/alerts");
  return { success: true as const };
}

export async function toggleWebhookChannel(id: string, isEnabled: boolean) {
  const organizationId = await getDemoOrganizationId();
  const existing = await prisma.alertChannel.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return { success: false as const, error: "Kanał nie istnieje." };

  await prisma.alertChannel.update({
    where: { id },
    data: { isEnabled },
  });

  revalidatePath("/alerts");
  return { success: true as const };
}

export async function deleteWebhookChannel(id: string) {
  const organizationId = await getDemoOrganizationId();
  const existing = await prisma.alertChannel.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return { success: false as const, error: "Kanał nie istnieje." };

  await prisma.alertChannel.delete({ where: { id } });
  revalidatePath("/alerts");
  return { success: true as const };
}

export async function testWebhookChannel(id: string) {
  const organizationId = await getDemoOrganizationId();
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  const channel = await prisma.alertChannel.findFirst({
    where: { id, organizationId },
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

  if (!channel) return { success: false as const, error: "Kanał nie istnieje." };

  const result = await sendToChannel(
    channel,
    {
      incidentId: "test-alert",
      organizationId,
      organizationName: org?.name ?? "Organizacja",
      reporterName: "Administrator (test)",
      department: "Finanse",
      severity: "HIGH",
      confidence: 0.94,
      explanation: "To jest testowy alert webhooka Cyber Strażnika.",
      indicators: ["Presja czasowa", "Podejrzany link"],
    },
    { isTest: true },
  );

  revalidatePath("/alerts");
  return {
    success: result.success,
    error: result.error,
  };
}

export async function testAllWebhooks() {
  const organizationId = await getDemoOrganizationId();
  const result = await sendTestAlert(organizationId);
  revalidatePath("/alerts");
  return {
    success: result.sent,
    channels: result.channels,
    errors: result.errors,
  };
}

const settingsSchema = z.object({
  alertsEnabled: z.boolean(),
  alertMinSeverity: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export async function updateAlertSettings(input: z.infer<typeof settingsSchema>) {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Nieprawidłowe ustawienia." };
  }

  const organizationId = await getDemoOrganizationId();

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      alertsEnabled: parsed.data.alertsEnabled,
      alertMinSeverity: parsed.data.alertMinSeverity as IncidentSeverity,
    },
  });

  revalidatePath("/alerts");
  return { success: true as const };
}
