"use client";

import { useState, useTransition } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { analyzeThreat } from "@/app/actions/analyze-threat";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VerdictDisplay } from "@/components/report/verdict-display";

const EXAMPLE_PHISHING = `PILNE: Twoje konto Microsoft zostanie zawieszone za 2 godziny.
Kliknij tutaj aby zweryfikować hasło: http://micros0ft-login.xyz/verify
Jeśli nie potwierdzisz danych, utracisz dostęp do skrzynki.`;

export function ThreatForm() {
  const [content, setContent] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof analyzeThreat>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const response = await analyzeThreat({ content });
      if (!response.success) {
        setError(response.error);
        setResult(null);
        return;
      }
      setResult(response);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-400" />
          Panic Button — sprawdź wiadomość
        </CardTitle>
        <CardDescription>
          Wklej treść podejrzanego maila lub SMS. AI przeanalizuje zagrożenie i zapisze
          incydent w bazie.
        </CardDescription>

        <div className="mt-6 space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Wklej tutaj treść wiadomości..."
          />
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isPending || content.trim().length < 10}
              variant="danger"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analizuję...
                </>
              ) : (
                "Sprawdź zagrożenie"
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setContent(EXAMPLE_PHISHING)}
            >
              Wstaw przykład phishingu
            </Button>
          </div>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        </div>
      </Card>

      {result?.success ? <VerdictDisplay result={result} /> : null}
    </div>
  );
}
