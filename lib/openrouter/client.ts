import { z } from "zod";
import { OpenRouterCompletionSchema } from "@/lib/openrouter/schemas";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const TIMEOUT_MS = 60_000;

export class AiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
    this.name = "AiError";
  }
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CompleteJsonOptions<T> {
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  resultSchema: z.ZodType<T>;
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  event: string;
}

function textModel(): string {
  return process.env.OPENROUTER_MODEL ?? "qwen/qwen3.8-27b";
}

function getApiKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY?.trim();
}

async function request(
  body: Record<string, unknown>,
  event: string,
): Promise<unknown> {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let status = "error";

  try {
    const key = getApiKey();
    if (!key) throw new AiError("AI_NOT_CONFIGURED", 503);

    const response = await fetch(ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new AiError(
        response.status === 429 ? "RATE_LIMIT" : "AI_UNAVAILABLE",
        response.status === 429 ? 429 : 503,
      );
    }

    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch {
      throw new AiError("AI_INVALID_RESPONSE", 502);
    }

    status = "ok";
    return parsed;
  } catch (error) {
    const failure =
      controller.signal.aborted
        ? new AiError("AI_TIMEOUT", 504)
        : error instanceof AiError
          ? error
          : new AiError("AI_UNAVAILABLE", 503);
    status = failure.code;
    throw failure;
  } finally {
    clearTimeout(timeout);
    if (process.env.NODE_ENV === "development") {
      console.log({ event, durationMs: Date.now() - started, status });
    }
  }
}

export async function completeJson<T>(options: CompleteJsonOptions<T>): Promise<T> {
  const body = {
    model: textModel(),
    stream: false,
    max_tokens: options.maxTokens ?? 2500,
    reasoning: { enabled: false },
    provider: { require_parameters: true, allow_fallbacks: false },
    response_format: {
      type: "json_schema",
      json_schema: {
        name: options.schemaName,
        strict: true,
        schema: options.jsonSchema,
      },
    },
    messages: [
      { role: "system", content: options.system },
      ...options.messages,
    ],
  };

  const payload = await request(body, options.event);
  const completion = OpenRouterCompletionSchema.safeParse(payload);
  if (!completion.success) {
    throw new AiError("AI_INVALID_RESPONSE", 502);
  }

  const choice = completion.data.choices[0];
  if (!choice || choice.finish_reason !== "stop") {
    throw new AiError("AI_INVALID_RESPONSE", 502);
  }

  let content: unknown;
  try {
    content = JSON.parse(choice.message.content);
  } catch {
    throw new AiError("AI_INVALID_RESPONSE", 502);
  }

  const parsed = options.resultSchema.safeParse(content);
  if (!parsed.success) {
    throw new AiError("AI_INVALID_RESPONSE", 502);
  }

  return parsed.data;
}

export function isOpenRouterConfigured(): boolean {
  const key = getApiKey();
  return Boolean(key && key.length > 0);
}
