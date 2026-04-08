import { z } from 'zod';

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1, 'Page must be greater than or equal to 1').default(1),
    limit: z.coerce.number().int().min(1, 'Limit must be greater than or equal to 1').max(100, 'Maximum limit is 100').default(10),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    search: z.string().optional(),
  }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>['query'];
