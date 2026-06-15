"use client";

import { FormEvent, useMemo, useState } from "react";
import { SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { InfoSignal } from "@/features/signals/types";
import type {
  AgentMessage,
  ToolCallEvent,
} from "@/features/threads/types";
import { cn } from "@/lib/utils";

import { MarkdownMessage } from "./markdown-message";
import { ToolEventRow } from "./tool-event-row";

type ThreadChatProps = {
  threadId: string;
  signal: InfoSignal;
  initialMessages: AgentMessage[];
  initialToolEvents: ToolCallEvent[];
};

export function ThreadChat({
  threadId,
  signal,
  initialMessages,
  initialToolEvents,
}: ThreadChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [toolEvents, setToolEvents] = useState(initialToolEvents);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const sortedTimeline = useMemo(
    () =>
      [...messages, ...toolEvents].sort((a, b) => {
        const aTime = "createdAt" in a ? a.createdAt : a.startedAt;
        const bTime = "createdAt" in b ? b.createdAt : b.startedAt;
        return new Date(aTime).getTime() - new Date(bTime).getTime();
      }),
    [messages, toolEvents],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || isRunning) {
      return;
    }

    setInput("");
    setIsRunning(true);

    const source = new EventSource(
      `/api/threads/${threadId}/events?message=${encodeURIComponent(message)}`,
    );

    source.addEventListener("message_created", (eventMessage) => {
      setMessages((current) => [
        ...current,
        JSON.parse(eventMessage.data) as AgentMessage,
      ]);
    });

    source.addEventListener("assistant_message", (eventMessage) => {
      setMessages((current) => [
        ...current,
        JSON.parse(eventMessage.data) as AgentMessage,
      ]);
    });

    const onToolEvent = (eventMessage: MessageEvent<string>) => {
      const next = JSON.parse(eventMessage.data) as ToolCallEvent;
      setToolEvents((current) => {
        const existingIndex = current.findIndex((item) => item.id === next.id);
        if (existingIndex === -1) {
          return [...current, next];
        }

        return current.map((item, index) =>
          index === existingIndex ? next : item,
        );
      });
    };

    source.addEventListener("tool_call_use", onToolEvent);
    source.addEventListener("tool_call_end", onToolEvent);
    source.addEventListener("agent_error", () => {
      setIsRunning(false);
      source.close();
    });
    source.addEventListener("done", () => {
      setIsRunning(false);
      source.close();
    });
  };

  return (
    <div className="grid min-h-screen gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>绑定信息差</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6">
            <div className="font-medium">{signal.title}</div>
            <p className="text-muted-foreground">{signal.summary}</p>
            <div className="rounded-md border p-3">
              风险：{signal.riskWarnings[0]}
            </div>
          </CardContent>
        </Card>
      </aside>

      <section className="flex min-h-[calc(100vh-3rem)] flex-col rounded-lg border bg-card">
        <div className="border-b p-4">
          <h1 className="text-lg font-semibold">Agent 深入追问</h1>
          <p className="text-sm text-muted-foreground">
            工具调用会以 SSE 事件流展示并保存。
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {sortedTimeline.map((item) => {
            if ("role" in item) {
              return (
                <div
                  key={item.id}
                  className={cn(
                    "max-w-3xl rounded-lg border p-3 text-sm leading-6",
                    item.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-background",
                    item.role === "system" && "text-muted-foreground",
                  )}
                >
                  <div className="mb-1 text-xs opacity-70">{item.role}</div>
                  <MarkdownMessage
                    content={item.content}
                    inverted={item.role === "user"}
                  />
                </div>
              );
            }

            return <ToolEventRow key={item.id} event={item} />;
          })}
        </div>

        <form onSubmit={onSubmit} className="flex gap-2 border-t p-4">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="继续追问，例如：打开来源页并判断是否只是孤例"
            disabled={isRunning}
          />
          <Button type="submit" disabled={isRunning}>
            <SendHorizontal />
            发送
          </Button>
        </form>
      </section>
    </div>
  );
}
