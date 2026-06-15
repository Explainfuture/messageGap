import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            返回看板
          </Link>
        </Button>
      </div>
      <SignalDetail signal={signal} action={action} />
    </main>
  );
}
