"use client";

import { useState, useTransition } from "react";
import {
  ClipboardCopy,
  Download,
  FileText,
  Loader2,
  Play,
  ShieldAlert,
} from "lucide-react";
import {
  generateDemoCertReport,
  type DemoAuditEvent,
} from "@/app/actions/demo-cert-report";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LEVEL_VARIANTS: Record<string, "safe" | "pending" | "threat" | "neutral"> = {
  INFO: "neutral",
  WARNING: "pending",
  CRITICAL: "threat",
  ACTION: "safe",
};

export function CertReportDemo() {
  const [events, setEvents] = useState<DemoAuditEvent[]>([]);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRunDemo() {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const result = await generateDemoCertReport();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setEvents(result.events);
      setMarkdown(result.markdown);
      setIncidentId(result.incidentId);
    });
  }

  async function handleCopy() {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `raport-cert-${incidentId ?? "demo"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-slate-900/50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-amber-400" />
              Demo CERT / RODO — jeden klik
            </CardTitle>
            <CardDescription className="max-w-2xl">
              Wstrzykuje 5 realistycznych zdarzeń ransomware z ostatnich 20 minut do
              AuditLog, a następnie generuje profesjonalny raport dla CERT Polska i IOD
              przy użyciu AI.
            </CardDescription>
          </div>
          <Button
            variant="danger"
            size="lg"
            onClick={handleRunDemo}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generuję scenariusz i raport...
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                Uruchom demo incydentu
              </>
            )}
          </Button>
        </div>
        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
      </Card>

      {events.length > 0 ? (
        <Card>
          <CardTitle>Oś czasu — wstrzyknięte zdarzenia (AuditLog)</CardTitle>
          <CardDescription>
            Zapisane w bazie PostgreSQL · incydent: {incidentId}
          </CardDescription>
          <div className="mt-4 space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3"
              >
                <span className="font-mono text-sm text-cyan-300">[{event.timeLabel}]</span>
                <Badge variant={LEVEL_VARIANTS[event.level] ?? "neutral"}>
                  {event.level}
                </Badge>
                <p className="flex-1 text-sm text-slate-300">{event.message}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {markdown ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              <CardTitle>Raport CERT / RODO (Markdown)</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                <ClipboardCopy className="h-4 w-4" />
                {copied ? "Skopiowano!" : "Kopiuj"}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Pobierz .md
              </Button>
            </div>
          </div>
          <div
            className={cn(
              "mt-4 max-h-[32rem] overflow-y-auto rounded-xl border border-slate-800",
              "bg-slate-950/80 p-6 font-mono text-sm leading-relaxed text-slate-200",
              "whitespace-pre-wrap",
            )}
          >
            {markdown}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
