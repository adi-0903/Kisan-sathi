import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot } from '../lib/firebase';
import { MapPin, User as UserIcon, ShieldCheck, Leaf, Search, Star, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export function FarmerDirectoryScreen() {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // For demo purposes, we fetch all users who are NOT consumers
    // In a real app, we might have a specific 'verified_farmers' collection or flag
    const q = query(collection(db, 'users'), where('role', '!=', 'consumer'));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFarmers(fetched);
    });
    return () => unsub();
  }, []);

  const filteredFarmers = farmers.filter(f => 
    f.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.village?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gradient-to-br from-[#064E3B] to-[#047857] shadow-xl text-white rounded-b-[28px] overflow-hidden relative p-5 pt-8 pb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-200 bg-white/10 px-2.5 py-1 rounded-full">Community</span>
          <h1 className="text-2xl font-black tracking-tight mt-3">Local Producers</h1>
          <p className="text-xs text-emerald-100 mt-1 opacity-90">Meet the hands that feed the nation. Genuine, verified farmers.</p>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search farmers by name or district..."
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        <div className="space-y-4">
          {filteredFarmers.map((farmer, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={farmer.id || idx} 
              className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-black text-lg uppercase shadow-inner border border-emerald-200">
                    {farmer.name?.charAt(0) || 'F'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-1.5">{farmer.name} 
                      {farmer.certified !== false && <ShieldCheck size={14} className="text-emerald-500" />}
                    </h3>
                    <p className="text-[10px] text-gray-500 flex items-center mt-0.5 font-medium"><MapPin size={10} className="mr-0.5 text-gray-400" /> {farmer.village || 'Local Region'}</p>
                  </div>
                </div>
                <div className="flex items-center bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-black border border-amber-100">
                  <Star size={12} className="mr-0.5 fill-current text-amber-500" /> {farmer.rating || '4.8'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100 flex items-center justify-center space-x-1.5">
                  <Leaf size={14} className="text-emerald-600" />
                  <span className="text-xs font-bold text-gray-700">{farmer.landSize || 'Small-scale'} Acres</span>
                </div>
                <button className="bg-emerald-50 text-emerald-700 p-2.5 rounded-2xl border border-emerald-100 flex items-center justify-center font-bold text-xs hover:bg-emerald-100 transition-colors">
                  <MessageSquare size={14} className="mr-1.5" /> Message
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
