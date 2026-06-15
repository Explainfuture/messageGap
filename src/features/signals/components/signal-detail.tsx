import Link from "next/link";
import { ExternalLink, MessageSquareText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { SignalWithEvidence } from "@/features/signals/types";
import { formatDateTime } from "@/lib/time";

import { RiskBadge } from "./risk-badge";
import { ScoreBreakdownView } from "./score-breakdown";

export function SignalDetail({
  signal,
  action,
}: {
  signal: SignalWithEvidence;
  action: (formData: FormData) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 space-y-5">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{signal.category}</Badge>
              <RiskBadge riskLevel={signal.riskLevel} />
              {signal.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="space-y-2">
              <h1 className="text-balance text-2xl font-semibold tracking-normal">
                {signal.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                发布：{formatDateTime(signal.publishedAt)} · 发现：
                {formatDateTime(signal.discoveredAt)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">摘要</h2>
              <p className="break-words leading-7">{signal.summary}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">为什么值得关注</h2>
              <p className="break-words leading-7">{signal.whyItMatters}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>证据</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {signal.evidence.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border bg-secondary/35 p-3"
              >
                <p className="text-sm leading-6">{item.snippet}</p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  打开来源
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>评分</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl font-semibold">
                {signal.opportunityScore}
              </div>
              <p className="text-sm text-muted-foreground">
                行动窗口：{signal.actionWindow}
              </p>
            </div>
            <ScoreBreakdownView score={signal.scoreBreakdown} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>建议行动</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm leading-6">
              {signal.suggestedActions.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>风险提示</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm leading-6">
              {signal.riskWarnings.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <form action={action}>
          <Button className="w-full" size="lg">
            <MessageSquareText aria-hidden="true" />
            深入追问
          </Button>
        </form>

        <Button asChild variant="ghost" className="w-full">
          <Link href="/">返回看板</Link>
        </Button>
      </aside>
    </div>
  );
}
