import pg from "pg";

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.SUPABASE_TRANSACTION_POOLER_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}