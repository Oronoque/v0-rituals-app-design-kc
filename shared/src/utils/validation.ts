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
