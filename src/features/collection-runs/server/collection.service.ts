import { randomUUID } from "node:crypto";

import { HttpSearchProvider } from "@/search/http-search-provider";
import {
  buildCollectionQueries,
  type CollectionQuery,
} from "@/search/query-builder";

import { insertSignalWithEvidence } from "@/features/signals/server/signals.repository";
import { signalCategories, type SignalCategory } from "@/features/signals/types";

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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

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

async function collectWithWebSearch(): Promise<CollectionCandidate[]> {
  const provider = new HttpSearchProvider();
  const runtimeConfig = getCollectionRuntimeConfig();
  const queries = buildCollectionQueries({
    queriesPerCategory: runtimeConfig.searchQueriesPerCategory,
  });
  const candidates: CollectionCandidate[] = [];
  const queriesByCategory = new Map<SignalCategory, CollectionQuery[]>();
  const seenUrlsByCategory = new Map<SignalCategory, Set<string>>();

  for (const query of queries) {
    const categoryQueries = queriesByCategory.get(query.category) ?? [];
    categoryQueries.push(query);
    queriesByCategory.set(query.category, categoryQueries);
  }

  for (const category of signalCategories) {
    const categoryQueries = queriesByCategory.get(category) ?? [];
    const seenUrls = seenUrlsByCategory.get(category) ?? new Set<string>();
    seenUrlsByCategory.set(category, seenUrls);

    for (const item of categoryQueries) {
      const remaining =
        runtimeConfig.maxSearchResultsPerCategory - seenUrls.size;

      if (remaining <= 0) {
        break;
      }

      const results = await provider.search(item.query, {
        maxResults: Math.min(runtimeConfig.maxSearchResultsPerQuery, remaining),
        freshnessDays: 3,
      });

      for (const result of results) {
        if (seenUrls.has(result.url)) {
          continue;
        }

        seenUrls.add(result.url);
        candidates.push({
          title: result.title,
          category: item.category,
          url: result.url,
          sourceName: result.sourceName,
          snippet: result.snippet || result.title,
          publishedAt: result.publishedAt ?? "",
          discoveredAt: result.discoveredAt,
        });
      }
    }
  }

  return candidates;
}

export async function runManualCollection(): Promise<CollectionRun> {
  const run = createRunningRun();

  try {
    insertCollectionRun(run);

    const runtimeConfig = getCollectionRuntimeConfig();
    const rawCandidates = runtimeConfig.liveWebSearchEnabled
      ? await collectWithWebSearch()
      : createSampleCandidates();
    const freshCandidatesForEnrichment = filterFreshCandidates(rawCandidates, {
      allowUnknownPublishedAt: true,
    });
    const dedupedCandidates = dedupeCandidates(freshCandidatesForEnrichment);
    const enrichment = await enrichCandidatesWithPages(dedupedCandidates);
    const freshEnrichedCandidates = filterFreshCandidates(
      enrichment.candidates,
      {
        includeExtractedText: true,
      },
    );

    const evaluated = (
      await Promise.all(
        freshEnrichedCandidates.map(evaluateCandidateWithOptionalDeepSeek),
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
        new Set(
          freshEnrichedCandidates.map((candidate) => candidate.sourceName),
        ),
      ),
      urlsDiscovered: rawCandidates.length,
      pagesCrawled: enrichment.pagesCrawled,
      candidatesEvaluated: freshEnrichedCandidates.length,
      signalsSaved,
      errors:
        runtimeConfig.liveWebSearchEnabled && rawCandidates.length === 0
          ? [
              ...enrichment.errors,
              "服务端网页搜索没有抽取到候选链接。可能遇到搜索引擎风控、空结果或 DOM 结构变化。",
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
      errors: [getErrorMessage(error)],
    };

    try {
      updateCollectionRun(failed);
    } catch (updateError) {
      return {
        ...failed,
        errors: [
          ...failed.errors,
          `写入采集状态失败：${getErrorMessage(updateError)}`,
        ],
      };
    }

    return failed;
  }
}
