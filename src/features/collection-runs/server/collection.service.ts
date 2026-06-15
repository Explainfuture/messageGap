import { randomUUID } from "node:crypto";

import { BrowserSearchProvider } from "@/search/browser-search-provider";
import { buildCollectionQueries } from "@/search/query-builder";

import { insertSignalWithEvidence } from "@/features/signals/server/signals.repository";

import type { CollectionRun } from "../types";
import type { CollectionCandidate } from "./collection-candidate";
import {
  insertCollectionRun,
  updateCollectionRun,
} from "./collection-runs.repository";
import { dedupeCandidates, filterFreshCandidates } from "./candidate-utils";
import { evaluateCandidateWithOptionalDeepSeek } from "./deepseek-evaluator";
import { enrichCandidatesWithPages } from "./page-enrichment.service";
import { getCollectionRuntimeConfig } from "./runtime-config";
import { createSampleCandidates } from "./sample-candidates";

function createRunningRun(): CollectionRun {
  return {
    id: `run-${randomUUID()}`,
    status: "running",
    startedAt: new Date().toISOString(),
    endedAt: null,
    sourcesSearched: [],
    urlsDiscovered: 0,
    pagesCrawled: 0,
    candidatesEvaluated: 0,
    signalsSaved: 0,
    errors: [],
  };
}

async function collectWithBrowserSearch(): Promise<CollectionCandidate[]> {
  const provider = new BrowserSearchProvider();
  const runtimeConfig = getCollectionRuntimeConfig();
  const queries = buildCollectionQueries({
    queriesPerCategory: runtimeConfig.searchQueriesPerCategory,
  });
  const candidates: CollectionCandidate[] = [];

  try {
    for (const item of queries) {
      const results = await provider.search(item.query, {
        maxResults: runtimeConfig.maxSearchResultsPerQuery,
        freshnessDays: 3,
      });

      for (const result of results) {
        candidates.push({
          title: result.title,
          category: item.category,
          url: result.url,
          sourceName: result.sourceName,
          snippet: result.snippet || result.title,
          publishedAt: result.publishedAt ?? result.discoveredAt,
          discoveredAt: result.discoveredAt,
        });
      }
    }
  } finally {
    await provider.close();
  }

  return candidates;
}

export async function runManualCollection(): Promise<CollectionRun> {
  const run = createRunningRun();
  insertCollectionRun(run);

  try {
    const runtimeConfig = getCollectionRuntimeConfig();
    const rawCandidates = runtimeConfig.liveBrowserSearchEnabled
      ? await collectWithBrowserSearch()
      : createSampleCandidates();
    const freshCandidates = filterFreshCandidates(rawCandidates);
    const dedupedCandidates = dedupeCandidates(freshCandidates);
    const enrichment = await enrichCandidatesWithPages(dedupedCandidates);

    const evaluated = (
      await Promise.all(
        enrichment.candidates.map(evaluateCandidateWithOptionalDeepSeek),
      )
    ).filter((item) => item !== null);

    let signalsSaved = 0;
    for (const item of evaluated) {
      if (insertSignalWithEvidence(item.signal, item.evidence)) {
        signalsSaved += 1;
      }
    }

    const completed: CollectionRun = {
      ...run,
      status: "success",
      endedAt: new Date().toISOString(),
      sourcesSearched: Array.from(
        new Set(enrichment.candidates.map((candidate) => candidate.sourceName)),
      ),
      urlsDiscovered: rawCandidates.length,
      pagesCrawled: enrichment.pagesCrawled,
      candidatesEvaluated: enrichment.candidates.length,
      signalsSaved,
      errors:
        runtimeConfig.liveBrowserSearchEnabled && rawCandidates.length === 0
          ? [
              ...enrichment.errors,
              "真实浏览器搜索没有抽取到候选链接。可能遇到搜索引擎 consent、验证码、空结果或 DOM 结构变化。",
            ]
          : enrichment.errors,
    };

    updateCollectionRun(completed);
    return completed;
  } catch (error) {
    const failed: CollectionRun = {
      ...run,
      status: "error",
      endedAt: new Date().toISOString(),
      errors: [error instanceof Error ? error.message : String(error)],
    };

    updateCollectionRun(failed);
    return failed;
  }
}
