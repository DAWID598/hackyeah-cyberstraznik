import OpenAI from "openai";
import { z } from "zod";

const analysisSchema = z.object({
  verdict: z.enum(["SAFE", "THREAT"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  confidence: z.number().min(0).max(1),
  explanation: z.string(),
  indicators: z.array(z.string()),
});

export type ThreatAnalysis = z.infer<typeof analysisSchema>;

const SYSTEM_PROMPT = `Jesteś analitykiem bezpieczeństwa SOC wspierającym małe organizacje publiczne i firmy.
Analizujesz podejrzane wiadomości e-mail/SMS pod kątem phishingu, oszustw i inżynierii społecznej.
Odpowiadaj WYŁĄCZNIE poprawnym JSON bez markdown:
{
  "verdict": "SAFE" | "THREAT",
  "severity": "LOW" | "MEDIUM" | "HIGH",
  "confidence": 0.0-1.0,
  "explanation": "krótkie wyjaśnienie po polsku dla pracownika nietechnicznego",
  "indicators": ["lista sygnałów ostrzegawczych lub powodów bezpieczeństwa"]
}`;

function heuristicAnalysis(content: string): ThreatAnalysis {
  const lower = content.toLowerCase();
  const indicators: string[] = [];
  let threatScore = 0;

  const checks: Array<[RegExp, string, number]> = [
    [/pilnie|natychmiast|ostatnia szansa|konto zostanie zablokowane/i, "Presja czasowa", 2],
    [/kliknij|zaloguj|potwierdź|zweryfikuj/i, "Wezwanie do kliknięcia", 1],
    [/hasło|password|dane logowania|kod otp/i, "Prośba o dane wrażliwe", 3],
    [/bitcoin|przelew|faktura|zaliczka/i, "Motyw finansowy", 2],
    [/http:\/\/|bit\.ly|tinyurl/i, "Podejrzany link", 2],
    [/urgent|verify your account|suspended/i, "Angielskie sygnały phishingu", 2],
  ];

  for (const [pattern, label, weight] of checks) {
    if (pattern.test(content)) {
      indicators.push(label);
      threatScore += weight;
    }
  }

  const isThreat = threatScore >= 3;
  const severity =
    threatScore >= 6 ? "HIGH" : threatScore >= 3 ? "MEDIUM" : "LOW";

  return {
    verdict: isThreat ? "THREAT" : "SAFE",
    severity,
    confidence: Math.min(0.95, 0.55 + threatScore * 0.08),
    explanation: isThreat
      ? `Wykryto ${indicators.length} sygnałów ostrzegawczych typowych dla phishingu. Nie klikaj linków i zgłoś incydent administratorowi.`
      : "Nie znaleziono typowych wskaźników phishingu. Zachowaj ostrożność przy nieznanych załącznikach.",
    indicators:
      indicators.length > 0
        ? indicators
        : ["Brak typowych sygnałów phishingu w treści"],
  };
}

export async function analyzeThreatContent(content: string): Promise<ThreatAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.startsWith("sk-your")) {
    return heuristicAnalysis(content);
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Przeanalizuj tę wiadomość:\n\n${content}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty AI response");

    return analysisSchema.parse(JSON.parse(raw));
  } catch {
    return heuristicAnalysis(content);
  }
}
