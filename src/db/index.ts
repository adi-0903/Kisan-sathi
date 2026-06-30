import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Use the user's Neon connection string via env
const connectionString = process.env.NEON_DATABASE_URL;

export const createPool = () => {
  if (!connectionString) {
    throw new Error("NEON_DATABASE_URL environment variable is required");
  }
  return new Pool({
    connectionString,
    connectionTimeoutMillis: 15000,
  });
};

let dbInstance: any = null;

const getDb = () => {
  if (!connectionString) {
    return null;
  }
  if (!dbInstance) {
    const pool = createPool();
    pool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
};

export const db = new Proxy({} as any, {
  get(target, prop) {
    const database = getDb();
    if (!database) {
      throw new Error("NEON_DATABASE_URL environment variable is required. Database operation failed.");
    }
    return Reflect.get(database, prop);
  }
});

