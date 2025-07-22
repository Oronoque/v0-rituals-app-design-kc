import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { validateRequestBody } from "../utils/validation";
import { loginSchema, registerSchema } from "../utils/validation";
import { asyncHandler } from "../middleware/error-handler";

const authService = new AuthService();

/**
 * POST /auth/register
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = validateRequestBody(registerSchema, req.body);

  const result = await authService.register(data);

  res.status(201).json(result);
});

/**
 * POST /auth/login
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = validateRequestBody(loginSchema, req.body);

  const result = await authService.login(data);

  res.status(200).json(result);
});

/**
 * GET /auth/me
 * Get current user information
 */
export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.userId) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }

    const user = await authService.getUserById(req.userId);

    res.status(200).json(user);
  }
);

/**
 * GET /auth/stats
 * Get current user statistics
 */
export const getUserStats = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.userId) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }

    const stats = await authService.getUserStats(req.userId);

    res.status(200).json(stats);
  }
);
