import { GoogleGenAI } from "@google/genai";

export const isGroqEnabled = () => !!process.env.GROQ_API_KEY;
export const isGeminiEnabled = () => !!process.env.GEMINI_API_KEY;

let genAI: GoogleGenAI | null = null;

export const initGemini = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAI;
};

export async function generateGroqChat(systemPrompt: string, userPrompt: string, isJson: boolean = false): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const fetchFn = (globalThis as any).fetch || fetch;
  const response = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      ...(isJson ? { response_format: { type: "json_object" } } : {})
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || "";
}

export async function generateGroqVision(systemPrompt: string, imageBase64: string, mimeType: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:${mimeType};base64,${imageBase64}`;

  const fetchFn = (globalThis as any).fetch || fetch;
  const response = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.2-11b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq Vision API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || "";
}
