import { Router } from "express";
import { aiLimiter } from "../middleware/rateLimiter";
import { createErrorResponse } from "../utils/errors";
import { isGroqEnabled, isGeminiEnabled, initGemini, generateGroqChat, generateGroqVision } from "../services/ai";
import { getFallbackChatResponse, getFallbackVisionResponse } from "../services/fallbacks";

const router = Router();

// Chat API
router.post("/chat", aiLimiter, async (req, res) => {
  try {
    let { prompt, language, role } = req.body;
    
    // Sanitization
    if (typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json(createErrorResponse("Prompt must be a non-empty string.", "BAD_REQUEST"));
      return;
    }
    // Strip HTML
    prompt = prompt.replace(/<[^>]*>?/gm, '');
    prompt = prompt.trim();
    
    if (prompt.length > 2000) {
      res.status(400).json(createErrorResponse("Prompt exceeds the maximum length of 2000 characters.", "PAYLOAD_TOO_LARGE"));
      return;
    }

    const validLangs = ["English", "Hindi", "Punjabi"];
    if (!validLangs.includes(language)) {
      language = "English";
    }
    
    let systemPrompt = `You are KisanSaathi AI, a friendly agricultural assistant for Indian farmers. You help with crop advice, cattle health, weather interpretation, government schemes, and market prices. Always: 
1. Respond in the same language the farmer uses (Hindi, Punjabi, or English). The preferred language is currently: ${language}
2. Use simple, non-technical language a village farmer understands. 
3. Give practical, actionable advice specific to North India/Punjab. 
4. When recommending chemicals or medicines, mention generic names and suggest consulting a local agronomist or vet. 
5. Be warm, respectful, and encouraging. 
6. If you don't know something, say so honestly.`;

    if (role === 'consumer') {
      systemPrompt = `You are KisanSaathi Consumer Assistant, a friendly and passionate partner connecting urban and retail consumers with Indian farming produce. You help with discovering organic fruits/vegetables, explaining health benefits of regional crops (like millets and pulses), sharing recipes, and answering questions about local farm products. Always:
1. Respond in the same language the consumer uses (Hindi, Punjabi, or English). The preferred language is currently: ${language}
2. Use clear, delightful, everyday language.
3. Show strong respect and appreciation for farmers, and encourage consumers to support direct farm-to-consumer sustainability.
4. Keep the tone warm, welcoming, and inspiring.
5. If you do not know something, say so honestly.`;
    }

    let aiText = "";
    if (isGroqEnabled()) {
      try {
        aiText = await generateGroqChat(systemPrompt, prompt, false);
      } catch (groqError: any) {
        console.error("Groq Chat Error, falling back to Gemini:", groqError.message || groqError);
        if (isGeminiEnabled()) {
          try {
            const ai = initGemini();
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                systemInstruction: systemPrompt,
              }
            });
            aiText = response.text || "";
          } catch (geminiError: any) {
            console.error("Gemini fallback Chat Error, using agricultural offline templates:", geminiError);
            aiText = getFallbackChatResponse(prompt, language, role);
          }
        } else {
          aiText = getFallbackChatResponse(prompt, language, role);
        }
      }
    } else if (isGeminiEnabled()) {
      try {
        const ai = initGemini();
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
          }
        });
        aiText = response.text || "";
      } catch (geminiError: any) {
        console.error("Gemini Chat Error, using agricultural offline templates:", geminiError);
        aiText = getFallbackChatResponse(prompt, language, role);
      }
    } else {
      aiText = getFallbackChatResponse(prompt, language, role);
    }
    
    res.json({ response: aiText });

  } catch (error: any) {
    console.error("Chat API Error:", error.message || error);
    res.status(500).json(createErrorResponse("Failed to process chat request.", "INTERNAL_SERVER_ERROR"));
  }
});

// Vision API
router.post("/vision", aiLimiter, async (req, res) => {
  try {
    let { imageBase64, language, role } = req.body;
    
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json(createErrorResponse("Image payload is missing or invalid.", "BAD_REQUEST"));
      return;
    }
    
    // Calculate byte size (roughly)
    // Remove data:...;base64, prefix if present
    const match = imageBase64.match(/^data:image\/(jpeg|png|webp);base64,(.*)$/);
    let mimeType = "image/jpeg";
    let base64Data = imageBase64;
    
    if (match) {
      mimeType = `image/${match[1]}`;
      base64Data = match[2];
    } else if (imageBase64.includes("data:")) {
      res.status(400).json(createErrorResponse("Invalid image. Only JPEG, PNG, WebP under 4MB are accepted.", "UNSUPPORTED_MEDIA_TYPE"));
      return;
    }

    const byteLength = (base64Data.length * 3) / 4 - (base64Data.match(/==?$/) ? base64Data.match(/==?$/)![0].length : 0);
    if (byteLength > 4 * 1024 * 1024) {
      res.status(400).json(createErrorResponse("Invalid image. Only JPEG, PNG, WebP under 4MB are accepted.", "PAYLOAD_TOO_LARGE"));
      return;
    }
    
    let systemPrompt = `You are an agricultural expert. Analyse this crop image.
Identify: 1) Crop type 2) Disease or pest if any 3) Severity (mild/moderate/severe) 4) Recommended treatment in simple language.
Respond in JSON format: { "crop": "name", "disease": "name or none", "severity": "mild/moderate/severe/none", "treatment": "treatment steps", "prevention": "prevention tips" }. Output the values in ${language || 'English'}.`;

    if (role === 'consumer') {
      systemPrompt = `You are an expert on organic produce and Indian agriculture. Analyze this image of farm produce or food.
Identify: 1) Produce/Item name 2) Freshness/Quality indicators 3) Nutritional benefits 4) Suggested recipe or usage.
Respond in JSON format: { "crop": "name", "disease": "freshness status", "severity": "quality score out of 10", "treatment": "nutritional benefits", "prevention": "suggested recipe/usage" }. Output the values in ${language || 'English'}.`;
    }

    let parsed = {};
    if (isGroqEnabled()) {
      try {
        const aiText = await generateGroqVision(systemPrompt, base64Data, mimeType);
        parsed = JSON.parse(aiText || '{}');
      } catch (groqError: any) {
        console.error("Groq Vision Error, falling back to Gemini:", groqError.message || groqError);
        if (isGeminiEnabled()) {
          try {
            const ai = initGemini();
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                  }
                },
                systemPrompt
              ],
              config: {
                responseMimeType: "application/json",
              }
            });
            parsed = JSON.parse(response.text || '{}');
          } catch (geminiError: any) {
            console.error("Gemini fallback Vision Error, using local fallback:", geminiError);
            parsed = getFallbackVisionResponse(language, role);
          }
        } else {
          parsed = getFallbackVisionResponse(language, role);
        }
      }
    } else if (isGeminiEnabled()) {
      try {
        const ai = initGemini();
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            systemPrompt
          ],
          config: {
            responseMimeType: "application/json",
          }
        });
        parsed = JSON.parse(response.text || '{}');
      } catch (geminiError: any) {
        console.error("Gemini Vision Error, using local fallback:", geminiError);
        parsed = getFallbackVisionResponse(language, role);
      }
    } else {
      parsed = getFallbackVisionResponse(language, role);
    }
    
    res.json(parsed);

  } catch (error: any) {
    console.error("Vision API Error:", error.message || error);
    res.status(500).json(createErrorResponse("Failed to process vision request.", "INTERNAL_SERVER_ERROR"));
  }
});

export default router;
