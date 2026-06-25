import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Globe, Leaf, LogOut, Settings, Moon, Sun, FileText, Cloud, CloudOff, 
  RefreshCw, CheckCircle2, Bell, Heart, ShoppingBag, Smartphone, Edit3, Save, X, MapPin
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';

export function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingItems, setPendingItems] = useState(navigator.onLine ? 0 : 2);

  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editVillage, setEditVillage] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editLandSize, setEditLandSize] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync edits state from context
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditVillage(user.village || '');
      setEditDistrict(user.district || '');
      setEditCity(user.city || '');
      setEditState(user.state || '');
      setEditPincode(user.pincode || '');
      setEditLandSize(user.landSize || '');
    }
  }, [user]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncing(true);
      setTimeout(() => {
        setSyncing(false);
        setPendingItems(0);
      }, 1500);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setPendingItems(2);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleForceSync = () => {
    if (!isOnline) {
      alert("Cannot sync while offline.");
      return;
    }
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setPendingItems(0);
    }, 1000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await updateUser({
        name: editName,
        phone: editPhone,
        village: editVillage,
        district: editDistrict,
        city: editCity,
        state: editState,
        pincode: editPincode,
        landSize: editLandSize
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const isConsumer = user?.role === 'consumer';

  return (
    <div className="p-4 space-y-6">
      <header className="py-2 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('profile')}</h1>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-sm transition-all"
          >
            <Edit3 size={12} />
            <span>Edit Profile</span>
          </button>
        )}
      </header>

      {/* Main Profile Info Card or Editable Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300">
        {!isEditing ? (
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 ${isConsumer ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'} dark:bg-primary/20 rounded-full flex-shrink-0 flex items-center justify-center text-2xl font-bold uppercase`}>
              {user?.name?.charAt(0) || 'K'}
            </div>
            <div className="flex-1 overflow-hidden">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">{user?.name || (isConsumer ? 'Urban Consumer' : 'Farmer')}</h2>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-0.5 mb-1">{user?.phone || 'No phone'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1.5">
                {user?.village || 'Unknown Village'}{user?.city ? `, ${user?.city}` : ''}{user?.district ? `, ${user?.district}` : ''}{user?.state ? `, ${user?.state}` : ''}{user?.pincode ? ` - ${user.pincode}` : ''}
              </p>
              {isConsumer ? (
                <div className="inline-flex items-center bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full text-xs font-extrabold text-emerald-800 dark:text-emerald-300 border border-emerald-100/30">
                  <Heart size={11} className="mr-1 text-emerald-600 animate-pulse fill-current" /> Green Supporter
                </div>
              ) : (
                <div className="inline-flex items-center bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full text-xs font-extrabold text-emerald-800 dark:text-emerald-300 border border-emerald-100/30">
                  <Leaf size={12} className="mr-1 text-emerald-600 dark:text-emerald-400" /> {user?.landSize || '0'} Acres
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 mb-2">
              <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center">
                <Edit3 size={14} className="mr-1.5" /> Modify Account Details
              </span>
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-1">Village / Town</label>
                <input
                  type="text"
                  value={editVillage}
                  onChange={(e) => setEditVillage(e.target.value)}
                  placeholder="Village or Town"
                  className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-1">City / Tehsil</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="City or Tehsil"
                  className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-1">District</label>
                <input
                  type="text"
                  value={editDistrict}
                  onChange={(e) => setEditDistrict(e.target.value)}
                  placeholder="District"
                  className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-1">State</label>
                <input
                  type="text"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  placeholder="State"
                  className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-1">{t("pin_code")}</label>
                <input
                  type="text"
                  value={editPincode}
                  onChange={(e) => setEditPincode(e.target.value)}
                  placeholder="6 digit pincode"
                  className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              {!isConsumer && (
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-1">Total Land Size (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editLandSize}
                    onChange={(e) => setEditLandSize(e.target.value)}
                    placeholder="Enter acreage"
                    className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-250 text-gray-700 dark:text-gray-200 text-xs font-black rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all"
              >
                {saving ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="space-y-4">
        {/* Support Eco-impact stat cards for consumer */}
        {isConsumer && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Eco Benefit</span>
              <div className="text-xl font-black text-emerald-950 mt-1">12.4 kg</div>
              <p className="text-[10px] text-emerald-700 mt-1 leading-snug">Carbon footprint saved by shopping farm-direct.</p>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Social Impact</span>
              <div className="text-xl font-black text-amber-950 mt-1">2 Families</div>
              <p className="text-[10px] text-amber-700 mt-1 leading-snug">Grassroots farming households fully supported.</p>
            </div>
          </div>
        )}

        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex items-center space-x-2">
              <Cloud size={18} className="text-gray-400 dark:text-gray-500" />
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Sync Manager</h3>
            </div>
            {isOnline ? (
              <span className="flex items-center text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">
                <CheckCircle2 size={12} className="mr-1" /> Online
              </span>
            ) : (
              <span className="flex items-center text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded">
                <CloudOff size={12} className="mr-1" /> Offline
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Pending Changes</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pendingItems} items waiting to sync</p>
              </div>
              <div className="text-right">
                 <button 
                   onClick={handleForceSync}
                   disabled={syncing || !isOnline || pendingItems === 0}
                   className="flex items-center px-3 py-1.5 text-xs font-bold rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   <RefreshCw size={14} className={`mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                   {syncing ? 'Syncing...' : 'Force Sync'}
                 </button>
              </div>
            </div>
            
            {pendingItems > 0 && (
              <div className="space-y-2">
                {isConsumer ? (
                  <>
                    <div className="text-xs flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Cart status check & favorites cache</span>
                      <span className="text-orange-500 font-bold text-[10px] uppercase tracking-wider">Pending</span>
                    </div>
                    <div className="text-xs flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Synced urban location indicators</span>
                      <span className="text-orange-500 font-bold text-[10px] uppercase tracking-wider">Pending</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Logged new crop: Wheat</span>
                      <span className="text-orange-500 font-bold text-[10px] uppercase tracking-wider">Pending</span>
                    </div>
                    <div className="text-xs flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Added morning milk log</span>
                      <span className="text-orange-500 font-bold text-[10px] uppercase tracking-wider">Pending</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {!pendingItems && (
               <div className="text-center py-5 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 border-dashed">
                 <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                   <CheckCircle2 size={24} className="text-green-500 dark:text-green-400" />
                 </div>
                 <p className="text-sm font-bold text-gray-700 dark:text-gray-300">All caught up!</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Data is successfully synced to cloud</p>
               </div>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-2">
            {!isConsumer && (
              <button onClick={() => navigate('/reports')} className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                <div className="flex items-center space-x-3">
                  <FileText size={18} className="text-gray-400" />
                  <span>{t('farm_reports')}</span>
                </div>
              </button>
            )}
            <button onClick={() => navigate('/install-app')} className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <Smartphone size={18} className="text-emerald-500" />
                <span className="font-extrabold text-[#0d3823] dark:text-emerald-300">Save App to Phone (PWA)</span>
              </div>
              <span className="text-[9px] bg-emerald-500/15 text-emerald-600 px-2 py-0.5 rounded-full font-bold">INSTALLABLE</span>
            </button>
            <button onClick={() => navigate('/settings')} className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <Settings size={18} className="text-gray-400" />
                <span>{t('settings')}</span>
              </div>
            </button>
            <button onClick={logout} className="w-full flex items-center justify-between px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <LogOut size={18} className="text-red-400" />
                <span>{t('logout')}</span>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
