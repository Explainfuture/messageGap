import type { CollectionCandidate } from "./collection-candidate";
import { inferPublishedAtFromText, isFreshWithinDays } from "@/lib/freshness";

type FilterFreshCandidatesOptions = {
  allowUnknownPublishedAt?: boolean;
  includeExtractedText?: boolean;
};

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

function getCandidateTimestampText(
  candidate: CollectionCandidate,
  options: FilterFreshCandidatesOptions,
) {
  return [
    candidate.title,
    candidate.snippet,
    options.includeExtractedText ? candidate.extractedText : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function filterFreshCandidates(
  candidates: CollectionCandidate[],
  options: FilterFreshCandidatesOptions = {},
) {
  return candidates.filter((candidate) => {
    const inferredPublishedAt = inferPublishedAtFromText(
      getCandidateTimestampText(candidate, options),
    );
    const publishedAt = inferredPublishedAt || candidate.publishedAt;

    if (publishedAt) {
      return isFreshWithinDays(publishedAt);
    }

    return options.allowUnknownPublishedAt === true;
  });
}
