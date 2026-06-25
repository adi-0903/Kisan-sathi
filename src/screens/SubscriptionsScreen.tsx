import React, { useState, useEffect } from 'react';
import { Package, Calendar, CheckCircle, Leaf, ShieldCheck, Truck, Milk, Heart, Activity, Sprout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dbClient } from '../lib/dbClient';
import { useAuth } from '../lib/AuthContext';
import { useSyncState, useGlobalSyncState } from '../lib/store';

export function SubscriptionsScreen() {
  const [activeTab, setActiveTab] = useState<'plans' | 'active' | 'sponsorships'>('plans');
  const [mySubs, setMySubs] = useState<any[]>([]);
  const { user } = useAuth();
  
  const [allCrops] = useGlobalSyncState<any[]>('_ks_crops', []);
  const [allCattle] = useGlobalSyncState<any[]>('_ks_cattle', []);
  
  const availableCrops = allCrops.filter(c => c.isSponsored);
  const availableCattle = allCattle.filter(c => c.isSponsored);

  useEffect(() => {
    if (!user) return;
    const unsub = dbClient.subscribe('subscriptions', [{ field: 'consumerId', op: '==', value: user.uid }], (items) => {
      setMySubs(items);
    });
    return () => unsub();
  }, [user]);

  const handleSubscribe = async (plan: any) => {
    if (!user) return;
    try {
      await dbClient.add('subscriptions', {
        consumerId: user.uid,
        planId: plan.id,
        title: plan.title,
        price: plan.price,
        interval: plan.interval,
        status: 'Active',
        type: 'Plan',
        nextDelivery: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
        createdAt: new Date().toISOString()
      });
      alert('Successfully Subscribed!');
      setActiveTab('active');
    } catch (e) {
      console.error("Subscription Error:", e);
      alert('Failed to subscribe');
    }
  };

  const handleSponsor = async (asset: any, type: 'Crop' | 'Cow') => {
    if (!user) return;
    try {
      await dbClient.add('subscriptions', {
        consumerId: user.uid,
        planId: asset.id,
        title: `Adopted ${type}: ${asset.name || asset.breed}`,
        price: asset.sponsorshipPrice,
        interval: type === 'Cow' ? 'year' : 'season',
        status: 'Active',
        type: 'Sponsorship',
        assetType: type,
        assetId: asset.id,
        nextDelivery: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
        createdAt: new Date().toISOString()
      });
      alert('Successfully Adopted!');
      setActiveTab('active');
    } catch (e) {
      console.error("Sponsorship Error:", e);
      alert('Failed to sponsor');
    }
  };

  const plans = [
    {
      id: 'p1',
      title: 'Monthly Subscription',
      desc: 'Order up to 15 quintal of any fresh farm produce directly from farmers.',
      price: 1999,
      interval: 'month',
      icon: Package,
      color: 'emerald'
    },
    {
      id: 'p2',
      title: 'Yearly Subscription',
      desc: 'Order up to 30 quintal of any fresh farm produce throughout the entire year.',
      price: 19999,
      interval: 'year',
      icon: Calendar,
      color: 'blue'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <header className="bg-gradient-to-br from-[#064E3B] to-[#047857] shadow-xl text-white rounded-b-[28px] overflow-hidden relative p-5 pt-8 pb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-200 bg-white/10 px-2.5 py-1 rounded-full">Auto-Deliveries</span>
          <h1 className="text-2xl font-black tracking-tight mt-3">Farm Subscriptions</h1>
          <p className="text-xs text-emerald-100 mt-1 opacity-90">Set it and forget it. Pure farm essentials delivered on schedule.</p>
          
          <div className="flex bg-black/15 backdrop-blur-md rounded-2xl p-1 mt-5 border border-white/10 shadow-inner">
            <button 
              onClick={() => setActiveTab('plans')}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === 'plans' ? 'bg-white text-emerald-900 shadow-md transform scale-[1.01]' : 'text-emerald-100 hover:text-white'}`}
            >
              Plans
            </button>
            <button 
              onClick={() => setActiveTab('sponsorships')}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === 'sponsorships' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md transform scale-[1.01]' : 'text-emerald-100 hover:text-white'}`}
            >
              <Heart size={12} className={activeTab === 'sponsorships' ? 'text-white' : ''} /> Adopt
            </button>
            <button 
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === 'active' ? 'bg-white text-emerald-900 shadow-md transform scale-[1.01]' : 'text-emerald-100 hover:text-white'}`}
            >
              Active Subs
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {activeTab === 'plans' ? (
          <div className="space-y-4">
            {plans.map((plan, idx) => {
              const Icon = plan.icon;
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  key={plan.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-${plan.color}-500/5 rounded-bl-[100px] z-0`} />
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-3 bg-${plan.color}-50 text-${plan.color}-600 rounded-2xl border border-${plan.color}-100`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg leading-tight">{plan.title}</h3>
                        <p className="text-[10px] text-gray-500 font-bold tracking-wide uppercase mt-0.5"><ShieldCheck size={10} className="inline mr-1 text-emerald-500" />Certified Organic</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-4 font-medium leading-relaxed">{plan.desc}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div>
                        <div className="text-xl font-black text-emerald-800">₹{plan.price}<span className="text-[10px] font-normal text-gray-500 ml-0.5">/{plan.interval}</span></div>
                      </div>
                      <button 
                        onClick={() => handleSubscribe(plan)}
                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 hover:scale-105 transition-transform"
                      >
                        Subscribe
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : activeTab === 'sponsorships' ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-tr from-amber-100 to-orange-50 rounded-3xl p-5 border border-amber-200">
              <h2 className="text-lg font-black text-amber-900 leading-tight">Direct Farm Sponsorships</h2>
              <p className="text-xs text-amber-800 mt-1.5 font-medium leading-relaxed">Turn your passive buying into an active partnership. Sponsor a dairy cow or fruit tree to get real-time health updates and guaranteed shares of the harvest delivered fresh.</p>
            </div>

            <div>
              <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><Milk size={16} className="text-blue-500"/> Sponsor a Cow</h3>
              <div className="grid grid-cols-2 gap-3">
                {availableCattle.map((cow, idx) => (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} key={cow.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1.5">
                      <span className="bg-blue-50 text-blue-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">{cow.status}</span>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2 border border-blue-100"><Milk size={20}/></div>
                    <h4 className="font-bold text-gray-800 text-sm">Tag #{cow.id}</h4>
                    <p className="text-[10px] text-gray-500 mb-2">{cow.breed}</p>
                    <div className="text-sm font-black text-amber-700 mb-2">₹{cow.sponsorshipPrice}<span className="text-[9px] font-normal text-gray-500 ml-0.5">/yr</span></div>
                    <button onClick={() => handleSponsor(cow, 'Cow')} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[10px] py-1.5 rounded-lg hover:shadow-md transition-all active:scale-95">Adopt Cow</button>
                  </motion.div>
                ))}
                {availableCattle.length === 0 && <div className="col-span-2 text-center text-xs text-gray-500 py-6 bg-gray-50 rounded-2xl">No cows currently available for adoption.</div>}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-1.5"><Sprout size={16} className="text-green-500"/> Adopt a Crop / Tree</h3>
              <div className="grid grid-cols-2 gap-3">
                {availableCrops.map((crop, idx) => (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} key={crop.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1.5">
                      <span className="bg-green-50 text-green-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">{crop.health}</span>
                    </div>
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-2 border border-green-100"><Leaf size={20}/></div>
                    <h4 className="font-bold text-gray-800 text-sm truncate">{crop.name}</h4>
                    <p className="text-[10px] text-gray-500 mb-2 truncate">{crop.variety}</p>
                    <div className="text-sm font-black text-amber-700 mb-2">₹{crop.sponsorshipPrice}<span className="text-[9px] font-normal text-gray-500 ml-0.5">/season</span></div>
                    <button onClick={() => handleSponsor(crop, 'Crop')} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[10px] py-1.5 rounded-lg hover:shadow-md transition-all active:scale-95">Adopt Crop</button>
                  </motion.div>
                ))}
                {availableCrops.length === 0 && <div className="col-span-2 text-center text-xs text-gray-500 py-6 bg-gray-50 rounded-2xl">No crops currently available for adoption.</div>}
              </div>
            </div>
          </div>
        ) : mySubs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
            <Calendar size={44} className="mx-auto text-gray-300 mb-3" />
            <h3 className="font-bold text-gray-800">No Active Subscriptions</h3>
            <p className="text-xs text-gray-500 mt-1 mb-6 leading-relaxed">You haven't subscribed to any regular farm deliveries yet. Secure your daily organic supplies!</p>
            <button 
              onClick={() => setActiveTab('plans')} 
              className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-emerald-100 transition-colors shadow-sm border border-emerald-100"
            >
              Browse Plans
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {mySubs.map((sub, idx) => {
              if (sub.type === 'Sponsorship') {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={sub.id}
                    className="bg-white rounded-3xl shadow-sm border-2 border-amber-300 relative overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-3 flex justify-between items-center text-white">
                      <div className="flex items-center gap-2">
                        <Heart size={16} fill="white" className="animate-pulse" />
                        <span className="font-black text-sm">{sub.title}</span>
                      </div>
                      <span className="bg-white/20 text-white text-[9px] font-black uppercase px-2 py-1 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm">
                        <CheckCircle size={10} /> {sub.status}
                      </span>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xl font-black text-amber-900">₹{sub.price}<span className="text-[10px] font-normal text-gray-500 ml-0.5">/{sub.interval}</span></div>
                        <div className="text-right">
                          <div className="text-[10px] text-gray-400 font-bold uppercase">Asset ID</div>
                          <div className="text-xs font-black text-gray-800">#{sub.assetId}</div>
                        </div>
                      </div>
                      
                      {/* Premium Real-time Stats Mock */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex flex-col items-center justify-center text-center">
                          <Activity size={16} className="text-blue-500 mb-1" />
                          <div className="text-[9px] font-bold text-gray-500 uppercase">Live Health</div>
                          <div className="text-xs font-black text-blue-700">Excellent</div>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex flex-col items-center justify-center text-center">
                          {sub.assetType === 'Cow' ? <Milk size={16} className="text-emerald-500 mb-1" /> : <Sprout size={16} className="text-emerald-500 mb-1" />}
                          <div className="text-[9px] font-bold text-gray-500 uppercase">Recent Yield</div>
                          <div className="text-xs font-black text-emerald-700">{sub.assetType === 'Cow' ? '12.4 L/day' : 'Growing Phase'}</div>
                        </div>
                      </div>

                      <div className="bg-orange-50/50 rounded-2xl p-3 border border-orange-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-600 border border-orange-100">
                          <Truck size={18} />
                        </div>
                        <div>
                          <div className="text-[10px] text-orange-800 font-bold uppercase tracking-wider">Next Harvest Share Delivery</div>
                          <div className="text-xs font-black text-gray-900 mt-0.5">
                            {new Date(sub.nextDelivery).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={sub.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3">
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <CheckCircle size={10} className="text-emerald-500" /> {sub.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">{sub.title}</h3>
                  <div className="text-xl font-black text-emerald-800 mt-1 mb-4">₹{sub.price}<span className="text-[10px] font-normal text-gray-500 ml-0.5">/{sub.interval}</span></div>
                  
                  <div className="bg-emerald-50/50 rounded-2xl p-3 border border-emerald-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600">
                      <Truck size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Next Delivery</div>
                      <div className="text-xs font-black text-gray-800 mt-0.5">
                        {new Date(sub.nextDelivery).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
