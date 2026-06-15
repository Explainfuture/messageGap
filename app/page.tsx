import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RunCollectionButton } from "@/features/collection-runs/components/run-collection-button";
import { RunStatus } from "@/features/collection-runs/components/run-status";
import { getLatestCollectionRun } from "@/features/collection-runs/server/collection-runs.repository";
import { getCollectionRuntimeConfig } from "@/features/collection-runs/server/runtime-config";
import { CategoryFilter } from "@/features/signals/components/category-filter";
import { SignalList } from "@/features/signals/components/signal-list";
import { listSignals } from "@/features/signals/server/signals.repository";
import { signalCategories, type SignalCategory } from "@/features/signals/types";

type HomeProps = {
  searchParams?: Promise<{
    category?: string;
    query?: string;
  }>;
};

function parseCategory(value?: string): SignalCategory | "all" {
  if (value && signalCategories.includes(value as SignalCategory)) {
    return value as SignalCategory;
  }

  return "all";
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const activeCategory = parseCategory(params?.category);
  const query = params?.query;
  const runtimeConfig = getCollectionRuntimeConfig();
  const signals = listSignals({
    category: activeCategory,
    query,
    excludeSampleSources: runtimeConfig.mode === "browser-search",
  });
  const latestRun = getLatestCollectionRun();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-5 py-6">
      <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="text-sm font-medium text-primary">MessageGap</div>
          <h1 className="text-2xl font-semibold tracking-normal">
            信息差采集看板
          </h1>
          <RunStatus run={latestRun} runtime={runtimeConfig} />
        </div>
        <RunCollectionButton runtime={runtimeConfig} />
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CategoryFilter activeCategory={activeCategory} />
          <form className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="query"
              placeholder="搜索标题、摘要、标签"
              defaultValue={query}
              className="pl-9"
            />
            {activeCategory !== "all" ? (
              <input type="hidden" name="category" value={activeCategory} />
            ) : null}
          </form>
        </div>
        <Separator />
        <SignalList signals={signals} />
      </section>
    </main>
  );
}
