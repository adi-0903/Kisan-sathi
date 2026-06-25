import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Smartphone, Download, Check, Sparkles, AlertCircle, 
  HelpCircle, Monitor, Chrome, Info, Star, ShieldCheck, Zap, WifiOff, BellRing, Apple
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function InstallAppScreen() {
  const navigate = useNavigate();
  const [canInstall, setCanInstall] = useState(!!(window as any).deferredPrompt);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('android');
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Detect Platform
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setPlatform('ios');
    } else if (/Macintosh|Windows|Linux|X11/.test(userAgent) && !/Mobi|Android/i.test(userAgent)) {
      setPlatform('desktop');
    } else {
      setPlatform('android');
    }

    const handleInstallable = () => {
      setCanInstall(true);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
    };
  }, []);

  const triggerNativeInstall = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;

    // Show the install prompt
    promptEvent.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again
    (window as any).deferredPrompt = null;
    setCanInstall(false);
  };

  const stepsAndroid = [
    {
      title: "Tap the Menu icon",
      desc: "Look for the three vertical dots (⋮) in the top-right corner of your Chrome browser address bar.",
    },
    {
      title: "Select 'Install App'",
      desc: "Scroll down and tap 'Install app' or 'Add to Home screen' from the menu.",
    },
    {
      title: "Confirm & Launch",
      desc: "Tap 'Install' in the pop-up. Kisan Saathi will instantly appear on your home screen!",
    }
  ];

  const stepsIOS = [
    {
      title: "Tap the Share button",
      desc: "Tap the Share button (square icon with an arrow pointing up) at the bottom of Safari browser.",
      icon: <Apple size={18} className="text-blue-500" />
    },
    {
      title: "Select 'Add to Home Screen'",
      desc: "Scroll down and select 'Add to Home Screen' (plus icon) from the option list.",
    },
    {
      title: "Confirm Name & Add",
      desc: "Tap 'Add' in the top-right corner. Kisan Saathi will appear instantly as an app icon!",
    }
  ];

  const stepsDesktop = [
    {
      title: "Look at the Address Bar",
      desc: "Look at the right side of your Chrome/Edge browser address bar for the 'Install Kisan Saathi' icon.",
    },
    {
      title: "Click 'Install'",
      desc: "Click the monitor icon or the 'Install' prompt.",
    },
    {
      title: "Run as Desktop App",
      desc: "The app will launch in a dedicated, distraction-free native window on your computer!",
    }
  ];

  const currentSteps = platform === 'ios' ? stepsIOS : platform === 'desktop' ? stepsDesktop : stepsAndroid;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#062416] via-slate-50 to-slate-50 dark:from-[#062416] dark:via-gray-950 dark:to-gray-950 pb-24 text-gray-800 dark:text-gray-100">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-900 px-4 py-3.5 flex items-center justify-between">
        <button 
          onClick={() => navigate('/profile')} 
          className="p-1 px-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center text-xs font-bold"
        >
          <ChevronLeft size={16} className="mr-0.5" /> Back
        </button>
        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <Smartphone size={14} className="animate-bounce" /> INSTANT APP CONFIGURATOR
        </span>
      </div>

      <div className="p-5 max-w-md mx-auto space-y-6">
        {/* App Splash Icon Card */}
        <div className="bg-gradient-to-b from-white/10 to-transparent p-6 rounded-3xl text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-[#062416] to-[#0b3c25] border-2 border-emerald-500/50 shadow-2xl flex items-center justify-center p-1"
          >
            <img 
              src="/icon.svg" 
              alt="Kisan Saathi Icon" 
              className="w-20 h-20 object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white dark:text-white leading-tight">Run as Native App</h1>
            <p className="text-xs text-green-200/80 leading-relaxed max-w-[280px] mx-auto">
              Get the full, premium full-screen experience with immediate home screen launch.
            </p>
          </div>
        </div>

        {/* Dynamic Native Prompt Button */}
        <AnimatePresence mode="wait">
          {canInstall ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-center space-y-3"
            >
              <div className="flex items-center justify-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles size={14} className="animate-spin" />
                <span>Compatible Browser Detected</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                Your browser fully supports 1-Click automatic App Installation! Click the button below to install.
              </p>
              <button
                onClick={triggerNativeInstall}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all"
              >
                <Download size={16} />
                <span>Install Kisan Saathi Now</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-start space-x-3 shadow-sm"
            >
              <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Info size={16} className="animate-pulse" />
              </div>
              <div className="text-left space-y-1">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Manual Setup Guidelines</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  If you don't see an automatic popup, simply follow the easy standard manual browser setup directions displayed below.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Key Benefits Grid */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center">
            <Star size={14} className="mr-1.5 text-amber-500" /> App Mode Advantages
          </h3>

          <div className="grid grid-cols-1 gap-3 text-xs">
            <div className="flex items-center space-x-3 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Zap size={14} />
              </div>
              <div>
                <p className="font-bold">Lightning Fast Launch</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Launches instantly from your phone dashboard bypassing URLs.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
                <WifiOff size={14} />
              </div>
              <div>
                <p className="font-bold">Offline Resilience</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Check logged crops, dairy status, and local data without internet.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <BellRing size={14} />
              </div>
              <div>
                <p className="font-bold">Push Notifications</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Get urgent local advisory, water schedules & mandi updates.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="flex bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-1.5 rounded-2xl justify-between shadow-sm">
          {[
            { id: 'android', label: 'Android / Chrome', icon: <Chrome size={14} /> },
            { id: 'ios', label: 'Apple / Safari', icon: <Apple size={14} /> },
            { id: 'desktop', label: 'PC / Desktop', icon: <Monitor size={14} /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setPlatform(item.id as any);
                setActiveStep(0);
              }}
              className={`flex-1 py-2 rounded-xl text-[11px] font-black flex items-center justify-center space-x-1 transition-all ${platform === item.id ? 'bg-[#062416] text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Step-by-Step Installation Cards */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
              {platform === 'ios' ? 'Safari Safari Steps' : platform === 'desktop' ? 'PC Installation Steps' : 'Android Chrome Steps'}
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full font-bold">PWA Standard</span>
          </div>

          <div className="space-y-4">
            {currentSteps.map((step, idx) => (
              <div 
                key={idx} 
                className={`flex space-x-4 items-start p-3.5 rounded-2xl transition-all ${idx === activeStep ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/20 shadow-sm' : 'border border-transparent'}`}
                onClick={() => setActiveStep(idx)}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${idx === activeStep ? 'bg-[#062416] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  {idx + 1}
                </div>
                <div className="text-left space-y-1">
                  <h4 className="text-xs font-black text-gray-800 dark:text-gray-100">{step.title}</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Certificate Indicator */}
        <div className="bg-gradient-to-r from-[#041a10] to-[#0d3823] text-green-300 p-4 rounded-3xl text-center flex items-center justify-center space-x-2 border border-emerald-900/40">
          <ShieldCheck size={18} className="text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider">100% Safe, Secure & Lightweight (No permissions, ads or spam)</span>
        </div>
      </div>
    </div>
  );
}
