import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Star, Zap, Shield, Crown, AlertTriangle, Sparkles, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function PremiumModal({ isOpen, onClose, message }: PremiumModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-center sm:p-4 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl h-[85vh] sm:h-auto overflow-y-auto relative"
        >
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="text-center pt-4 mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white mb-4 shadow-lg shadow-orange-500/30">
              <Crown size={32} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">KisanSaathi Pro</h2>
            {message ? (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center justify-center space-x-2 mb-2 border border-red-100 dark:border-red-900/30">
                <AlertTriangle size={18} />
                <span className="text-sm font-bold">{message}</span>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">Unlock advanced farming analytics and tools.</p>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start space-x-3 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-500/20">
              <Sparkles className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Unlimited Kisan GPT</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">24/7 access to your personal AI farming assistant.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-500/20">
              <Shield className="text-green-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">AI Disease Scans</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Scan unlimited crops with our advanced vision models.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-500/20">
              <FileText className="text-orange-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Detailed PDF Reports</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Export beautiful, detailed farm analytics and tracking reports.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button className="w-full relative group overflow-hidden bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-4 rounded-xl shadow-xl active:scale-95 transition-all">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center justify-center">
                Upgrade for ₹299 / month
              </span>
            </button>
            <button className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 active:scale-95 transition-transform hover:bg-gray-50 dark:hover:bg-gray-700">
              Get Year for ₹2499 <span className="text-orange-500 text-xs ml-1">(Save 30%)</span>
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Cancel anytime. Real integration would use <span className="font-bold text-gray-700 dark:text-gray-300">Stripe</span> or <span className="font-bold text-gray-700 dark:text-gray-300">Razorpay</span> to handle payments safely.
          </p>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
