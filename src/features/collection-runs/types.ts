export type CollectionRunStatus = "running" | "success" | "error" | "cancelled";

export type CollectionRun = {
  id: string;
  status: CollectionRunStatus;
  startedAt: string;
  endedAt: string | null;
  sourcesSearched: string[];
  urlsDiscovered: number;
  pagesCrawled: number;
  candidatesEvaluated: number;
  signalsSaved: number;
  errors: string[];
};
