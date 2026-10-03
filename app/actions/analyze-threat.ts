"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { analyzeThreatContent } from "@/lib/ai";
import { getDemoOrganizationId, getDemoUser } from "@/lib/demo-org";
import { prisma } from "@/lib/prisma";

const inputSchema = z.object({
  content: z.string().min(10, "Wklej co najmniej 10 znaków treści wiadomości."),
  title: z.string().optional(),
});

export async function analyzeThreat(input: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    const [organizationId, user] = await Promise.all([
      getDemoOrganizationId(),
      getDemoUser(),
    ]);

    const analysis = await analyzeThreatContent(parsed.data.content);

    const incident = await prisma.securityIncident.create({
      data: {
        title: parsed.data.title ?? "Podejrzana wiadomość",
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
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Nie udało się przeanalizować wiadomości.",
    };
  }
}
