import type { SignalWithEvidence } from "@/features/signals/types";

export type AgentEvidenceContext = {
  signal: SignalWithEvidence;
  relatedSearchResults: Array<{
    title: string;
    url: string;
    snippet: string;
    sourceName: string;
  }>;
};

export function buildEvidenceDigest(context: AgentEvidenceContext) {
  const evidenceLines = context.signal.evidence.map(
    (item, index) =>
      `${index + 1}. ${item.snippet}\n来源：${item.url}\n置信度：${item.confidence}`,
  );
  const searchLines = context.relatedSearchResults.map(
    (item, index) =>
      `${index + 1}. ${item.title}\n来源：${item.sourceName} ${item.url}\n摘要：${item.snippet || "无"}`,
  );

  return [
    `信息差：${context.signal.title}`,
    `分类：${context.signal.category}`,
    `分数：${context.signal.opportunityScore}`,
    `摘要：${context.signal.summary}`,
    `为什么重要：${context.signal.whyItMatters}`,
    `风险：${context.signal.riskWarnings.join("；")}`,
    `建议行动：${context.signal.suggestedActions.join("；")}`,
    `证据：\n${evidenceLines.join("\n\n") || "无"}`,
    `相似搜索结果：\n${searchLines.join("\n\n") || "未执行实时搜索"}`,
  ].join("\n\n");
}
