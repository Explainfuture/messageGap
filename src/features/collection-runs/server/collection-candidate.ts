import type { SignalCategory } from "@/features/signals/types";

export type CollectionCandidate = {
  title: string;
  category: SignalCategory;
  url: string;
  sourceName: string;
  snippet: string;
  extractedText?: string;
  publishedAt: string;
  discoveredAt: string;
};
