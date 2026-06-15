import type { CollectionCandidate } from "./collection-candidate";

const THREE_DAYS_MS = 3 * 24 * 3_600_000;

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
  const now = Date.now();

  return candidates.filter((candidate) => {
    const publishedAt = new Date(candidate.publishedAt).getTime();
    if (!Number.isFinite(publishedAt)) {
      return false;
    }

    return now - publishedAt <= THREE_DAYS_MS;
  });
}
