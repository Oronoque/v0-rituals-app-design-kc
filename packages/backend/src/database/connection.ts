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
        log(event) {
          if (event.level === "query") {
            // console.log("SQL:", event.query.sql);
            // console.log("Params:", event.query.parameters.join(", "));
          }
        },
      });

      // Fetch the OID for the '_exercise_equipment' type
      const fetchExerciseEquipmentOid = async (): Promise<number> => {
        const pool = DatabaseManager.getPool();
        const client = await pool.connect();
        try {
          const res = await client.query(
            "SELECT oid FROM pg_type WHERE typname = '_exercise_equipment'"
          );
          if (res.rows.length > 0) {
            return res.rows[0].oid;
          } else {
            throw new Error("❌ Failed to fetch OID for '_exercise_equipment'");
          }
        } finally {
          client.release();
        }
      };

      // Apply the custom parser for '_exercise_equipment' type
      fetchExerciseEquipmentOid()
        .then((oid) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          types.setTypeParser(oid, (val) => {
            return val === null ? null : val.slice(1, -1).split(",");
          });
        })
        .catch((error) => {
          console.error(
            "❌ Error fetching OID for '_exercise_equipment':",
            error
          );
          throw error;
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
