import React, { useState } from 'react';
import { Users, UserPlus, HardHat, DollarSign, Calendar, Clock, CheckCircle2, MoreVertical, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useSyncState } from '../lib/store';

type Worker = {
  id: string;
  name: string;
  role: string;
  dailyWage: number;
  phone: string;
};

type Attendance = {
  id: string;
  workerId: string;
  date: string;
  status: 'Present' | 'Half-day' | 'Absent';
  paid: boolean;
};

export function LaborScreen() {
  const { t } = useTranslation();
  const [workers, setWorkers] = useSyncState<Worker[]>('ks_labor_workers', []);
  const [attendance, setAttendance] = useSyncState<Attendance[]>('ks_labor_attendance', []);

  const [activeTab, setActiveTab] = useState<'workers' | 'attendance' | 'payouts'>('attendance');
  const [showAddWorker, setShowAddWorker] = useState(false);

  // Add Worker Form State
  const [newWorker, setNewWorker] = useState({ name: '', role: '', dailyWage: '', phone: '' });

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorker.name || !newWorker.dailyWage) return;

    setWorkers([...workers, {
      id: Date.now().toString(),
      name: newWorker.name,
      role: newWorker.role,
      dailyWage: parseFloat(newWorker.dailyWage),
      phone: newWorker.phone
    }]);
    setNewWorker({ name: '', role: '', dailyWage: '', phone: '' });
    setShowAddWorker(false);
  };

  const today = new Date().toISOString().split('T')[0];

  const markAttendance = (workerId: string, status: 'Present' | 'Half-day' | 'Absent') => {
    const existingIndex = attendance.findIndex(a => a.workerId === workerId && a.date === today);
    if (existingIndex >= 0) {
      const updated = [...attendance];
      updated[existingIndex].status = status;
      setAttendance(updated);
    } else {
      setAttendance([...attendance, {
        id: Date.now().toString(),
        workerId,
        date: today,
        status,
        paid: false
      }]);
    }
  };

  const getAttendanceStatus = (workerId: string) => {
    return attendance.find(a => a.workerId === workerId && a.date === today)?.status;
  };

  const calculateUnpaid = (workerId: string) => {
    const records = attendance.filter(a => a.workerId === workerId && !a.paid && a.status !== 'Absent');
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return 0;

    let total = 0;
    records.forEach(r => {
      if (r.status === 'Present') total += worker.dailyWage;
      if (r.status === 'Half-day') total += worker.dailyWage / 2;
    });
    return total;
  };

  const processPayout = (workerId: string) => {
    setAttendance(attendance.map(a => 
      a.workerId === workerId ? { ...a, paid: true } : a
    ));
    alert("Payout processed and logged in Finance!");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center space-x-2">
          <HardHat className="text-secondary" />
          <span>{t('labor_title')}</span>
        </div>
        <div className="flex px-4 py-2 space-x-4 overflow-x-auto text-sm no-scrollbar">
          {(['attendance', 'workers', 'payouts'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 whitespace-nowrap font-medium transition-colors border-b-2 ${activeTab === tab ? 'border-secondary text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-4">
        <AnimatePresence mode="wait">
          
          {/* TODAY'S ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <div>
                  <h3 className="font-bold text-blue-900 dark:text-blue-100">Today's Attendance</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm font-bold text-blue-600 dark:text-blue-400">
                  {attendance.filter(a => a.date === today && a.status === 'Present').length} / {workers.length} Present
                </div>
              </div>

              {workers.map(worker => {
                const status = getAttendanceStatus(worker.id);
                return (
                  <div key={worker.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{worker.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{worker.role}</p>
                      </div>
                      <div className="text-right text-sm">
                        <span className="font-bold text-gray-800 dark:text-gray-200">₹{worker.dailyWage}</span>
                        <span className="text-gray-500 dark:text-gray-400">/day</span>
                      </div>
                    </div>
                    
                    <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                      <button 
                        onClick={() => markAttendance(worker.id, 'Present')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${status === 'Present' ? 'bg-emerald-500 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                      >
                        Present
                      </button>
                      <button 
                        onClick={() => markAttendance(worker.id, 'Half-day')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors border-x border-gray-200 dark:border-gray-600 ${status === 'Half-day' ? 'bg-amber-500 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}
                      >
                        Half-day
                      </button>
                      <button 
                        onClick={() => markAttendance(worker.id, 'Absent')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${status === 'Absent' ? 'bg-red-500 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* WORKERS DIRECTORY TAB */}
          {activeTab === 'workers' && (
            <motion.div
              key="workers"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <button 
                onClick={() => setShowAddWorker(true)}
                className="w-full bg-secondary/10 hover:bg-secondary/20 dark:bg-secondary/20 dark:hover:bg-secondary/30 text-secondary dark:text-secondary-light border border-secondary/20 dark:border-secondary/30 border-dashed rounded-xl p-4 flex items-center justify-center space-x-2 font-bold transition-colors"
              >
                <UserPlus size={20} />
                <span>Add New Worker</span>
              </button>

              {workers.map(worker => (
                <div key={worker.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <Users size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 dark:text-gray-100">{worker.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{worker.role}</p>
                    {worker.phone && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{worker.phone}</p>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800 dark:text-gray-200">₹{worker.dailyWage}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">per day</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* PAYOUTS TAB */}
          {activeTab === 'payouts' && (
            <motion.div
              key="payouts"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Outstanding</h3>
                <div className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                  ₹{workers.reduce((acc, w) => acc + calculateUnpaid(w.id), 0)}
                </div>
              </div>

              {workers.map(worker => {
                const unpaid = calculateUnpaid(worker.id);
                if (unpaid <= 0) return null;
                return (
                  <div key={worker.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-gray-100">{worker.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{worker.role}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-bold text-red-600 dark:text-red-400">₹{unpaid}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">pending</div>
                      </div>
                      <button 
                        onClick={() => processPayout(worker.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {workers.every(w => calculateUnpaid(w.id) <= 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 flex flex-col items-center">
                  <CheckCircle2 size={48} className="text-emerald-500 opacity-50 mb-4" />
                  <p>All workers have been paid.</p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Add Worker Modal */}
      <AnimatePresence>
        {showAddWorker && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Add Worker</h3>
                <button onClick={() => setShowAddWorker(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleAddWorker} className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">Full Name</label>
                  <input required value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})} type="text" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-secondary/50 dark:text-white" placeholder="e.g. Ramesh Singh" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">Role/Job</label>
                  <input required value={newWorker.role} onChange={e => setNewWorker({...newWorker, role: e.target.value})} type="text" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-secondary/50 dark:text-white" placeholder="e.g. Tractor Driver, Harvester" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">Daily Wage (₹)</label>
                  <input required value={newWorker.dailyWage} onChange={e => setNewWorker({...newWorker, dailyWage: e.target.value})} type="number" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-secondary/50 dark:text-white" placeholder="e.g. 500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">Phone (Optional)</label>
                  <input value={newWorker.phone} onChange={e => setNewWorker({...newWorker, phone: e.target.value})} type="tel" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-secondary/50 dark:text-white" placeholder="10-digit number" />
                </div>
                <button type="submit" className="w-full bg-secondary text-white font-bold py-3 mt-4 rounded-xl active:scale-95 transition-transform">
                  Save Worker
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
