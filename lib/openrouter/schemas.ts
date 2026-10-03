import { z } from "zod";

export const OpenRouterCompletionSchema = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.string(),
        message: z.object({ content: z.string() }),
      }),
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: z.number().int().nonnegative(),
      completion_tokens: z.number().int().nonnegative(),
      total_tokens: z.number().int().nonnegative(),
    })
    .optional(),
});

export const threatAnalysisSchema = z.object({
  verdict: z.enum(["SAFE", "THREAT"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  confidence: z.number().min(0).max(1),
  explanation: z.string(),
  indicators: z.array(z.string()),
});

export type ThreatAnalysis = z.infer<typeof threatAnalysisSchema>;

export const threatAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "severity", "confidence", "explanation", "indicators"],
  properties: {
    verdict: { type: "string", enum: ["SAFE", "THREAT"] },
    severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    explanation: { type: "string", minLength: 1, maxLength: 1000 },
    indicators: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: { type: "string", minLength: 1, maxLength: 200 },
    },
  },
} as const;
