import { NextResponse } from "next/server";

import { getSignalWithEvidence } from "@/features/signals/server/signals.repository";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const signal = getSignalWithEvidence(id);

  if (!signal) {
    return NextResponse.json({ error: "Signal not found" }, { status: 404 });
  }

  return NextResponse.json({ signal });
}
