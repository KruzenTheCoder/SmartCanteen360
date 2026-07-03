import { z } from 'zod';

/** Standard list-query parameters: pagination, search, sort. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Compute Prisma skip/take from pagination query. */
export const toPrismaPage = (q: Pick<PaginationQuery, 'page' | 'pageSize'>) => ({
  skip: (q.page - 1) * q.pageSize,
  take: q.pageSize,
});
