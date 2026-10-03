import Link from "next/link";
import { AlertTriangle, Bell, CheckCircle2, Siren } from "lucide-react";
import type { analyzeThreat } from "@/app/actions/analyze-threat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SEVERITY_LABELS } from "@/lib/constants";

type Result = Extract<Awaited<ReturnType<typeof analyzeThreat>>, { success: true }>;

export function VerdictDisplay({ result }: { result: Result }) {
  const isThreat = result.verdict === "THREAT";

  return (
    <Card
      className={
        isThreat
          ? "border-rose-500/40 bg-rose-950/20"
          : "border-emerald-500/40 bg-emerald-950/20"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            {isThreat ? (
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            )}
            Werdykt: {isThreat ? "Phishing / Zagrożenie" : "Prawdopodobnie bezpieczne"}
          </CardTitle>
          <CardDescription>
            Pewność modelu: {Math.round(result.confidence * 100)}%
          </CardDescription>
        </div>
        <Badge variant={isThreat ? "threat" : "safe"}>
          {SEVERITY_LABELS[result.severity]}
        </Badge>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-200">{result.explanation}</p>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Wskaźniki
        </p>
        <ul className="mt-2 space-y-1">
          {result.indicators.map((indicator) => (
            <li key={indicator} className="text-sm text-slate-300">• {indicator}</li>
          ))}
        </ul>
      </div>

      {isThreat && result.alertSent ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-amber-300">
          <Bell className="h-4 w-4" />
          Alert wysłany na: {result.alertChannels?.join(", ")}
        </p>
      ) : null}

      {isThreat ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/playbook">
            <Button variant="danger">
              <Siren className="h-4 w-4" />
              Uruchom Kryzysownik
            </Button>
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
