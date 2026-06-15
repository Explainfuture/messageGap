import type { CollectionRun } from "@/features/collection-runs/types";
import type { CollectionRuntimeConfig } from "@/features/collection-runs/server/runtime-config";
import { formatDateTime } from "@/lib/time";

function formatMode(runtime: CollectionRuntimeConfig) {
  return runtime.mode === "browser-search"
    ? "真实浏览器搜索"
    : "示例数据";
}

export function RunStatus({
  run,
  runtime,
}: {
  run: CollectionRun | null;
  runtime: CollectionRuntimeConfig;
}) {
  if (!run) {
    return (
      <p className="text-sm text-muted-foreground">
        尚未运行采集任务，当前采集模式：{formatMode(runtime)}。
      </p>
    );
  }

  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      <p>
        当前采集模式：{formatMode(runtime)}
        {runtime.deepSeekEvaluationEnabled ? "，DeepSeek 评估开启" : ""}
        {runtime.livePageCrawlEnabled ? "，页面抽取开启" : ""}。
      </p>
      <p>
        上次采集：{formatDateTime(run.startedAt)}，状态 {run.status}，
        发现 {run.urlsDiscovered} 条，保存 {run.signalsSaved} 条。
      </p>
      {run.urlsDiscovered > 0 && run.signalsSaved === 0 ? (
        <p>候选 URL 已存在时会被去重跳过，所以可能保存 0 条。</p>
      ) : null}
    </div>
  );
}
