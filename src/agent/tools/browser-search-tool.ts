import { getBooleanEnv } from "@/lib/env";
import { BrowserSearchProvider } from "@/search/browser-search-provider";
import type { SearchResult } from "@/search/search-provider";

export async function searchRelatedSignals(query: string): Promise<{
  mode: "live" | "disabled";
  results: SearchResult[];
  note?: string;
}> {
  if (!getBooleanEnv("ENABLE_AGENT_BROWSER_SEARCH", false)) {
    return {
      mode: "disabled",
      results: [],
      note: "Agent 实时浏览器搜索未开启。设置 ENABLE_AGENT_BROWSER_SEARCH=true 后启用。",
    };
  }

  const provider = new BrowserSearchProvider();
  const results = await provider.search(query, {
    maxResults: 5,
    freshnessDays: 3,
  });

  return {
    mode: "live",
    results,
  };
}
