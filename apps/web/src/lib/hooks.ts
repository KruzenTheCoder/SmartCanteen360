"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { api } from "./api";

export interface Paginated<T> {
  data: T[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetch a paginated list from `endpoint`. Tolerates both the raw array and the
 * `{ data, pagination }` envelope the API returns. Falls back to an empty list
 * so pages render an empty state rather than crashing when the API is offline.
 */
export function useList<T>(
  key: string,
  endpoint: string,
  params?: Record<string, string>,
  options?: Partial<UseQueryOptions<Paginated<T>>>,
) {
  return useQuery<Paginated<T>>({
    queryKey: [key, params],
    queryFn: async () => {
      const res = await api.get<Paginated<T> | T[]>(endpoint, params);
      if (Array.isArray(res)) return { data: res };
      return res;
    },
    ...options,
  });
}

/** Fetch a single object from `endpoint`. */
export function useResource<T>(
  key: string,
  endpoint: string,
  options?: Partial<UseQueryOptions<T>>,
) {
  return useQuery<T>({
    queryKey: [key, endpoint],
    queryFn: () => api.get<T>(endpoint),
    ...options,
  });
}
