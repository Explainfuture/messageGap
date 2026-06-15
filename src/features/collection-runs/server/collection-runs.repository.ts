import { desc, eq } from "drizzle-orm";

import { db, ensureDatabase } from "@/db/client";
import { parseJson, stringifyJson } from "@/db/json";
import { collectionRuns } from "@/db/schema";
import type { CollectionRun } from "@/features/collection-runs/types";

type CollectionRunRow = typeof collectionRuns.$inferSelect;

function toCollectionRun(row: CollectionRunRow): CollectionRun {
  return {
    id: row.id,
    status: row.status as CollectionRun["status"],
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    sourcesSearched: parseJson<string[]>(row.sourcesSearchedJson, []),
    urlsDiscovered: row.urlsDiscovered,
    pagesCrawled: row.pagesCrawled,
    candidatesEvaluated: row.candidatesEvaluated,
    signalsSaved: row.signalsSaved,
    errors: parseJson<string[]>(row.errorsJson, []),
  };
}

function fromCollectionRun(
  run: CollectionRun,
): typeof collectionRuns.$inferInsert {
  return {
    id: run.id,
    status: run.status,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    sourcesSearchedJson: stringifyJson(run.sourcesSearched),
    urlsDiscovered: run.urlsDiscovered,
    pagesCrawled: run.pagesCrawled,
    candidatesEvaluated: run.candidatesEvaluated,
    signalsSaved: run.signalsSaved,
    errorsJson: stringifyJson(run.errors),
  };
}

export function insertCollectionRun(run: CollectionRun) {
  ensureDatabase();
  db.insert(collectionRuns).values(fromCollectionRun(run)).run();
}

export function updateCollectionRun(run: CollectionRun) {
  ensureDatabase();
  db.update(collectionRuns)
    .set(fromCollectionRun(run))
    .where(eq(collectionRuns.id, run.id))
    .run();
}

export function getLatestCollectionRun() {
  ensureDatabase();
  const row = db
    .select()
    .from(collectionRuns)
    .orderBy(desc(collectionRuns.startedAt))
    .get();

  return row ? toCollectionRun(row) : null;
}
