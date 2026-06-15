import type { InfoSignal } from "@/features/signals/types";
import type { AgentMessage, ToolCallEvent } from "@/features/threads/types";
import { createMessage } from "@/features/threads/server/threads.repository";

import { runTracedTool } from "./tool-runtime";

export type ThreadAgentHandlers = {
  onMessage: (message: AgentMessage) => void;
  onToolEvent: (event: ToolCallEvent) => void;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildAnswer(userQuestion: string, signal: InfoSignal) {
  return [
    `基于「${signal.title}」，我会先把它当成一个需要二次核验的早期信号，而不是直接执行的结论。`,
    `当前最强证据是：${signal.summary}`,
    `下一步建议：${signal.suggestedActions.join("；")}`,
    `风险边界：${signal.riskWarnings.join("；")}`,
    `你的追问是「${userQuestion}」。下一轮可以继续要求我打开具体来源页、找 24 小时内相似信号，或拆成行动清单。`,
  ].join("\n\n");
}

export async function runThreadAgent(params: {
  threadId: string;
  signal: InfoSignal;
  userMessage: AgentMessage;
  handlers: ThreadAgentHandlers;
}) {
  await runTracedTool(
    {
      threadId: params.threadId,
      messageId: params.userMessage.id,
      toolName: "local-db-lookup",
      inputPreview: {
        signalId: params.signal.id,
        fields: ["summary", "riskWarnings", "suggestedActions"],
      },
      run: async () => {
        await delay(350);
        return {
          signalTitle: params.signal.title,
          evidenceCount: params.signal.evidenceIds.length,
          riskLevel: params.signal.riskLevel,
        };
      },
    },
    { onEvent: params.handlers.onToolEvent },
  );

  await runTracedTool(
    {
      threadId: params.threadId,
      messageId: params.userMessage.id,
      toolName: "browser-search",
      inputPreview: {
        query: `${params.signal.title} 24小时 相似`,
      },
      run: async () => {
        await delay(450);
        return {
          mode: "sse-preview",
          note: "MVP 已接入工具生命周期，真实浏览器搜索由 ENABLE_LIVE_BROWSER_SEARCH 控制。",
        };
      },
    },
    { onEvent: params.handlers.onToolEvent },
  );

  const assistantMessage = createMessage(
    params.threadId,
    "assistant",
    buildAnswer(params.userMessage.content, params.signal),
  );
  params.handlers.onMessage(assistantMessage);

  return assistantMessage;
}
