import { load } from "cheerio";

import { getEnv } from "@/lib/env";
import { inferPublishedAtFromText } from "@/lib/freshness";

import type { SearchOptions, SearchProvider, SearchResult } from "./search-provider";

type SearchEngineId = "duckduckgo" | "bing" | "google";

type SearchEngine = {
  id: SearchEngineId;
  buildUrl: (query: string) => string;
};

type ExtractedResult = {
  title: string;
  url: string;
  snippet: string;
};

const searchEngines: Record<SearchEngineId, SearchEngine> = {
  duckduckgo: {
    id: "duckduckgo",
    buildUrl: (query) =>
      `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
  },
  bing: {
    id: "bing",
    buildUrl: (query) =>
      `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
  },
  google: {
    id: "google",
    buildUrl: (query) =>
      `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  },
};

function getEnabledSearchEngines() {
  const configured = getEnv(
    "WEB_SEARCH_ENGINES",
    getEnv("BROWSER_SEARCH_ENGINES", "duckduckgo,bing"),
  )
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const engines = configured.flatMap((item) => {
    if (item === "duckduckgo" || item === "bing" || item === "google") {
      return [searchEngines[item]];
    }

    return [];
  });

  return engines.length > 0 ? engines : [searchEngines.duckduckgo];
}

function enrichQuery(query: string, freshnessDays: number) {
  const after = new Date(Date.now() - freshnessDays * 24 * 3_600_000)
    .toISOString()
    .slice(0, 10);

  return `${query} after:${after} 过去${freshnessDays}天 新发布`;
}

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return Buffer.from(padded, "base64").toString("utf8");
}

function unwrapUrl(value: string, baseUrl: string) {
  try {
    const url = new URL(value, baseUrl);
    const googleTarget = url.searchParams.get("q");
    const googleUrlTarget = url.searchParams.get("url");
    const duckDuckGoTarget = url.searchParams.get("uddg");
    const bingTarget = url.searchParams.get("u");

    if (url.hostname.includes("google.") && googleTarget) {
      return googleTarget;
    }

    if (url.hostname.includes("google.") && googleUrlTarget) {
      return googleUrlTarget;
    }

    if (url.hostname.includes("duckduckgo.") && duckDuckGoTarget) {
      return duckDuckGoTarget;
    }

    if (url.hostname.includes("bing.") && bingTarget) {
      if (bingTarget.startsWith("http")) {
        return bingTarget;
      }

      if (bingTarget.startsWith("a1")) {
        return decodeBase64Url(bingTarget.slice(2));
      }
    }

    return url.toString();
  } catch {
    return value;
  }
}

function isSearchEngineNoise(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname;
    const pathname = url.pathname;

    return (
      value.startsWith("javascript:") ||
      value.startsWith("#") ||
      host.includes("accounts.google") ||
      host.includes("support.google") ||
      host.includes("policies.google") ||
      host.includes("duckduckgo.com") ||
      host.includes("bing.com") ||
      host.includes("go.microsoft.com") ||
      host.includes("login.live.com") ||
      host.includes("microsoft.com") ||
      host.includes("msn.com") ||
      pathname === "/search" ||
      pathname.includes("/preferences") ||
      pathname.includes("/settings") ||
      pathname.includes("/account") ||
      !["http:", "https:"].includes(url.protocol)
    );
  } catch {
    return true;
  }
}

async function fetchSearchHtml(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Search request failed: ${response.status}`);
  }

  return response.text();
}

function extractResults(html: string, baseUrl: string, maxResults: number) {
  const $ = load(html);
  const selectors = [
    ".result",
    "li.b_algo",
    ".g",
    "article",
    "div[data-sokoban-container]",
  ];
  const seen = new Set<string>();
  const results: ExtractedResult[] = [];

  for (const selector of selectors) {
    $(selector).each((_, element) => {
      if (results.length >= maxResults) {
        return false;
      }

      const container = $(element);
      const anchor = container
        .find(".result__a[href], h2 a[href], h3 a[href], a[href]")
        .first();
      const href = anchor.attr("href");
      const title = normalizeText(
        container.find(".result__a, h2, h3").first().text() ||
          anchor.text() ||
          anchor.attr("aria-label") ||
          anchor.attr("title"),
      );

      if (!href || !title || title.length < 8) {
        return;
      }

      const url = unwrapUrl(href, baseUrl);
      if (seen.has(url) || isSearchEngineNoise(url)) {
        return;
      }

      const snippet = normalizeText(
        container.find(".result__snippet, .b_caption, .VwiC3b").first().text() ||
          container.text(),
      ).slice(0, 360);

      seen.add(url);
      results.push({
        title: title.slice(0, 180),
        url,
        snippet,
      });
    });

    if (results.length > 0) {
      break;
    }
  }

  return results;
}

export class HttpSearchProvider implements SearchProvider {
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const enrichedQuery = enrichQuery(query, options.freshnessDays);
    const engines = getEnabledSearchEngines();
    let extracted: ExtractedResult[] = [];

    for (const engine of engines) {
      const searchUrl = engine.buildUrl(enrichedQuery);

      try {
        const html = await fetchSearchHtml(searchUrl);
        extracted = extractResults(html, searchUrl, options.maxResults);
      } catch {
        extracted = [];
      }

      if (extracted.length > 0) {
        break;
      }
    }

    const now = new Date().toISOString();

    return extracted.map((result) => ({
      ...result,
      sourceName: new URL(result.url).hostname,
      discoveredAt: now,
      publishedAt:
        inferPublishedAtFromText(`${result.title} ${result.snippet}`) ??
        undefined,
    }));
  }
}
