// Validation utilities for the fully-typed rituals system
// Uses Zod schemas with inferred TypeScript types

import {
  NewRitual,
  NewRitualFrequency,
  NewStepDefinition,
  StepConfigOf,
  StepType,
} from "@/types/database";
import {
  ritualCategorySchema,
  ritualFrequencyTypeSchema,
  workoutSetTypeSchema,
  workoutSetUnitSchema,
  stepTypeSchema,
  booleanStepConfigSchema,
  counterStepConfigSchema,
  qnaStepConfigSchema,
  scaleStepConfigSchema,
  timerStepConfigSchema,
  exerciseSetStepConfigSchema,
  stepDefinitionSchema,
  UUID,
} from "@/types/schema";
import { v4 } from "uuid";
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

export class ValidationError extends Error {
  public details: ValidationErrorDetail[];

  constructor(errors: ValidationErrorDetail[]) {
    super("Validation failed");
    this.name = "ValidationError";
    this.details = errors;
  }
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
