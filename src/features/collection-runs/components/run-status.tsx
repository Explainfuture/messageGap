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
      <div className="max-w-3xl space-y-1 rounded-lg border bg-card/70 px-3 py-2 text-sm text-muted-foreground shadow-sm shadow-primary/5">
        <p>尚未运行采集任务，当前采集模式：{formatMode(runtime)}。</p>
        {runtime.mode === "browser-search" ? (
          <p>
            立即采集覆盖 {runtime.searchDirectionsPerRun} 个方向，每个方向{" "}
            {runtime.searchQueriesPerCategory} 组关键词，每组最多{" "}
            {runtime.maxSearchResultsPerQuery} 条候选。
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-1 rounded-lg border bg-card/70 px-3 py-2 text-sm text-muted-foreground shadow-sm shadow-primary/5">
      <p>
        当前采集模式：{formatMode(runtime)}
        {runtime.deepSeekEvaluationEnabled ? "，DeepSeek 评估开启" : ""}
        {runtime.livePageCrawlEnabled ? "，页面抽取开启" : ""}。
      </p>
      {runtime.mode === "browser-search" ? (
        <p>
          立即采集覆盖 {runtime.searchDirectionsPerRun} 个方向，每个方向{" "}
          {runtime.searchQueriesPerCategory} 组关键词，每组最多{" "}
          {runtime.maxSearchResultsPerQuery} 条候选。
        </p>
      ) : null}
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
