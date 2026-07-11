"use client";

import * as React from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useList } from "@/lib/hooks";
import { EmptyState, ErrorState, TableSkeleton } from "./query-states";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface ResourceTableProps<T> {
  queryKey: string;
  endpoint: string;
  columns: Column<T>[];
  params?: Record<string, string>;
  emptyTitle?: string;
  emptyDescription?: string;
  rowKey?: (row: T) => string;
  /** Enables an Edit/Delete actions column: routes to /{resource}/{id}/edit and DELETEs /{resource}/{id}. */
  resource?: string;
}

function RowActions({ resource, id, queryKey }: { resource: string; id: string; queryKey: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState(false);

  const onDelete = async () => {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    setBusy(true);
    try {
      await api.delete(`/${resource}/${id}`);
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: [queryKey] });
    } catch (e) {
      toast.error("Could not delete", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex justify-end gap-1">
      <Button asChild size="icon" variant="ghost" className="h-8 w-8">
        <Link href={`/${resource}/${id}/edit`} aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onDelete} disabled={busy} aria-label="Delete">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

/**
 * Data-driven table: fetches `endpoint` and renders `columns`, handling the
 * loading, error and empty states. Pass `resource` to add an Edit/Delete column.
 */
export function ResourceTable<T extends { id?: string }>({
  queryKey,
  endpoint,
  columns,
  params,
  emptyTitle,
  emptyDescription,
  rowKey,
  resource,
}: ResourceTableProps<T>) {
  const { data, isLoading, isError, error } = useList<T>(queryKey, endpoint, params);

  if (isLoading) {
    return (
      <Card className="p-6">
        <TableSkeleton cols={columns.length} />
      </Card>
    );
  }
  if (isError) {
    return <ErrorState message={(error as Error)?.message} />;
  }

  const rows = data?.data ?? [];
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.header} className={col.className}>
                {col.header}
              </TableHead>
            ))}
            {resource ? <TableHead className="text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={rowKey?.(row) ?? row.id ?? i}>
              {columns.map((col) => (
                <TableCell key={col.header} className={col.className}>
                  {col.cell(row)}
                </TableCell>
              ))}
              {resource && row.id ? (
                <TableCell className="text-right">
                  <RowActions resource={resource} id={row.id} queryKey={queryKey} />
                </TableCell>
              ) : resource ? (
                <TableCell />
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
