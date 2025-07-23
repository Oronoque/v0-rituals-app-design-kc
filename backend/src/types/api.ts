// ===========================================
// COMMON API TYPES
// ===========================================

import { User, UserProgress } from "./database";

export interface ApiResponse<T> {
  success: boolean;
  data?: T | undefined;
  error?: string | undefined;
  message?: string | undefined;
}

export interface PaginationParams {
  page?: number | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ===========================================
// AUTH TYPES
// ===========================================

export interface AuthResponse {
  user: Omit<User, "password_hash">;
  token: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ===========================================
// USER TYPES
// ===========================================

export interface UserProfileResponse extends Omit<User, "password_hash"> {
  progress?: UserProgress | undefined;
}

export interface UserStatsResponse {
  total_users: number;
  premium_users: number;
  active_users_last_30_days: number;
  new_users_last_7_days: number;
}

export interface UsersResponse {
  users: Omit<User, "password_hash">[];
  total: number;
  limit: number;
  offset: number;
  total_pages: number;
}

// ===========================================
// ERROR TYPES
// ===========================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiError {
  error: string;
  message: string;
  status_code: number;
  validation_errors?: ValidationError[] | undefined;
  request_id?: string | undefined;
}
