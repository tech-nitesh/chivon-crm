import { Pool } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  console.log("Reading prisma/neon_init.sql...");
  const sqlContent = fs.readFileSync(path.join(process.cwd(), "prisma/neon_init.sql"), "utf-8");

  console.log("Executing SQL batch on Neon Database via Pool...");
  
  try {
    await pool.query(sqlContent);
    console.log("✅ All tables, constraints, and indexes successfully created on Neon PostgreSQL!");
    await pool.end();
  } catch (err) {
    console.error("Execution error:", err);
    await pool.end();
    process.exit(1);
  }
}

main();
