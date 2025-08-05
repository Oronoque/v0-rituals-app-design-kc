import { UnauthorizedError } from "@rituals/shared";
import { NextFunction, Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";

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
    // Get token from Authorization header
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid authorization header");
    }

    const token = authorization.slice(7); // Remove 'Bearer ' prefix

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
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Invalid token"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Token expired"));
    } else {
      next(error);
    }
  }
}

/**
 * Middleware for optional authentication (doesn't throw if no token)
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return next(); // Continue without authentication
    }

    const token = authorization.slice(7);

    if (!token) {
      return next(); // Continue without authentication
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    const payload = jwt.verify(token, jwtSecret) as JwtPayload;
    req.userId = payload.sub;

    next();
  } catch (error) {
    // For optional auth, continue even if token is invalid
    next();
  }
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId: string, email: string): string {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  const options = {
    expiresIn: jwtExpiresIn,
  } as SignOptions;

  return jwt.sign(
    {
      userId,
      sub: userId,
      email: email,
    },
    jwtSecret,
    options
  );
}

/**
 * Verify and decode JWT token without throwing errors
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return null;
    }

    return jwt.verify(token, jwtSecret) as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to require admin role (must be used after requireAuth)
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // This middleware assumes the user object is attached by the auth service
  const user = (req as any).user;

  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }

  if (user.role !== "admin") {
    res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Admin access required",
    });
    return;
  }

  next();
}
