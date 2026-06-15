import { getBooleanEnv, getNumberEnv } from "@/lib/env";
import { signalCategories } from "@/features/signals/types";

export type CollectionMode = "browser-search" | "sample";

export type CollectionRuntimeConfig = {
  mode: CollectionMode;
  liveBrowserSearchEnabled: boolean;
  livePageCrawlEnabled: boolean;
  deepSeekEvaluationEnabled: boolean;
  searchDirectionsPerRun: number;
  searchQueriesPerCategory: number;
  maxSearchResultsPerQuery: number;
  maxSearchResultsPerCategory: number;
};

function getPositiveIntegerEnv(name: string, fallback: number) {
  return Math.max(1, Math.floor(getNumberEnv(name, fallback)));
}

export function getCollectionRuntimeConfig(): CollectionRuntimeConfig {
  const liveBrowserSearchEnabled = getBooleanEnv(
    "ENABLE_LIVE_BROWSER_SEARCH",
    false,
  );

  return {
    mode: liveBrowserSearchEnabled ? "browser-search" : "sample",
    liveBrowserSearchEnabled,
    livePageCrawlEnabled: getBooleanEnv("ENABLE_LIVE_PAGE_CRAWL", false),
    deepSeekEvaluationEnabled: getBooleanEnv(
      "ENABLE_DEEPSEEK_EVALUATION",
      false,
    ),
    searchDirectionsPerRun: signalCategories.length,
    searchQueriesPerCategory: getPositiveIntegerEnv(
      "SEARCH_QUERIES_PER_CATEGORY",
      2,
    ),
    maxSearchResultsPerQuery: getPositiveIntegerEnv(
      "MAX_SEARCH_RESULTS_PER_QUERY",
      10,
    ),
    maxSearchResultsPerCategory: getPositiveIntegerEnv(
      "MAX_SEARCH_RESULTS_PER_CATEGORY",
      10,
    ),
  };
}
