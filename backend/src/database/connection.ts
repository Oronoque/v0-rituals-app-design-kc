import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import dotenv from "dotenv";
import type {
  UserRow,
  RitualRow,
  StepRow,
  RitualTemplateRow,
  DailyRitualRow,
  DailyStepRow,
} from "../types/database";

// Load environment variables
dotenv.config();

// Database interface
export interface Database {
  users: UserRow;
  rituals: RitualRow;
  steps: StepRow;
  ritual_templates: RitualTemplateRow;
  daily_rituals: DailyRitualRow;
  daily_steps: DailyStepRow;
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Kysely instance
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool,
  }),
});

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await db.selectFrom("users").select("id").limit(1).execute();
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  try {
    await pool.end();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
  }
}
