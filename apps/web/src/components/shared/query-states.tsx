import * as React from "react";
import { AlertCircle, Inbox } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

/** Table loading skeleton: a header bar plus N shimmer rows. */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description,
  icon: Icon = Inbox,
  action,
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <Icon className="mb-3 h-10 w-10 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-12 text-center">
      <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
      <p className="font-medium text-destructive">Something went wrong</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {message ?? "Failed to load data. Please try again."}
      </p>
    </div>
  );
}
