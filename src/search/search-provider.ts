export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  sourceName: string;
  discoveredAt: string;
  publishedAt?: string;
};

export type SearchOptions = {
  maxResults: number;
  freshnessDays: number;
};

export interface SearchProvider {
  search(query: string, options: SearchOptions): Promise<SearchResult[]>;
}
