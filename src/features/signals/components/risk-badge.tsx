import { Badge } from "@/components/ui/badge";
import type { RiskLevel } from "@/features/signals/types";

const riskText: Record<RiskLevel, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  critical: "严重风险",
};

export function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const variant =
    riskLevel === "high" || riskLevel === "critical" ? "danger" : "warning";

  if (riskLevel === "low") {
    return <Badge variant="secondary">{riskText[riskLevel]}</Badge>;
  }

  return <Badge variant={variant}>{riskText[riskLevel]}</Badge>;
}
