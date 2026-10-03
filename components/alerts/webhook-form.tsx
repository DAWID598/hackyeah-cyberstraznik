"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

type FormValues = {
  name: string;
  type: "SLACK" | "DISCORD" | "TELEGRAM";
  webhookUrl?: string;
  botToken?: string;
  chatId?: string;
  minSeverity: "LOW" | "MEDIUM" | "HIGH";
};

type SubmitResult = { success: boolean; error?: string };

export function WebhookForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<FormValues>;
  onSubmit: (values: FormValues) => Promise<SubmitResult>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<FormValues["type"]>(initial?.type ?? "SLACK");
  const [webhookUrl, setWebhookUrl] = useState(initial?.webhookUrl ?? "");
  const [botToken, setBotToken] = useState(initial?.botToken ?? "");
  const [chatId, setChatId] = useState(initial?.chatId ?? "");
  const [minSeverity, setMinSeverity] = useState<FormValues["minSeverity"]>(
    initial?.minSeverity ?? "HIGH",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isTelegram = type === "TELEGRAM";

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await onSubmit({
        name,
        type,
        webhookUrl: isTelegram ? undefined : webhookUrl,
        botToken: isTelegram ? botToken : undefined,
        chatId: isTelegram ? chatId : undefined,
        minSeverity,
      });
      if (!result.success) setError(result.error ?? "Nie udało się zapisać kanału.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-slate-400">Nazwa kanału</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. #it-security"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-400">Platforma</label>
          <Select value={type} onChange={(e) => setType(e.target.value as FormValues["type"])}>
            <option value="SLACK">Slack</option>
            <option value="DISCORD">Discord</option>
            <option value="TELEGRAM">Telegram</option>
          </Select>
        </div>
      </div>

      {isTelegram ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-slate-400">Bot Token</label>
            <Input
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABC..."
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-400">Chat ID</label>
            <Input
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="-1001234567890"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-2 block text-sm text-slate-400">Webhook URL</label>
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
          />
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm text-slate-400">
          Minimalny poziom zagrożenia dla tego kanału
        </label>
        <Select
          value={minSeverity}
          onChange={(e) => setMinSeverity(e.target.value as FormValues["minSeverity"])}
        >
          <option value="LOW">LOW — wszystkie</option>
          <option value="MEDIUM">MEDIUM+</option>
          <option value="HIGH">HIGH — tylko krytyczne</option>
        </Select>
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={isPending || name.trim().length < 2}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Zapisz kanał
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isPending}>
          Anuluj
        </Button>
      </div>
    </div>
  );
}
