import { z } from "zod";
import type { User, AuthResponse } from "../types/api";

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be less than 128 characters long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Step validation schemas (snake_case format)
export const stepSchema = z.object({
  type: z.enum(["yesno", "qa", "weightlifting", "cardio", "custom"]),
  name: z
    .string()
    .min(1, "Step name is required")
    .max(255, "Step name too long"),
  question: z.string().optional(),
  weightlifting_config: z
    .array(
      z.object({
        reps: z.number().min(1).max(1000),
        weight: z.number().min(0).max(10000),
        completed: z.boolean().optional(),
      })
    )
    .optional(),
  cardio_config: z
    .array(
      z.object({
        time: z.number().min(1).max(10000), // minutes
        distance: z.number().min(0).max(1000), // miles/km
        completed: z.boolean().optional(),
      })
    )
    .optional(),
  custom_config: z
    .object({
      label: z.string().min(1).max(100),
      unit: z.string().min(1).max(20),
    })
    .optional(),
});

// Ritual validation schemas (snake_case format)
export const createRitualSchema = z.object({
  name: z
    .string()
    .min(1, "Ritual name is required")
    .max(255, "Ritual name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  category: z.string().max(100, "Category too long").optional(),
  location: z.string().max(255, "Location too long").optional(),
  gear: z.array(z.string().max(100)).max(20, "Too many gear items").optional(),
  steps: z
    .array(stepSchema)
    .min(1, "At least one step is required")
    .max(50, "Too many steps"),
  is_public: z.boolean(),
  // Frequency settings
  frequency_type: z.enum(["once", "daily", "weekly", "custom"]),
  frequency_interval: z.number().min(1).max(365),
  frequency_data: z
    .object({
      days_of_week: z.array(z.number().min(0).max(6)), // 0-6 for Sunday-Saturday
      specific_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    })
    .optional(),
});

export const updateRitualSchema = createRitualSchema.partial();

// Daily ritual validation schemas
export const createDailyRitualSchema = z.object({
  ritual_id: z.string().uuid("Invalid ritual ID"),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  scheduled_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional(),
});

export const updateDailyRitualSchema = z.object({
  scheduled_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional(),
  steps: z
    .array(
      z.object({
        step_id: z.string().uuid("Invalid step ID"),
        completed: z.boolean().optional(),
        skipped: z.boolean().optional(),
        answer: z
          .union([
            z.string(), // For yesno and qa steps
            z.object({
              // For weightlifting steps
              sets: z.array(
                z.object({
                  reps: z.number().min(0).max(1000),
                  weight: z.number().min(0).max(10000),
                  completed: z.boolean().optional(),
                })
              ),
            }),
            z.object({
              // For cardio steps
              rounds: z.array(
                z.object({
                  time: z.number().min(0).max(10000),
                  distance: z.number().min(0).max(1000),
                  completed: z.boolean().optional(),
                })
              ),
            }),
            z.object({
              // For custom steps
              value: z.number(),
              unit: z.string().max(20),
            }),
          ])
          .optional(),
        was_modified: z.boolean().optional(),
      })
    )
    .optional(),
});

// Legacy scheduling schema (to be deprecated)
export const scheduleRitualSchema = z.object({
  ritual_id: z.string().uuid("Invalid ritual ID"),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  scheduled_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional(),
  frequency_type: z.enum(["once", "daily", "weekly", "custom"]).optional(),
  frequency_data: z
    .object({
      days_of_week: z.array(z.number().min(0).max(6)).optional(),
      interval: z.number().min(1).max(365).optional(),
      custom_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    })
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD)")
    .optional(),
});

// Step progress validation schemas (for daily instances)
export const updateStepSchema = z.object({
  completed: z.boolean().optional(),
  skipped: z.boolean().optional(),
  answer: z
    .union([
      z.string(), // For yesno and qa steps
      z.object({
        // For weightlifting steps
        sets: z.array(
          z.object({
            reps: z.number().min(0).max(1000),
            weight: z.number().min(0).max(10000),
            completed: z.boolean().optional(),
          })
        ),
      }),
      z.object({
        // For cardio steps
        rounds: z.array(
          z.object({
            time: z.number().min(0).max(10000),
            distance: z.number().min(0).max(1000),
            completed: z.boolean().optional(),
          })
        ),
      }),
      z.object({
        // For custom steps
        value: z.number(),
        unit: z.string().max(20),
      }),
    ])
    .optional(),
});

// Query parameter validation schemas
export const publicRitualQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1).max(100))
    .optional(),
  offset: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(0))
    .optional(),
  sort_by: z
    .enum(["name", "fork_count", "completion_count", "created_at"])
    .optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
});

// Type exports
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type CreateRitualRequest = z.infer<typeof createRitualSchema>;
export type UpdateRitualRequest = z.infer<typeof updateRitualSchema>;
export type CreateDailyRitualRequest = z.infer<typeof createDailyRitualSchema>;
export type UpdateDailyRitualRequest = z.infer<typeof updateDailyRitualSchema>;
export type ScheduleRitualRequest = z.infer<typeof scheduleRitualSchema>;
export type UpdateStepRequest = z.infer<typeof updateStepSchema>;
export type PublicRitualQuery = z.infer<typeof publicRitualQuerySchema>;

export { User, AuthResponse };

// Validation error type
export class ValidationError extends Error {
  public details: Record<string, string[]>;

  constructor(issues: z.ZodIssue[]) {
    super("Validation failed");
    this.name = "ValidationError";
    this.details = issues.reduce((acc, issue) => {
      const path = issue.path.join(".");
      if (!acc[path]) {
        acc[path] = [];
      }
      acc[path].push(issue.message);
      return acc;
    }, {} as Record<string, string[]>);
  }
}

// Helper function to validate request body
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
}

// Helper function to validate query parameters
export function validateQuery<T>(schema: z.ZodSchema<T>, query: unknown): T {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
}
