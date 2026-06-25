import React, { useState, useEffect } from 'react';
import { dbClient } from '../lib/dbClient';
import { useAuth, User } from '../lib/AuthContext';
import { useSubscription } from '../lib/subscription';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MapPin, Package, Clock, CheckCircle, Database, Search, Filter, ShieldCheck, Heart, User as UserIcon, HelpCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConsumerHomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isExpired, daysLeft } = useSubscription();
  const [activeTab, setActiveTab] = useState<'shop' | 'orders'>('shop');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<{product: any, quantity: number}[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState(user?.village || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [mySubs, setMySubs] = useState<any[]>([]);
  
  // Society Cart
  const [isGroupBuy, setIsGroupBuy] = useState(false);
  const [societyCode, setSocietyCode] = useState('');
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Custom dialog notifications
  const [notification, setNotification] = useState<{message: string, isError?: boolean} | null>(null);

  const showNotification = (msg: string, isErr = false) => {
    setNotification({ message: msg, isError: isErr });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Fetch products
  useEffect(() => {
    if (activeTab === 'shop') {
      const unsub = dbClient.subscribe('products', [{ field: 'status', op: '==', value: 'Listed' }], (items) => {
        setProducts(items);
      });
      return () => unsub();
    }
  }, [activeTab]);

  // Fetch orders
  useEffect(() => {
    if (user && activeTab === 'orders') {
      const unsub = dbClient.subscribe('orders', [{ field: 'buyerId', op: '==', value: user.uid }], (items) => {
        setOrders(items);
      });
      return () => unsub();
    }
  }, [user, activeTab]);

  // Fetch subscriptions
  useEffect(() => {
    if (user) {
      const unsub = dbClient.subscribe('subscriptions', [{ field: 'consumerId', op: '==', value: user.uid }], (items) => {
        setMySubs(items);
      });
      return () => unsub();
    }
  }, [user]);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    showNotification(`Added ${product.name} to cart`);
  };

  const removeFromCart = (productId: string) => {
    const existing = cart.find(item => item.product.id === productId);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item));
    } else {
      setCart(cart.filter(item => item.product.id !== productId));
    }
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartTotal = isGroupBuy ? Math.floor(cartSubtotal * 0.85) : cartSubtotal;

  const placeOrder = async () => {
    if (!user || cart.length === 0 || !address || !phone) return;
    
    // Check Limits
    let monthlyLimitKg = 500; // 5 quintals free mode limit
    let yearlyLimitKg = Infinity;
    const hasMonthly = mySubs.some(s => s.interval === 'month' && s.status === 'Active');
    const hasYearly = mySubs.some(s => s.interval === 'year' && s.status === 'Active');

    if (hasYearly) {
      yearlyLimitKg = 3000; // 30 quintal yearly
      monthlyLimitKg = Infinity;
    } else if (hasMonthly) {
      monthlyLimitKg = 1500; // 15 quintal monthly
    } else if (!isExpired) {
      monthlyLimitKg = Infinity; // No limit during 30 days free trial
    }

    const calcKg = (list: any[]) => list.reduce((s, o) => s + (o.items || []).reduce((isum: number, item: any) => 
      isum + (item.unit === 'kg' ? item.quantity : item.unit === 'g' ? item.quantity / 1000 : item.unit === 'quintal' ? item.quantity * 100 : item.unit === 'liter' ? item.quantity : item.quantity), 0), 0);
    
    const cartKg = cart.reduce((isum: number, item: any) => 
      isum + (item.product.unit === 'kg' ? item.quantity : item.product.unit === 'g' ? item.quantity / 1000 : item.product.unit === 'quintal' ? item.quantity * 100 : item.product.unit === 'liter' ? item.quantity : item.quantity), 0);

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();

    const currentMonthOrders = orders.filter(o => new Date(o.createdAt?.toDate?.() || o.createdAt || Date.now()).getTime() >= monthStart);
    const currentYearOrders = orders.filter(o => new Date(o.createdAt?.toDate?.() || o.createdAt || Date.now()).getTime() >= yearStart);

    const monthKg = calcKg(currentMonthOrders);
    const yearKg = calcKg(currentYearOrders);

    if (hasYearly && (yearKg + cartKg > yearlyLimitKg)) {
      showNotification(`Yearly limit of 30 quintal exceeded. You have ${Math.max(0, yearlyLimitKg - yearKg).toFixed(1)} kg remaining this year.`, true);
      return;
    } else if (hasMonthly && (monthKg + cartKg > monthlyLimitKg)) {
      showNotification(`Monthly limit of 15 quintal exceeded. You have ${Math.max(0, monthlyLimitKg - monthKg).toFixed(1)} kg remaining this month.`, true);
      return;
    } else if (!hasYearly && !hasMonthly && isExpired && (monthKg + cartKg > monthlyLimitKg)) {
      if (window.confirm(`Free monthly limit of 5 quintal exceeded! Subscribe to a premium plan to continue purchasing?`)) {
        navigate('/subscriptions');
      }
      return;
    }

    // Group cart items by supplier
    const itemsBySupplier: {[key: string]: typeof cart} = {};
    cart.forEach(item => {
      if (!itemsBySupplier[item.product.supplierId]) itemsBySupplier[item.product.supplierId] = [];
      itemsBySupplier[item.product.supplierId].push(item);
    });

    try {
      // Create an order per supplier
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
        const totalAmount = isGroupBuy ? Math.floor(subTotalAmount * 0.85) : subTotalAmount;

        await dbClient.add('orders', {
          buyerId: user.uid,
          buyerName: user.name,
          buyerPhone: phone,
          deliveryAddress: address,
          supplierId,
          items: orderItems,
          totalAmount,
          isGroupBuy,
          societyCode: isGroupBuy ? societyCode : null,
          status: 'Pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      setCart([]);
      setShowCheckout(false);
      setActiveTab('orders');
      setIsGroupBuy(false);
      setSocietyCode('');
      showNotification('Order placed successfully! Track status in My Orders.');
    } catch (error) {
      console.error(error);
      showNotification('Failed to place order', true);
    }
  };

  // Filter products by search and category list
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy'];

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto"
          >
            <div className={`p-4 rounded-xl shadow-lg border text-sm font-bold flex items-center space-x-2 ${notification.isError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'}`}>
              <ShieldCheck size={18} className={notification.isError ? 'text-red-500' : 'text-emerald-600'} />
              <span>{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-gradient-to-br from-[#064E3B] to-[#047857] shadow-xl text-white rounded-b-[28px] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl" />
        
        <div className="px-5 pt-8 pb-6 relative z-10">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-200 bg-white/10 px-2.5 py-1 rounded-full">Consumer Storefront</span>
            <span className="text-xs font-bold text-emerald-100 flex items-center gap-1">
              <MapPin size={12} className="text-yellow-300" /> {user?.village || 'India'}
            </span>
          </div>
          
          <h1 className="text-2xl font-black tracking-tight mt-2">KisanSaathi Fresh</h1>
          <p className="text-xs text-emerald-100 mt-1 opacity-90">Enjoy direct-from-farm organic purity and support rural agriculture</p>
          
          <div className="flex bg-black/15 backdrop-blur-md rounded-2xl p-1 mt-5 border border-white/10 shadow-inner">
            <button 
              onClick={() => setActiveTab('shop')}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === 'shop' ? 'bg-white text-emerald-900 shadow-md transform scale-[1.01]' : 'text-emerald-100 hover:text-white'}`}
            >
              Browse Shop
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === 'orders' ? 'bg-white text-emerald-900 shadow-md transform scale-[1.01]' : 'text-emerald-100 hover:text-white'}`}
            >
              My Orders ({orders.length})
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-5">
        {activeTab === 'shop' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search tomatoes, fresh cow milk, grains..."
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
              </div>

              {/* Categories scroll */}
              <div className="flex space-x-2 overflow-x-auto no-scrollbar py-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedCategory === cat 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.length === 0 ? (
                <div className="col-span-2 text-center py-14 bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
                  <Package size={44} className="mx-auto text-gray-300 mb-3" />
                  <h3 className="font-bold text-gray-800">No Farm Products Found</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-6 leading-relaxed">No produce matching your filter is currently available.</p>
                </div>
              ) : (
                filteredProducts.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="relative mb-2.5">
                        <img src={p.image} alt={p.name} className="w-full h-28 object-cover rounded-xl bg-gray-100" />
                        {p.certified && (
                          <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md flex items-center shadow-lg">
                            <ShieldCheck size={8} className="mr-0.5" /> Organic
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                          {p.category}
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-gray-800 text-sm leading-snug truncate">{p.name}</h3>
                      {p.description && (
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 leading-normal font-medium">{p.description}</p>
                      )}
                      
                      {p.farmerName && (
                        <div className="flex items-center space-x-1 mt-1 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded w-max">
                          <UserIcon size={9} />
                          <span>Mfd: {p.farmerName.split(' ')[0]}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
                      <div className="text-base font-black text-emerald-700">₹{p.price}<span className="text-[9px] font-normal text-gray-500 ml-0.5">/{p.unit}</span></div>
                      {p.status === 'Out of Stock' ? (
                        <div className="text-[10px] font-bold text-red-500 px-2 py-1 bg-red-50 rounded-md">Out of Stock</div>
                      ) : (
                        <button 
                          onClick={() => addToCart(p)}
                          className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold hover:bg-emerald-700 shadow-sm hover:scale-105 active:scale-95 transition-all text-sm"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Support Highlight Widget */}
            <div className="bg-gradient-to-tr from-amber-50 to-amber-100/50 p-4 rounded-3xl border border-amber-200/50 flex items-start space-x-3.5 mt-2">
              <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-2xl font-black">🌱</div>
              <div>
                <h4 className="text-xs font-black text-amber-900">Direct From India's Soil</h4>
                <p className="text-[10px] text-amber-800 mt-1 leading-normal font-medium">100% of order totals are directly disbursed to verified farmers, reinforcing sustainable rural wealth. Zero intermediary margins.</p>
              </div>
            </div>

            {/* Society Cart Promo Widget */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-3xl border border-emerald-400 shadow-md flex items-center justify-between text-white mt-4">
              <div>
                <h4 className="text-sm font-black flex items-center gap-1.5"><Package size={16} /> Society Cart</h4>
                <p className="text-[10px] text-emerald-100 mt-1 font-medium leading-relaxed max-w-[200px]">Pool orders with neighbors. Lower carbon footprints and get <span className="font-black bg-white/20 px-1 rounded">15% OFF</span> delivery!</p>
              </div>
              <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm shadow-sm border border-white/10">
                <Users size={24} className="text-white" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
                <ShoppingBag size={44} className="mx-auto text-gray-350 mb-3" />
                <h3 className="font-bold text-gray-800">No Purchases Recorded</h3>
                <p className="text-xs text-gray-500 mt-1">Place an order directly from the shop directory to track milestones.</p>
              </div>
            ) : (
              orders.map(o => (
                <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col space-y-3.5">
                  <div className="flex justify-between items-center pb-2.5 border-b border-gray-50">
                    <div>
                      <div className="text-xs font-bold text-gray-400">ORDER NO.</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-black text-gray-800">#{o.id?.slice(0, 8).toUpperCase()}</div>
                        {o.isGroupBuy && (
                          <span className="bg-teal-50 text-teal-600 border border-teal-100 text-[8px] px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                            <Users size={8} /> Society Drop
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`text-[10px] px-2.5 py-1 rounded-full font-black flex items-center gap-1 shadow-sm
                      ${o.status === 'Pending' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                        o.status === 'Accepted' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                        o.status === 'Dispatched' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 
                        'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}
                    >
                      {o.status === 'Delivered' ? <CheckCircle size={10}/> : <Clock size={10}/>}
                      {o.status}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {o.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-700 font-semibold flex items-center gap-1.5">
                          <span className="bg-gray-100 text-gray-850 px-1.5 py-0.5 rounded font-bold text-[9px]">{item.quantity}x</span> 
                          {item.productName}
                        </span>
                        <span className="font-extrabold text-gray-800">₹{item.totalAmount}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Progress Timeline */}
                  <div className="pt-2 border-t border-gray-50">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold mb-2">
                      <span>Order Timeline</span>
                      <span className="text-emerald-700">Live Status</span>
                    </div>
                    <div className="grid grid-cols-4 gap-0.5 relative pt-1">
                      {/* Progress Line Background */}
                      <div className="absolute top-3.5 left-6 right-6 h-1 bg-gray-100 z-0 rounded-full" />
                      {/* Active Progress Line */}
                      <div className={`absolute top-3.5 left-6 h-1 bg-emerald-600 z-0 transition-all rounded-full`} style={{
                        width: o.status === 'Pending' ? '0%' : o.status === 'Accepted' ? '33%' : o.status === 'Dispatched' ? '66%' : '100%'
                      }} />

                      {[
                        { label: 'Placed', stepStatus: 'Pending', stepIndex: 0 },
                        { label: 'Accepted', stepStatus: 'Accepted', stepIndex: 1 },
                        { label: 'Transit', stepStatus: 'Dispatched', stepIndex: 2 },
                        { label: 'Delivered', stepStatus: 'Delivered', stepIndex: 3 },
                      ].map((step, idx) => {
                        const statuses = ['Pending', 'Accepted', 'Dispatched', 'Delivered'];
                        const currentIdx = statuses.indexOf(o.status || 'Pending');
                        const isDone = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;
                        return (
                          <div key={idx} className="flex flex-col items-center text-center z-10">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black transition-colors ${
                              isDone ? 'bg-emerald-600 text-white' : 'bg-gray-150 text-gray-400'
                            } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}>
                              {idx + 1}
                            </div>
                            <span className={`text-[9px] mt-1 font-bold ${isDone ? 'text-emerald-700' : 'text-gray-450'}`}>{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-50 text-sm">
                    <div className="text-[10px] font-black text-gray-400 flex items-center gap-1">
                      <MapPin size={10} className="text-gray-400" /> Deliver to: {o.deliveryAddress?.slice(0, 30)}
                    </div>
                    <div className="text-base font-black text-emerald-800">₹{o.totalAmount}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Cart FAB */}
      {cart.length > 0 && !showCheckout && activeTab === 'shop' && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40 max-w-md mx-auto">
          <motion.button 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => setShowCheckout(true)}
            className="w-full bg-emerald-950 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between border border-emerald-800"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
              <span className="font-extrabold text-sm tracking-tight text-emerald-100">Checkout Cart Bag</span>
            </div>
            <div className="font-black text-emerald-300">₹{cartTotal}</div>
          </motion.button>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-5 pb-8 overflow-y-auto max-h-[90vh] shadow-2xl relative border-t-4 border-emerald-600"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-gray-800">Checkout Basket</h2>
              <button onClick={() => setShowCheckout(false)} className="text-gray-400 dark:text-gray-500 font-extrabold hover:text-gray-700 text-sm bg-gray-50 px-3 py-1.5 rounded-xl border">Dismiss</button>
            </div>

            <div className="space-y-3 mb-6">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <img src={item.product.image} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white border" />
                      <div>
                        <div className="font-extrabold text-sm text-gray-800 leading-tight">{item.product.name}</div>
                        <div className="text-[10px] text-gray-500 font-bold mt-0.5">₹{item.product.price}/{item.product.unit}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-200 shadow-inner px-2.5">
                       <button onClick={() => removeFromCart(item.product.id)} className="text-gray-500 font-extrabold text-sm px-1.5 hover:text-red-500">-</button>
                       <span className="font-extrabold text-xs">{item.quantity}</span>
                       <button onClick={() => addToCart(item.product)} className="text-emerald-700 font-extrabold text-sm px-1.5 hover:text-emerald-500">+</button>
                    </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-1.5">Deliver to address</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-850" 
                    placeholder="Provide full urban billing/delivery address" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 mb-1.5">Recipient contact phone</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-850" 
                  placeholder="Receiver mobile number" 
                />
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-emerald-900 flex items-center gap-1"><Users size={16} /> Group Buy (Society Cart)</h4>
                    <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Pool delivery & get 15% off cart total</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isGroupBuy} onChange={e => setIsGroupBuy(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                
                <AnimatePresence>
                  {isGroupBuy && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <label className="block text-xs font-black text-emerald-800 mb-1.5 mt-2">Society / Apartment Code</label>
                      <input 
                        type="text" 
                        value={societyCode} 
                        onChange={e => setSocietyCode(e.target.value)} 
                        className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-850" 
                        placeholder="e.g. GREENWOODS-A" 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <button 
              onClick={placeOrder}
              disabled={!address || !phone || cart.length === 0}
              className="w-full bg-gradient-to-r from-emerald-700 to-emerald-600 text-white font-black rounded-2xl py-4 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg transition-all"
            >
              Confirm Purchase • ₹{cartTotal}
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
