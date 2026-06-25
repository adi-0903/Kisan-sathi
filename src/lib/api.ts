export const fetchChatResponse = async (prompt: string, language: string, role?: string) => {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, language, role })
  });
  if (!res.ok) throw new Error("Failed to fetch response");
  const data = await res.json();
  return data.text;
};

export const fetchVisionDiagnosis = async (imageBase64: string, language: string) => {
  const res = await fetch("/api/vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, language })
  });
  if (!res.ok) throw new Error("Failed to parse image");
  return res.json();
};

export const fetchWeather = async () => {
  const res = await fetch("/api/weather");
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch weather");
  }
  return res.json();
};

export const fetchSprayRecommendation = async (forecastData: any) => {
  const res = await fetch("/api/weather/spray-recommendation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ forecastData })
  });
  if (!res.ok) throw new Error("Failed to fetch spray recommendation");
  return res.json();
};

export const fetchMarketPrices = async () => {
  const res = await fetch("/api/market");
  return res.json();
};
