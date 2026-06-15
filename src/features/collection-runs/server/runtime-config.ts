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
};

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
    searchQueriesPerCategory: getNumberEnv("SEARCH_QUERIES_PER_CATEGORY", 1),
    maxSearchResultsPerQuery: getNumberEnv("MAX_SEARCH_RESULTS_PER_QUERY", 2),
  };
}
