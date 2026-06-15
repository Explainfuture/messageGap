"use server";

import { redirect } from "next/navigation";

import { getSignalWithEvidence } from "@/features/signals/server/signals.repository";
import {
  createThread,
  getLatestThreadForSignal,
} from "@/features/threads/server/threads.repository";

export async function openInvestigationThread(signalId: string) {
  const signal = getSignalWithEvidence(signalId);
  if (!signal) {
    throw new Error("Signal not found");
  }

  const existing = getLatestThreadForSignal(signalId);
  const thread =
    existing ??
    createThread(signalId, `追问：${signal.title.slice(0, 28)}`);

  redirect(`/threads/${thread.id}`);
}
