import React, { useState, useEffect } from 'react';
import { Store, Plus, Tag, MapPin, Search, Package, TrendingUp, X, Image as ImageIcon, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/AuthContext';
import { dbClient } from '../lib/dbClient';

export function D2CScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'orders'>('listings');
  
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newProduct, setNewProduct] = useState<any>({
    name: '',
    category: 'Vegetables',
    price: 0,
    unit: 'kg',
    quantity: 0,
    status: 'Listed'
  });

  // Fetch products
  useEffect(() => {
    if (user && activeTab === 'listings') {
      const unsub = dbClient.subscribe('products', [{ field: 'supplierId', op: '==', value: user.uid }], (items) => {
        setProducts(items);
      });
      return () => unsub();
    }
  }, [user, activeTab]);

  // Fetch orders
  useEffect(() => {
    if (user && activeTab === 'orders') {
      const unsub = dbClient.subscribe('orders', [{ field: 'supplierId', op: '==', value: user.uid }], (items) => {
        setOrders(items);
      });
      return () => unsub();
    }
  }, [user, activeTab]);


  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price || newProduct.quantity === undefined || !user) return;
    
    try {
      if (editingProduct) {
        await dbClient.update('products', editingProduct.id, {
          name: newProduct.name,
          category: newProduct.category || 'Vegetables',
          price: Number(newProduct.price),
          unit: newProduct.unit || 'kg',
          quantity: Number(newProduct.quantity),
        });
      } else {
        await dbClient.add('products', {
          supplierId: user.uid,
          name: newProduct.name,
          category: newProduct.category || 'Vegetables',
          price: Number(newProduct.price),
          unit: newProduct.unit || 'kg',
          quantity: Number(newProduct.quantity),
          image: newProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
          status: 'Listed',
          createdAt: new Date().toISOString()
        });
      }

      setShowAddModal(false);
      setEditingProduct(null);
      setNewProduct({
        name: '',
        category: 'Vegetables',
        price: 0,
        unit: 'kg',
        quantity: 0,
        status: 'Listed'
      });
    } catch (e) {
      console.error(e);
      alert("Error saving product");
    }
  };

  const handleEditClick = (p: any) => {
    setEditingProduct(p);
    setNewProduct({
      name: p.name,
      category: p.category,
      price: p.price,
      unit: p.unit,
      quantity: p.quantity,
      status: p.status
    });
    setShowAddModal(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await dbClient.delete('products', id);
      } catch (e) {
        console.error(e);
        alert("Error deleting product");
      }
    }
  };

  const handleToggleStock = async (p: any) => {
    try {
      await dbClient.update('products', p.id, {
        status: p.status === 'Listed' ? 'Out of Stock' : 'Listed'
      });
    } catch (e) {
      console.error(e);
      alert("Error updating product status");
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await dbClient.update('orders', orderId, { 
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
        <div className="p-4 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-green-500 text-white">
          <div>
            <h1 className="font-bold text-xl flex items-center space-x-2">
              <Store size={22} />
              <span>{t('d2c_title')}</span>
            </h1>
            <p className="text-xs text-emerald-100 opacity-90 mt-1">Sell directly to urban consumers</p>
          </div>
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <TrendingUp size={24} className="text-white" />
          </div>
        </div>

        <div className="flex px-4 py-2 space-x-4">
          <button 
            onClick={() => setActiveTab('listings')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'listings' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            My Listings
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'orders' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Active Orders ({orders.filter(o => o.status !== 'Delivered').length})
          </button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {activeTab === 'listings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <button 
              onClick={() => {
                setEditingProduct(null);
                setNewProduct({
                  name: '',
                  category: 'Vegetables',
                  price: 0,
                  unit: 'kg',
                  quantity: 0,
                  status: 'Listed'
                });
                setShowAddModal(true);
              }}
              className="w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 border-dashed rounded-xl p-4 flex items-center justify-center space-x-2 font-bold transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            >
              <Plus size={20} />
              <span>Create New Listing</span>
            </button>

            {products.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <Store size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <h3 className="font-bold text-gray-800 dark:text-gray-200">No products listed</h3>
                <p className="text-sm text-gray-500 mt-1">Add your first product to sell directly to consumers.</p>
              </div>
            ) : (
              products.map(p => (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex">
                  <div className="w-28 h-28 relative flex-shrink-0">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {p.status}
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 leading-tight">{p.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{p.category} &bull; {p.quantity} {p.unit} remaining</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{p.price}<span className="text-sm text-gray-500 font-normal">/{p.unit}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <button onClick={() => handleToggleStock(p)} className={`px-3 py-1 text-xs font-bold rounded-lg ${p.status === 'Listed' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'}`}>
                          {p.status === 'Listed' ? 'No stock' : 'Restock'}
                        </button>
                        <button onClick={() => handleEditClick(p)} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <Package size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                <p className="font-medium text-lg text-gray-700 dark:text-gray-300 mb-1">No pending orders</p>
                <p className="text-sm">When urban buyers purchase your produce, it will appear here.</p>
              </div>
            ) : (
              orders.map(o => (
                <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm font-bold text-gray-800">{o.buyerName}</div>
                      <div className="text-xs text-gray-500">{o.deliveryAddress} • {o.buyerPhone}</div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-lg font-bold flex items-center gap-1
                      ${o.status === 'Pending' ? 'bg-orange-50 text-orange-600' : 
                        o.status === 'Accepted' ? 'bg-blue-50 text-blue-600' : 
                        o.status === 'Dispatched' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}
                    >
                      {o.status === 'Delivered' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                      {o.status}
                    </div>
                  </div>
                  <div className="space-y-2 mb-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {o.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-800"><span className="font-bold">{item.quantity}x</span> {item.productName}</span>
                        <span className="font-medium text-gray-600">₹{item.totalAmount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total</div>
                    <div className="font-black text-emerald-600">₹{o.totalAmount}</div>
                  </div>
                  
                  {/* Status Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {o.status === 'Pending' && (
                      <button onClick={() => updateOrderStatus(o.id, 'Accepted')} className="flex-1 bg-emerald-50 text-emerald-600 font-bold py-2 rounded-lg text-sm transition-colors hover:bg-emerald-100">
                        Accept Order
                      </button>
                    )}
                    {o.status === 'Accepted' && (
                      <button onClick={() => updateOrderStatus(o.id, 'Dispatched')} className="flex-1 bg-blue-50 text-blue-600 font-bold py-2 rounded-lg text-sm transition-colors hover:bg-blue-100">
                        Mark Dispatched
                      </button>
                    )}
                    {o.status === 'Dispatched' && (
                      <button onClick={() => updateOrderStatus(o.id, 'Delivered')} className="flex-1 bg-purple-50 text-purple-600 font-bold py-2 rounded-lg text-sm transition-colors hover:bg-purple-100">
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-xl"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">{editingProduct ? 'Edit Listing' : 'New Listing'}</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProduct(); }} className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="e.g. Organic Tomatoes"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Category</label>
                    <select 
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option>Vegetables</option>
                      <option>Fruits</option>
                      <option>Grains</option>
                      <option>Dairy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Unit</label>
                    <select 
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option>kg</option>
                      <option>gram</option>
                      <option>liters</option>
                      <option>piece</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Price (₹)</label>
                    <input 
                      type="number" 
                      value={newProduct.price || ''}
                      onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                      placeholder="e.g. 40"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Available Quantity</label>
                    <input 
                      type="number" 
                      value={newProduct.quantity || ''}
                      onChange={(e) => setNewProduct({...newProduct, quantity: Number(e.target.value)})}
                      placeholder="e.g. 50"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

              
              <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
                <button 
                  type="submit"
                  disabled={!newProduct.name || newProduct.price === undefined || newProduct.price === 0 || newProduct.quantity === undefined || newProduct.quantity === 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {editingProduct ? 'Update Product' : 'List Product'}
                </button>
              </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

