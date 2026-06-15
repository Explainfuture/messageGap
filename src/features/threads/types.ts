export type AgentThread = {
  id: string;
  signalId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentMessageRole = "user" | "assistant" | "system";

export type AgentMessage = {
  id: string;
  threadId: string;
  role: AgentMessageRole;
  content: string;
  createdAt: string;
};

export type ToolCallStatus = "running" | "success" | "error" | "cancelled";
export type ToolCallEventType = "tool_call_use" | "tool_call_end";

export type ToolCallEvent = {
  id: string;
  threadId: string;
  messageId: string | null;
  runId: string;
  eventType: ToolCallEventType;
  toolName: string;
  status: ToolCallStatus;
  inputPreview: Record<string, unknown> | null;
  outputPreview: Record<string, unknown> | null;
  startedAt: string;
  endedAt: string | null;
  error: string | null;
};
