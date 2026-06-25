import { defineConfig } from "drizzle-kit";

const connectionString = process.env.NEON_DATABASE_URL || "postgresql://neondb_owner:npg_kr8Aox0JEecp@ep-dark-moon-aqr1a891-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
});
