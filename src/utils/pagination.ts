export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export function parsePagination(query: {
  page?: string | string[];
  limit?: string | string[];
}): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(query.page ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  let limit = parseInt(String(query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  if (limit < 1) limit = DEFAULT_LIMIT;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationResult {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
