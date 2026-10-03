import { PlaybookChecklist } from "@/components/playbook/playbook-checklist";
import { Header } from "@/components/layout/header";
import { getDemoOrganizationId } from "@/lib/demo-org";
import { prisma } from "@/lib/prisma";

export default async function PlaybookPage() {
  const organizationId = await getDemoOrganizationId();

  const playbooks = await prisma.playbook.findMany({
    where: {
      OR: [{ isGlobal: true }, { organizationId }],
    },
    include: {
      steps: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  const completions = await prisma.stepCompletion.findMany({
    where: { organizationId },
    select: { stepId: true },
  });
  const completedIds = new Set(completions.map((c) => c.stepId));

  return (
    <div>
      <Header
        title="Kryzysownik"
        description="Interaktywna checklista kroków Incident Response — np. przy ransomware lub phishingu."
      />

      <div className="space-y-6">
        {playbooks.map((playbook) => (
          <PlaybookChecklist
            key={playbook.id}
            playbookId={playbook.id}
            title={playbook.title}
            description={playbook.description}
            steps={playbook.steps.map((step) => ({
              ...step,
              completed: completedIds.has(step.id),
            }))}
          />
        ))}
      </div>
    </div>
  );
}
