"use client";

import * as React from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";

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
import { Input } from "@/components/ui/input";
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
  /** Enables an Edit/Delete actions column: /{resource}/{id}/edit and DELETE /{resource}/{id}. */
  resource?: string;
  /** Show the search box (default true). */
  searchable?: boolean;
  pageSize?: number;
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

export function ResourceTable<T extends { id?: string }>({
  queryKey,
  endpoint,
  columns,
  params,
  emptyTitle,
  emptyDescription,
  rowKey,
  resource,
  searchable = true,
  pageSize = 25,
}: ResourceTableProps<T>) {
  const [rawSearch, setRawSearch] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(rawSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [rawSearch]);

  const mergedParams: Record<string, string> = {
    ...(params ?? {}),
    page: String(page),
    pageSize: String(pageSize),
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError, error } = useList<T>(queryKey, endpoint, mergedParams);
  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? rows.length;

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search…"
            className="pl-9"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
          />
        </div>
      )}

      {isLoading ? (
        <Card className="p-6">
          <TableSkeleton cols={columns.length} />
        </Card>
      ) : isError ? (
        <ErrorState message={(error as Error)?.message} />
      ) : rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={search ? "No matches for your search." : emptyDescription} />
      ) : (
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
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
