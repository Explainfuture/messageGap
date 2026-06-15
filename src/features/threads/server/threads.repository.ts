import { randomUUID } from "node:crypto";

import { asc, desc, eq } from "drizzle-orm";

import { db, ensureDatabase } from "@/db/client";
import { agentMessages, agentThreads, toolCallEvents } from "@/db/schema";
import type {
  AgentMessage,
  AgentThread,
  ToolCallEvent,
} from "@/features/threads/types";

import { fromToolCallEvent, toMessage, toThread, toToolCallEvent } from "./thread-mappers";

export function createThread(signalId: string, title: string): AgentThread {
  ensureDatabase();

  const now = new Date().toISOString();
  const thread: AgentThread = {
    id: `thread-${randomUUID()}`,
    signalId,
    title,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(agentThreads).values(thread).run();
  db.insert(agentMessages)
    .values({
      id: `message-${randomUUID()}`,
      threadId: thread.id,
      role: "system",
      content: "线程已绑定信息差上下文，可继续打开来源、搜索相似案例和追问风险。",
      createdAt: now,
    })
    .run();

  return thread;
}

export function getThread(threadId: string) {
  ensureDatabase();
  const row = db
    .select()
    .from(agentThreads)
    .where(eq(agentThreads.id, threadId))
    .get();

  return row ? toThread(row) : null;
}

export function getLatestThreadForSignal(signalId: string) {
  ensureDatabase();
  const row = db
    .select()
    .from(agentThreads)
    .where(eq(agentThreads.signalId, signalId))
    .orderBy(desc(agentThreads.updatedAt))
    .get();

  return row ? toThread(row) : null;
}

export function listMessages(threadId: string): AgentMessage[] {
  ensureDatabase();

  return db
    .select()
    .from(agentMessages)
    .where(eq(agentMessages.threadId, threadId))
    .orderBy(asc(agentMessages.createdAt))
    .all()
    .map(toMessage);
}

export function createMessage(
  threadId: string,
  role: AgentMessage["role"],
  content: string,
): AgentMessage {
  ensureDatabase();

  const message: AgentMessage = {
    id: `message-${randomUUID()}`,
    threadId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };

  db.insert(agentMessages).values(message).run();
  db.update(agentThreads)
    .set({ updatedAt: message.createdAt })
    .where(eq(agentThreads.id, threadId))
    .run();

  return message;
}

export function insertToolCallEvent(event: ToolCallEvent) {
  ensureDatabase();
  db.insert(toolCallEvents).values(fromToolCallEvent(event)).run();
}

export function updateToolCallEvent(event: ToolCallEvent) {
  ensureDatabase();
  db.update(toolCallEvents)
    .set(fromToolCallEvent(event))
    .where(eq(toolCallEvents.id, event.id))
    .run();
}

export function listToolCallEvents(threadId: string) {
  ensureDatabase();

  return db
    .select()
    .from(toolCallEvents)
    .where(eq(toolCallEvents.threadId, threadId))
    .orderBy(asc(toolCallEvents.startedAt))
    .all()
    .map(toToolCallEvent);
}
