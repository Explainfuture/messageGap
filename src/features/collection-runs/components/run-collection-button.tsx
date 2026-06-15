"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RunCollectionButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRunning, setIsRunning] = useState(false);

  const runCollection = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/collection/run", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("采集任务启动失败");
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
    <div className="flex flex-col items-end gap-2">
      <Button onClick={runCollection} disabled={disabled}>
        {disabled ? <Loader2 className="animate-spin" /> : <Play />}
        立即采集
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
