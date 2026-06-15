"use client";

import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signalCategories, type SignalCategory } from "@/features/signals/types";

export function CategoryFilter({
  activeCategory,
}: {
  activeCategory?: SignalCategory | "all";
}) {
  const active = activeCategory ?? "all";
  const categories = ["all", ...signalCategories] as const;
  const router = useRouter();
  const searchParams = useSearchParams();

  function hrefFor(category: (typeof categories)[number]) {
    const params = new URLSearchParams(searchParams.toString());

    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    const queryString = params.toString();
    return queryString ? `/?${queryString}` : "/";
  }

  return (
    <nav aria-label="信息差分类" className="w-full md:w-56">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-10 w-full justify-between bg-card/90 px-3"
          >
            {active === "all" ? "全部分类" : active}
            <ChevronDown aria-hidden="true" className="size-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
          <DropdownMenuGroup>
            {categories.map((category) => (
              <DropdownMenuItem
                key={category}
                selected={active === category}
                onSelect={() => router.push(hrefFor(category))}
              >
                {category === "all" ? "全部分类" : category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
