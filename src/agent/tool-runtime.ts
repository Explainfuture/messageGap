import { randomUUID } from "node:crypto";

import type { ToolCallEvent } from "@/features/threads/types";
import {
  insertToolCallEvent,
  updateToolCallEvent,
} from "@/features/threads/server/threads.repository";

export type ToolLifecycleHandlers = {
  onEvent: (event: ToolCallEvent) => void;
};

export async function runTracedTool<TOutput extends Record<string, unknown>>(
  params: {
    threadId: string;
    messageId: string | null;
    toolName: string;
    inputPreview: Record<string, unknown>;
    run: () => Promise<TOutput>;
  },
  handlers: ToolLifecycleHandlers,
) {
  const startedAt = new Date().toISOString();
  const baseEvent: ToolCallEvent = {
    id: `tool-${randomUUID()}`,
    threadId: params.threadId,
    messageId: params.messageId,
    runId: `run-${randomUUID()}`,
    eventType: "tool_call_use",
    toolName: params.toolName,
    status: "running",
    inputPreview: params.inputPreview,
    outputPreview: null,
    startedAt,
    endedAt: null,
    error: null,
  };

  insertToolCallEvent(baseEvent);
  handlers.onEvent(baseEvent);

  try {
    const output = await params.run();
    const completed: ToolCallEvent = {
      ...baseEvent,
      eventType: "tool_call_end",
      status: "success",
      outputPreview: output,
      endedAt: new Date().toISOString(),
    };

    updateToolCallEvent(completed);
    handlers.onEvent(completed);
    return output;
  } catch (error) {
    const failed: ToolCallEvent = {
      ...baseEvent,
      eventType: "tool_call_end",
      status: "error",
      endedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };

    updateToolCallEvent(failed);
    handlers.onEvent(failed);
    throw error;
  }
}
