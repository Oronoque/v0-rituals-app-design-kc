// Validation utilities for the fully-typed rituals system
// Uses Zod schemas with inferred TypeScript types

import { z } from "zod";

// ===========================================
// VALIDATION ERROR TYPES
// ===========================================

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrorDetail[];
}

// convert zod error to ValidationErrorDetail
export function convertZodErrorToValidationErrorDetail(
  error: z.ZodError
): ValidationErrorDetail[] {
  const details: ValidationErrorDetail[] = [];
  error.errors.forEach(function addError(err) {
    details.push({
      field: err.path.join("."),
      message: err.message,
      code: err.code,
    });
  });
  return details;
}

// ===========================================
// AUTH SCHEMAS (EXISTING)
// ===========================================

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().max(100, "First name must be 100 characters or less"),
  last_name: z.string().max(100, "Last name must be 100 characters or less"),
  timezone: z
    .enum([
      "America/New_York",
      "America/Los_Angeles",
      "America/Chicago",
      "America/Denver",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Madrid",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Kolkata",
      "Asia/Dubai",
      "Australia/Sydney",
      "UTC",
    ])
    .optional(),
});

export const updateUserSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  timezone: z
    .enum([
      "America/New_York",
      "America/Los_Angeles",
      "America/Chicago",
      "America/Denver",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Madrid",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Kolkata",
      "Asia/Dubai",
      "Australia/Sydney",
      "UTC",
    ])
    .optional(),
  is_premium: z.boolean().optional(),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
