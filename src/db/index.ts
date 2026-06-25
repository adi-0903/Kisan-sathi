import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Use the user's Neon connection string directly or via env
const connectionString = process.env.NEON_DATABASE_URL || "postgresql://neondb_owner:npg_kr8Aox0JEecp@ep-dark-moon-aqr1a891-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require";

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
