import type { CollectionRun } from "@/features/collection-runs/types";
import { formatDateTime } from "@/lib/time";

export function RunStatus({ run }: { run: CollectionRun | null }) {
  if (!run) {
    return (
      <p className="text-sm text-muted-foreground">
        尚未运行采集任务，当前展示 seed 数据。
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      上次采集：{formatDateTime(run.startedAt)}，状态 {run.status}，
      发现 {run.urlsDiscovered} 条，保存 {run.signalsSaved} 条。
    </p>
  );
}
