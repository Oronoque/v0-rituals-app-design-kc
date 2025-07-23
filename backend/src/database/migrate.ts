import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  });

  try {
    console.log("🔄 Running database migrations...");

    // Read schema file
    const schemaPath = join(__dirname, "../../database/schema.sql");
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
