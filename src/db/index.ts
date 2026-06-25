import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Use the user's Neon connection string via env
const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  throw new Error("NEON_DATABASE_URL environment variable is required");
}

export const createPool = () => {
  return new Pool({
    connectionString,
    connectionTimeoutMillis: 15000,
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });
