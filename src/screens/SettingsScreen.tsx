import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Globe, Moon, Sun, Bell, Lock, Key } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../lib/useNotifications';

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { permission, requestPermission } = useNotifications();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate password change
    alert(t("password_updated"));
    setShowPasswordChange(false);
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-gray-50 dark:bg-[#121212]">
      <header className="flex items-center p-4 bg-white dark:bg-gray-800 shadow-sm z-10 sticky top-0">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t("settings")}</h1>
      </header>

      <div className="p-4 space-y-6 flex-1 pb-24">
        {/* App Language */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 flex items-center space-x-2 bg-gray-50/50 dark:bg-gray-800/50">
            <Globe size={18} className="text-gray-400 dark:text-gray-500" />
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t("app_language")}</h3>
          </div>
          <div className="p-2">
            <button onClick={() => changeLang('en')} className={`w-full text-left px-4 py-3 text-sm rounded-xl font-medium ${i18n.language === 'en' ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-gray-600 dark:text-gray-400'}`}>
              {t("english")}
            </button>
            <button onClick={() => changeLang('hi')} className={`w-full text-left px-4 py-3 text-sm rounded-xl font-medium ${i18n.language === 'hi' ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-gray-600 dark:text-gray-400'}`}>
              {t("hindi")}
            </button>
            <button onClick={() => changeLang('pa')} className={`w-full text-left px-4 py-3 text-sm rounded-xl font-medium ${i18n.language === 'pa' ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-gray-600 dark:text-gray-400'}`}>
              {t("punjabi")}
            </button>
          </div>
        </section>

        {/* Appearance & Alerts */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 flex items-center space-x-2 bg-gray-50/50 dark:bg-gray-800/50">
            <Moon size={18} className="text-gray-400 dark:text-gray-500" />
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t("appearance_alerts")}</h3>
          </div>
          <div className="p-2 space-y-1">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                {theme === 'dark' ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-yellow-500" />}
                <span>{t("dark_mode")}</span>
              </div>
              <button 
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                <Bell size={18} className="text-blue-500" />
                <div>
                  <span>{t("task_notifications")}</span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">{t("task_notif_desc")}</p>
                </div>
              </div>
              <button 
                onClick={requestPermission}
                disabled={permission === 'granted'}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${permission === 'granted' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${permission === 'granted' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Account Security */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 flex items-center space-x-2 bg-gray-50/50 dark:bg-gray-800/50">
            <Lock size={18} className="text-gray-400 dark:text-gray-500" />
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t("account_security")}</h3>
          </div>
          <div className="p-4">
            {!showPasswordChange ? (
              <button 
                onClick={() => setShowPasswordChange(true)}
                className="w-full flex items-center justify-center space-x-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 py-3 rounded-xl transition-colors font-medium text-sm border border-gray-200 dark:border-gray-600"
              >
                <Key size={16} />
                <span>{t("change_password")}</span>
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("current_password")}</label>
                  <input 
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-primary text-sm text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t("new_password")}</label>
                  <input 
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-primary text-sm text-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex space-x-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowPasswordChange(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {t("cancel")}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {t("save_changes")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
