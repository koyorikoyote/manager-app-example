import { z } from "zod";

/**
 * Validation schemas for mobile API endpoints
 */

// Pagination query validation
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .default("1")
    .refine((val) => val >= 1, { message: "Page must be >= 1" }),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .default("20")
    .refine((val) => val >= 1 && val <= 100, {
      message: "Limit must be between 1 and 100",
    }),
});

// Search query validation with date filters
export const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query 'q' is required"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default("20"),
});

// Documents query validation
export const documentsQuerySchema = z.object({
  q: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default("20"),
});

// Submissions query validation
export const submissionsQuerySchema = paginationQuerySchema;
