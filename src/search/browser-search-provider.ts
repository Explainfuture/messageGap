import path from "node:path";

import { chromium } from "playwright-core";

import { getEnv } from "@/lib/env";

import type { SearchOptions, SearchProvider, SearchResult } from "./search-provider";

function buildSearchUrl(query: string, freshnessDays: number) {
  const baseUrl = getEnv(
    "BROWSER_SEARCH_ENGINE",
    "https://www.google.com/search?q=",
  );
  const after = new Date(Date.now() - freshnessDays * 24 * 3_600_000)
    .toISOString()
    .slice(0, 10);
  const enrichedQuery = `${query} after:${after}`;

  return `${baseUrl}${encodeURIComponent(enrichedQuery)}`;
}

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
      viewport: { width: 1280, height: 900 },
    });

    try {
      const page = await context.newPage();
      await page.goto(buildSearchUrl(query, options.freshnessDays), {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });

      const results = await page.evaluate((maxResults) => {
        const anchors = Array.from(document.querySelectorAll("a[href]"));
        const seen = new Set<string>();

        return anchors.flatMap((anchor) => {
          const element = anchor as HTMLAnchorElement;
          const href = element.href;
          const title = element.innerText?.trim();

          if (!href || !title || title.length < 8 || seen.has(href)) {
            return [];
          }

          if (
            href.includes("/search?") ||
            href.startsWith("javascript:") ||
            href.includes("accounts.google") ||
            href.includes("support.google")
          ) {
            return [];
          }

          seen.add(href);
          return [
            {
              title,
              url: href,
              snippet: "",
            },
          ];
        }).slice(0, maxResults);
      }, options.maxResults);

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
