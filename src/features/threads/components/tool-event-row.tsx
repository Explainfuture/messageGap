import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ToolCallEvent } from "@/features/threads/types";
import { cn } from "@/lib/utils";

export function ToolEventRow({ event }: { event: ToolCallEvent }) {
  const isRunning = event.status === "running";
  const isError = event.status === "error";

  return (
    <div className="rounded-md border bg-muted/40 p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isRunning ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : isError ? (
            <XCircle className="size-4 text-destructive" />
          ) : (
            <CheckCircle2 className="size-4 text-primary" />
          )}
          <span className="truncate font-medium">{event.toolName}</span>
        </div>
        <Badge
          variant={isError ? "danger" : isRunning ? "secondary" : "outline"}
        >
          {event.eventType}
        </Badge>
      </div>
      <pre
        className={cn(
          "mt-2 max-h-32 overflow-auto rounded bg-background p-2 text-xs text-muted-foreground",
          isError && "text-destructive",
        )}
      >
        {JSON.stringify(event.outputPreview ?? event.inputPreview ?? event.error, null, 2)}
      </pre>
    </div>
  );
}
