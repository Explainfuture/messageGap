import { count, desc, eq } from "drizzle-orm";

import { db, ensureDatabase } from "@/db/client";
import { infoSignals, signalEvidence } from "@/db/schema";
import type {
  InfoSignal,
  SignalCategory,
  SignalEvidence,
  SignalWithEvidence,
} from "@/features/signals/types";
import {
  inferPublishedAtFromText,
  isGithubUrl,
  isStaleTimestampText,
} from "@/lib/freshness";

import { createSeedSignals } from "./seed-signals";
import { fromEvidence, fromSignal, toEvidence, toSignal } from "./signal-mappers";

export type SignalFilters = {
  category?: SignalCategory | "all";
  query?: string;
  riskLevel?: string;
  excludeSampleSources?: boolean;
  excludeStaleSources?: boolean;
};

export function ensureSeedSignals() {
  ensureDatabase();

  const existing = db.select({ value: count() }).from(infoSignals).get();
  if ((existing?.value ?? 0) > 0) {
    return;
  }

  for (const item of createSeedSignals()) {
    insertSignalWithEvidence(item.signal, item.evidence);
  }
}

export function insertSignalWithEvidence(
  signal: InfoSignal,
  evidence: SignalEvidence[],
): boolean {
  ensureDatabase();

  const existing = db
    .select({ id: infoSignals.id })
    .from(infoSignals)
    .where(eq(infoSignals.id, signal.id))
    .get();

  if (existing) {
    return false;
  }

  if (signal.sourceUrls.some(hasSignalForSourceUrl)) {
    return false;
  }

  db.transaction((tx) => {
    tx.insert(infoSignals).values(fromSignal(signal)).run();

    for (const evidenceItem of evidence) {
      tx.insert(signalEvidence).values(fromEvidence(evidenceItem)).run();
    }
  });

  return true;
}

export function hasSignalForSourceUrl(sourceUrl: string) {
  ensureDatabase();

  const rows = db.select().from(infoSignals).all();

  return rows.map(toSignal).some((signal) => signal.sourceUrls.includes(sourceUrl));
}

export function listSignals(filters: SignalFilters = {}): InfoSignal[] {
  ensureSeedSignals();

  const rows = db
    .select()
    .from(infoSignals)
    .orderBy(desc(infoSignals.opportunityScore), desc(infoSignals.discoveredAt))
    .all();

  const query = filters.query?.trim().toLowerCase();

  return rows.map(toSignal).filter((signal) => {
    if (filters.excludeSampleSources && isSampleSignal(signal)) {
      return false;
    }

    if (filters.excludeStaleSources && isStaleOrStaticSignal(signal)) {
      return false;
    }

    if (filters.category && filters.category !== "all") {
      if (signal.category !== filters.category) {
        return false;
      }
    }

    if (filters.riskLevel && signal.riskLevel !== filters.riskLevel) {
      return false;
    }

    if (query) {
      const haystack = [
        signal.title,
        signal.summary,
        signal.whyItMatters,
        signal.category,
        ...signal.tags,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    }

    return true;
  });
}

function isSampleSignal(signal: InfoSignal) {
  return signal.sourceUrls.some((url) => {
    try {
      return new URL(url).hostname === "example.com";
    } catch {
      return url.includes("example.com");
    }
  });
}

function isStaleOrStaticSignal(signal: InfoSignal) {
  const searchableText = [
    signal.title,
    signal.summary,
    signal.whyItMatters,
    ...signal.tags,
  ].join(" ");

  if (isStaleTimestampText(searchableText)) {
    return true;
  }

  const isGithubSignal = signal.sourceUrls.some(isGithubUrl);
  if (!isGithubSignal) {
    return false;
  }

  return inferPublishedAtFromText(searchableText) === null;
}

export function getSignalWithEvidence(id: string): SignalWithEvidence | null {
  ensureSeedSignals();

  const row = db
    .select()
    .from(infoSignals)
    .where(eq(infoSignals.id, id))
    .get();

  if (!row) {
    return null;
  }

  const evidence = db
    .select()
    .from(signalEvidence)
    .where(eq(signalEvidence.signalId, id))
    .all()
    .map(toEvidence);

  return {
    ...toSignal(row),
    evidence,
  };
}

export function getLatestSignals(limit = 5) {
  return listSignals().slice(0, limit);
}
