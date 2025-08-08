// ===========================================
// COMMON API TYPES
// ===========================================

import { err, Result } from "neverthrow";
import { User, UserProgress } from "./database-types";
import { requestContext } from "./request-id";
import { ValidationErrorDetail } from "./utils";

export class ApiError extends Error {
  success: false;
  status_message: string;
  status_code: number;
  request_id: string;

  constructor(message: string, status_code: number, cause?: unknown) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.status_message = getErrorCode(status_code);
    this.status_code = status_code;
    this.request_id = requestContext.requestId;
    this.success = false;

    // Filter stack to only include lines from our workspaces
    if (this.stack) {
      this.stack = this.stack
        .split("\n")
        .filter(
          (line) =>
            line.includes("packages/frontend") ||
            line.includes("packages/backend")
        )
        .join("\n");
    }
  }

  neverThrow() {
    return err(this);
  }

  static parse(error: ApiError): ApiError {
    switch (error.name) {
      case "InternalError":
        return new InternalError(error.message, error.cause);
      case "NotFoundError":
        return new NotFoundError(error.message, error.cause);
      case "BadRequestError":
        return new BadRequestError(error.message, error.cause);
      case "UnprocessableEntityError":
        return new UnprocessableEntityError(error.message, error.cause);
      case "TooManyRequestsError":
        return new TooManyRequestsError(error.message, error.cause);
      case "UnauthorizedError":
        return new UnauthorizedError(error.message, error.cause);
      case "ValidationError":
        return new ValidationError(
          (error as ValidationError).validation_errors,
          error.cause
        );
      case "ForbiddenError":
        return new ForbiddenError(error.message, error.cause);
      case "ConflictError":
        return new ConflictError(error.message, error.cause);
      default:
        return new ApiError(error.message, error.status_code, error.cause);
    }
  }

  protected printError(message: string) {
    const separator = `=== [${message}] ===`;
    console.error(separator);
    console.error(this);
    console.error("=== END ERROR BLOCK ===\n");
  }
}
export class InternalError extends ApiError {
  constructor(message = "Internal server error", cause?: unknown) {
    super(message, 500, cause);
    this.printError("INTERNAL ERROR");
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found", cause?: unknown) {
    super(message, 404, cause);
    this.printError("NOT FOUND");
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request", cause?: unknown) {
    super(message, 400, cause);
    this.printError("BAD REQUEST");
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(message = "Unprocessable entity", cause?: unknown) {
    super(message, 422, cause);
    this.printError("UNPROCESSABLE ENTITY");
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = "Too many requests", cause?: unknown) {
    super(message, 429, cause);
    this.printError("TOO MANY REQUESTS");
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", cause?: unknown) {
    super(message, 401, cause);
  }
}

export class ValidationError extends ApiError {
  validation_errors: ValidationErrorDetail[];
  constructor(validation_errors: ValidationErrorDetail[], cause?: unknown) {
    super("Validation failed", 400, cause);
    this.validation_errors = validation_errors;
    this.printError("VALIDATION ERROR");
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden", cause?: unknown) {
    super(message, 403, cause);
    this.printError("FORBIDDEN");
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, cause?: unknown) {
    super(message, 409, cause);
    this.printError("CONFLICT");
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
