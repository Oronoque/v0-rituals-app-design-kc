import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "./connection";

// Load environment variables
dotenv.config();

async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");

    // Read schema file
    const schemaPath = join(__dirname, "./schema.sql");
    const schema = readFileSync(schemaPath, "utf8");

    // Execute schema
    await pool.query(schema);

    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
