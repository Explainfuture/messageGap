import type { CollectionCandidate } from "./collection-candidate";
import { isFreshWithinDays, isStaleTimestampText } from "@/lib/freshness";

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.searchParams.sort();
    return url.toString();
  } catch {
    return value.trim();
  }
}

export function dedupeCandidates(candidates: CollectionCandidate[]) {
  const seen = new Set<string>();
  const deduped: CollectionCandidate[] = [];

  for (const candidate of candidates) {
    const key = normalizeUrl(candidate.url);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(candidate);
  }

  return deduped;
}

export function filterFreshCandidates(candidates: CollectionCandidate[]) {
  return candidates.filter((candidate) => {
    if (!isFreshWithinDays(candidate.publishedAt || candidate.discoveredAt)) {
      return false;
    }

    return !isStaleTimestampText(`${candidate.title} ${candidate.snippet}`);
  });
}
