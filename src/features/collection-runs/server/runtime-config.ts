import { getBooleanEnv, getNumberEnv } from "@/lib/env";

export type CollectionMode = "browser-search" | "sample";

export type CollectionRuntimeConfig = {
  mode: CollectionMode;
  liveBrowserSearchEnabled: boolean;
  livePageCrawlEnabled: boolean;
  deepSeekEvaluationEnabled: boolean;
  maxSearchTasksPerRun: number;
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
    maxSearchTasksPerRun: getNumberEnv("MAX_SEARCH_TASKS_PER_RUN", 4),
  };
}
