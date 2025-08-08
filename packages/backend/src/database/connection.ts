import { Database } from "@rituals/shared";
import dotenv from "dotenv";
import { Kysely, PostgresDialect } from "kysely";
import { Pool, PoolConfig, types } from "pg";

// Load environment variables
dotenv.config({ path: ".env" });

// Configure pg types
types.setTypeParser(types.builtins.INT8, (val) => parseInt(val));
types.setTypeParser(types.builtins.INT4, (val) => parseInt(val));

class DatabaseManager {
  private static instance: Kysely<Database>;
  private static poolInstance: Pool;

  private constructor() {}

  public static getInstance(): Kysely<Database> {
    if (!DatabaseManager.instance) {
      const config: PoolConfig = {
        connectionString: process.env.DATABASE_URL,
      };

      // Override SSL config for production
      if (process.env.NODE_ENV === "production") {
        config.ssl = {
          rejectUnauthorized: false,
        };
      }

      DatabaseManager.poolInstance = new Pool(config);

      DatabaseManager.instance = new Kysely<Database>({
        dialect: new PostgresDialect({
          pool: DatabaseManager.poolInstance,
        }),
      });
    }
    return DatabaseManager.instance;
  }

  public static getPool(): Pool {
    if (!DatabaseManager.poolInstance) {
      DatabaseManager.getInstance(); // This will initialize the pool
    }
    return DatabaseManager.poolInstance;
  }

  public static async testConnection(): Promise<boolean> {
    try {
      const pool = DatabaseManager.getPool();
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      console.log("✅ Database connection successful");
      return true;
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      return false;
    }
  }

  public static async closeConnection(): Promise<void> {
    try {
      if (DatabaseManager.instance) {
        await DatabaseManager.instance.destroy();
      }
      if (DatabaseManager.poolInstance) {
        await DatabaseManager.poolInstance.end();
      }
      console.log("✅ Database connection closed");
    } catch (error) {
      console.error("❌ Error closing database connection:", error);
    }
  }
}

// Export singleton instances
export const db = DatabaseManager.getInstance();
export const pool = DatabaseManager.getPool();

// Export functions for backward compatibility
export const testConnection =
  DatabaseManager.testConnection.bind(DatabaseManager);
export const closeConnection =
  DatabaseManager.closeConnection.bind(DatabaseManager);
