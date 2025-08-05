// ===========================================
// COMMON API TYPES
// ===========================================

import { err, Result } from "neverthrow";
import { User, UserProgress } from "./database-types";
import { ValidationErrorDetail } from "./utils";

export class ApiError extends Error {
  name: string;
  success: false;
  status_message: string;
  message: string;
  status_code: number;
  request_id: string | undefined;

  constructor(message: string, status_code: number, request_id?: string) {
    super(message);
    this.message = message;
    this.status_message = getErrorCode(status_code);
    this.status_code = status_code;
    this.request_id = request_id;
    this.name = "ApiError";
    this.success = false;
    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    if (status_code >= 500) {
      console.error(this);
    }
  }

  neverThrow() {
    return err(this);
  }

  static parse(error: ApiError): ApiError {
    switch (error.name) {
      case "ApiError":
        return new ApiError(error.message, error.status_code, error.request_id);
      case "InternalError":
        return new InternalError(error.message, error.request_id);
      case "NotFoundError":
        return new NotFoundError(error.message, error.request_id);
      case "BadRequestError":
        return new BadRequestError(error.message, error.request_id);
      case "UnprocessableEntityError":
        return new UnprocessableEntityError(error.message, error.request_id);
      case "TooManyRequestsError":
        return new TooManyRequestsError(error.message, error.request_id);
      case "UnauthorizedError":
        return new UnauthorizedError(error.message, error.request_id);
      case "ValidationError":
        return new ValidationError(
          (error as ValidationError).validation_errors,
          error.request_id
        );
      case "ForbiddenError":
        return new ForbiddenError(error.message, error.request_id);
      default:
        return new ApiError(error.message, error.status_code, error.request_id);
    }
  }
}

export class InternalError extends ApiError {
  constructor(message = "Internal server error", request_id?: string) {
    super(message, 500, request_id);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found", request_id?: string) {
    super(message, 404, request_id);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request", request_id?: string) {
    super(message, 400, request_id);
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(message = "Unprocessable entity", request_id?: string) {
    super(message, 422, request_id);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = "Too many requests", request_id?: string) {
    super(message, 429, request_id);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", request_id?: string) {
    super(message, 401, request_id);
  }
}

export class ValidationError extends ApiError {
  validation_errors: ValidationErrorDetail[];
  constructor(validation_errors: ValidationErrorDetail[], request_id?: string) {
    super("Validation failed", 400, request_id);
    this.validation_errors = validation_errors;
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "Forbidden", request_id?: string) {
    super(message, 403, request_id);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, request_id?: string) {
    super(message, 409, request_id);
  }
}

// Helper function to get error codes
function getErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "UNPROCESSABLE_ENTITY";
    case 429:
      return "TOO_MANY_REQUESTS";
    case 500:
      return "INTERNAL_ERROR";
    default:
      return "UNKNOWN_ERROR";
  }
}

export interface ApiSuccess<T> {
  status_code: number;
  message: string;
  data: T;
  success: true;
}

export type ApiResult<T> = Result<ApiSuccess<T>, ApiError>;

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
