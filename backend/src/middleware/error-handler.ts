import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/validation";

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, any>;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
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

  // Log error for debugging
  if (process.env.NODE_ENV !== "production") {
    console.error("Error:", error);
  }

  // Handle validation errors
  if (error instanceof ValidationError) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: error.details,
    } as ApiError);
    return;
  }

  // Handle application errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: getErrorCode(error.statusCode),
      message: error.message,
    } as ApiError);
    return;
  }

  // Handle database errors
  if (
    error.message.includes("duplicate key value violates unique constraint")
  ) {
    res.status(409).json({
      error: "CONFLICT",
      message: "Resource already exists",
    } as ApiError);
    return;
  }

  if (error.message.includes("foreign key constraint")) {
    res.status(400).json({
      error: "INVALID_REFERENCE",
      message: "Referenced resource does not exist",
    } as ApiError);
    return;
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Invalid token",
    } as ApiError);
    return;
  }

  if (error.name === "TokenExpiredError") {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Token expired",
    } as ApiError);
    return;
  }

  // Default internal server error
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : error.message,
  } as ApiError);
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

// 404 handler for undefined routes
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  } as ApiError);
}

// Async error wrapper for route handlers
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
