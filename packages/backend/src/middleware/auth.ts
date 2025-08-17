import {
  ApiError,
  getErrorCode,
  InternalError,
  UnauthorizedError,
} from "@rituals/shared";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to require authentication
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Prefer httpOnly cookie; fall back to Authorization header for backward compat
    const tokenFromCookie = (req as any).cookies?.token as string | undefined;
    const authorization = req.headers.authorization;
    const tokenFromHeader = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : undefined;
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      throw new UnauthorizedError("Missing token");
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    const payload = jwt.verify(token, jwtSecret) as JwtPayload;
    // Add user ID to request
    req.userId = payload.sub;

    next();
  } catch (error) {
    let apiError: ApiError | undefined;

    if (error instanceof Error) {
      if (error instanceof ApiError) {
        apiError = error;
      } else {
        if (error instanceof jwt.JsonWebTokenError) {
          apiError = new UnauthorizedError("Invalid token", error);
        } else if (error instanceof jwt.TokenExpiredError) {
          apiError = new UnauthorizedError("Token expired", error);
        } else {
          apiError = new InternalError(
            "Unexpected error: " + error.message,
            error
          );
        }
      }
    } else {
      apiError = new InternalError("Unknown error", error);
    }

    res.statusMessage = getErrorCode(apiError.status_code);
    res.status(apiError.status_code).json(apiError.intoErrorResponse());
  }
}

// /**
//  * Middleware for optional authentication (doesn't throw if no token)
//  */
// export function optionalAuth(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void {
//   try {
//     const authorization = req.headers.authorization;

//     if (!authorization || !authorization.startsWith("Bearer ")) {
//       return next(); // Continue without authentication
//     }

//     const token = authorization.slice(7);

//     if (!token) {
//       return next(); // Continue without authentication
//     }

//     const jwtSecret = process.env.JWT_SECRET;
//     if (!jwtSecret) {
//       throw new Error("JWT_SECRET environment variable is not set");
//     }

//     const payload = jwt.verify(token, jwtSecret) as JwtPayload;
//     req.userId = payload.sub;

//     next();
//   } catch (error) {
//     // For optional auth, continue even if token is invalid
//     next();
//   }
// }
