import { NextFunction, Request, Response } from "express";
import { err } from "neverthrow";
import { ZodError } from "zod";
import { ApiResult } from "../types/api";
import {
  convertZodErrorToValidationErrorDetail,
  ValidationErrorDetail,
} from "../utils/validation";

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

// Error handling middleware
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Don't respond if response already sent
  if (res.headersSent) {
    return next(error);
  }

  // Handle application errors
  if (error instanceof ApiError) {
    res.json(error.neverThrow());
    return;
  }

  // Handle validation errors
  if (error instanceof ZodError) {
    res.json(
      new ValidationError(convertZodErrorToValidationErrorDetail(error))
    );
    return;
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    res.status(401).json(new UnauthorizedError("Invalid token").neverThrow());
    return;
  }

  if (error.name === "TokenExpiredError") {
    res.status(401).json(new UnauthorizedError("Token expired").neverThrow());
    return;
  }

  // Handle database errors
  if (
    error.message.includes("duplicate key value violates unique constraint")
  ) {
    res.json(new ApiError("Resource already exists", 409).neverThrow());
    return;
  }

  if (error.message.includes("foreign key constraint")) {
    res.json(
      new ApiError("Referenced resource does not exist", 400).neverThrow()
    );
    return;
  }

  // Default internal server error
  res.status(500).json(new InternalError(error.message).neverThrow());
}

// 404 handler for undefined routes
export function notFoundHandler(req: Request, res: Response): void {
  res
    .status(404)
    .json(
      new NotFoundError(
        `Route ${req.method} ${req.originalUrl} not found`
      ).neverThrow()
    );
}

export type SafeResponse = Omit<Response, "json" | "send" | "end" | "jsonp">;

export type Handler<T> = (
  req: Request,
  res: SafeResponse,
  next: NextFunction
) => Promise<ApiResult<T>>;

export function asyncHandler<T>(fn: Handler<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await fn(req, res, next);
      if (result.isOk()) {
        res.status(result.value.status_code).json({
          ...result.value,
          success: true,
        });
      } else {
        res.statusMessage = result.error.status_message;
        res.status(result.error.status_code).json({
          ...result.error,
          success: false,
        });
      }
    } catch (err) {
      next(err);
    }
  };
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
