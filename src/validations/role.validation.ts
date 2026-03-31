import { z } from 'zod';

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Role name must be at least 2 characters').toUpperCase(),
    description: z.string().optional(),
    permissions: z.array(z.number()).default([]), // array of permission IDs
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Role name must be at least 2 characters').toUpperCase().optional(),
    description: z.string().optional(),
    permissions: z.array(z.number()).optional(), // array of permission IDs
  }),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>['body'];
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>['body'];