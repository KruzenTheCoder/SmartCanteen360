import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { api } from "./api";

interface Paginated<T> {
  data: T[];
}

/** Fetch a list, tolerating both raw arrays and the `{ data }` envelope. */
export function useApiList<T>(
  key: string,
  endpoint: string,
  options?: Partial<UseQueryOptions<T[]>>,
) {
  return useQuery<T[]>({
    queryKey: [key],
    queryFn: async () => {
      const res = await api.get<Paginated<T> | T[]>(endpoint);
      const body = res.data;
      return Array.isArray(body) ? body : body.data;
    },
    ...options,
  });
}

/** Fetch a single object. */
export function useApiResource<T>(
  key: string,
  endpoint: string,
  options?: Partial<UseQueryOptions<T>>,
) {
  return useQuery<T>({
    queryKey: [key, endpoint],
    queryFn: async () => (await api.get<T>(endpoint)).data,
    ...options,
  });
}
