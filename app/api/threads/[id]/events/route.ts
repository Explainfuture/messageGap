import { getSignalWithEvidence } from "@/features/signals/server/signals.repository";
import {
  createMessage,
  getThread,
} from "@/features/threads/server/threads.repository";
import { runThreadAgent } from "@/agent/thread-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeSse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const content = url.searchParams.get("message")?.trim();

  if (!content) {
    return new Response("Missing message", { status: 400 });
  }

  const thread = getThread(id);
  if (!thread) {
    return new Response("Thread not found", { status: 404 });
  }

  const signal = getSignalWithEvidence(thread.signalId);
  if (!signal) {
    return new Response("Signal not found", { status: 404 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(encodeSse(event, data)));
      };

      try {
        const userMessage = createMessage(id, "user", content);
        send("message_created", userMessage);

        await runThreadAgent({
          threadId: id,
          signal,
          userMessage,
          handlers: {
            onMessage: (message) => send("assistant_message", message),
            onToolEvent: (event) => send(event.eventType, event),
          },
        });

        send("done", { ok: true });
      } catch (error) {
        send("agent_error", {
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
