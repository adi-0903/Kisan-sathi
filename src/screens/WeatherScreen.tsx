import React, { useEffect, useState } from 'react';
import { ChevronLeft, CloudRain, Wind, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchWeather, fetchSprayRecommendation } from '../lib/api';

export function WeatherScreen() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [sprayRec, setSprayRec] = useState<any>(null);

  useEffect(() => {
    fetchWeather().then(d => {
      setData(d);
      fetchSprayRecommendation(d.forecast).then(setSprayRec);
    });
  }, []);

  if (!data) return <div className="p-8 text-center">Loading weather...</div>;

  return (
    <div className="min-h-screen bg-accent text-white p-4">
      <header className="flex items-center mb-8">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 rounded-full bg-white/20 backdrop-blur-sm">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Weather Forecast</h1>
      </header>

      <div className="text-center mb-12">
        {data.condition === 'Clear' || data.condition === 'Sunny' ? (
          <Sun size={80} className="mx-auto mb-4 text-yellow-300" />
        ) : data.condition === 'Clouds' || data.condition === 'Cloudy' ? (
          <CloudRain size={80} className="mx-auto mb-4 text-gray-300" />
        ) : (
          <CloudRain size={80} className="mx-auto mb-4 text-blue-300" />
        )}
        <div className="text-6xl font-light tracking-tighter mb-2">{data.temp}°<span className="text-3xl text-white/70">C</span></div>
        <div className="text-xl font-medium">{data.condition}</div>
        <div className="text-sm text-white/70 mt-1">Ludhiana, Punjab</div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl flex flex-col items-center">
          <CloudRain size={24} className="mb-2 text-blue-200" />
          <div className="text-sm font-bold">{data.rainProb}%</div>
          <div className="text-[10px] text-white/70 uppercase tracking-widest mt-1">Rain</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl flex flex-col items-center">
          <Wind size={24} className="mb-2 text-blue-200" />
          <div className="text-sm font-bold">{data.windSpeed} km/h</div>
          <div className="text-[10px] text-white/70 uppercase tracking-widest mt-1">Wind</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl flex flex-col items-center">
          <DropletIcon humidity={data.humidity} />
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 mb-4">
        <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest mb-4">AI Suggestion</h3>
        {sprayRec ? (
          <p className="text-sm leading-relaxed">
            {sprayRec.reasoning}
          </p>
        ) : (
          <p className="text-sm leading-relaxed opacity-70">
            Analyzing weather data...
          </p>
        )}
      </div>

      {data.forecast && data.forecast.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6">
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest mb-4">5-Day Forecast</h3>
          <div className="space-y-4">
            {data.forecast.map((day: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="w-12 font-medium">{day.day}</span>
                <div className="flex-1 flex justify-center">
                  {day.icon ? (
                    <img src={`https://openweathermap.org/img/wn/${day.icon}.png`} alt={day.condition} className="w-8 h-8 drop-shadow-sm brightness-0 invert" />
                  ) : (
                    <CloudRain size={20} className="text-white/80" />
                  )}
                </div>
                <div className="w-24 text-right flex items-center justify-end space-x-2">
                  <span className="text-[10px] text-blue-200">{day.rainProb}% rain</span>
                  <span className="font-bold">{day.temp}°C</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DropletIcon({ humidity }: { humidity: number }) {
  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-blue-200"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
      <div className="text-sm font-bold">{humidity}%</div>
      <div className="text-[10px] text-white/70 uppercase tracking-widest mt-1">Humidity</div>
    </>
  );
}
