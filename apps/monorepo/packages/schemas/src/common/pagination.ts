import { z } from 'zod'

/**
 * Common pagination input schema
 */
export const PaginationInput = z.object({
  page: z.number().int().min(1).default(1).describe('Page number for pagination'),
  pageSize: z.number().int().min(1).max(100).default(10).describe('Number of items per page'),
})

/**
 * Common pagination output schema
 */
export const createPaginatedOutput = <T extends z.ZodTypeAny>(itemSchema: T) => {
  return z.object({
    items: z.array(itemSchema).describe('Array of items'),
    page: z.number().int().describe('Current page number'),
    pageSize: z.number().int().describe('Number of items per page'),
    total: z.number().int().describe('Total number of items'),
  })
}
