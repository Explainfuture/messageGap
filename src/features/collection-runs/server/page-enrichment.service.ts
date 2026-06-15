import { crawlWithLoggedInBrowser } from "@/crawler/browser-crawler";
import { getBooleanEnv, getNumberEnv } from "@/lib/env";
import { inferPublishedAtFromText } from "@/lib/freshness";

import type { CollectionCandidate } from "./collection-candidate";

function textSnippet(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 500);
}

export async function enrichCandidatesWithPages(
  candidates: CollectionCandidate[],
) {
  if (!getBooleanEnv("ENABLE_LIVE_PAGE_CRAWL", false)) {
    return {
      candidates,
      pagesCrawled: 0,
      errors: [] as string[],
    };
  }

  const maxCrawls = getNumberEnv("MAX_LIVE_PAGE_CRAWLS", 3);
  const errors: string[] = [];
  let pagesCrawled = 0;

  const enriched: CollectionCandidate[] = [];

  for (const candidate of candidates) {
    if (pagesCrawled >= maxCrawls) {
      enriched.push(candidate);
      continue;
    }

    try {
      const page = await crawlWithLoggedInBrowser(candidate.url);
      const inferredPublishedAt = inferPublishedAtFromText(
        `${page.title} ${page.text.slice(0, 4000)}`,
      );
      pagesCrawled += 1;
      enriched.push({
        ...candidate,
        title: page.title || candidate.title,
        snippet: textSnippet(page.text) || candidate.snippet,
        extractedText: page.text,
        publishedAt: inferredPublishedAt ?? candidate.publishedAt,
      });
    } catch (error) {
      errors.push(
        `${candidate.url}: ${error instanceof Error ? error.message : String(error)}`,
      );
      enriched.push(candidate);
    }
  }

  return {
    candidates: enriched,
    pagesCrawled,
    errors,
  };
}
