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

// Fetch the OID for the '_exercise_equipment' type
const fetchExerciseEquipmentOid = async (): Promise<number> => {
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
