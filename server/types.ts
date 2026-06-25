export interface ErrorResponse {
  error: string;
  code: string;
  timestamp: string;
}

export interface WeatherForecast {
  day: string;
  date: string;
  temp: number;
  main: string;
  condition: string;
  description: string;
  windSpeed: number;
  rainProb: number;
  icon: string;
}

export interface AIResponse {
  text?: string;
  crop?: string;
  disease?: string;
  severity?: string;
  treatment?: string;
  prevention?: string;
}

export interface MarketPrice {
  crop: string;
  today: number;
  yesterday: number;
  change: number;
  mandi: string;
}
