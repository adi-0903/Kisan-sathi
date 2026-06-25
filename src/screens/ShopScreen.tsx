import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Search, Filter, Plus as PlusIcon, CheckCircle, Package, Leaf, Bug, Wheat, Star, ChevronLeft, Sprout, TestTube, MapPin, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { dbClient } from '../lib/dbClient';

type Category = 'All' | 'Seeds' | 'Fertilizers' | 'Pesticides' | 'Feed';

interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  rating: number;
  reviews: number;
  icon: React.ReactNode;
  unit: string;
  image?: string;
  supplierId?: string;
}

export function ShopScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [address, setAddress] = useState(user?.village || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notification, setNotification] = useState<string | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const unsub = dbClient.subscribe('products', [
      { field: 'isAgriInput', op: '==', value: true },
      { field: 'status', op: '==', value: 'Listed' }
    ], (items) => {
      setProducts(items as Product[]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user && showOrders) {
      const unsub = dbClient.subscribe('orders', [
        { field: 'buyerId', op: '==', value: user.uid },
        { field: 'isAgriInput', op: '==', value: true }
      ], (items) => {
        setOrders(items);
      });
      return () => unsub();
    }
  }, [user, showOrders]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    showToast(`Added ${product.name} to cart`);
  };

  const removeFromCart = (productId: string) => {
    const existing = cart.find(item => item.product.id === productId);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item));
    } else {
      setCart(cart.filter(item => item.product.id !== productId));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty.');
      return;
    }
    if (!address || !phone) {
      showToast('Please provide a delivery address and phone number.');
      return;
    }
    if (!user) return;
    
    try {
      // Group cart items by supplier
      const itemsBySupplier: {[key: string]: typeof cart} = {};
      cart.forEach(item => {
        // Fallback to a default if supplierId is missing (it shouldn't be with our new schema)
        const supplier = item.product.supplierId || 'agri-business-supplier';
        if (!itemsBySupplier[supplier]) itemsBySupplier[supplier] = [];
        itemsBySupplier[supplier].push(item);
      });

      for (const [supplierId, items] of Object.entries(itemsBySupplier)) {
        const orderItems = items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unit: item.product.unit,
          price: item.product.price,
          totalAmount: item.product.price * item.quantity
        }));
        
        const subTotalAmount = orderItems.reduce((sum, item) => sum + item.totalAmount, 0);

        await dbClient.add('orders', {
          buyerId: user.uid,
          buyerName: user.name || 'Farmer',
          buyerPhone: phone,
          deliveryAddress: address,
          supplierId: supplierId,
          items: orderItems,
          totalAmount: subTotalAmount,
          status: 'Pending',
          paymentStatus: 'Pending',
          isAgriInput: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Decrement product quantity
        for (const item of items) {
          if (item.product.quantity !== undefined) {
            const newQuantity = Math.max(0, item.product.quantity - item.quantity);
            await dbClient.update('products', item.product.id, {
              quantity: newQuantity,
              status: newQuantity === 0 ? 'Out of Stock' : 'Listed'
            });
          }
        }
      }

      setCart([]);
      setShowCheckout(false);
      showToast('Order placed successfully! Check your orders.');
    } catch (error) {
      console.error(error);
      showToast('Failed to place order.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <AnimatePresence>
        {notification && (
          <motion.div 
            key="toast-notification"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto"
          >
            <div className="p-4 rounded-xl shadow-lg border text-sm font-bold flex items-center space-x-2 bg-emerald-50 text-emerald-800 border-emerald-100">
              <CheckCircle size={18} className="text-emerald-600" />
              <span>{notification}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white dark:bg-gray-800 px-5 pt-12 pb-4 shadow-sm z-10 sticky top-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate(-1)} 
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('shop_title', 'Agri Input Store')}</h1>
          </div>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setShowOrders(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <Package size={24} />
            </button>
            <button 
              onClick={() => { if (cartCount > 0) setShowCheckout(true); }}
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-secondary text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">
                {cartCount}
              </span>
            )}
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary transition-colors"
            placeholder="Search seeds, fertilizers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
          {(['All', 'Seeds', 'Fertilizers', 'Pesticides', 'Feed'] as Category[]).map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === category
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 p-5">
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="bg-gray-100 dark:bg-gray-700/50 h-32 flex items-center justify-center p-4">
                {p.image ? <img src={p.image} className="h-full w-full object-cover" /> : p.icon}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                  {p.category}
                </span>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight mb-2 flex-1">
                  {p.name}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-yellow-500 flex items-center text-xs font-bold">
                    ★ {p.rating || 'New'}
                  </span>
                  {p.reviews > 0 && <span className="text-[10px] text-gray-400">({p.reviews})</span>}
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-gray-900 dark:text-white">
                    ₹{p.price}
                  </span>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(p); }}
                    className="p-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-colors"
                  >
                    <PlusIcon size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-2 text-center py-12 text-gray-500 dark:text-gray-400">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium">No products found</p>
              <p className="text-sm mt-1">Try a different search term or category</p>
            </div>
          )}
        </div>
      </div>

      {cartCount > 0 && !showCheckout && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40 max-w-md mx-auto">
          <motion.button 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => setShowCheckout(true)}
            className="w-full bg-primary text-white rounded-2xl p-4 shadow-xl flex items-center justify-between border border-primary/50 hover:bg-primary/90"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
                {cartCount}
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white">Checkout Cart</span>
            </div>
            <div className="font-black text-white">₹{cartTotal}</div>
          </motion.button>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-5 pb-8 overflow-y-auto max-h-[90vh] shadow-2xl relative border-t-4 border-primary"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-gray-800 dark:text-white">Checkout Cart</h2>
              <button onClick={() => setShowCheckout(false)} className="text-gray-400 dark:text-gray-500 font-extrabold hover:text-gray-700 dark:hover:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600">Dismiss</button>
            </div>

            <div className="space-y-3 mb-6">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-2xl border border-gray-100 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border dark:border-gray-600">
                        {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover p-2 rounded-2xl" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.product.category === 'Fertilizers' && <Package size={40} className="text-emerald-600" />}
                          {item.product.category === 'Seeds' && <Leaf size={40} className="text-green-500" />}
                          {item.product.category === 'Pesticides' && <Bug size={40} className="text-red-500" />}
                          {item.product.category === 'Feed' && <Wheat size={40} className="text-yellow-600" />}
                        </div>
                      )}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-gray-800 dark:text-gray-200 leading-tight">{item.product.name}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-0.5">₹{item.product.price}/{item.product.unit}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-600 shadow-inner px-2.5">
                       <button onClick={() => removeFromCart(item.product.id)} className="text-gray-500 font-extrabold text-sm px-1.5 hover:text-red-500">-</button>
                       <span className="font-extrabold text-xs dark:text-gray-200">{item.quantity}</span>
                       <button onClick={() => addToCart(item.product)} className="text-primary font-extrabold text-sm px-1.5 hover:text-primary-light">+</button>
                    </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-1.5">Deliver to address</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary text-gray-800 dark:text-gray-100" 
                    placeholder="Provide full delivery address" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 mb-1.5">Contact phone</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary text-gray-800 dark:text-gray-100" 
                  placeholder="Receiver mobile number" 
                />
              </div>
            </div>

            <button 
              onClick={placeOrder}
              className="w-full bg-primary hover:bg-primary-dark text-white font-black rounded-2xl py-4 flex items-center justify-center gap-2 hover:shadow-lg transition-all"
            >
              Confirm Purchase • ₹{cartTotal}
            </button>
          </motion.div>
        </div>
      )}

      {/* Orders History Modal */}
      {showOrders && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-5 pb-8 overflow-y-auto max-h-[90vh] shadow-2xl relative border-t-4 border-emerald-500"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-gray-800 dark:text-white">My Orders</h2>
              <button onClick={() => setShowOrders(false)} className="text-gray-400 dark:text-gray-500 font-extrabold hover:text-gray-700 dark:hover:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600">Close</button>
            </div>
            
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400 font-medium">No orders placed yet.</div>
              ) : (
                orders.map(o => (
                  <div key={o.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-[10px] font-black text-gray-400 dark:text-gray-500">ORDER NO. #{o.id?.slice(0,8).toUpperCase()}</div>
                        <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-0.5">₹{o.totalAmount}</div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className={`text-[10px] px-2 py-1 rounded font-bold mb-1 border ${
                          o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                          o.status === 'Dispatched' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          o.status === 'Accepted' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                        }`}>
                          {o.status || 'Pending'}
                        </div>
                        <div className={`text-[10px] px-2 py-1 rounded font-bold border ${
                          o.paymentStatus === 'Done' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}>
                          Payment: {o.paymentStatus || 'Pending'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      {o.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                          <span>{item.productName} (x{item.quantity})</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}


