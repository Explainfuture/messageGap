export const signalCategories = [
  "考公考编",
  "升学深造",
  "大厂求职",
  "赚钱副业",
  "创业机会",
  "政策补贴",
  "竞赛项目",
  "技术开源",
  "金融市场",
  "平台红利",
  "合规风险",
  "城市资源",
] as const;

export type SignalCategory = (typeof signalCategories)[number];

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type SignalStatus = "new" | "useful" | "ignored" | "archived" | "investigating";

export type ScoreBreakdown = {
  freshness: number;
  actionability: number;
  asymmetry: number;
  windowUrgency: number;
  evidenceStrength: number;
  potentialUpside: number;
  riskClarity: number;
};

export type InfoSignal = {
  id: string;
  title: string;
  category: SignalCategory;
  tags: string[];
  summary: string;
  whyItMatters: string;
  sourceUrls: string[];
  publishedAt: string;
  discoveredAt: string;
  freshnessHours: number;
  opportunityScore: number;
  scoreBreakdown: ScoreBreakdown;
  riskLevel: RiskLevel;
  riskWarnings: string[];
  actionWindow: string;
  suggestedActions: string[];
  evidenceIds: string[];
  status: SignalStatus;
  createdAt: string;
  updatedAt: string;
};

export type SignalEvidence = {
  id: string;
  signalId: string;
  rawSourceItemId: string | null;
  url: string;
  snippet: string;
  evidenceType: "source_text" | "comment" | "search_result" | "manual_note";
  confidence: number;
  createdAt: string;
};

export type SignalWithEvidence = InfoSignal & {
  evidence: SignalEvidence[];
};
