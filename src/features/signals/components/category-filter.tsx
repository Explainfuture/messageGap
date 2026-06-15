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
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const label = category === "all" ? "全部" : category;
        const href = category === "all" ? "/" : `/?category=${category}`;

        return (
          <Button
            key={category}
            asChild
            variant={active === category ? "default" : "outline"}
            size="sm"
            className={cn("h-8", active === category && "shadow-sm")}
          >
            <Link href={href}>{label}</Link>
          </Button>
        );
      })}
    </div>
  );
}
