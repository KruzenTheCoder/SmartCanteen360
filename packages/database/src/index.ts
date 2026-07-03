/**
 * @smartcanteen/database
 *
 * Single source of truth for the SmartCanteen 360 data layer. Both the API
 * (and, through it, the web admin and mobile app) depend on this package.
 * Nothing outside the API should import PrismaClient directly.
 */
import { PrismaClient, Prisma } from '@prisma/client';

export * from '@prisma/client';

/**
 * Returns a singleton PrismaClient. In development we cache the instance on the
 * global object to survive HMR / module reloads and avoid exhausting the
 * Supabase connection pool.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function createPrismaClient(
  options?: Prisma.PrismaClientOptions,
): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
    ...options,
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Columns treated as soft-delete markers. Repositories should filter
 * `deletedAt: null` on read and set `deletedAt` on delete rather than issuing
 * hard `DELETE` statements.
 */
export const SOFT_DELETE_FIELD = 'deletedAt' as const;
