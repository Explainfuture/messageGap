"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CollectionRun } from "@/features/collection-runs/types";
import type {
  CollectionMode,
  CollectionRuntimeConfig,
} from "@/features/collection-runs/server/runtime-config";

type CollectionRunResponse = {
  run?: CollectionRun;
  runtime: CollectionRuntimeConfig;
  error?: string;
};

function modeLabel(mode: CollectionMode) {
  return mode === "browser-search" ? "真实搜索" : "示例模式";
}

export function RunCollectionButton({
  runtime,
}: {
  runtime: CollectionRuntimeConfig;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<CollectionRun | null>(null);
  const [lastRuntime, setLastRuntime] =
    useState<CollectionRuntimeConfig>(runtime);
  const [isPending, startTransition] = useTransition();
  const [isRunning, setIsRunning] = useState(false);

  const runCollection = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/collection/run", {
        method: "POST",
      });

      const payload = (await response.json()) as CollectionRunResponse;

      if (!response.ok) {
        throw new Error(payload.error || "采集任务启动失败");
      }

      if (!payload.run) {
        throw new Error(payload.error || "采集任务没有返回结果");
      }

      setLastRun(payload.run);
      setLastRuntime(payload.runtime);
      if (payload.run.status === "error") {
        setError(payload.run.errors[0] ?? "采集任务执行失败");
      }
      startTransition(() => router.refresh());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "未知错误");
    } finally {
      setIsRunning(false);
    }
  };

  const disabled = isRunning || isPending;

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <Button onClick={runCollection} disabled={disabled} size="lg">
        {disabled ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : (
          <Play aria-hidden="true" />
        )}
        立即采集
      </Button>
      {lastRun ? (
        <p
          aria-live="polite"
          className="max-w-80 text-left text-xs text-muted-foreground md:text-right"
        >
          {modeLabel(lastRuntime.mode)}采集完成：发现 {lastRun.urlsDiscovered} 条，评估{" "}
          {lastRun.candidatesEvaluated} 条，新保存 {lastRun.signalsSaved} 条
          {lastRun.errors.length > 0 ? `，错误 ${lastRun.errors.length} 个` : ""}
          {lastRun.urlsDiscovered > 0 && lastRun.signalsSaved === 0
            ? "。候选 URL 已存在，被去重跳过。"
            : ""}
        </p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
