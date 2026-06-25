import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Package, AlertCircle, Plus, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSyncState } from '../lib/store';
import { motion } from 'framer-motion';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Seed' | 'Fertilizer' | 'Pesticide' | 'Harvest';
  quantity: number;
  unit: string;
  lowStockThreshold: number;
}

export function InventoryScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useSyncState<InventoryItem[]>('ks_inventory', []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'Fertilizer',
    quantity: 0,
    unit: 'kg',
    lowStockThreshold: 10,
  });

  const categories = ['Seed', 'Fertilizer', 'Pesticide', 'Harvest'];
  const units = ['kg', 'liters', 'bags', 'quintals', 'tons'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setItems(items.map(item => item.id === editingId ? { ...item, ...formData as InventoryItem } : item));
    } else {
      setItems([...items, { ...formData as InventoryItem, id: Date.now().toString() }]);
    }
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', category: 'Fertilizer', quantity: 0, unit: 'kg', lowStockThreshold: 10 });
  };

  const editItem = (item: InventoryItem) => {
    setFormData(item);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Alert generation
  const lowStockItems = items.filter(item => item.quantity <= item.lowStockThreshold);

  return (
    <div className="pb-24">
      <header className="bg-white dark:bg-gray-800 p-4 sticky top-0 z-30 shadow-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-bold">{t('inventory')}</h1>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingId(null); }}
          className="bg-primary/10 text-primary p-2 rounded-full hover:bg-primary/20 transition-colors"
        >
          <Plus size={20} />
        </button>
      </header>

      <div className="p-4 space-y-6">
        {lowStockItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4">
            <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 font-bold mb-2">
              <AlertCircle size={20} />
              <span>Low Stock Alerts</span>
            </div>
            <ul className="space-y-1 text-sm text-orange-800 dark:text-orange-300">
              {lowStockItems.map(item => (
                <li key={item.id}>• {item.name} ({item.quantity} {item.unit} left, threshold: {item.lowStockThreshold})</li>
              ))}
            </ul>
          </motion.div>
        )}

        {isAdding && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-200">{editingId ? 'Edit Item' : 'Add New Item'}</h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Item Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3" placeholder="e.g. Urea 46%, Wheat Seeds" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Unit</label>
                <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Quantity</label>
                <input required type="number" step="0.1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Alert Below</label>
                <input required type="number" step="0.1" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3" />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl">Save</button>
            </div>
          </motion.form>
        )}

        <div className="space-y-4">
          {items.length === 0 && !isAdding ? (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Your inventory is empty.</p>
              <button onClick={() => setIsAdding(true)} className="mt-4 text-primary font-bold hover:underline">Add items to stock</button>
            </div>
          ) : (
            items.map(item => {
              const isLow = item.quantity <= item.lowStockThreshold;
              return (
                <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-start space-x-3">
                    <div className={`p-3 rounded-xl ${isLow ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                      <Package size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-gray-200">{item.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{item.category}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`text-xl font-bold tracking-tight ${isLow ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                        {item.quantity}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">{item.unit}</div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <button onClick={() => editItem(item)} className="p-1.5 text-gray-400 hover:text-blue-500 bg-gray-50 dark:bg-gray-700 rounded"><Edit2 size={14}/></button>
                      <button onClick={() => deleteItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-gray-700 rounded"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
