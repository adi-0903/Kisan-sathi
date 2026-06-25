import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tractor, Leaf, Sun, CloudRain, Droplets } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export function SplashScreen() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 300);
    const timer2 = setTimeout(() => setStage(2), 1200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0B4A30] via-[#05291A] to-[#02100A] text-white overflow-hidden shadow-2xl relative shadow-black/50">
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      {/* Dynamic Background */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.2 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-[-10%] right-[-10%] w-72 h-72 rounded-full bg-gradient-to-br from-yellow-300 to-[#10B981] blur-[80px] pointer-events-none"
      />
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.15 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        className="absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full bg-gradient-to-tr from-[#10B981] to-emerald-300 blur-[80px] pointer-events-none"
      />

      {/* Floating environment elements */}
      <motion.div
        initial={{ y: 150, x: -80, opacity: 0, rotate: -45 }}
        animate={{ y: -50, x: -20, opacity: [0, 0.15, 0], rotate: -20 }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 left-10 pointer-events-none"
      >
        <Leaf size={40} className="text-[#10B981]" />
      </motion.div>
      <motion.div
        initial={{ y: 200, x: 80, opacity: 0, rotate: 45 }}
        animate={{ y: -80, x: 40, opacity: [0, 0.1, 0], rotate: 80 }}
        transition={{ duration: 6, repeat: Infinity, delay: 1.5, ease: "easeInOut" }}
        className="absolute bottom-0 right-10 pointer-events-none"
      >
        <Leaf size={32} className="text-[#34D399]" />
      </motion.div>

      {/* Main Logo Container */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-8 h-48">
        <AnimatePresence>
          {stage >= 1 && (
            <motion.div
              initial={{ scale: 0, rotate: -45, opacity: 0 }}
              animate={{ 
                scale: 1, 
                rotate: 0, 
                opacity: 1
              }}
              transition={{ 
                duration: 0.8,
                type: "spring",
                bounce: 0.5
              }}
              className="z-10"
            >
              <BrandLogo size={128} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {stage >= 2 && (
             <motion.div
               initial={{ scale: 0, y: 10, opacity: 0 }}
               animate={{ scale: 1, y: 0, opacity: 1 }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
               className="absolute -bottom-4 bg-gradient-to-r from-[#047857] to-[#065F46] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-black/20 flex items-center space-x-1.5 border border-[#10B981]/50"
             >
               <Leaf size={14} className="fill-current text-[#34D399]" />
               <span className="uppercase tracking-widest text-[10px]">Smart Farm</span>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Text Reveal */}
      <div className="h-20 flex flex-col items-center justify-center relative">
         <AnimatePresence>
           {stage >= 1 && (
             <motion.div className="flex overflow-hidden">
               {"KisanSaathi".split('').map((char, index) => {
                 const isSaathi = index >= 5;
                 return (
                   <motion.span
                     key={index}
                     initial={{ y: 50, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     transition={{
                       duration: 0.5,
                       delay: 0.4 + index * 0.05,
                       type: "spring",
                       damping: 12,
                       stiffness: 200
                     }}
                     className={`text-[2.75rem] font-extrabold tracking-tight ${isSaathi ? 'text-yellow-400' : 'text-white'} drop-shadow-sm`}
                   >
                     {char}
                   </motion.span>
                 );
               })}
             </motion.div>
           )}
         </AnimatePresence>
         
         <AnimatePresence>
            {stage >= 2 && (
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 0.3 }}
                 className="flex items-center space-x-2 mt-2 text-emerald-100 font-medium tracking-wide text-sm"
               >
                 <Droplets size={14} className="text-blue-300" />
                 <span>Empowering Every Harvest</span>
                 <CloudRain size={14} className="text-gray-300" />
               </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* Loading bar progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12 w-48 h-1 bg-white/20 rounded-full overflow-hidden"
      >
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
          className="h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-green-400 w-full"
        />
      </motion.div>
    </div>
  );
}
