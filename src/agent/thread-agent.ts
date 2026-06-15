import type { SignalWithEvidence } from "@/features/signals/types";
import type { AgentMessage, ToolCallEvent } from "@/features/threads/types";
import { createMessage } from "@/features/threads/server/threads.repository";

import { generateAgentAnswer } from "./deepseek-answer";
import { searchRelatedSignals } from "./tools/web-search-tool";
import { runTracedTool } from "./tool-runtime";

export type ThreadAgentHandlers = {
  onMessage: (message: AgentMessage) => void;
  onToolEvent: (event: ToolCallEvent) => void;
};

export async function runThreadAgent(params: {
  threadId: string;
  signal: SignalWithEvidence;
  userMessage: AgentMessage;
  handlers: ThreadAgentHandlers;
}) {
  const localContext = await runTracedTool(
    {
      threadId: params.threadId,
      messageId: params.userMessage.id,
      toolName: "local-db-lookup",
      inputPreview: {
        signalId: params.signal.id,
        fields: ["summary", "riskWarnings", "suggestedActions", "evidence"],
      },
      outputPreview: (output) => ({
        signalTitle: output.signalTitle,
        evidenceCount: output.evidenceCount,
        sourceCount: output.sourceCount,
        riskLevel: output.riskLevel,
      }),
      run: async () => ({
        signalTitle: params.signal.title,
        evidenceCount: params.signal.evidence.length,
        sourceCount: params.signal.sourceUrls.length,
        evidenceSnippets: params.signal.evidence.map((item) => item.snippet),
        sourceUrls: params.signal.sourceUrls,
        riskLevel: params.signal.riskLevel,
      }),
    },
    { onEvent: params.handlers.onToolEvent },
  );

  const searchContext = await runTracedTool(
    {
      threadId: params.threadId,
      messageId: params.userMessage.id,
      toolName: "web-search",
      inputPreview: {
        query: `${params.signal.title} 24小时 相似`,
      },
      outputPreview: (output) => ({
        mode: output.mode,
        resultCount: output.results.length,
        note: output.note,
      }),
      run: () => searchRelatedSignals(`${params.signal.title} 24小时 相似`),
    },
    { onEvent: params.handlers.onToolEvent },
  );

  const answerResult = await runTracedTool(
    {
      threadId: params.threadId,
      messageId: params.userMessage.id,
      toolName: "deepseek-answer",
      inputPreview: {
        mode: "answer-generation",
        signalId: params.signal.id,
        questionLength: params.userMessage.content.length,
        evidenceCount: localContext.evidenceCount,
        relatedResultCount: searchContext.results.length,
      },
      outputPreview: (output) => ({
        mode: output.mode,
        answerLength: output.answer.length,
      }),
      run: () =>
        generateAgentAnswer({
          userQuestion: params.userMessage.content,
          context: {
            signal: params.signal,
            relatedSearchResults: searchContext.results,
          },
        }),
    },
    { onEvent: params.handlers.onToolEvent },
  );

  const assistantMessage = createMessage(
    params.threadId,
    "assistant",
    answerResult.answer,
  );
  params.handlers.onMessage(assistantMessage);

  return assistantMessage;
}
