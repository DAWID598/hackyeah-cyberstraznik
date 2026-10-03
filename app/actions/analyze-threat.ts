"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendCriticalThreatAlert } from "@/lib/alerts/webhook";
import { analyzeThreatContent } from "@/lib/ai";
import { getDemoOrganizationId, getDemoUser } from "@/lib/demo-org";
import { prisma } from "@/lib/prisma";

const inputSchema = z.object({
  content: z.string().min(10, "Wklej co najmniej 10 znaków treści wiadomości."),
  title: z.string().optional(),
  department: z.string().optional(),
});

export async function analyzeThreat(input: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    const organizationId = await getDemoOrganizationId();
    const [user, organization] = await Promise.all([
      getDemoUser(),
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      }),
    ]);

    const analysis = await analyzeThreatContent(parsed.data.content);

    const incident = await prisma.securityIncident.create({
      data: {
        title: parsed.data.title ?? "Podejrzana wiadomość",
        department: parsed.data.department,
        content: parsed.data.content,
        status: analysis.verdict,
        severity: analysis.severity,
        aiVerdict: analysis.verdict === "THREAT" ? "Phishing" : "Safe",
        aiExplanation: `${analysis.explanation}\n\nWskaźniki: ${analysis.indicators.join(", ")}`,
        aiConfidence: analysis.confidence,
        organizationId,
        reportedById: user.id,
      },
    });

    let alertSent = false;
    let alertChannels: string[] = [];

    if (analysis.verdict === "THREAT") {
      const alertResult = await sendCriticalThreatAlert({
        incidentId: incident.id,
        organizationId,
        organizationName: organization?.name ?? "Organizacja",
        reporterName: user.name,
        department: parsed.data.department,
        severity: analysis.severity,
        confidence: analysis.confidence,
        explanation: analysis.explanation,
        indicators: analysis.indicators,
      });
      alertSent = alertResult.sent;
      alertChannels = alertResult.channels;
    }

    revalidatePath("/dashboard");
    revalidatePath("/report");

    return {
      success: true as const,
      incidentId: incident.id,
      verdict: analysis.verdict,
      severity: analysis.severity,
      confidence: analysis.confidence,
      explanation: analysis.explanation,
      indicators: analysis.indicators,
      alertSent,
      alertChannels,
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Nie udało się przeanalizować wiadomości.",
    };
  }
}
