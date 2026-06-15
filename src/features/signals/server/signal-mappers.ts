import type {
  InfoSignal,
  RiskLevel,
  ScoreBreakdown,
  SignalCategory,
  SignalEvidence,
  SignalStatus,
} from "@/features/signals/types";
import { parseJson, stringifyJson } from "@/db/json";
import { infoSignals, signalEvidence } from "@/db/schema";

type SignalRow = typeof infoSignals.$inferSelect;
type EvidenceRow = typeof signalEvidence.$inferSelect;

export function toSignal(row: SignalRow): InfoSignal {
  return {
    id: row.id,
    title: row.title,
    category: row.category as SignalCategory,
    tags: parseJson<string[]>(row.tagsJson, []),
    summary: row.summary,
    whyItMatters: row.whyItMatters,
    sourceUrls: parseJson<string[]>(row.sourceUrlsJson, []),
    publishedAt: row.publishedAt,
    discoveredAt: row.discoveredAt,
    freshnessHours: row.freshnessHours,
    opportunityScore: row.opportunityScore,
    scoreBreakdown: parseJson<ScoreBreakdown>(row.scoreBreakdownJson, {
      freshness: 0,
      actionability: 0,
      asymmetry: 0,
      windowUrgency: 0,
      evidenceStrength: 0,
      potentialUpside: 0,
      riskClarity: 0,
    }),
    riskLevel: row.riskLevel as RiskLevel,
    riskWarnings: parseJson<string[]>(row.riskWarningsJson, []),
    actionWindow: row.actionWindow,
    suggestedActions: parseJson<string[]>(row.suggestedActionsJson, []),
    evidenceIds: parseJson<string[]>(row.evidenceIdsJson, []),
    status: row.status as SignalStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function fromSignal(signal: InfoSignal): typeof infoSignals.$inferInsert {
  return {
    id: signal.id,
    title: signal.title,
    category: signal.category,
    tagsJson: stringifyJson(signal.tags),
    summary: signal.summary,
    whyItMatters: signal.whyItMatters,
    sourceUrlsJson: stringifyJson(signal.sourceUrls),
    publishedAt: signal.publishedAt,
    discoveredAt: signal.discoveredAt,
    freshnessHours: signal.freshnessHours,
    opportunityScore: signal.opportunityScore,
    scoreBreakdownJson: stringifyJson(signal.scoreBreakdown),
    riskLevel: signal.riskLevel,
    riskWarningsJson: stringifyJson(signal.riskWarnings),
    actionWindow: signal.actionWindow,
    suggestedActionsJson: stringifyJson(signal.suggestedActions),
    evidenceIdsJson: stringifyJson(signal.evidenceIds),
    status: signal.status,
    createdAt: signal.createdAt,
    updatedAt: signal.updatedAt,
  };
}

export function toEvidence(row: EvidenceRow): SignalEvidence {
  return {
    id: row.id,
    signalId: row.signalId,
    rawSourceItemId: row.rawSourceItemId,
    url: row.url,
    snippet: row.snippet,
    evidenceType: row.evidenceType as SignalEvidence["evidenceType"],
    confidence: row.confidence,
    createdAt: row.createdAt,
  };
}

export function fromEvidence(
  evidence: SignalEvidence,
): typeof signalEvidence.$inferInsert {
  return {
    id: evidence.id,
    signalId: evidence.signalId,
    rawSourceItemId: evidence.rawSourceItemId,
    url: evidence.url,
    snippet: evidence.snippet,
    evidenceType: evidence.evidenceType,
    confidence: evidence.confidence,
    createdAt: evidence.createdAt,
  };
}
