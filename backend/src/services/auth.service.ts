import { v4 as uuidv4 } from "uuid";
import { db } from "../database/connection";
import { hashPassword, comparePassword } from "../utils/crypto";
import { generateToken } from "../middleware/auth";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../middleware/error-handler";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "@/utils/validation";
import { UserRow } from "@/types/database";

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Check if user already exists
    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", email)
      .executeTakeFirst();

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = uuidv4();

    const user = await db
      .insertInto("users")
      .values({
        id: userId,
        email,
        password_hash: passwordHash,
        current_streak: 0,
        proof_score: 1.0,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        current_streak: user.current_streak,
        proof_score: user.proof_score.toString(),
        created_at: user.created_at.toISOString(),
      },
      token,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user by email
    const user = await db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        current_streak: user.current_streak,
        proof_score: user.proof_score.toString(),
        created_at: user.created_at.toISOString(),
      },
      token,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Omit<UserRow, "password_hash">> {
    const user = await db
      .selectFrom("users")
      .select([
        "id",
        "email",
        "current_streak",
        "proof_score",
        "created_at",
        "updated_at",
      ])
      .where("id", "=", userId)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundError("User");
    }

    return {
      id: user.id,
      email: user.email,
      current_streak: user.current_streak,
      proof_score: user.proof_score,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  /**
   * Update user's proof score and streak
   */
  async updateUserStats(userId: string, completed: boolean): Promise<void> {
    const user = await db
      .selectFrom("users")
      .select(["current_streak", "proof_score"])
      .where("id", "=", userId)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundError("User");
    }

    let newStreak: number;
    let newProofScore: number;

    if (completed) {
      // Increase streak and proof score
      newStreak = user.current_streak + 1;
      newProofScore = user.proof_score * 1.01; // 1% increase
    } else {
      // Reset streak, decrease proof score
      newStreak = 0;
      newProofScore = user.proof_score * 0.99; // 1% decrease
    }

    await db
      .updateTable("users")
      .set({
        current_streak: newStreak,
        proof_score: Math.round(newProofScore * 10000) / 10000, // Round to 4 decimal places
        updated_at: new Date(),
      })
      .where("id", "=", userId)
      .execute();
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const user = await db
      .selectFrom("users")
      .select(["current_streak", "proof_score"])
      .where("id", "=", userId)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundError("User");
    }

    // Get ritual statistics
    const ritualStats = await db
      .selectFrom("rituals")
      .select(["category"])
      .where("user_id", "=", userId)
      .where("is_public", "=", false)
      .execute();

    const totalRituals = ritualStats.length;

    // Get completion statistics from daily rituals
    const completionStats = await db
      .selectFrom("daily_rituals")
      .select(["completed"])
      .where("user_id", "=", userId)
      .execute();

    const totalCompletions = completionStats.filter((r) => r.completed).length;
    const averageCompletionRate =
      completionStats.length > 0
        ? Math.round((totalCompletions / completionStats.length) * 100)
        : 0;

    // Count by category
    const categoryMap = new Map<string, number>();
    ritualStats.forEach((ritual) => {
      const category = ritual.category || "Uncategorized";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, completions: count }))
      .sort((a, b) => b.completions - a.completions)
      .slice(0, 5);

    return {
      currentStreak: user.current_streak,
      longestStreak: user.current_streak, // TODO: Calculate actual longest streak from history
      proofScore: user.proof_score,
      totalRituals,
      totalCompletions,
      averageCompletionRate,
      topCategories,
    };
  }
}
