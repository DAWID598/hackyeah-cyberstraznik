"use client";

import { useTransition } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { togglePlaybookStep } from "@/app/actions/playbook";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Step = {
  id: string;
  order: number;
  title: string;
  description: string;
  isCritical: boolean;
  completed: boolean;
};

export function PlaybookChecklist({
  playbookId,
  title,
  description,
  steps,
}: {
  playbookId: string;
  title: string;
  description: string | null;
  steps: Step[];
}) {
  const [isPending, startTransition] = useTransition();
  const completedCount = steps.filter((s) => s.completed).length;
  const progress = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;

  function handleToggle(stepId: string, completed: boolean) {
    startTransition(async () => {
      await togglePlaybookStep({ playbookId, stepId, completed });
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <Badge variant={progress === 100 ? "safe" : "pending"}>
          {completedCount}/{steps.length} kroków
        </Badge>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-cyan-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-6 space-y-3">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            disabled={isPending}
            onClick={() => handleToggle(step.id, !step.completed)}
            className={cn(
              "flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors",
              step.completed
                ? "border-emerald-500/30 bg-emerald-950/20"
                : "border-slate-800 bg-slate-950/40 hover:border-slate-700",
            )}
          >
            {isPending ? (
              <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-slate-400" />
            ) : step.completed ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-100">
                  {step.order}. {step.title}
                </p>
                {step.isCritical ? (
                  <Badge variant="threat">Krytyczny</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-400">{step.description}</p>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
