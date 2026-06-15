import { NextResponse } from "next/server";

import { runManualCollection } from "@/features/collection-runs/server/collection.service";
import { getCollectionRuntimeConfig } from "@/features/collection-runs/server/runtime-config";

export const runtime = "nodejs";

export async function POST() {
  const run = await runManualCollection();

  return NextResponse.json({ run, runtime: getCollectionRuntimeConfig() });
}
