import { NextResponse } from "next/server";

import { listSignals } from "@/features/signals/server/signals.repository";
import { signalCategories } from "@/features/signals/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const query = url.searchParams.get("query") ?? undefined;

  const signals = listSignals({
    category:
      category && signalCategories.includes(category as never)
        ? (category as (typeof signalCategories)[number])
        : "all",
    query,
  });

  return NextResponse.json({ signals });
}
