import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/signals/${signal.id}`}>
            <ArrowLeft aria-hidden="true" />
            返回详情
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">返回看板</Link>
        </Button>
      </div>
      <ThreadChat
        threadId={thread.id}
        signal={signal}
        initialMessages={messages}
        initialToolEvents={toolEvents}
      />
    </main>
  );
}
