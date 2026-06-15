import type { InfoSignal } from "@/features/signals/types";

import { SignalCard } from "./signal-card";

export function SignalList({ signals }: { signals: InfoSignal[] }) {
  if (signals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
        当前筛选条件下没有信息差。
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} />
      ))}
    </div>
  );
}
