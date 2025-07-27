// Auth controller for the fully-typed schema
// Handles authentication endpoints with proper validation and error handling

import { Request } from "express";
import { ok } from "neverthrow";
import { pool } from "../database/connection";
import {
  asyncHandler,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  SafeResponse,
  UnauthorizedError,
  ValidationError,
} from "../middleware/error-handler";
import { AuthService } from "../services/auth.service";
import {
  convertZodErrorToValidationErrorDetail,
  loginSchema,
  registerSchema,
  updateUserSchema,
} from "../utils/validation";

const authService = new AuthService(pool);

// ===========================================
// AUTHENTICATION ENDPOINTS
// ===========================================

export const register = asyncHandler(
  async (req: Request, res: SafeResponse) => {
    try {
      // Validate request data
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return new ValidationError(
          convertZodErrorToValidationErrorDetail(validation.error)
        ).neverThrow();
      }
      const result = await authService.register(validation.data);

      return ok({
        data: result,
        message: "User registered successfully",
        status_code: 201,
        success: true,
      });
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error && error.message.includes("already exists")) {
        return new ConflictError("User already exists").neverThrow();
      } else {
        throw error;
      }
    }
  }
);

export const login = asyncHandler(async (req: Request, res: SafeResponse) => {
  try {
    // Validate request data
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return new ValidationError(
        convertZodErrorToValidationErrorDetail(validation.error)
      ).neverThrow();
    }
    const result = await authService.login(validation.data);

    return ok({
      data: result,
      message: "Login successful",
      status_code: 200,
      success: true,
    });
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error && error.message.includes("incorrect")) {
      return new UnauthorizedError("Invalid credentials").neverThrow();
    } else {
      throw error;
    }
  }
});

export const verifyToken = asyncHandler(
  async (req: Request, res: SafeResponse) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return new UnauthorizedError("No token provided").neverThrow();
      }

      const user = await authService.verifyToken(token);
      const sanitizedUser = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        current_streak: user.current_streak,
        timezone: user.timezone,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };

      return ok({
        data: sanitizedUser,
        message: "Token is valid",
        status_code: 200,
        success: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("invalid")) {
        return new UnauthorizedError("Invalid token").neverThrow();
      } else {
        throw error;
      }
    }
  }
);

// ===========================================
// USER PROFILE ENDPOINTS
// ===========================================

export const getProfile = asyncHandler(
  async (req: Request, res: SafeResponse) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return new UnauthorizedError("User not authenticated").neverThrow();
      }

      const userProfile = await authService.getUserProfile(userId);

      return ok({
        data: userProfile,
        message: "Profile retrieved successfully",
        status_code: 200,
        success: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return new NotFoundError("User not found").neverThrow();
      } else {
        throw error;
      }
    }
  }
);

export const updateProfile = asyncHandler(
  async (req: Request, res: SafeResponse) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return new UnauthorizedError("User not authenticated").neverThrow();
      }

      // Validate request data
      const validation = updateUserSchema.safeParse(req.body);
      if (!validation.success) {
        return new ValidationError(
          convertZodErrorToValidationErrorDetail(validation.error)
        ).neverThrow();
      }

      const updatedUser = await authService.updateUserProfile(
        userId,
        validation.data
      );

      // Sanitize the response
      const sanitizedUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        role: updatedUser.role,
        current_streak: updatedUser.current_streak,
        timezone: updatedUser.timezone,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
      };

      return ok({
        data: updatedUser,
        message: "Profile updated successfully",
        status_code: 200,
        success: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return new NotFoundError("User not found").neverThrow();
      } else {
        throw error;
      }
    }
  }
);

// export const changePassword = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = (req as any).user?.id;

//     if (!userId) {
//       res.status(401).json({
//         success: false,
//         error: "Unauthorized",
//         message: "User not authenticated",
//       });
//       return;
//     }

//     const { current_password, new_password } = req.body;

//     if (!current_password || !new_password) {
//       res.status(400).json({
//         success: false,
//         error: "Missing required fields",
//         message: "Current password and new password are required",
//       });
//       return;
//     }

//     if (new_password.length < 6) {
//       res.status(400).json({
//         success: false,
//         error: "Invalid password",
//         message: "New password must be at least 6 characters long",
//       });
//       return;
//     }

//     const changePasswordData: ChangePasswordRequest = {
//       current_password,
//       new_password,
//     };

//     await authService.changePassword(userId, changePasswordData);

//     const response: ApiResponse = {
//       success: true,
//       message: "Password changed successfully",
//     };

//     res.status(200).json(response);
//   } catch (error) {
//     console.error("Change password error:", error);

//     const response: ApiResponse = {
//       success: false,
//       error:
//         error instanceof Error ? error.message : "Failed to change password",
//       message: "Could not change password",
//     };

//     // Handle specific error types
//     if (error instanceof Error && error.message.includes("incorrect")) {
//       res.status(400).json(response);
//     } else {
//       res.status(500).json(response);
//     }
//   }
// };

export const deleteAccount = asyncHandler(
  async (req: Request, res: SafeResponse) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return new UnauthorizedError("User not authenticated").neverThrow();
      }

      const { confirm } = req.body;

      if (!confirm) {
        return new BadRequestError("Confirmation required").neverThrow();
      }

      await authService.deleteUser(userId);

      return ok({
        message: "Account deleted successfully",
        data: null,
        status_code: 200,
        success: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return new NotFoundError("User not found").neverThrow();
      } else {
        throw error;
      }
    }
  }
);

// ===========================================
// ADMIN ENDPOINTS
// ===========================================

export const getAllUsers = asyncHandler(
  async (req: Request, res: SafeResponse) => {
    try {
      const userRole = req.userId;

      if (userRole !== "admin") {
        return new ForbiddenError("Admin access required").neverThrow();
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await authService.getAllUsers(limit, offset);

      return ok({
        data: {
          users: result.users,
          total: result.total,
          limit,
          offset,
          total_pages: Math.ceil(result.total / limit),
        },
        message: "Users retrieved successfully",
        status_code: 200,
        success: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return new NotFoundError("User not found").neverThrow();
      } else {
        throw error;
      }
    }
  }
);
