import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signalCategories, type SignalCategory } from "@/features/signals/types";
import { cn } from "@/lib/utils";

export function CategoryFilter({
  activeCategory,
}: {
  activeCategory?: SignalCategory | "all";
}) {
  const active = activeCategory ?? "all";
  const categories = ["all", ...signalCategories] as const;

  return (
    <nav
      aria-label="信息差分类"
      className="flex flex-wrap gap-2 rounded-lg border bg-card/70 p-1 shadow-sm shadow-primary/5"
    >
      {categories.map((category) => {
        const label = category === "all" ? "全部" : category;
        const href = category === "all" ? "/" : `/?category=${category}`;

        return (
          <Button
            key={category}
            asChild
            variant={active === category ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-8 border border-transparent px-3",
              active === category
                ? "shadow-sm shadow-primary/20"
                : "text-muted-foreground hover:border-primary/15 hover:text-foreground",
            )}
          >
            <Link href={href}>{label}</Link>
          </Button>
        );
      })}
    </nav>
  );
}
