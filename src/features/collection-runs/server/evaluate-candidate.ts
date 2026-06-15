import { randomUUID } from "node:crypto";

import type { InfoSignal, SignalEvidence } from "@/features/signals/types";
import { hoursSince } from "@/lib/time";

import type { CollectionCandidate } from "./collection-candidate";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function inferRisk(candidate: CollectionCandidate): InfoSignal["riskLevel"] {
  if (candidate.category === "金融市场" || candidate.category === "合规风险") {
    return "high";
  }

  if (candidate.category === "平台红利" || candidate.category === "赚钱副业") {
    return "medium";
  }

  return "low";
}

export function evaluateCandidate(candidate: CollectionCandidate): {
  signal: InfoSignal;
  evidence: SignalEvidence[];
} {
  const freshnessHours = hoursSince(candidate.publishedAt);
  const freshness = clampScore(25 - freshnessHours * 2);
  const actionability = 16;
  const asymmetry = candidate.sourceName.includes("reddit") ? 14 : 12;
  const windowUrgency = freshnessHours < 2 ? 14 : 10;
  const evidenceStrength = candidate.snippet.length > 40 ? 7 : 4;
  const potentialUpside = candidate.category === "技术开源" ? 9 : 7;
  const riskClarity = 3;
  const opportunityScore = clampScore(
    freshness +
      actionability +
      asymmetry +
      windowUrgency +
      evidenceStrength +
      potentialUpside +
      riskClarity,
  );
  const id = `signal-${randomUUID()}`;
  const evidenceId = `evidence-${randomUUID()}`;
  const now = new Date().toISOString();
  const riskLevel = inferRisk(candidate);

  return {
    signal: {
      id,
      title: candidate.title,
      category: candidate.category,
      tags: [candidate.sourceName, candidate.category, "网页搜索"],
      summary: candidate.snippet,
      whyItMatters:
        "内容发布时间很近，且包含具体变化、窗口或重复反馈，值得作为信息差候选继续追问。",
      sourceUrls: [candidate.url],
      publishedAt: candidate.publishedAt,
      discoveredAt: candidate.discoveredAt,
      freshnessHours,
      opportunityScore,
      scoreBreakdown: {
        freshness,
        actionability,
        asymmetry,
        windowUrgency,
        evidenceStrength,
        potentialUpside,
        riskClarity,
      },
      riskLevel,
      riskWarnings: [
        "当前结论来自自动筛选，需要打开来源页二次核验。",
        riskLevel === "low"
          ? "执行前仍需确认官方页面或原帖上下文。"
          : "涉及平台规则、收益或合规边界，不能直接照做。",
      ],
      actionWindow: freshnessHours < 2 ? "接下来 24 小时" : "接下来 3 日内",
      suggestedActions: [
        "打开来源页核验发布时间、评论区和上下文。",
        "在 Agent 线程里搜索过去 24 小时相似信号。",
      ],
      evidenceIds: [evidenceId],
      status: "new",
      createdAt: now,
      updatedAt: now,
    },
    evidence: [
      {
        id: evidenceId,
        signalId: id,
        rawSourceItemId: null,
        url: candidate.url,
        snippet: candidate.snippet,
        evidenceType: "search_result",
        confidence: 0.68,
        createdAt: now,
      },
    ],
  };
}
