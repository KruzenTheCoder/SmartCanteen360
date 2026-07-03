import { PaginationMeta } from '@smartcanteen/shared';

/** Build the standard pagination envelope metadata. */
export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return { data, pagination: buildPaginationMeta(total, page, pageSize) };
}
