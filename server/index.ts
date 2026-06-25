import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";

import healthRoutes from "./routes/health";
import aiRoutes from "./routes/ai";
import dbRoutes from "./routes/db";
import weatherRoutes from "./routes/weather";
import marketRoutes from "./routes/market";
import otpRoutes from "./routes/otp";
import locationsRoutes from "./routes/locations";
import authRoutes from "./routes/auth";

console.log("=== KisaniSaathi Server Startup ===");
const envVars = [
  { key: "GROQ_API_KEY", required: false },
  { key: "GEMINI_API_KEY", required: false },
  { key: "OPENWEATHER_API_KEY", required: false },
  { key: "DATAGOVIN_API_KEY", required: false },
];

envVars.forEach(({ key, required }) => {
  const isSet = !!process.env[key];
  console.log(`| ${key.padEnd(25)} | ${isSet ? "✅ SET" : (required ? "❌ MISSING" : "⚠️ MISSING (Mock Fallback)")} |`);
});

const isGroqSet = !!process.env.GROQ_API_KEY;
const isGeminiSet = !!process.env.GEMINI_API_KEY;
if (!isGroqSet && !isGeminiSet) {
  console.error("\nCRITICAL: Either GROQ_API_KEY or GEMINI_API_KEY must be set for full AI functionality.");
}
console.log("===================================\n");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize and verify Neon DB table exists
  try {
    const { createPool } = await import("../src/db/index.js");
    const pool = createPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_data (
        id TEXT PRIMARY KEY,
        collection TEXT NOT NULL,
        doc_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT
      );
    `);
    console.log("PostgreSQL app_data table verified/created successfully.");
    await pool.end();
  } catch (err) {
    console.error("Database initialization failed:", err);
  }

  app.set("trust proxy", 1);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https://*"],
        connectSrc: ["'self'", "https://api.anthropic.com", "https://generativelanguage.googleapis.com", "https://openweathermap.org", "https://api.openweathermap.org"],
        frameAncestors: ["*"],
      },
    },
    crossOriginEmbedderPolicy: false,
    xFrameOptions: false,
    crossOriginResourcePolicy: false,
  }));

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // Mount API routes
  app.use("/api", healthRoutes);
  app.use("/api", aiRoutes);
  app.use("/api/db", dbRoutes);
  app.use("/api/weather", weatherRoutes);
  app.use("/api/market", marketRoutes);
  app.use("/api/otp", otpRoutes);
  app.use("/api/locations", locationsRoutes);
  app.use("/api/auth", authRoutes);

  // Neon DB Test Route
  app.get("/api/test-neon", async (req, res) => {
    try {
      const { db } = await import("../src/db/index.js");
      const { neonTestTable } = await import("../src/db/schema.js");
      
      await db.insert(neonTestTable).values({
        message: `Test message ${new Date().toISOString()}`
      });
      const users = await db.select().from(neonTestTable);
      res.json({ success: true, count: users.length, users });
    } catch (error: any) {
      console.error("Neon test error:", error);
      res.status(500).json({ error: error.message || "Failed to query Neon Postgres DB" });
    }
  });

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    app.use(express.static(path.resolve("./dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("./dist/index.html"));
    });
  } else {
    // We only use Vite for non-production environments to avoid building
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
