import { Router } from "express";
import { dataLimiter } from "../middleware/rateLimiter";
import { createErrorResponse } from "../utils/errors";
import { eq } from "drizzle-orm";
import { db } from "../../src/db/index.js";
import { appData } from "../../src/db/schema.js";

const router = Router();

const marketCache = {
  data: null as any,
  timestamp: 0
};

router.get("/", dataLimiter, async (req, res) => {
  try {
    const apiKey = process.env.DATAGOVIN_API_KEY;
    if (!apiKey) {
       console.warn("DATAGOVIN_API_KEY missing - returning mock market prices.");
       return res.json([
          { crop: "Wheat", today: 2275, yesterday: 2250, change: 1.1, mandi: "Khanna" },
          { crop: "Rice (Paddy)", today: 2203, yesterday: 2203, change: 0, mandi: "Ludhiana" },
          { crop: "Maize", today: 2090, yesterday: 2110, change: -0.9, mandi: "Jalandhar" },
          { crop: "Potato", today: 850, yesterday: 830, change: 2.4, mandi: "Amritsar" },
          { crop: "Mustard", today: 5650, yesterday: 5600, change: 0.9, mandi: "Patiala" },
          { crop: "Cotton", today: 6620, yesterday: 6700, change: -1.2, mandi: "Bathinda" },
        ]);
    }

    // 30 min cache
    const now = Date.now();
    if (marketCache.data && (now - marketCache.timestamp < 30 * 60 * 1000)) {
       return res.json(marketCache.data);
    }

    // Fetch from API
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=20&filters[state.keyword]=Punjab`;
    const response = await fetch(url);
    
    if (!response.ok) {
       res.status(response.status).json(createErrorResponse(`Market API Error: ${response.statusText}`, "BAD_GATEWAY"));
       return;
    }
    
    const parsedData = await response.json();
    if (parsedData && parsedData.records) {
      
      // Load yesterday's prices from DB
      let yesterdayMarketData: Record<string, number> = {};
      try {
        const [row] = await db.select().from(appData).where(eq(appData.id, `market_cache:yesterday_prices`));
        if (row) {
          yesterdayMarketData = JSON.parse(row.data);
        }
      } catch (err) {
        console.error("Failed to load yesterday prices from DB", err);
      }

      const formatted = parsedData.records.map((r: any) => {
        const crop = r.commodity || "Unknown";
        const market = r.market || "Unknown";
        const currentPrice = Number(r.modal_price) || 0;
        const mapKey = `${crop}_${market}`;
        
        let yesterdayPrice = yesterdayMarketData[mapKey];
        if (!yesterdayPrice) {
          yesterdayPrice = currentPrice; 
          yesterdayMarketData[mapKey] = currentPrice;
        }
        
        let change = 0;
        if (yesterdayPrice > 0) {
           change = Number((((currentPrice - yesterdayPrice) / yesterdayPrice) * 100).toFixed(2));
        }

        // Update yesterday map for future runs if it's a new day
        yesterdayMarketData[mapKey] = currentPrice;

        return {
          crop,
          today: currentPrice,
          yesterday: yesterdayPrice,
          change: change,
          mandi: market
        };
      });

      // Save updated yesterday prices to DB
      try {
        const nowIso = new Date().toISOString();
        await db.insert(appData).values({
          id: `market_cache:yesterday_prices`,
          collection: `market_cache`,
          docId: `yesterday_prices`,
          data: JSON.stringify(yesterdayMarketData),
          createdAt: nowIso,
          updatedAt: nowIso
        }).onConflictDoUpdate({
          target: appData.id,
          set: {
            data: JSON.stringify(yesterdayMarketData),
            updatedAt: nowIso
          }
        });
      } catch (err) {
        console.error("Failed to save yesterday prices to DB", err);
      }

      marketCache.data = formatted;
      marketCache.timestamp = now;
      res.json(formatted);
    } else {
      res.json([]);
    }
  } catch (error: any) {
    console.error("Mandi API Error:", error.message || error);
    res.status(500).json(createErrorResponse("Failed to fetch Mandi prices", "INTERNAL_SERVER_ERROR"));
  }
});

export default router;
