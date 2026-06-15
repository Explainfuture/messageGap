import { notFound } from "next/navigation";

import { getSignalWithEvidence } from "@/features/signals/server/signals.repository";
import { ThreadChat } from "@/features/threads/components/thread-chat";
import {
  getThread,
  listMessages,
  listToolCallEvents,
} from "@/features/threads/server/threads.repository";

type ThreadPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { id } = await params;
  const thread = getThread(id);

  if (!thread) {
    notFound();
  }

  const signal = getSignalWithEvidence(thread.signalId);
  if (!signal) {
    notFound();
  }

  const messages = listMessages(thread.id);
  const toolEvents = listToolCallEvents(thread.id);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6">
      <ThreadChat
        threadId={thread.id}
        signal={signal}
        initialMessages={messages}
        initialToolEvents={toolEvents}
      />
    </main>
  );
}
