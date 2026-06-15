import { NextResponse } from "next/server";

import { runManualCollection } from "@/features/collection-runs/server/collection.service";
import { getCollectionRuntimeConfig } from "@/features/collection-runs/server/runtime-config";

export const runtime = "nodejs";

export async function POST() {
  try {
    const run = await runManualCollection();

    return NextResponse.json({ run, runtime: getCollectionRuntimeConfig() });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        runtime: getCollectionRuntimeConfig(),
      },
      { status: 500 },
    );
  }
}
