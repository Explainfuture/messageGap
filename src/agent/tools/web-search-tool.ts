import { getBooleanEnv } from "@/lib/env";
import { HttpSearchProvider } from "@/search/http-search-provider";
import type { SearchResult } from "@/search/search-provider";

export async function searchRelatedSignals(query: string): Promise<{
  mode: "live" | "disabled";
  results: SearchResult[];
  note?: string;
}> {
  const enabled = getBooleanEnv(
    "ENABLE_AGENT_WEB_SEARCH",
    getBooleanEnv("ENABLE_AGENT_BROWSER_SEARCH", false),
  );

  if (!enabled) {
    return {
      mode: "disabled",
      results: [],
      note: "Agent 实时网页搜索未开启。设置 ENABLE_AGENT_WEB_SEARCH=true 后启用。",
    };
  }

  const provider = new HttpSearchProvider();
  const results = await provider.search(query, {
    maxResults: 5,
    freshnessDays: 3,
  });

  return {
    mode: "live",
    results,
  };
}
