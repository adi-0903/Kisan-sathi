import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Truck, MapPin, Calendar, Scale, ChevronRight, Star, ShieldCheck, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface Vehicle {
  id: string;
  type: string;
  capacity: string;
  driver: string;
  rating: number;
  trips: number;
  eta: string;
  priceEst: string;
  verified: boolean;
}

const MOCK_VEHICLES: Vehicle[] = [
  { id: '1', type: 'Mini Truck (Tata Ace)', capacity: 'Up to 1.5 Tons', driver: 'Ramesh K.', rating: 4.8, trips: 342, eta: '45 mins', priceEst: '₹800 - ₹1,200', verified: true },
  { id: '2', type: 'Pickup Truck (Bolero)', capacity: 'Up to 2.5 Tons', driver: 'Suresh S.', rating: 4.6, trips: 156, eta: '1 hr 15 mins', priceEst: '₹1,500 - ₹2,000', verified: true },
  { id: '3', type: 'Heavy Truck (Eicher)', capacity: 'Up to 5 Tons', driver: 'Baljit Singh', rating: 4.9, trips: 890, eta: '2 hrs', priceEst: '₹3,500 - ₹4,500', verified: true },
];

export function LogisticsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'results'>('form');

  // Form state
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [date, setDate] = useState('');
  const [weight, setWeight] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (pickup && dropoff && weight) {
      setStep('results');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-safe">
      <header className="bg-white dark:bg-gray-800 px-5 pt-12 pb-4 shadow-sm z-10 sticky top-0">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => step === 'results' ? setStep('form') : navigate(-1)} 
            className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('logistics_title')}</h1>
        </div>
      </header>

      <div className="flex-1 p-5">
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-5 flex items-center">
                  <Truck className="mr-2 text-primary" size={20} />
                  Book a Vehicle
                </h2>
                
                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Location</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin size={18} className="text-emerald-500" />
                      </div>
                      <input
                        required
                        type="text"
                        value={pickup}
                        onChange={e => setPickup(e.target.value)}
                        placeholder="Farm address / Village"
                        className="block w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Drop-off Location</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin size={18} className="text-red-500" />
                      </div>
                      <input
                        required
                        type="text"
                        value={dropoff}
                        onChange={e => setDropoff(e.target.value)}
                        placeholder="Mandi / Warehouse"
                        className="block w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar size={18} className="text-gray-400" />
                        </div>
                        <input
                          required
                          type="date"
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          className="block w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Est. Weight</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Scale size={18} className="text-gray-400" />
                        </div>
                        <input
                          required
                          type="number"
                          placeholder="e.g. 1.5"
                          value={weight}
                          onChange={e => setWeight(e.target.value)}
                          className="block w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm font-medium">Tons</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 mt-4 bg-primary text-white font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center justify-center space-x-2"
                  >
                    <span>Find Available Trucks</span>
                    <ChevronRight size={20} />
                  </button>
                </form>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 p-4 rounded-2xl flex items-start space-x-3 text-amber-800 dark:text-amber-200">
                <ShieldCheck size={24} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm mb-1">Secure Transport Guarantee</h4>
                  <p className="text-xs opacity-90">All verified drivers carry basic goods insurance up to ₹50,000 against transit damage.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Pickup</span>
                  <span className="font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{pickup}</span>
                </div>
                <div className="px-2 text-gray-300">→</div>
                <div className="flex flex-col text-right">
                  <span className="text-gray-500 font-medium">Drop</span>
                  <span className="font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{dropoff}</span>
                </div>
              </div>

              <h3 className="font-bold text-gray-800 dark:text-white mt-6 mb-2">Available Vehicles ({MOCK_VEHICLES.length})</h3>

              {MOCK_VEHICLES.map((v, idx) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-5 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{v.type}</h4>
                      <p className="text-sm text-primary font-medium">{v.capacity}</p>
                    </div>
                    <div className="bg-primary/10 p-2 text-primary rounded-xl">
                      <Truck size={24} />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 mb-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-2 font-bold text-gray-600 dark:text-gray-300 uppercase">
                        {v.driver.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center">
                          {v.driver}
                          {v.verified && <ShieldCheck size={14} className="ml-1 text-blue-500" />}
                        </p>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <Star size={12} className="text-amber-400 fill-current" />
                          <span className="text-xs font-bold">{v.rating}</span>
                          <span className="text-xs opacity-70">({v.trips} trips)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 mb-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <ClockIcon size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">ETA: <span className="font-bold text-gray-900 dark:text-white">{v.eta}</span></span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Estimated Fare</p>
                      <p className="font-bold text-lg text-gray-900 dark:text-white">{v.priceEst}</p>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button className="flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 transition-colors">
                      <Phone size={20} />
                    </button>
                    <button className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
                      Book Now
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ClockIcon({ size = 24, className = "" }: { size?: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
