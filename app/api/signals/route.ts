import { NextResponse } from "next/server";

import { getCollectionRuntimeConfig } from "@/features/collection-runs/server/runtime-config";
import { listSignals } from "@/features/signals/server/signals.repository";
import { signalCategories } from "@/features/signals/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const query = url.searchParams.get("query") ?? undefined;
  const includeSamples = url.searchParams.get("includeSamples") === "true";
  const runtimeConfig = getCollectionRuntimeConfig();

  const signals = listSignals({
    category:
      category && signalCategories.includes(category as never)
        ? (category as (typeof signalCategories)[number])
        : "all",
    query,
    excludeSampleSources:
      runtimeConfig.mode === "browser-search" && !includeSamples,
    excludeStaleSources: runtimeConfig.mode === "browser-search",
  });

  return NextResponse.json({ signals });
}
