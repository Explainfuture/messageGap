import { z } from "zod";

import { getEnv } from "@/lib/env";

const deepSeekMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const deepSeekRequestSchema = z.object({
  messages: z.array(deepSeekMessageSchema),
  temperature: z.number().min(0).max(2).default(0.2),
});

export type DeepSeekRequest = z.infer<typeof deepSeekRequestSchema>;

export function hasDeepSeekConfig() {
  return Boolean(getEnv("DEEPSEEK_API_KEY"));
}

export async function callDeepSeek(request: DeepSeekRequest) {
  const parsed = deepSeekRequestSchema.parse(request);
  const apiKey = getEnv("DEEPSEEK_API_KEY");

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const response = await fetch(`${getEnv("DEEPSEEK_BASE_URL")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getEnv("DEEPSEEK_MODEL", "deepseek-chat"),
      messages: parsed.messages,
      temperature: parsed.temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek request failed: ${response.status}`);
  }

  return response.json() as Promise<{
    choices?: Array<{ message?: { content?: string } }>;
  }>;
}

export function extractDeepSeekText(response: {
  choices?: Array<{ message?: { content?: string } }>;
}) {
  return response.choices?.[0]?.message?.content?.trim() ?? "";
}
