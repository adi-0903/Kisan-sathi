import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf, Plus, Calendar, Ruler, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSyncState } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';

export function CropsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [crops, setCrops] = useSyncState('ks_crops', []);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [area, setArea] = useState('');
  const [sown, setSown] = useState('');
  
  // Sponsorship fields
  const [isSponsored, setIsSponsored] = useState(false);
  const [sponsorshipPrice, setSponsorshipPrice] = useState('');

  const handleAddCrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sown.trim()) return;
    
    // Parse the date to a nice string if possible
    let displaySown = sown;
    try {
      const d = new Date(sown);
      if (!isNaN(d.getTime())) {
        displaySown = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch(e) {}

    const newCrop = {
      id: Date.now(),
      name,
      variety: variety || 'Standard',
      sown: displaySown,
      area: area ? `${area} Acres` : '1 Acre',
      health: 'Healthy',
      progress: 0,
      color: 'bg-green-500',
      isSponsored,
      sponsorshipPrice: isSponsored ? (sponsorshipPrice || '5000') : null
    };
    
    setCrops([newCrop, ...crops]);
    setShowAdd(false);
    setName('');
    setVariety('');
    setArea('');
    setSown('');
    setIsSponsored(false);
    setSponsorshipPrice('');
  };

  return (
    <div className="p-4 space-y-6">
      <header className="flex justify-between items-center py-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('crops')}</h1>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-primary hover:bg-primary-dark transition-colors text-white p-2 rounded-full shadow-md active:scale-95"
        >
          <Plus size={20} />
        </button>
      </header>

      <div className="space-y-4">
        {crops.map(crop => (
          <div key={crop.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform cursor-pointer" onClick={() => navigate(`/crops/${crop.id}`)}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700/50 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center text-primary dark:text-primary-light">
                  <Leaf size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{crop.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{crop.variety}</p>
                </div>
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border ${crop.health === 'Healthy' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800/30' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800/30'}`}>
                {crop.health}
              </span>
            </div>

            {crop.isSponsored && (
              <div className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-700/30 flex items-center justify-between">
                <div className="flex items-center text-amber-700 dark:text-amber-400">
                  <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Available for Adoption
                  </span>
                </div>
                <div className="text-xs font-black text-amber-800 dark:text-amber-300">₹{crop.sponsorshipPrice}/season</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Calendar size={16} className="text-gray-400" />
                <span>Sown: {crop.sown}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Ruler size={16} className="text-gray-400" />
                <span>{crop.area}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium text-gray-600 dark:text-gray-400">
                <span>Growth Stage</span>
                <span>{crop.progress}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${crop.color}`} style={{ width: `${crop.progress}%` }}></div>
              </div>
            </div>
          </div>
        ))}
        {crops.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <Leaf className="mx-auto text-gray-300 mb-2" size={48} />
            <p>No crops added yet.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl h-[85vh] sm:h-auto overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add New Crop</h2>
                <button onClick={() => setShowAdd(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddCrop} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Crop Name *</label>
                  <input required value={name} onChange={e => setName(e.target.value)} type="text" placeholder="e.g. Wheat" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Variety</label>
                  <input value={variety} onChange={e => setVariety(e.target.value)} type="text" placeholder="e.g. HD 3226" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Sown Date *</label>
                  <input required value={sown} onChange={e => setSown(e.target.value)} type="date" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white [&::-webkit-calendar-picker-indicator]:dark:invert" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Area (Acres)</label>
                  <input value={area} onChange={e => setArea(e.target.value)} type="number" step="0.1" placeholder="e.g. 5" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white" />
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200/50 dark:border-amber-700/30 space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-amber-900 dark:text-amber-400">Adopt-a-Crop</h4>
                      <p className="text-[10px] text-amber-700 dark:text-amber-500 mt-0.5">Let consumers sponsor this crop directly</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={isSponsored} onChange={e => setIsSponsored(e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                  
                  {isSponsored && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="block text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">Sponsorship Price (₹ per season)</label>
                      <input value={sponsorshipPrice} onChange={e => setSponsorshipPrice(e.target.value)} type="number" placeholder="e.g. 5000" className="w-full bg-white dark:bg-gray-700 border border-amber-200 dark:border-amber-600/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/50 focus:outline-none dark:text-white text-sm" />
                    </motion.div>
                  )}
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-transform">
                    Save Crop
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
