import {
  ApiSuccess,
  BadRequestError,
  ConflictError,
  InternalError,
  loginSchema,
  NotFoundError,
  registerSchema,
  RitualCategory,
  UnauthorizedError,
  updateUserSchema,
  User,
  UserProfileResponse,
  UserProgress,
  UserRole,
  UserWithoutPassword,
} from "@rituals/shared";
import bcrypt from "bcrypt";
import { Request } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { db } from "../database/connection";
import { asyncHandler, SafeResponse } from "../middleware/error-handler";

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

// ===========================================
// AUTHENTICATION ENDPOINTS
// ===========================================

export const register = asyncHandler(async function registerHandler(
  req: Request,
  res: SafeResponse
): Promise<ApiSuccess<UserProfileResponse>> {
  // Validate request data
  const data = registerSchema.parse(req.body);

  return await db.transaction().execute(async (trx) => {
    // Check if user already exists
    const existingUser = await trx
      .selectFrom("users")
      .select("id")
      .where("email", "=", data.email.toLowerCase())
      .execute();

    if (existingUser.length > 0) {
      throw new ConflictError("User already exists");
    }

    // Hash password
    const passwordHash = await bcrypt
      .hash(data.password, SALT_ROUNDS)
      .catch((err) => {
        throw new InternalError("Failed to hash password", err);
      });

    // Create user
    const userId = uuidv4();
    const userResult = await trx
      .insertInto("users")
      .values({
        id: userId,
        email: data.email.toLowerCase(),
        password_hash: passwordHash,
        first_name: data.first_name,
        last_name: data.last_name,
        role: "user" as UserRole,
        current_streak: 0,
        timezone: data.timezone || "+00:00",
      })
      .returningAll()
      .execute();

    const user = userResult[0];
    if (!user) {
      throw new InternalError("Failed to create user");
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);
    const responseData = sanitizeUser(user);

    // Set auth token as httpOnly cookie
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return {
      data: responseData,
      message: "User registered successfully",
      status: "success",
    };
  });
});

export const login = asyncHandler(async function loginHandler(
  req: Request,
  res: SafeResponse
): Promise<ApiSuccess<UserProfileResponse>> {
  const data = loginSchema.parse(req.body);
  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", data.email.toLowerCase())
    .executeTakeFirst();

  if (!user) {
    throw new BadRequestError("Invalid email or password");
  }

  // Verify password
  const isPasswordValid = await bcrypt
    .compare(data.password, user.password_hash)
    .catch((error) => {
      throw new InternalError("Failed to login", error);
    });

  if (!isPasswordValid) {
    throw new BadRequestError("Invalid email or password");
  }

  // Generate JWT token
  const token = generateToken(user.id, user.email, user.role);

  // Set auth token as httpOnly cookie
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  return {
    data: sanitizeUser(user),
    message: "Login successful",
    status: "success",
  };
});

export const logout = asyncHandler(async function logoutHandler(
  req: Request,
  res: SafeResponse
): Promise<ApiSuccess<void>> {
  res.clearCookie("token");
  return {
    data: undefined,
    message: "Logout successful",
    status: "success",
  };
});
// export const verifyToken = asyncHandler(async function verifyTokenHandler(
//   req: Request
// ) {
//   const token =
//     (req as any).cookies?.token ||
//     req.headers.authorization?.replace("Bearer ", "");

//   if (!token) {
//     throw new UnauthorizedError("No token provided");
//   }

//   const user = await authService.verifyToken(token);
//   const sanitizedUser = {
//     id: user.id,
//     email: user.email,
//     first_name: user.first_name,
//     last_name: user.last_name,
//     role: user.role,
//     current_streak: user.current_streak,
//     timezone: user.timezone,
//     created_at: user.created_at,
//     updated_at: user.updated_at,
//   };

//   return {
//     data: sanitizedUser,
//     message: "Token is valid",
//   };
// });

// ===========================================
// USER PROFILE ENDPOINTS
// ===========================================

export const getProfile = asyncHandler(async function getProfileHandler(
  req: Request
): Promise<ApiSuccess<any>> {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError("User not authenticated");
  }
  // Get user data using Kysely
  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", userId)
    .executeTakeFirst();

  if (!user) {
    throw new Error("User not found");
  }

  // Get ritual completions count
  const completionsCount = await db
    .selectFrom("ritual_completions")
    .select(db.fn.count("id").as("total"))
    .where("user_id", "=", userId)
    .executeTakeFirst();

  // Get favorite categories (most used ritual categories)
  const favoriteCategories = await db
    .selectFrom("ritual_completions as rc")
    .leftJoin("rituals as r", "rc.ritual_id", "r.id")
    .select(["r.category", db.fn.countAll().as("usage_count")])
    .where("rc.user_id", "=", userId)
    .where("r.category", "is not", null)
    .groupBy("r.category")
    .orderBy("usage_count", "desc")
    .limit(3)
    .execute();

  const totalCompletions = Number(completionsCount?.total || 0);

  const progress: UserProgress = {
    user_id: userId,
    current_streak: user.current_streak,
    total_completions: totalCompletions,
    completion_rate: 100, // Always 100% since we only store completed rituals
    favorite_categories: favoriteCategories
      .map((cat) => cat.category)
      .filter(Boolean) as RitualCategory[],
  };

  return {
    data: {
      ...sanitizeUser(user),
      progress,
    },
    message: "Profile retrieved successfully",
    status: "success",
  };
});

export const updateProfile = asyncHandler(async function updateProfileHandler(
  req: Request
) {
  const userId = req.userId;

  if (!userId) {
    throw new UnauthorizedError("User not authenticated");
  }

  // Validate request data
  const validation = updateUserSchema.parse(req.body);

  const updatedUser = await db
    .updateTable("users")
    .set(validation)
    .where("id", "=", userId)
    .returningAll()
    .executeTakeFirst();

  if (!updatedUser) {
    throw new NotFoundError("User not found");
  }

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

  return {
    data: sanitizedUser,
    message: "Profile updated successfully",
  };
});

// ===========================================
// UTILITY METHODS
// ===========================================

function generateToken(userId: string, email: string, role: UserRole): string {
  // JWT payload matching what the middleware expects
  return jwt.sign(
    {
      userId,
      role,
      sub: userId,
      email: email,
    },
    JWT_SECRET!,
    {
      expiresIn: JWT_EXPIRES_IN!,
    } as jwt.SignOptions
  );
}

export function sanitizeUser(user: User): UserWithoutPassword {
  return {
    created_at: user.created_at,
    current_streak: user.current_streak,
    email: user.email,
    first_name: user.first_name,
    id: user.id,
    last_name: user.last_name,
    role: user.role,
    timezone: user.timezone,
    updated_at: user.updated_at,
  };
}
