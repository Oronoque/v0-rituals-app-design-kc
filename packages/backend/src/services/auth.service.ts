// Auth service for the fully-typed schema
// Handles user authentication, registration, and user management

import {
  AuthResponse,
  InternalError,
  LoginRequest,
  RegisterRequest,
  RitualCategory,
  UpdateUserRequest,
  User,
  UserProfileResponse,
  UserProgress,
  UserRole,
} from "@rituals/shared";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { db } from "../database/connection";

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly SALT_ROUNDS = 12;

  constructor(private pool: Pool) {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not set");
    }
    if (!process.env.JWT_EXPIRES_IN) {
      throw new Error("JWT_EXPIRES_IN environment variable is not set");
    }
    this.JWT_SECRET = process.env.JWT_SECRET;
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
  }

  // ===========================================
  // AUTHENTICATION METHODS
  // ===========================================

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      // Check if user already exists
      const existingUser = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [data.email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);

      // Create user
      const userId = uuidv4();
      const userQuery = `
        INSERT INTO users (
          id, email, password_hash, first_name, last_name, 
          role, current_streak, timezone  
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const userResult = await client.query(userQuery, [
        userId,
        data.email.toLowerCase(),
        passwordHash,
        data.first_name,
        data.last_name,
        "user" as UserRole,
        0,
        data.timezone || "+00:00",
      ]);

      const user = userResult.rows[0] as User;

      await client.query("COMMIT");

      // Generate JWT token
      const token = this.generateToken(user.id, user.email, user.role);
      const result = {
        user: this.sanitizeUser(user),
        token,
      };
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new InternalError("Failed to register", error);
    } finally {
      client.release();
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    // Get user by email
    try {
      const userQuery = "SELECT * FROM users WHERE email = $1";
      const userResult = await this.pool.query(userQuery, [
        data.email.toLowerCase(),
      ]);

      if (userResult.rows.length === 0) {
        throw new Error("Invalid email or password");
      }

      const user = userResult.rows[0] as User;

      // Verify password
      const isPasswordValid = await bcrypt
        .compare(data.password, user.password_hash)
        .catch((error) => {
          throw new InternalError("Failed to login", error);
        });

      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      // Generate JWT token
      const token = this.generateToken(user.id, user.email, user.role);

      return {
        user: this.sanitizeUser(user),
        token,
      };
    } catch (error) {
      throw new InternalError("Failed to login", error);
    }
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };

      const userQuery = "SELECT * FROM users WHERE id = $1";
      const userResult = await this.pool.query(userQuery, [decoded.userId]);

      if (userResult.rows.length === 0) {
        throw new Error("User not found");
      }

      return userResult.rows[0] as User;
    } catch (error) {
      throw new InternalError("Invalid or expired token", error);
    }
  }

  // ===========================================
  // USER MANAGEMENT METHODS
  // ===========================================

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    try {
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
        ...this.sanitizeUser(user),
        progress,
      };
    } catch (error) {
      throw new InternalError("Failed to get user profile", error);
    }
  }

  async updateUserProfile(
    userId: string,
    data: UpdateUserRequest
  ): Promise<User> {
    const updateFields: string[] = [];
    const updateValues: unknown[] = [];
    let paramIndex = 1;

    if (data.first_name !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      updateValues.push(data.first_name);
    }

    if (data.last_name !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      updateValues.push(data.last_name);
    }

    if (data.timezone !== undefined) {
      updateFields.push(`timezone = $${paramIndex++}`);
      updateValues.push(data.timezone);
    }

    if (data.is_premium !== undefined) {
      updateFields.push(`is_premium = $${paramIndex++}`);
      updateValues.push(data.is_premium);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex++}
      RETURNING *
    `;
    try {
      const result = await this.pool.query(query, updateValues);

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      return result.rows[0] as User;
    } catch (error) {
      throw new InternalError("Failed to update user profile", error);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      // Delete user (cascade will handle related records)
      const deleteQuery = "DELETE FROM users WHERE id = $1";
      const result = await client.query(deleteQuery, [userId]);

      if (result.rowCount === 0) {
        throw new Error("User not found");
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw new InternalError("Failed to delete user", error);
    } finally {
      client.release();
    }
  }

  // ===========================================
  // ADMIN METHODS
  // ===========================================

  async getAllUsers(
    limit = 50,
    offset = 0
  ): Promise<{ users: Omit<User, "password_hash">[]; total: number }> {
    // Count query
    const countQuery = "SELECT COUNT(*) as total FROM users";
    const countResult = await this.pool.query(countQuery);
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataQuery = `
      SELECT * FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    try {
      const dataResult = await this.pool.query(dataQuery, [limit, offset]);
      const users = dataResult.rows.map((user) =>
        this.sanitizeUser(user as User)
      );

      return { users, total };
    } catch (error) {
      throw new InternalError("Failed to get all users", error);
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private generateToken(userId: string, email: string, role: UserRole): string {
    // JWT payload matching what the middleware expects
    return jwt.sign(
      {
        userId,
        role,
        sub: userId,
        email: email,
      },
      this.JWT_SECRET,
      {
        expiresIn: this.JWT_EXPIRES_IN,
      } as jwt.SignOptions
    );
  }

  private sanitizeUser(user: User): Omit<User, "password_hash"> {
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

  async getUserById(userId: string): Promise<User | null> {
    try {
      const query = "SELECT * FROM users WHERE id = $1";
      const result = await this.pool.query(query, [userId]);

      return result.rows.length > 0 ? (result.rows[0] as User) : null;
    } catch (error) {
      throw new InternalError("Failed to get user by id", error);
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const query = "SELECT * FROM users WHERE email = $1";
      const result = await this.pool.query(query, [email.toLowerCase()]);

      return result.rows.length > 0 ? (result.rows[0] as User) : null;
    } catch (error) {
      throw new InternalError("Failed to get user by email", error);
    }
  }

  async updateUserStreak(userId: string, streakChange: number): Promise<void> {
    try {
      const query = `
      UPDATE users 
      SET current_streak = GREATEST(0, current_streak + $1), updated_at = NOW()
      WHERE id = $2
    `;

      await this.pool.query(query, [streakChange, userId]);
    } catch (error) {
      throw new InternalError("Failed to update user streak", error);
    }
  }

  async getUsersWithUpcomingRituals(
    date: string
  ): Promise<Omit<User, "password_hash">[]> {
    try {
      const query = `
      SELECT DISTINCT u.*
      FROM users u
      JOIN daily_rituals dr ON u.id = dr.user_id
      WHERE dr.scheduled_date = $1 
        AND dr.status = 'scheduled'
        AND dr.is_active = true
    `;

      const result = await this.pool.query(query, [date]);
      return result.rows.map((user) => this.sanitizeUser(user as User));
    } catch (error) {
      throw new InternalError(
        "Failed to get users with upcoming rituals",
        error
      );
    }
  }
}
