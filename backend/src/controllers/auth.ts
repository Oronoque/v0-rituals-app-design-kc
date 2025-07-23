// Auth controller for the fully-typed schema
// Handles authentication endpoints with proper validation and error handling

import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import {
  loginSchema,
  registerSchema,
  updateUserSchema,
} from "../utils/validation";
import {
  ApiResponse,
  AuthResponse,
  UserProfileResponse,
  UsersResponse,
} from "../types/api";
import { pool } from "../database/connection";

const authService = new AuthService(pool);

// ===========================================
// AUTHENTICATION ENDPOINTS
// ===========================================

export const register = async (
  req: Request,
  res: Response
): Promise<Response<ApiResponse<AuthResponse>, Record<string, any>>> => {
  try {
    // Validate request data
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Please check your input data",
        validation_errors: validation.error.formErrors.fieldErrors,
      });
    }
    const result = await authService.register(validation.data);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: result,
      message: "User registered successfully",
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error("Registration error:", error);

    const response: ApiResponse<AuthResponse> = {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
      message: "Failed to register user",
    };

    // Handle specific error types
    if (error instanceof Error && error.message.includes("already exists")) {
      return res.status(409).json(response);
    } else {
      return res.status(500).json(response);
    }
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<Response<ApiResponse<AuthResponse>, Record<string, any>>> => {
  try {
    // Validate request data
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Please check your input data",
        validation_errors: validation.error.formErrors.fieldErrors,
      });
    }
    const result = await authService.login(validation.data);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: result,
      message: "Login successful",
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Login error:", error);

    const response: ApiResponse<UserProfileResponse> = {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
      message: "Invalid credentials",
    };

    return res.status(401).json(response);
  }
};

export const verifyToken = async (
  req: Request,
  res: Response
): Promise<Response<ApiResponse<UserProfileResponse>, Record<string, any>>> => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
        message: "Authorization token is required",
      });
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

    const response: ApiResponse<UserProfileResponse> = {
      success: true,
      data: sanitizedUser,
      message: "Token is valid",
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Token verification error:", error);

    const response: ApiResponse<UserProfileResponse> = {
      success: false,
      error:
        error instanceof Error ? error.message : "Token verification failed",
      message: "Invalid or expired token",
    };

    return res.status(401).json(response);
  }
};

// ===========================================
// USER PROFILE ENDPOINTS
// ===========================================

export const getProfile = async (
  req: Request,
  res: Response
): Promise<Response<ApiResponse<UserProfileResponse>, Record<string, any>>> => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const userProfile = await authService.getUserProfile(userId);

    const response: ApiResponse<UserProfileResponse> = {
      success: true,
      data: userProfile,
      message: "Profile retrieved successfully",
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get profile error:", error);

    const response: ApiResponse<UserProfileResponse> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get profile",
      message: "Could not retrieve user profile",
    };

    return res.status(500).json(response);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<Response<ApiResponse<UserProfileResponse>, Record<string, any>>> => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    // Validate request data
    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: "Please check your input data",
        validation_errors: validation.error.formErrors.fieldErrors,
      });
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

    const response: ApiResponse<UserProfileResponse> = {
      success: true,
      data: sanitizedUser,
      message: "Profile updated successfully",
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Update profile error:", error);

    const response: ApiResponse<UserProfileResponse> = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
      message: "Could not update user profile",
    };

    return res.status(500).json(response);
  }
};

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

export const deleteAccount = async (
  req: Request,
  res: Response
): Promise<Response<ApiResponse<UserProfileResponse>, Record<string, any>>> => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const { confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: "Confirmation required",
        message: "Please confirm account deletion",
      });
    }

    await authService.deleteUser(userId);

    const response: ApiResponse<UserProfileResponse> = {
      success: true,
      message: "Account deleted successfully",
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Delete account error:", error);

    const response: ApiResponse<UserProfileResponse> = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete account",
      message: "Could not delete account",
    };

    return res.status(500).json(response);
  }
};

// ===========================================
// ADMIN ENDPOINTS
// ===========================================

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<Response<ApiResponse<UsersResponse>, Record<string, any>>> => {
  try {
    const userRole = req.userId;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Admin access required",
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await authService.getAllUsers(limit, offset);

    const response: ApiResponse<UsersResponse> = {
      success: true,
      data: {
        users: result.users,
        total: result.total,
        limit,
        offset,
        total_pages: Math.ceil(result.total / limit),
      },
      message: "Users retrieved successfully",
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get all users error:", error);

    const response: ApiResponse<UsersResponse> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get users",
      message: "Could not retrieve users",
    };

    return res.status(500).json(response);
  }
};
