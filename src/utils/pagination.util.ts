import type { Request } from 'express';

export type PaginationMeta = {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
};

export type PaginationLinks = {
  first: string;
  previous: string | null;
  next: string | null;
  last: string;
};

export const getPaginationMeta = (totalItems: number, page: number, limit: number): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    totalItems,
    itemsPerPage: limit,
    currentPage: page,
    totalPages: totalPages === 0 ? 1 : totalPages,
  };
};

export const getPaginationLinks = (
  req: Request,
  page: number,
  limit: number,
  totalItems: number
): PaginationLinks => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const protocol = req.protocol;
  const host = req.get('host');
  // Express req.originalUrl contains the full path including the query string
  // We use req.baseUrl + req.path to get the clean path without query
  const path = req.baseUrl + req.path;
  const baseUrl = `${protocol}://${host}${path}`;
  
  // Reconstruct query parameters
  const queryParts: string[] = [];
  for (const [key, value] of Object.entries(req.query)) {
    // Exclude page and limit as we will inject them specifically for each link
    if (key !== 'page' && key !== 'limit' && value !== undefined) {
      queryParts.push(`${key}=${encodeURIComponent(value as string)}`);
    }
  }
  
  const buildUrl = (p: number) => {
    const defaultParams = [`page=${p}`, `limit=${limit}`];
    const queryString = [...defaultParams, ...queryParts].join('&');
    return `${baseUrl}?${queryString}`;
  };

  return {
    first: buildUrl(1),
    previous: page > 1 ? buildUrl(page - 1) : null,
    next: page < totalPages ? buildUrl(page + 1) : null,
    last: buildUrl(totalPages),
  };
};
