import { z } from "zod";

import { callDeepSeek } from "@/deepseek/client";
import { informationGapSystemPrompt } from "@/deepseek/prompts";
import type { InfoSignal, SignalEvidence } from "@/features/signals/types";
import { getBooleanEnv, getEnv } from "@/lib/env";

import type { CollectionCandidate } from "./collection-candidate";
import { evaluateCandidate } from "./evaluate-candidate";

const deepSeekSignalSchema = z.object({
  shouldSave: z.boolean(),
  title: z.string().min(1),
  summary: z.string().min(1),
  whyItMatters: z.string().min(1),
  opportunityScore: z.number().min(0).max(100),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  riskWarnings: z.array(z.string()).min(1),
  actionWindow: z.string().min(1),
  suggestedActions: z.array(z.string()).min(1),
  tags: z.array(z.string()).default([]),
});

function extractJsonObject(content: string) {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("DeepSeek response did not include a JSON object");
  }

  return JSON.parse(content.slice(start, end + 1)) as unknown;
}

function buildCandidatePrompt(candidate: CollectionCandidate) {
  return `
请判断下面候选内容是否值得保存为 MessageGap 信息差。

分类：${candidate.category}
来源：${candidate.sourceName}
URL：${candidate.url}
标题：${candidate.title}
发布时间：${candidate.publishedAt}
发现时间：${candidate.discoveredAt}
摘要/证据：
${candidate.snippet}

页面抽取文本：
${candidate.extractedText?.slice(0, 6000) ?? "无"}

只返回 JSON：
{
  "shouldSave": true,
  "title": "...",
  "summary": "...",
  "whyItMatters": "...",
  "opportunityScore": 0,
  "riskLevel": "low|medium|high|critical",
  "riskWarnings": ["..."],
  "actionWindow": "...",
  "suggestedActions": ["..."],
  "tags": ["..."]
}
`;
}

function mergeDeepSeekResult(
  candidate: CollectionCandidate,
  result: z.infer<typeof deepSeekSignalSchema>,
): { signal: InfoSignal; evidence: SignalEvidence[] } | null {
  if (!result.shouldSave || result.opportunityScore < 60) {
    return null;
  }

  const evaluated = evaluateCandidate(candidate);
  return {
    signal: {
      ...evaluated.signal,
      title: result.title,
      tags: Array.from(new Set([...result.tags, ...evaluated.signal.tags])),
      summary: result.summary,
      whyItMatters: result.whyItMatters,
      opportunityScore: Math.round(result.opportunityScore),
      riskLevel: result.riskLevel,
      riskWarnings: result.riskWarnings,
      actionWindow: result.actionWindow,
      suggestedActions: result.suggestedActions,
    },
    evidence: evaluated.evidence,
  };
}

export async function evaluateCandidateWithOptionalDeepSeek(
  candidate: CollectionCandidate,
) {
  const enabled = getBooleanEnv("ENABLE_DEEPSEEK_EVALUATION", false);
  const hasApiKey = Boolean(getEnv("DEEPSEEK_API_KEY"));

  if (!enabled || !hasApiKey) {
    return evaluateCandidate(candidate);
  }

  try {
    const response = await callDeepSeek({
      temperature: 0.1,
      messages: [
        { role: "system", content: informationGapSystemPrompt },
        { role: "user", content: buildCandidatePrompt(candidate) },
      ],
    });
    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("DeepSeek response was empty");
    }

    const parsed = deepSeekSignalSchema.parse(extractJsonObject(content));
    return mergeDeepSeekResult(candidate, parsed);
  } catch {
    return evaluateCandidate(candidate);
  }
}
