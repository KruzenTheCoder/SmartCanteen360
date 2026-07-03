/**
 * Consistent API response envelope used across every endpoint. The web and
 * mobile clients decode these shapes; the API's TransformInterceptor produces
 * them.
 */

export interface ApiMeta {
  requestId?: string;
  timestamp: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiPaginated<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

/** Stable machine-readable error codes returned in `error.code`. */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  BOOKING_CLOSED: 'BOOKING_CLOSED',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ApiError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: ApiErrorDetail[];
  };
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
