import React, { useEffect, useState } from 'react';
import { fetchMarketPrices } from '../lib/api';
import { TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function MarketScreen() {
  const [prices, setPrices] = useState<any[]>([]);

  useEffect(() => {
    fetchMarketPrices().then(setPrices);
  }, []);

  const expenseData = [
    { name: 'Seed', value: 4000 },
    { name: 'Fert', value: 8000 },
    { name: 'Labor', value: 6500 },
    { name: 'Machine', value: 12000 }
  ];

  return (
    <div className="p-4 space-y-6">
      <header className="py-2">
        <h1 className="text-2xl font-bold text-gray-800">Market & Finance</h1>
      </header>

      <section>
        <h2 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-3">Live Mandi Prices (₹/Qtl)</h2>
        <div className="space-y-3">
          {Array.isArray(prices) && prices.length > 0 ? prices.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{item.crop}</h3>
                <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                  <MapPin size={12} />
                  <span>{item.mandi}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-800">₹{item.today}</div>
                <div className={`flex items-center justify-end space-x-1 text-xs font-semibold ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{Math.abs(item.change)}%</span>
                </div>
              </div>
            </div>
          )) : (
             <div className="text-sm text-gray-500 py-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
               Loading or Live Prices failed to load...
             </div>
          )}
        </div>
      </section>

      <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-4">Season Expenses</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={expenseData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="value" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
