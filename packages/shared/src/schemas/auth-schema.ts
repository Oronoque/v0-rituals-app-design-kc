// ===========================================
// AUTH SCHEMAS (EXISTING)
// ===========================================

import z from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().max(100, "First name must be 100 characters or less"),
  last_name: z.string().max(100, "Last name must be 100 characters or less"),
});

export const updateUserSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
