/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Home, Sprout, Tractor, IndianRupee, MessageSquare, User, Droplets, CloudOff, Cloud, Store, Users, Calendar } from "lucide-react";
import './lib/i18n';
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { HomeScreen } from "./screens/HomeScreen";
import { CropsScreen } from "./screens/CropsScreen";
import { DairyScreen } from "./screens/DairyScreen";
import { MarketScreen } from "./screens/MarketScreen";
import { AIScreen } from "./screens/AIScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { CropLogScreen } from "./screens/CropLogScreen";
import { DiseaseDetectorScreen } from "./screens/DiseaseDetectorScreen";
import { WeatherScreen } from "./screens/WeatherScreen";
import { ReportsScreen } from "./screens/ReportsScreen";
import { FinanceScreen } from "./screens/FinanceScreen";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { ThemeProvider } from "./lib/ThemeContext";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { TasksScreen } from "./screens/TasksScreen";
import { useNotifications } from "./lib/useNotifications";
import { SettingsScreen } from "./screens/SettingsScreen";
import { InventoryScreen } from "./screens/InventoryScreen";
import { SoilHealthScreen } from "./screens/SoilHealthScreen";
import { SchemesScreen } from "./screens/SchemesScreen";
import { ShopScreen } from "./screens/ShopScreen";
import { LogisticsScreen } from "./screens/LogisticsScreen";
import { MachineryScreen } from "./screens/MachineryScreen";
import { LaborScreen } from "./screens/LaborScreen";
import { D2CScreen } from "./screens/D2CScreen";
import { ConsumerHomeScreen } from "./screens/ConsumerHomeScreen";

import { SplashScreen } from './screens/SplashScreen';
import { syncLocalData as syncLocalDataToFirestore } from './lib/dbClient';

import { FarmerDirectoryScreen } from "./screens/FarmerDirectoryScreen";
import { SubscriptionsScreen } from "./screens/SubscriptionsScreen";
import { InstallAppScreen } from "./screens/InstallAppScreen";

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  const isConsumer = user?.role === 'consumer';

  const navItems = isConsumer ? [
    { path: "/", icon: Store, label: "Market" },
    { path: "/directory", icon: Users, label: "Farmers" },
    { path: "/subscriptions", icon: Calendar, label: "Subs" },
    { path: "/profile", icon: User, label: t("profile") }
  ] : [
    { path: "/", icon: Home, label: t("home") },
    { path: "/crops", icon: Sprout, label: t("crops") },
    { path: "/dairy", icon: Tractor, label: t("dairy") },
    { path: "/finance", icon: IndianRupee, label: t("finance", "Finance") },
    { path: "/profile", icon: User, label: t("profile") }
  ];

  // Only show nav on main tabs and their subpages
  const showNav = navItems.some(item => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)));
  if (!showNav) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom pb-2 z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto relative px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.div 
                    layoutId="nav-pill"
                    className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-primary rounded-full transform -translate-x-1/2" 
                  />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const isConsumer = user?.role === 'consumer';
  const navPaths = isConsumer ? ['/', '/directory', '/subscriptions', '/profile'] : ['/', '/crops', '/dairy', '/finance', '/profile'];
  const showNav = navPaths.some(path => location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`${showNav ? 'pb-32' : 'pb-0'} max-w-md mx-auto bg-background dark:bg-[#121212] min-h-screen relative shadow-2xl shadow-gray-200/50 dark:shadow-gray-900/50`}
    >
      {children}
    </motion.div>
  );
}

function FloatingAIFab() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  if (['/ai', '/login', '/register'].includes(location.pathname)) return null;

  const isConsumer = user?.role === 'consumer';
  const navPaths = isConsumer ? ['/', '/directory', '/subscriptions', '/profile'] : ['/', '/crops', '/dairy', '/finance', '/profile'];
  const showNav = navPaths.some(path => location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`)));

  return (
    <button
      onClick={() => navigate('/ai')}
      className={`fixed ${showNav ? 'bottom-22' : 'bottom-6'} right-4 bg-accent text-white p-4 rounded-full shadow-lg z-50 flex items-center justify-center hover:scale-105 transition-transform`}
    >
      <MessageSquare size={24} />
      <span className="sr-only">Ask AI</span>
    </button>
  );
}

function ProtectedFarmerRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === 'consumer') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function InnerApp() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Call useNotifications here so the background interval runs while the app is active
  useNotifications();

  useEffect(() => {
    // Attempt database synchronization on boot
    syncLocalDataToFirestore();

    const handleOnline = () => {
      setIsOnline(true);
      syncLocalDataToFirestore();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background dark:bg-[#121212]"><div className="animate-spin text-primary"><Tractor size={48} /></div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/register" element={<PageWrapper><RegisterScreen /></PageWrapper>} />
            <Route path="*" element={<PageWrapper><LoginScreen /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-orange-500 text-white text-xs font-bold py-1.5 px-4 flex items-center justify-center space-x-2 shadow-md">
          <CloudOff size={14} />
          <span>Working Offline. Changes will sync later.</span>
        </div>
      )}
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={<PageWrapper>{user.role === 'consumer' ? <ConsumerHomeScreen /> : <HomeScreen />}</PageWrapper>} />
          <Route path="/directory" element={<PageWrapper><FarmerDirectoryScreen /></PageWrapper>} />
          <Route path="/subscriptions" element={<PageWrapper><SubscriptionsScreen /></PageWrapper>} />
          <Route path="/crops" element={<PageWrapper><ProtectedFarmerRoute><CropsScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/crops/:id" element={<PageWrapper><ProtectedFarmerRoute><CropLogScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/disease" element={<PageWrapper><ProtectedFarmerRoute><DiseaseDetectorScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/dairy" element={<PageWrapper><ProtectedFarmerRoute><DairyScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/market" element={<PageWrapper><ProtectedFarmerRoute><MarketScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/finance" element={<PageWrapper><ProtectedFarmerRoute><FinanceScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/ai" element={<PageWrapper><AIScreen /></PageWrapper>} />
          <Route path="/profile" element={<PageWrapper><ProfileScreen /></PageWrapper>} />
          <Route path="/install-app" element={<PageWrapper><InstallAppScreen /></PageWrapper>} />
          <Route path="/weather" element={<PageWrapper><ProtectedFarmerRoute><WeatherScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/tasks" element={<PageWrapper><ProtectedFarmerRoute><TasksScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/reports" element={<PageWrapper><ProtectedFarmerRoute><ReportsScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/settings" element={<PageWrapper><SettingsScreen /></PageWrapper>} />
          <Route path="/inventory" element={<PageWrapper><ProtectedFarmerRoute><InventoryScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/soil-health" element={<PageWrapper><ProtectedFarmerRoute><SoilHealthScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/schemes" element={<PageWrapper><ProtectedFarmerRoute><SchemesScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/shop" element={<PageWrapper><ProtectedFarmerRoute><ShopScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/logistics" element={<PageWrapper><ProtectedFarmerRoute><LogisticsScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/machinery" element={<PageWrapper><ProtectedFarmerRoute><MachineryScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/labor" element={<PageWrapper><ProtectedFarmerRoute><LaborScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="/d2c" element={<PageWrapper><ProtectedFarmerRoute><D2CScreen /></ProtectedFarmerRoute></PageWrapper>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
      <FloatingAIFab />
      <BottomNav />
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000); // 4s duration
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AnimatePresence mode="wait">
            {showSplash ? (
              <motion.div key="splash" className="fixed inset-0 z-[100] w-full bg-[#05291A] flex items-center justify-center" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="w-full max-w-md mx-auto h-full relative">
                  <SplashScreen />
                </div>
              </motion.div>
            ) : (
              <motion.div key="app" className="h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <InnerApp />
              </motion.div>
            )}
          </AnimatePresence>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

