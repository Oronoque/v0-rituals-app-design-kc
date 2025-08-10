import {
  ApiError,
  ApiSuccess,
  getErrorCode,
  InternalError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@rituals/shared";
import { Request, Response } from "express";
import { ZodError } from "zod";

// 404 handler for undefined routes
export function notFoundHandler(req: Request, res: Response): void {
  const error = new NotFoundError(
    `Route ${req.method} ${req.originalUrl} not found`
  );
  res.status(404).json(error.intoErrorResponse());
}

export type SafeResponse = Omit<Response, "json" | "send" | "end" | "jsonp">;

export type Handler<T> = (
  req: Request,
  res: SafeResponse
) => Promise<Omit<ApiSuccess<T>, "status">>;

export function asyncHandler<T>(fn: Handler<T>) {
  return async function withResultHandler(req: Request, res: Response) {
    try {
      const result = await fn(req, res as SafeResponse);
      res.json({
        ...result,
        status: "success",
      });
    } catch (err) {
      // 🔹 Centralized error conversion
      let apiError: ApiError | undefined;

      if (err instanceof Error) {
        if (err instanceof ApiError) {
          apiError = err;
        } else if (err instanceof ZodError) {
          apiError = new ValidationError(err);
        } else if (err.name === "JsonWebTokenError") {
          apiError = new UnauthorizedError("Invalid token", err);
        } else if (err.name === "TokenExpiredError") {
          apiError = new UnauthorizedError("Token expired", err);
        } else if (
          err.message.includes("duplicate key value violates unique constraint")
        ) {
          apiError = new ApiError("Resource already exists", 409, err);
        } else if (err.message.includes("foreign key constraint")) {
          apiError = new ApiError(
            "Referenced resource does not exist",
            400,
            err
          );
        } else {
          apiError = new InternalError("Unexpected error: " + err.message, err);
        }
      } else {
        apiError = new InternalError("Unknown error", err);
      }

      res.statusMessage = getErrorCode(apiError.status_code);
      res.status(apiError.status_code).json(apiError.intoErrorResponse());
    }
  };
}
