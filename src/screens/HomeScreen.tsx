import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, Droplets, Thermometer, ChevronRight, AlertTriangle, ListTodo, Sprout, Plus, Leaf, Sun, CloudRain, Wind, Loader2, Package, TestTube2, Crown, Clock, X, Landmark, ShoppingCart, Truck, HardHat, Store, Tractor, Smartphone, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSyncState } from '../lib/store';
import { useAuth } from '../lib/AuthContext';
import { Task } from './TasksScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWeather, fetchSprayRecommendation } from '../lib/api';
import { PremiumModal } from '../components/PremiumModal';
import { useSubscription } from '../lib/subscription';

export function HomeScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks] = useSyncState<Task[]>('ks_tasks', []);
  const [crops] = useSyncState<any[]>('ks_crops', []);
  const [cattle] = useSyncState<any[]>('ks_cattle', []);

  const [weatherData, setWeatherData] = useState<any>(null);
  const [sprayRec, setSprayRec] = useState<any>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [showPremium, setShowPremium] = useState(false);
  const [showAlertPopUp, setShowAlertPopUp] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(!!standalone);
    
    const dismissed = localStorage.getItem('ks_dismiss_pwa_banner');
    if (!standalone && !dismissed) {
      setShowInstallBanner(true);
    }
  }, []);
  
  const { isExpired, daysLeft } = useSubscription();

  useEffect(() => {
    const hasSeenAlert = sessionStorage.getItem('ks_seen_alert');
    if (!hasSeenAlert && crops.length > 0) {
      const timer = setTimeout(() => {
        setShowAlertPopUp(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [crops]);

  const dismissAlert = () => {
    setShowAlertPopUp(false);
    sessionStorage.setItem('ks_seen_alert', 'true');
  };

  useEffect(() => {
    fetchWeather()
      .then(data => {
        setWeatherData(data);
        return fetchSprayRecommendation(data.forecast);
      })
      .then(rec => setSprayRec(rec))
      .catch(err => setWeatherError(err.message));
  }, []);

  const currentLang = i18n.language;
  const isHindi = currentLang === 'hi';
  const isPa = currentLang === 'pa';
  
  const weather = weatherData || { temp: 32, condition: "Sunny" };

  const upcomingTasks = (tasks || []).filter(t => !t.completed).slice(0, 3);
  
  const greetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return isHindi ? 'सुप्रभात' : isPa ? 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ' : 'Good Morning';
    if (hour < 18) return isHindi ? 'शुभ दोपहर' : isPa ? 'ਸ਼ੁਭ ਦੁਪਹਿਰ' : 'Good Afternoon';
    return isHindi ? 'शुभ संध्या' : isPa ? 'ਸ਼ੁਭ ਸ਼ਾਮ' : 'Good Evening';
  };

  return (
    <div className="space-y-6">
      {/* Immersive Hero Banner */}
      <div className="bg-gradient-to-br from-primary to-[#1B4323] dark:from-[#113118] dark:to-black rounded-b-[24px] p-5 pt-4 pb-8 shadow-sm relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 dark:bg-yellow-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/5 rounded-t-[100%] translate-y-6 scale-110" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-white/10 rounded-t-[100%] translate-y-4" />

        <header className="flex justify-between items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-[10px] text-green-200/80 font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1">
              <Leaf size={10}/> KisanSaathi
              {!isExpired ? (
                <span className="ml-2 bg-white/20 text-white rounded-full px-2 py-0.5 text-[8px] font-bold shadow-sm flex items-center">
                  <Clock size={8} className="mr-1" /> {daysLeft} Days Free
                </span>
              ) : (
                <button 
                  onClick={() => setShowPremium(true)}
                  className="ml-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full px-2 py-0.5 text-[8px] font-black shadow-sm flex items-center shadow-red-500/20"
                >
                  <AlertTriangle size={8} className="mr-0.5" /> EXPIRED
                </button>
              )}
              <button 
                onClick={() => setShowPremium(true)}
                className="ml-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full px-2 py-0.5 text-[8px] font-black shadow-sm flex items-center"
              >
                <Crown size={8} className="mr-0.5" /> PRO
              </button>
            </h1>
            <h2 className="text-xl font-bold text-white tracking-tight flex flex-wrap items-center gap-1">
              <span>{greetingText()},</span>
              <span className="text-secondary-light">{user?.name?.split(' ')[0] || 'Kisan'}</span>
            </h2>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/10 backdrop-blur-md p-1 rounded-full shadow-sm border border-white/20 cursor-pointer hover:bg-white/20" 
            onClick={() => navigate('/profile')}
          >
            <div className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center font-bold text-sm uppercase shadow-inner">
              {user?.name?.charAt(0) || 'K'}
            </div>
          </motion.div>
        </header>
      </div>

      <div className="px-5 space-y-6 -mt-4 relative z-20 pb-10">
        {/* PWA Install Banner */}
        <AnimatePresence>
          {showInstallBanner && (
            <motion.section
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-gradient-to-r from-[#062416] to-[#0d3823] text-white rounded-[20px] p-4 shadow-md relative overflow-hidden border border-emerald-900/50"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl" />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  localStorage.setItem('ks_dismiss_pwa_banner', 'true');
                  setShowInstallBanner(false);
                }}
                className="absolute top-3 right-3 text-green-300/80 hover:text-white transition-colors bg-white/10 rounded-full p-1"
              >
                <X size={14} />
              </button>
              
              <div className="flex items-start space-x-3.5 pr-6">
                <div className="bg-emerald-500/20 p-2.5 rounded-2xl text-emerald-400">
                  <Smartphone size={20} className="animate-pulse" />
                </div>
                <div className="text-left space-y-1">
                  <h4 className="text-sm font-black text-white">Install Kisan Saathi</h4>
                  <p className="text-[11px] text-green-200/80 leading-relaxed font-medium">
                    Run full-screen, offline-ready & lightning fast on your phone or desktop screen!
                  </p>
                  <div className="pt-2">
                    <button 
                      onClick={() => navigate('/install-app')}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-sm active:scale-95 transition-all flex items-center space-x-1"
                    >
                      <Download size={10} />
                      <span>Configure App Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Compact Weather & Spray Widget */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          onClick={() => navigate('/weather')}
          className="bg-white dark:bg-gray-800 rounded-[20px] shadow-sm border border-gray-100 dark:border-gray-700 p-3 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-500 dark:text-blue-400">
               {weatherData?.forecast?.[0]?.icon ? (
                 <img src={`https://openweathermap.org/img/wn/${weatherData.forecast[0].icon}.png`} alt="weather" className="w-6 h-6 drop-shadow-sm" />
               ) : (
                 <Cloud size={24} />
               )}
             </div>
             <div>
               <div className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2 leading-none">
                 {weather.temp}°C
                 {sprayRec && sprayRec.isGood && (
                   <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Good to Spray</span>
                 )}
                 {sprayRec && !sprayRec.isGood && (
                   <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">High Wind/Rain</span>
                 )}
               </div>
               <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{weather.condition} • View 5-Day Forecast</p>
             </div>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </motion.section>

        {/* Minimal Pro Banner */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          onClick={() => setShowPremium(true)}
          className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-2xl p-4 shadow-lg cursor-pointer flex justify-between items-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl" />
          <div className="flex items-center space-x-3 relative z-10">
            <div className="bg-orange-500/20 p-2 rounded-full text-orange-400">
              <Crown size={18} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm text-shadow-sm">Unlock KisanSaathi Pro</h4>
              <p className="text-gray-400 text-xs mt-0.5">AI crop scans, advanced reports & GPT</p>
            </div>
          </div>
          <div className="bg-white/10 text-white p-1.5 rounded-full backdrop-blur-sm relative z-10">
            <ChevronRight size={16} />
          </div>
        </motion.section>

        {/* Smart Alert Removed from inline and moved to pop-up */}

        {/* Core Action shortcuts */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-2 gap-4"
        >
          <button onClick={() => navigate('/disease')} className="bg-white dark:bg-gray-800 border-[1.5px] border-primary/20 hover:border-primary/50 transition-colors p-4 rounded-3xl flex flex-col items-center text-center shadow-sm active:scale-95 group">
            <div className="bg-primary/10 text-primary p-3.5 rounded-full mb-3 group-hover:scale-110 transition-transform">
               <Sprout size={28} />
            </div>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: t("diagnose_disease").replace(' ', '<br/>') }} />
          </button>
          
          <button onClick={() => navigate('/market')} className="bg-white dark:bg-gray-800 border-[1.5px] border-secondary/20 hover:border-secondary/50 transition-colors p-4 rounded-3xl flex flex-col items-center text-center shadow-sm active:scale-95 group">
            <div className="bg-secondary/10 text-secondary p-3.5 rounded-full mb-3 group-hover:scale-110 transition-transform">
               <ChevronRight size={28} />
            </div>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: t("live_mandi").replace(' ', '<br/>') }} />
          </button>

          <button onClick={() => navigate('/schemes')} className="bg-white dark:bg-gray-800 border-[1.5px] border-blue-500/20 hover:border-blue-500/50 transition-colors p-4 rounded-3xl flex flex-col items-center text-center shadow-sm active:scale-95 group">
            <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3.5 rounded-full mb-3 group-hover:scale-110 transition-transform">
               <Landmark size={28} />
            </div>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: t("govt_schemes").replace(' ', '<br/>') }} />
          </button>

          <button onClick={() => navigate('/shop')} className="bg-white dark:bg-gray-800 border-[1.5px] border-orange-500/20 hover:border-orange-500/50 transition-colors p-4 rounded-3xl flex flex-col items-center text-center shadow-sm active:scale-95 group">
            <div className="bg-orange-500/10 text-orange-600 dark:text-orange-400 p-3.5 rounded-full mb-3 group-hover:scale-110 transition-transform">
               <ShoppingCart size={28} />
            </div>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Agri<br/>Shop</span>
          </button>
        </motion.section>

        {/* More Services */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
        >
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-3 px-1 mt-6">More Services</h3>
          <div className="flex overflow-x-auto space-x-3 pb-4 scrollbar-hide -mx-5 px-5">
            <button onClick={() => navigate('/inventory')} className="flex flex-col items-center min-w-[72px] group">
              <div className="w-14 h-14 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                 <Package size={22} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 text-center leading-tight">Inventory</span>
            </button>

            <button onClick={() => navigate('/logistics')} className="flex flex-col items-center min-w-[72px] group">
              <div className="w-14 h-14 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                 <Truck size={22} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 text-center leading-tight">Logistics</span>
            </button>

            <button onClick={() => navigate('/machinery')} className="flex flex-col items-center min-w-[72px] group">
              <div className="w-14 h-14 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                 <Tractor size={22} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 text-center leading-tight">Machinery</span>
            </button>

            <button onClick={() => navigate('/labor')} className="flex flex-col items-center min-w-[72px] group">
              <div className="w-14 h-14 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                 <HardHat size={22} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 text-center leading-tight">Labor</span>
            </button>

            <button onClick={() => navigate('/d2c')} className="flex flex-col items-center min-w-[72px] group">
              <div className="w-14 h-14 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                 <Store size={22} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 text-center leading-tight">D2C<br/>Storefront</span>
            </button>
            
            <button onClick={() => navigate('/soil-health')} className="flex flex-col items-center min-w-[72px] group">
              <div className="w-14 h-14 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full flex items-center justify-center text-amber-700 dark:text-amber-500 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                 <TestTube2 size={22} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 text-center leading-tight">Soil<br/>Health</span>
            </button>
          </div>
        </motion.section>

        {/* Upcoming Tasks */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="pb-10"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-5 bg-primary rounded-full" />
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">{t("upcoming_tasks")}</h3>
            </div>
            <button onClick={() => navigate('/tasks')} className="text-sm font-bold text-primary dark:text-primary-light hover:underline">
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  key={task.id} 
                  className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-pointer hover:shadow-md transition-all active:scale-[0.98]" 
                  onClick={() => navigate('/tasks')}
                >
                  <span className="text-base font-medium text-gray-800 dark:text-gray-200 truncate pr-3">{task.title}</span>
                  <span className="text-sm text-secondary dark:text-secondary-light font-bold bg-secondary/10 px-3 py-1.5 rounded-full whitespace-nowrap">{task.date}</span>
                </motion.div>
              ))
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => navigate('/tasks')}>
                <Plus size={28} className="text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-base text-gray-500 dark:text-gray-400 font-medium">Add a task to your field</p>
              </div>
            )}
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {showAlertPopUp && crops.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-20 left-4 right-4 z-50 shadow-2xl"
          >
            <div className="bg-orange-50 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-500/30 rounded-2xl p-5 flex items-start space-x-4 shadow-xl relative backdrop-blur-md">
              <button 
                onClick={dismissAlert}
                className="absolute top-3 right-3 text-orange-400 hover:text-orange-600 dark:text-orange-300 dark:hover:text-orange-100 transition-colors bg-orange-100/50 dark:bg-orange-900/50 rounded-full p-1"
              >
                <X size={16} />
              </button>
              <div className="text-orange-500 dark:text-orange-400 mt-0.5 shadow-orange-500/20">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1 pr-6">
                <h4 className="text-base font-bold text-orange-800 dark:text-orange-300">{t("smart_alerts")}</h4>
                <p className="text-sm text-orange-700 dark:text-orange-200 mt-1 leading-relaxed">
                  Consider checking field moisture levels for <span className="font-bold">{crops[0]?.name || 'your crops'}</span> soon based on upcoming weather forecast.
                </p>
                <div className="mt-3">
                  <button onClick={dismissAlert} className="text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-full shadow-sm active:scale-95 transition-all">
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PremiumModal isOpen={showPremium} onClose={() => setShowPremium(false)} />
    </div>
  );
}
