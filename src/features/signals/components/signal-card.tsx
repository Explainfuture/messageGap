import Link from "next/link";
import { ArrowUpRight, Clock3, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InfoSignal } from "@/features/signals/types";
import { formatRelativeTime } from "@/lib/time";

import { RiskBadge } from "./risk-badge";

export function SignalCard({ signal }: { signal: InfoSignal }) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-[border-color,box-shadow] duration-150 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{signal.category}</Badge>
          <RiskBadge riskLevel={signal.riskLevel} />
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3 aria-hidden="true" className="size-3.5" />
            {formatRelativeTime(signal.publishedAt)}
          </span>
        </div>
        <CardTitle className="line-clamp-2 min-h-11 leading-snug">
          <Link
            href={`/signals/${signal.id}`}
            className="transition-colors duration-150 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {signal.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2 min-h-10 leading-5">
          {signal.summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-md bg-secondary/65 p-2">
            <div className="text-xs text-muted-foreground">分数</div>
            <div className="font-semibold tabular-nums">{signal.opportunityScore}</div>
          </div>
          <div className="rounded-md bg-secondary/65 p-2">
            <div className="text-xs text-muted-foreground">窗口</div>
            <div className="truncate font-semibold">{signal.actionWindow}</div>
          </div>
          <div className="rounded-md bg-secondary/65 p-2">
            <div className="text-xs text-muted-foreground">证据</div>
            <div className="font-semibold tabular-nums">{signal.evidenceIds.length}</div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <ShieldAlert aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">{signal.riskWarnings[0]}</span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/signals/${signal.id}`}>
              详情
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
