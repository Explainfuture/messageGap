import { NextResponse } from "next/server";
import { z } from "zod";

import { getSignalWithEvidence } from "@/features/signals/server/signals.repository";
import {
  createThread,
  getLatestThreadForSignal,
} from "@/features/threads/server/threads.repository";

export const runtime = "nodejs";

const createThreadSchema = z.object({
  signalId: z.string().min(1),
  reuseExisting: z.boolean().default(true),
});

export async function POST(request: Request) {
  const parsed = createThreadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const signal = getSignalWithEvidence(parsed.data.signalId);
  if (!signal) {
    return NextResponse.json({ error: "Signal not found" }, { status: 404 });
  }

  const existing = parsed.data.reuseExisting
    ? getLatestThreadForSignal(signal.id)
    : null;
  const thread =
    existing ?? createThread(signal.id, `追问：${signal.title.slice(0, 28)}`);

  return NextResponse.json({ thread });
}
