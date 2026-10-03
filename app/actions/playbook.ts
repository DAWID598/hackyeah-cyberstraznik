"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDemoOrganizationId } from "@/lib/demo-org";
import { prisma } from "@/lib/prisma";

const toggleSchema = z.object({
  playbookId: z.string(),
  stepId: z.string(),
  completed: z.boolean(),
});

export async function togglePlaybookStep(input: z.infer<typeof toggleSchema>) {
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return { success: false };

  const organizationId = await getDemoOrganizationId();
  const { stepId, completed } = parsed.data;

  if (completed) {
    await prisma.stepCompletion.upsert({
      where: {
        stepId_organizationId: { stepId, organizationId },
      },
      create: { stepId, organizationId },
      update: { completedAt: new Date() },
    });
  } else {
    await prisma.stepCompletion.deleteMany({
      where: { stepId, organizationId },
    });
  }

  revalidatePath("/playbook");
  return { success: true };
}

export async function resetPlaybook(playbookId: string) {
  const organizationId = await getDemoOrganizationId();

  await prisma.stepCompletion.deleteMany({
    where: {
      organizationId,
      step: { playbookId },
    },
  });

  revalidatePath("/playbook");
  return { success: true };
}
