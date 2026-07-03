"use client";

import { useMemo, useState } from "react";
import { Search, UtensilsCrossed, ShoppingBasket } from "lucide-react";

import { Input } from "@/components/ui/input";
import { TableSkeleton, EmptyState } from "@/components/shared/query-states";
import { useList } from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";
import { usePos } from "@/lib/pos/store";

interface RetailProduct {
  id: string;
  name: string;
  category: string;
  price: number;
}
interface Meal {
  id: string;
  name: string;
  retailPrice: number;
  category?: { name: string } | null;
}

export function ProductGrid() {
  const addItem = usePos((s) => s.addItem);
  const [tab, setTab] = useState<"retail" | "meals">("retail");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("ALL");

  const { data: retailData, isLoading: retailLoading } = useList<RetailProduct>("pos-products", "/pos/products");
  const { data: mealData, isLoading: mealLoading } = useList<Meal>("pos-meals", "/meals");

  const retail = retailData?.data ?? [];
  const meals = (mealData?.data ?? []).filter((m) => Number(m.retailPrice) > 0);

  const categories = useMemo(() => ["ALL", ...Array.from(new Set(retail.map((p) => p.category)))], [retail]);

  const shownRetail = retail.filter(
    (p) =>
      (category === "ALL" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const shownMeals = meals.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const loading = tab === "retail" ? retailLoading : mealLoading;

  return (
    <div className="flex h-full flex-col">
      {/* Tabs + search */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-lg border p-1">
          <button
            onClick={() => setTab("retail")}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium", tab === "retail" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            <ShoppingBasket className="h-4 w-4" /> Shop
          </button>
          <button
            onClick={() => setTab("meals")}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium", tab === "meals" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            <UtensilsCrossed className="h-4 w-4" /> Meals
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Category chips (retail) */}
      {tab === "retail" && (
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium", category === c ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")}
            >
              {c === "ALL" ? "All" : c.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : tab === "retail" ? (
          shownRetail.length === 0 ? (
            <EmptyState title="No products" description="Add retail products to sell them here." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {shownRetail.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addItem({ id: p.id, label: p.name, unitPrice: Number(p.price), kind: "retail" })}
                  className="rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-muted/50"
                >
                  <p className="text-sm font-medium leading-tight">{p.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.category.replace(/_/g, " ")}</p>
                  <p className="mt-2 font-semibold">{formatCurrency(Number(p.price))}</p>
                </button>
              ))}
            </div>
          )
        ) : shownMeals.length === 0 ? (
          <EmptyState title="No meals" description="Published meals with a retail price appear here." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shownMeals.map((m) => (
              <button
                key={m.id}
                onClick={() => addItem({ id: m.id, label: m.name, unitPrice: Number(m.retailPrice), kind: "meal" })}
                className="rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-muted/50"
              >
                <p className="text-sm font-medium leading-tight">{m.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{m.category?.name ?? "Meal"}</p>
                <p className="mt-2 font-semibold">{formatCurrency(Number(m.retailPrice))}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
