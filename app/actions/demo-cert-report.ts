"use server";

import { revalidatePath } from "next/cache";
import {
  DEMO_RANSOMWARE_EVENTS,
  generateCertReportMarkdown,
  occurredAtMinutesAgo,
} from "@/lib/demo/cert-report";
import { getDemoOrganizationId } from "@/lib/demo-org";
import { prisma } from "@/lib/prisma";

export type DemoAuditEvent = {
  id: string;
  level: string;
  message: string;
  occurredAt: string;
  timeLabel: string;
};

export async function generateDemoCertReport() {
  try {
    const organizationId = await getDemoOrganizationId();

    const [organization, admin] = await Promise.all([
      prisma.organization.findUnique({ where: { id: organizationId } }),
      prisma.user.findFirst({
        where: { organizationId, role: "ADMIN" },
      }),
    ]);

    if (!organization) {
      return { success: false as const, error: "Brak organizacji demo." };
    }

    const demoSessionId = `demo-${Date.now()}`;

    const incident = await prisma.securityIncident.create({
      data: {
        title: "Incydent ransomware — faktura-korekta.pdf.exe",
        department: "Finanse",
        content:
          "PILNE: Faktura korekta za usługi IT. Załącznik: faktura-korekta.pdf.exe. Prosimy o pilną weryfikację i opłacenie.",
        status: "THREAT",
        severity: "HIGH",
        aiVerdict: "Ransomware/Trojan",
        aiExplanation:
          "Załącznik .exe podszywający się pod dokument PDF. Wykryto zachowanie typowe dla ransomware.",
        aiConfidence: 0.97,
        organizationId,
        reportedById: admin?.id,
        demoSessionId,
      },
    });

    await prisma.auditLog.createMany({
      data: DEMO_RANSOMWARE_EVENTS.map((event) => ({
        organizationId,
        incidentId: incident.id,
        demoSessionId,
        level: event.level,
        message: event.message,
        occurredAt: occurredAtMinutesAgo(event.minutesAgo),
      })),
    });

    const logs = await prisma.auditLog.findMany({
      where: { demoSessionId },
      orderBy: { occurredAt: "asc" },
    });

    const markdown = await generateCertReportMarkdown(organization, incident, logs);

    const events: DemoAuditEvent[] = logs.map((log) => ({
      id: log.id,
      level: log.level,
      message: log.message,
      occurredAt: log.occurredAt.toISOString(),
      timeLabel: new Intl.DateTimeFormat("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(log.occurredAt),
    }));

    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      success: true as const,
      demoSessionId,
      incidentId: incident.id,
      events,
      markdown,
    };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Nie udało się wygenerować raportu demo.",
    };
  }
}
