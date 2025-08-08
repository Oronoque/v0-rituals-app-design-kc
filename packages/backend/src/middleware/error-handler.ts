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
    const response = error.neverThrow();
    res.json({
      ...response,
      success: false,
    });
    return;
  }

  // Handle validation errors
  if (error instanceof ZodError) {
    const response = new ValidationError(
      convertZodErrorToValidationErrorDetail(error),
      error
    ).neverThrow();
    res.json({
      ...response,
      success: false,
    });
    return;
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    const response = new UnauthorizedError("Invalid token", error).neverThrow();
    res.status(401).json({
      ...response,
      success: false,
    });
    return;
  }

  if (error.name === "TokenExpiredError") {
    const response = new UnauthorizedError("Token expired", error).neverThrow();
    res.status(401).json({
      ...response,
      success: false,
    });
    return;
  }

  // Handle database errors
  if (
    error.message.includes("duplicate key value violates unique constraint")
  ) {
    const response = new ApiError(
      "Resource already exists",
      409,
      error
    ).neverThrow();
    res.json({
      ...response,
      success: false,
    });
    return;
  }

  if (error.message.includes("foreign key constraint")) {
    const response = new ApiError(
      "Referenced resource does not exist",
      400,
      error
    ).neverThrow();
    res.json({
      ...response,
      success: false,
    });
    return;
  }

  // Default internal server error
  res.status(500).json(new InternalError(error.message, error).neverThrow());
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
  return async function withResultHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fn(req, res, next);
      if (result.isOk()) {
        console.log("result", result.value);
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
