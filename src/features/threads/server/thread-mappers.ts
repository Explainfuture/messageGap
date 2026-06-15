import { parseJson, stringifyJson } from "@/db/json";
import { agentMessages, agentThreads, toolCallEvents } from "@/db/schema";
import type {
  AgentMessage,
  AgentThread,
  ToolCallEvent,
  ToolCallEventType,
  ToolCallStatus,
} from "@/features/threads/types";

type ThreadRow = typeof agentThreads.$inferSelect;
type MessageRow = typeof agentMessages.$inferSelect;
type ToolCallEventRow = typeof toolCallEvents.$inferSelect;

export function toThread(row: ThreadRow): AgentThread {
  return {
    id: row.id,
    signalId: row.signalId,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toMessage(row: MessageRow): AgentMessage {
  return {
    id: row.id,
    threadId: row.threadId,
    role: row.role as AgentMessage["role"],
    content: row.content,
    createdAt: row.createdAt,
  };
}

export function toToolCallEvent(row: ToolCallEventRow): ToolCallEvent {
  return {
    id: row.id,
    threadId: row.threadId,
    messageId: row.messageId,
    runId: row.runId,
    eventType: row.eventType as ToolCallEventType,
    toolName: row.toolName,
    status: row.status as ToolCallStatus,
    inputPreview: row.inputPreviewJson
      ? parseJson<Record<string, unknown>>(row.inputPreviewJson, {})
      : null,
    outputPreview: row.outputPreviewJson
      ? parseJson<Record<string, unknown>>(row.outputPreviewJson, {})
      : null,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    error: row.error,
  };
}

export function fromToolCallEvent(
  event: ToolCallEvent,
): typeof toolCallEvents.$inferInsert {
  return {
    id: event.id,
    threadId: event.threadId,
    messageId: event.messageId,
    runId: event.runId,
    eventType: event.eventType,
    toolName: event.toolName,
    status: event.status,
    inputPreviewJson: event.inputPreview
      ? stringifyJson(event.inputPreview)
      : null,
    outputPreviewJson: event.outputPreview
      ? stringifyJson(event.outputPreview)
      : null,
    startedAt: event.startedAt,
    endedAt: event.endedAt,
    error: event.error,
  };
}
