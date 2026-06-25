import React, { useState } from 'react';
import { Tractor, MapPin, Search, Calendar, Star, Clock, Filter, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

type Equipment = {
  id: string;
  name: string;
  type: string;
  owner: string;
  pricePerHour: number;
  location: string;
  distance: string;
  rating: number;
  image: string;
  available: boolean;
};

const mockEquipment: Equipment[] = [];

export function MachineryScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  
  const filtered = mockEquipment.filter(eq => 
    (filter === 'All' || eq.type === filter) &&
    eq.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="p-4 flex items-center space-x-3 border-b border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center">
            <Tractor size={24} />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{t('machinery_title')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Peer-to-Peer Farm Equipment</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tractors, harvesters, drones..."
              className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-secondary/50 dark:text-white"
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
            {['All', 'Tractor', 'Harvester', 'Drone', 'Implement'].map(cat => (
              <button 
                key={cat}
                onClick={() => setFilter(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === cat ? 'bg-secondary text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {filtered.map(eq => (
          <motion.div 
            key={eq.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            <div className="h-40 relative">
              <img src={eq.image} alt={eq.name} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-lg">
                {eq.type}
              </div>
              <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-lg shadow-sm ${eq.available ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {eq.available ? 'Available Now' : 'Currently Rented'}
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg leading-tight">{eq.name}</h3>
                <div className="flex items-center text-sm font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-lg">
                  <Star size={14} className="mr-1 fill-amber-500" />
                  {eq.rating}
                </div>
              </div>
              
              <div className="space-y-1 mb-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <MapPin size={14} className="mr-2 opacity-70" />
                  <span>{eq.location} ({eq.distance})</span>
                </div>
                <div className="flex items-center">
                  <User2 size={14} className="mr-2 opacity-70" />
                  <span>Owner: {eq.owner}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <span className="text-xl font-bold text-gray-800 dark:text-gray-100">₹{eq.pricePerHour}</span>
                  <span className="text-secondary font-medium text-sm"> / hr</span>
                </div>
                <button 
                  disabled={!eq.available}
                  className={`px-6 py-2 rounded-xl font-bold text-sm shadow-sm transition-transform ${eq.available ? 'bg-secondary text-white hover:scale-105 active:scale-95' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                >
                  {eq.available ? 'Book Now' : 'Unavailable'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </main>
    </div>
  );
}

// Inline fallback for missing icon
function User2({ size = 24, className = "" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="5"></circle>
      <path d="M20 21a8 8 0 0 0-16 0"></path>
    </svg>
  );
}
