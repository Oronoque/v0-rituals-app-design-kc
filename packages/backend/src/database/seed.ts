import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "./connection";

// Load environment variables
dotenv.config();

async function runSeed() {
  try {
    console.log("🔄 Running database seed...");

    // Read seed file
    const seedPath = join(__dirname, "./seed.sql");
    const seed = readFileSync(seedPath, "utf8");

    // Execute seed
    await pool.query(seed);

    console.log("✅ Database seed completed successfully");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seed if called directly
if (require.main === module) {
  runSeed();
}

export { runSeed };
