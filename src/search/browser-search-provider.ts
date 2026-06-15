import path from "node:path";

import { chromium } from "playwright-core";

import { getEnv } from "@/lib/env";

import type { SearchOptions, SearchProvider, SearchResult } from "./search-provider";

type SearchEngineId = "duckduckgo" | "bing" | "google";

type SearchEngine = {
  id: SearchEngineId;
  buildUrl: (query: string) => string;
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
  const configured = getEnv("BROWSER_SEARCH_ENGINES", "duckduckgo,bing,google")
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

  return `${query} after:${after}`;
}

type BrowserSearchExtractedResult = {
  title: string;
  url: string;
  snippet: string;
};

export class BrowserSearchProvider implements SearchProvider {
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const profileDir = path.resolve(
      process.cwd(),
      getEnv("BROWSER_PROFILE_DIR", ".browser-profile"),
    );
    const executablePath = getEnv("CHROME_EXECUTABLE_PATH");

    const context = await chromium.launchPersistentContext(profileDir, {
      channel: executablePath ? undefined : "chrome",
      executablePath: executablePath || undefined,
      headless: false,
      locale: "zh-CN",
      viewport: { width: 1280, height: 900 },
    });

    try {
      const page = await context.newPage();
      const enrichedQuery = enrichQuery(query, options.freshnessDays);
      const engines = getEnabledSearchEngines();
      let results: BrowserSearchExtractedResult[] = [];

      for (const engine of engines) {
        await page.goto(engine.buildUrl(enrichedQuery), {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        await page.waitForTimeout(1_000);

        const extracted = await page.evaluate((maxResults) => {
          function decodeBase64Url(value: string) {
            const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
            const padded = normalized.padEnd(
              Math.ceil(normalized.length / 4) * 4,
              "=",
            );

            return atob(padded);
          }

          function unwrapUrl(value: string) {
            try {
              const url = new URL(value);
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

          function normalizeText(value: string | null | undefined) {
            return value?.replace(/\s+/g, " ").trim() ?? "";
          }

          function getAnchor(container: Element) {
            return container.querySelector<HTMLAnchorElement>(
              ".result__a[href], h2 a[href], h3 a[href], a[href]",
            );
          }

          function getTitle(container: Element, anchor: HTMLAnchorElement) {
            return normalizeText(
              container.querySelector(".result__a, h2, h3")?.textContent ||
                anchor.textContent ||
                anchor.getAttribute("aria-label") ||
                anchor.getAttribute("title"),
            );
          }

          function getSnippet(container: Element) {
            const text = normalizeText(container.textContent);

            if (!text) {
              return "";
            }

            return text.slice(0, 280);
          }

          const containers = Array.from(
            document.querySelectorAll(
              "li.b_algo, .result, .g, article, div[data-sokoban-container]",
            ),
          );
          const candidates =
            containers.length > 0
              ? containers
              : Array.from(document.querySelectorAll("a[href]"));
          const seen = new Set<string>();
          const extracted: BrowserSearchExtractedResult[] = [];

          for (const candidate of candidates) {
            const container = candidate;
            const anchor =
              container instanceof HTMLAnchorElement
                ? container
                : getAnchor(container);

            if (!anchor) {
              continue;
            }

            const href = unwrapUrl(anchor.href);
            const title =
              container instanceof HTMLAnchorElement
                ? normalizeText(
                    anchor.textContent ||
                      anchor.getAttribute("aria-label") ||
                      anchor.getAttribute("title"),
                  )
                : getTitle(container, anchor);

            if (!href || !title || title.length < 8 || seen.has(href)) {
              continue;
            }

            if (isSearchEngineNoise(href)) {
              continue;
            }

            seen.add(href);
            extracted.push({
              title: title.slice(0, 180),
              url: href,
              snippet:
                container instanceof HTMLAnchorElement
                  ? ""
                  : getSnippet(container),
            });

            if (extracted.length >= maxResults) {
              break;
            }
          }

          return extracted;
        }, options.maxResults);

        if (extracted.length > 0) {
          results = extracted;
          break;
        }
      }

      const now = new Date().toISOString();

      return results.map((result) => ({
        ...result,
        sourceName: new URL(result.url).hostname,
        discoveredAt: now,
      }));
    } finally {
      await context.close();
    }
  }
}
