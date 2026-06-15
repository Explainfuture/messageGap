import { notFound } from "next/navigation";

import { SignalDetail } from "@/features/signals/components/signal-detail";
import { getSignalWithEvidence } from "@/features/signals/server/signals.repository";

import { openInvestigationThread } from "./actions";

type SignalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SignalPage({ params }: SignalPageProps) {
  const { id } = await params;
  const signal = getSignalWithEvidence(id);

  if (!signal) {
    notFound();
  }

  const action = openInvestigationThread.bind(null, signal.id);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6">
      <SignalDetail signal={signal} action={action} />
    </main>
  );
}
