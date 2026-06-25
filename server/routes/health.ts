import { Router } from "express";
import { isGroqEnabled, isGeminiEnabled } from "../services/ai";
import { createErrorResponse } from "../utils/errors";

const router = Router();

router.get("/health", async (req, res) => {
  try {
    res.json({
      status: "ok",
      groq: isGroqEnabled(),
      gemini: isGeminiEnabled(),
      weather: !!process.env.OPENWEATHER_API_KEY,
      market: !!process.env.DATAGOVIN_API_KEY,
      uptime: Math.floor(process.uptime())
    });
  } catch (error: any) {
    console.error("Health API Error:", error.message || error);
    res.status(500).json(createErrorResponse("Health check failed.", "INTERNAL_SERVER_ERROR"));
  }
});

export default router;
