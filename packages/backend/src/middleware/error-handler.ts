import {
  ApiError,
  ApiResult,
  convertZodErrorToValidationErrorDetail,
  InternalError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@rituals/shared";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

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
