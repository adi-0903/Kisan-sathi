import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, CheckCircle2, X, Droplet, Trash2, Calendar, 
  Tag, Check, Milk, Award, AlertCircle, Sparkles, Pencil 
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useSyncState } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';

export function DairyScreen() {
  const { t } = useTranslation();
  
  const [cattle, setCattle] = useSyncState<any[]>('ks_cattle', []);
  const [milkLogs, setMilkLogs] = useSyncState<any[]>('ks_milk_logs', []);

  const [showAdd, setShowAdd] = useState(false);
  const [editCattle, setEditCattle] = useState<any | null>(null);
  const [tagId, setTagId] = useState('');
  const [breed, setBreed] = useState('');
  const [status, setStatus] = useState('Milking');
  
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];

  const [logDateInput, setLogDateInput] = useState(today);
  const [logAmountInput, setLogAmountInput] = useState('');

  const handleAddCattle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagId.trim()) return;
    
    const newCow = {
      id: tagId,
      breed: breed || 'Mixed',
      status,
      yield: status === 'Milking' ? '0.0L/day' : '-'
    };
    
    setCattle([newCow, ...cattle]);
    setShowAdd(false);
    setTagId('');
    setBreed('');
    setStatus('Milking');
  };

  const handleUpdateCattle = () => {
    if (!editCattle) return;
    
    // Auto-update yield calculation if status changes
    const isMilking = editCattle.status === 'Milking';
    let targetYield = editCattle.yield;
    
    if (!isMilking) {
      targetYield = '-';
    } else if (editCattle.yield === '-') {
      // Recalculate average from logs
      const cowLogs = milkLogs.filter(l => l.cattleId === editCattle.id);
      const avgYield = cowLogs.length ? (cowLogs.reduce((acc, curr) => acc + curr.amount, 0) / cowLogs.length).toFixed(1) : '0.0';
      targetYield = `${avgYield}L/day`;
    }

    const updatedCattle = {
      ...editCattle,
      yield: targetYield
    };

    setCattle(cattle.map(c => c.id === editCattle.id ? updatedCattle : c));
    setEditCattle(updatedCattle);
    
    // Show visual confirmation
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
    }, 1500);
  };

  const handleDeleteCattle = () => {
    if (!editCattle) return;
    if (window.confirm('Are you sure you want to remove this cattle from your herd? This will also delete all of their milk logs.')) {
      setCattle(cattle.filter(c => c.id !== editCattle.id));
      setMilkLogs(milkLogs.filter(l => l.cattleId !== editCattle.id));
      setEditCattle(null);
    }
  };

  const addLogToCattle = () => {
    if (!editCattle || !logAmountInput) return;
    
    let newLogs = [...milkLogs];
    const existingIndex = newLogs.findIndex(l => l.cattleId === editCattle.id && l.date === logDateInput);
    
    if (existingIndex >= 0) {
      newLogs[existingIndex] = { ...newLogs[existingIndex], amount: parseFloat(logAmountInput) };
    } else {
      newLogs.push({
        id: Date.now(),
        cattleId: editCattle.id,
        date: logDateInput,
        amount: parseFloat(logAmountInput)
      });
    }
    
    setMilkLogs(newLogs);
    
    const cowLogs = newLogs.filter(l => l.cattleId === editCattle.id);
    const avgYield = cowLogs.length ? (cowLogs.reduce((acc, curr) => acc + curr.amount, 0) / cowLogs.length).toFixed(1) : '0.0';
    
    const updatedCattle = { ...editCattle, yield: editCattle.status === 'Milking' ? `${avgYield}L/day` : '-' };
    setEditCattle(updatedCattle);
    setCattle(cattle.map(c => c.id === editCattle.id ? updatedCattle : c));
    
    setLogAmountInput('');
  };

  const deleteLog = (logId: number) => {
    if (!editCattle) return;
    const filteredLogs = milkLogs.filter(l => l.id !== logId);
    setMilkLogs(filteredLogs);

    const cowLogs = filteredLogs.filter(l => l.cattleId === editCattle.id);
    const avgYield = cowLogs.length ? (cowLogs.reduce((acc, curr) => acc + curr.amount, 0) / cowLogs.length).toFixed(1) : '0.0';
    
    const updatedCattle = { ...editCattle, yield: editCattle.status === 'Milking' ? `${avgYield}L/day` : '-' };
    setEditCattle(updatedCattle);
    setCattle(cattle.map(c => c.id === editCattle.id ? updatedCattle : c));
  };

  const aggregateMilkData = useMemo(() => {
    const days = 7;
    const data = [];
    const existingCattleIds = new Set(cattle.map(c => c.id));
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = milkLogs.filter(l => l.date === dateStr && existingCattleIds.has(l.cattleId));
      const total = dayLogs.reduce((acc, curr) => acc + curr.amount, 0);
      data.push({
        fullDate: dateStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' })[0],
        value: total
      });
    }
    return data;
  }, [milkLogs, cattle]);

  const todaysTotal = aggregateMilkData[aggregateMilkData.length - 1]?.value || 0;

  return (
    <div className="p-4 space-y-6">
      <header className="flex justify-between items-center py-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('dairy')}</h1>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-primary text-white p-2 rounded-full shadow-md hover:bg-primary-dark transition-colors active:scale-95"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Milk Log Card */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Herd Overview</h2>
        </div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-3xl font-light text-gray-800 dark:text-gray-100">{cattle.length} <span className="text-lg text-gray-400 dark:text-gray-500">Cattle</span></div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cattle.filter(c => c.status === 'Milking').length} Milking • {cattle.filter(c => c.status === 'Dry').length} Dry</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-light text-blue-600 dark:text-blue-400">{todaysTotal.toFixed(1)} <span className="text-sm text-blue-400 dark:text-blue-500">Liters</span></div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold">Today's Milk</div>
          </div>
        </div>

        {todaysTotal > 0 && (
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={aggregateMilkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMilk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-background)', color: 'var(--color-text)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}/>
                <Area type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorMilk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Cattle List */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-3">My Herd</h3>
        <div className="space-y-3">
          {cattle.map(c => (
            <div key={c.id} onClick={() => setEditCattle(c)} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-transform">
              <div>
                <div className="font-bold text-gray-800 dark:text-gray-200">Tag #{c.id}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.breed}</div>
              </div>
              <div className="text-right flex items-center justify-end space-x-3">
                <div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 inline-block rounded mb-1 ${c.status === 'Milking' ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {c.status}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{c.yield}</div>
                </div>
                {c.status === 'Milking' && !milkLogs.find(l => l.cattleId === c.id && l.date === today && l.amount > 0) && (
                  <button onClick={(e) => { e.stopPropagation(); setEditCattle(c); }} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                    <Droplet size={16} />
                  </button>
                )}
                {c.status === 'Milking' && milkLogs.find(l => l.cattleId === c.id && l.date === today && l.amount > 0) && (
                  <div className="p-2 text-green-500 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); setEditCattle(c); }}>
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>
            </div>
          ))}
          {cattle.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              No cattle added to herd.
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {editCattle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4 animate-fade-in"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl h-[90vh] sm:h-auto overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center space-x-2">
                  <Milk className="text-primary" size={22} />
                  <span>Cattle Details</span>
                </h2>
                <button onClick={() => setEditCattle(null)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Profile Details</h3>
                  
                  {/* Thematic Ear Tag Display */}
                  <div className="flex items-center space-x-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl">
                    <div className="bg-amber-400 text-amber-950 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center shadow-xs select-none">
                      <Tag size={13} className="mr-1" /> EAR TAG
                    </div>
                    <div>
                      <div className="text-lg font-black text-gray-800 dark:text-gray-100">#{editCattle.id}</div>
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium tracking-wide">Registered Cattle Identifier</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Breed (नस्ल)</label>
                      <input required value={editCattle.breed} onChange={e => setEditCattle({ ...editCattle, breed: e.target.value })} type="text" className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white text-sm" placeholder="e.g. HF, Murrah, Jersey" />
                    </div>
                    
                    {/* Segmented Button Selection for Status */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Status (स्थिति)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Milking', 'Dry', 'Pregnant'].map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setEditCattle({ ...editCattle, status: st })}
                            className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                              editCattle.status === st
                                ? 'bg-primary border-primary text-white shadow-xs'
                                : 'bg-gray-50 dark:bg-gray-700/40 border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleUpdateCattle} 
                    className={`w-full font-bold py-3.5 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center space-x-2 ${
                      showSavedFeedback 
                        ? 'bg-green-600 text-white' 
                        : 'bg-primary text-white hover:bg-primary-dark shadow-xs'
                    }`}
                  >
                    {showSavedFeedback ? (
                      <>
                        <Check size={18} />
                        <span>Saved Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Daily Milk Logs Section */}
                <div className="space-y-4 border-t border-gray-100 dark:border-gray-700/80 pt-5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center">
                      <Droplet size={13} className="mr-1" /> Daily Milk Log (दूध का रिकॉर्ड)
                    </h3>
                    <div className="text-[10px] text-gray-500 dark:text-gray-300 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Avg: {editCattle.yield}</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <input type="date" value={logDateInput} onChange={e => {
                        setLogDateInput(e.target.value);
                        const existing = milkLogs.find(l => l.cattleId === editCattle.id && l.date === e.target.value);
                        setLogAmountInput(existing ? existing.amount.toString() : '');
                    }} className="flex-[1.2] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/50 focus:outline-none dark:text-white [&::-webkit-calendar-picker-indicator]:dark:invert" />
                    <input type="number" step="0.1" value={logAmountInput} onChange={e => setLogAmountInput(e.target.value)} placeholder="0.0 Liters" className="flex-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/50 focus:outline-none dark:text-white" />
                    <button onClick={addLogToCattle} className="bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-white font-bold transition-all shadow-xs active:scale-95 flex items-center justify-center">
                      <Plus size={18} />
                    </button>
                  </div>
                  
                  {/* Highly polished List of logs with Delete Option */}
                  <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-2">
                     {milkLogs.filter(l => l.cattleId === editCattle.id).sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                       <div key={log.id} className="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-xs hover:border-gray-200 transition-colors">
                         <div className="flex items-center space-x-2">
                           <Calendar size={13} className="text-gray-400" />
                           <span className="font-semibold text-gray-700 dark:text-gray-300">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                         </div>
                         <div className="flex items-center space-x-3">
                           <span className="font-bold text-blue-600 dark:text-blue-400">{log.amount.toFixed(1)} L</span>
                           <button 
                             onClick={() => deleteLog(log.id)} 
                             className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                             title="Delete Log Entry"
                           >
                             <Trash2 size={13} />
                           </button>
                         </div>
                       </div>
                     ))}
                     {milkLogs.filter(l => l.cattleId === editCattle.id).length === 0 && (
                       <div className="text-center py-6 bg-gray-50/50 dark:bg-gray-800/20 border border-dashed border-gray-100 dark:border-gray-700/50 rounded-xl">
                         <Droplet className="mx-auto text-gray-300 dark:text-gray-600 mb-1" size={24} />
                         <div className="text-xs font-semibold text-gray-400">No milk logs recorded.</div>
                         <p className="text-[10px] text-gray-400 mt-0.5">Use the inputs above to log milk production.</p>
                       </div>
                     )}
                  </div>
                </div>

                {/* Danger Section */}
                <div className="border-t border-gray-100 dark:border-gray-700/50 pt-5 mt-4">
                  <button onClick={handleDeleteCattle} className="w-full flex items-center justify-center space-x-2 text-red-500 dark:text-red-400 text-sm font-bold p-3 hover:bg-red-50/80 dark:hover:bg-red-950/10 border border-dashed border-red-100 dark:border-red-950/30 rounded-xl transition-all">
                    <Trash2 size={14} />
                    <span>Remove Cattle from Herd</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

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
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center space-x-2">
                  <Plus className="text-primary" size={22} />
                  <span>Add New Cattle</span>
                </h2>
                <button onClick={() => setShowAdd(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddCattle} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tag ID * (टैग आईडी)</label>
                  <input required value={tagId} onChange={e => setTagId(e.target.value)} type="text" placeholder="e.g. 103" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Breed (नस्ल)</label>
                  <input value={breed} onChange={e => setBreed(e.target.value)} type="text" placeholder="e.g. HF, Murrah, Jersey" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Status (स्थिति)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Milking', 'Dry', 'Pregnant'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(st)}
                        className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${
                          status === st
                            ? 'bg-primary border-primary text-white shadow-xs'
                            : 'bg-gray-50 dark:bg-gray-700/40 border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 flex space-x-3">
                  <button type="button" onClick={() => setShowAdd(false)} className="w-1/2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-4 rounded-xl transition hover:bg-gray-200">
                    Cancel
                  </button>
                  <button type="submit" className="w-1/2 bg-primary text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-transform">
                    Save Cattle
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
