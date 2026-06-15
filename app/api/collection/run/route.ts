import { NextResponse } from "next/server";

import { runManualCollection } from "@/features/collection-runs/server/collection.service";

export const runtime = "nodejs";

export async function POST() {
  const run = await runManualCollection();

  return NextResponse.json({ run });
}
