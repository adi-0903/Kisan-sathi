import { Router } from "express";
import { dataLimiter } from "../middleware/rateLimiter";
import { createErrorResponse } from "../utils/errors";
import { isGroqEnabled, isGeminiEnabled, initGemini, generateGroqChat } from "../services/ai";

const router = Router();

router.get("/", dataLimiter, async (req, res) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const lat = req.query.lat || "30.9010"; // Ludhiana, Punjab
    const lon = req.query.lon || "75.8573";
    
    if (!apiKey) {
      // Fallback
      return res.json({
        temp: 32,
        humidity: 45,
        windSpeed: 12,
        rainProb: 10,
        uvIndex: 5,
        sprayWindow: true,
        condition: "Sunny",
        forecast: [
          { day: "Mon", date: "2026-06-05", temp: 32, main: "Clear", condition: "Sunny", description: "clear sky", windSpeed: 12, rainProb: 10, icon: "01d" },
        ]
      });
    }

    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
    if (!response.ok) {
       res.status(response.status).json(createErrorResponse(`Weather API Error: ${response.statusText}`, "BAD_GATEWAY"));
       return;
    }
    
    const data = await response.json();
    
    const dailyData: any[] = [];
    const seenDays = new Set();
    
    // Generate IST formatted dates mapping
    const toIST = (dateObj: Date) => {
      return new Date(dateObj.getTime() + (5.5 * 60 * 60 * 1000));
    };

    for (const item of data.list) {
      const istDate = toIST(new Date(item.dt * 1000));
      const dayStr = istDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      const dateStr = istDate.toLocaleDateString('en-US', { timeZone: 'UTC' });
      
      if (!seenDays.has(dateStr)) {
        seenDays.add(dateStr);
        dailyData.push({
          day: dayStr,
          date: dateStr,
          temp: Math.round(item.main.temp),
          main: item.weather[0].main,
          condition: item.weather[0].main,
          description: item.weather[0].description,
          windSpeed: Math.round(item.wind.speed * 3.6), 
          rainProb: Math.round(item.pop * 100), 
          icon: item.weather[0].icon
        });
      }
    }

    const currentTemp = Math.round(data.list[0].main.temp);
    const currentWind = Math.round(data.list[0].wind.speed * 3.6);
    const currentRainProb = Math.round(data.list[0].pop * 100);
    const isSprayWindow = currentWind < 15 && currentRainProb < 30 && currentTemp >= 15 && currentTemp <= 35;

    res.json({
      temp: currentTemp,
      humidity: data.list[0].main.humidity,
      windSpeed: currentWind,
      rainProb: currentRainProb,
      uvIndex: 0, 
      sprayWindow: isSprayWindow,
      condition: data.list[0].weather[0].main,
      forecast: dailyData
    });
    
  } catch (error: any) {
    console.error("Weather API Error:", error.message || error);
    res.status(500).json(createErrorResponse("Failed to fetch weather data.", "INTERNAL_SERVER_ERROR"));
  }
});

router.post("/spray-recommendation", dataLimiter, async (req, res) => {
  try {
    const { forecastData } = req.body;
    
    const systemPrompt = `You are an expert AI agronomist analyzing weather data. 
Given the following weather forecast, determine if the next few days are suitable for spraying pesticide.
Consider:
- High wind speed (>15 km/h) causes spray drift.
- High rain probability (>30%) washes away chemicals.
- Extreme temperatures are generally poor.
Respond in JSON format: { "recommendation": "Spray Now / Wait", "reasoning": "Simple, short reasoning.", "isGood": true }.`;

    if (isGroqEnabled()) {
      try {
        const aiText = await generateGroqChat(systemPrompt, "Forecast: " + JSON.stringify(forecastData), true);
        res.json(JSON.parse(aiText || '{}'));
        return;
      } catch (groqError: any) {
        console.error("Groq Spray recommendation Error, falling back to Gemini:", groqError.message || groqError);
      }
    }

    if (isGeminiEnabled()) {
      try {
        const ai = initGemini();
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            systemPrompt,
            "Forecast: " + JSON.stringify(forecastData)
          ],
          config: { responseMimeType: "application/json" }
        });
        
        res.json(JSON.parse(response.text || '{}'));
        return;
      } catch (geminiError: any) {
        console.error("Gemini Spray recommendation Error:", geminiError);
      }
    }

    const firstDay = forecastData && forecastData.length > 0 ? forecastData[0] : null;
    let isGood = true;
    let reasoning = "Conditions look acceptable for spraying.";
    
    if (firstDay) {
       if (firstDay.windSpeed > 15 && firstDay.rainProb > 30) {
          isGood = false;
          reasoning = "High winds and rain risk make spraying unsafe.";
       } else if (firstDay.windSpeed > 15) {
         isGood = false;
         reasoning = "High winds may cause spray drift.";
       } else if (firstDay.rainProb > 30) {
         isGood = false;
         reasoning = "High probability of rain could wash away spray.";
       } else if (firstDay.temp < 15 || firstDay.temp > 35) {
         isGood = false;
         reasoning = "Temperature is outside the optimal range for spraying.";
       }
    }
    res.json({
      recommendation: isGood ? "Spray Now" : "Wait",
      reasoning: reasoning,
      isGood: isGood
    });
    
  } catch (error: any) {
    console.error("Spray recommendation exception:", error.message || error);
    res.status(500).json(createErrorResponse("Failed to generate recommendation", "INTERNAL_SERVER_ERROR"));
  }
});

export default router;
