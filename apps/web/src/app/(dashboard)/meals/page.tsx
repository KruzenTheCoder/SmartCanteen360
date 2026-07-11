"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, UtensilsCrossed, Flame, Beef, Star, TrendingUp, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton, EmptyState } from "@/components/shared/query-states";
import { useList } from "@/lib/hooks";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";

interface Meal {
  id: string;
  name: string;
  status: string;
  imageUrl?: string | null;
  category?: { name: string } | null;
  costPrice: number;
  retailPrice: number;
  subsidyPrice: number;
  nutrition?: { calories: number; protein: number } | null;
}

const statusVariant: Record<string, "success" | "secondary" | "warning"> = {
  PUBLISHED: "success",
  DRAFT: "secondary",
  ARCHIVED: "warning",
};

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </Card>
  );
}

export default function MealsPage() {
  const { data, isLoading, isError } = useList<Meal>("meals", "/meals");
  const meals = data?.data ?? [];
  const qc = useQueryClient();

  const deleteMeal = async (id: string) => {
    if (!window.confirm("Delete this meal?")) return;
    try {
      await api.delete(`/meals/${id}`);
      toast.success("Meal deleted");
      await qc.invalidateQueries({ queryKey: ["meals"] });
    } catch (e) {
      toast.error("Could not delete", { description: (e as Error).message });
    }
  };

  const published = meals.filter((m) => m.status === "PUBLISHED").length;
  const avgPrice = meals.length ? meals.reduce((s, m) => s + Number(m.retailPrice), 0) / meals.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Meals" description="Your menu, priced and plated. Add photos to make them irresistible.">
        <Button asChild className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
          <Link href="/meals/new">
            <Plus className="mr-2 h-4 w-4" /> Add Meal
          </Link>
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total meals" value={String(meals.length)} icon={UtensilsCrossed} accent="bg-indigo-100 text-indigo-600 dark:bg-indigo-950" />
        <StatCard label="Published" value={String(published)} icon={Star} accent="bg-green-100 text-green-600 dark:bg-green-950" />
        <StatCard label="Avg. price" value={formatCurrency(avgPrice)} icon={TrendingUp} accent="bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <Card className="p-6"><TableSkeleton rows={4} cols={4} /></Card>
      ) : isError || meals.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No meals yet"
          description="Create your first meal and add a mouth-watering photo."
          action={
            <Button asChild>
              <Link href="/meals/new"><Plus className="mr-2 h-4 w-4" /> Add Meal</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {meals.map((meal, i) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.4) }}
              whileHover={{ y: -6 }}
              className="group"
            >
              <Card className="overflow-hidden border-0 shadow-md ring-1 ring-black/5 transition-shadow duration-300 group-hover:shadow-2xl dark:ring-white/10">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {meal.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={meal.imageUrl}
                      alt={meal.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500">
                      <UtensilsCrossed className="h-10 w-10 text-white/80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Status */}
                  <div className="absolute right-3 top-3">
                    <Badge variant={statusVariant[meal.status] ?? "secondary"} className="shadow">
                      {meal.status}
                    </Badge>
                  </div>

                  {/* Name + price over image */}
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-white drop-shadow">{meal.name}</p>
                      <p className="text-xs text-white/80">{meal.category?.name ?? "Uncategorised"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/95 px-2.5 py-1 text-sm font-bold text-slate-900 shadow">
                      {formatCurrency(Number(meal.retailPrice))}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600 dark:bg-orange-950 dark:text-orange-300">
                      <Flame className="h-3 w-3" /> {Math.round(Number(meal.nutrition?.calories ?? 0))} kcal
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                      <Beef className="h-3 w-3" /> {Math.round(Number(meal.nutrition?.protein ?? 0))}g protein
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3 text-sm">
                    <span className="text-muted-foreground">
                      Subsidised from{" "}
                      <span className="font-semibold text-foreground">{formatCurrency(Number(meal.subsidyPrice))}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <Button asChild size="sm" variant="ghost" className="h-7 text-indigo-600 hover:text-indigo-700">
                        <Link href={`/meals/${meal.id}/edit`}>Edit</Link>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMeal(meal.id)} aria-label="Delete meal">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
