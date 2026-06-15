import type { ScoreBreakdown } from "@/features/signals/types";

const labels: Array<[keyof ScoreBreakdown, string]> = [
  ["freshness", "新鲜度"],
  ["actionability", "可行动性"],
  ["asymmetry", "信息不对称"],
  ["windowUrgency", "窗口紧迫度"],
  ["evidenceStrength", "证据强度"],
  ["potentialUpside", "潜在收益"],
  ["riskClarity", "风险可识别"],
];

export function ScoreBreakdownView({
  score,
}: {
  score: ScoreBreakdown;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {labels.map(([key, label]) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{score[key]}</span>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary shadow-sm shadow-primary/20"
              style={{ width: `${Math.min(100, score[key] * 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
