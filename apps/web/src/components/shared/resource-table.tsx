"use client";

import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
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
}

/**
 * Data-driven table: fetches `endpoint` and renders `columns`, handling the
 * loading, error and empty states for a consistent look across every module.
 */
export function ResourceTable<T extends { id?: string }>({
  queryKey,
  endpoint,
  columns,
  params,
  emptyTitle,
  emptyDescription,
  rowKey,
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
