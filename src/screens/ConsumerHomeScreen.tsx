import React, { useState, useEffect } from 'react';
import { dbClient } from '../lib/dbClient';
import { useAuth, User } from '../lib/AuthContext';
import { useSubscription } from '../lib/subscription';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MapPin, Package, Clock, CheckCircle, Database, Search, Filter, ShieldCheck, Heart, User as UserIcon, HelpCircle, Users, Download, Plus, X, Sprout, TestTube, Bug, Wheat, Leaf, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoPngBase64 } from '../lib/pdfLogo';

export function ConsumerHomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isExpired, daysLeft } = useSubscription();
  const [activeTab, setActiveTab] = useState<'shop' | 'orders' | 'agri_inputs'>('shop');
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

  // Agri Inputs Management
  const [agriInputs, setAgriInputs] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInput, setEditingInput] = useState<any>(null);
  const [newInput, setNewInput] = useState<any>({
    name: '',
    category: 'Seeds',
    price: 0,
    unit: 'kg',
    quantity: 0,
    status: 'Listed'
  });

  const showNotification = (msg: string, isErr = false) => {
    setNotification({ message: msg, isError: isErr });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Fetch products
  useEffect(() => {
    if (activeTab === 'shop') {
      const unsub = dbClient.subscribe('products', [
        { field: 'status', op: '==', value: 'Listed' },
        { field: 'isAgriInput', op: '!=', value: true } // Don't show agri inputs in consumer shop
      ], (items) => {
        setProducts(items.filter(i => !i.isAgriInput));
      });
      return () => unsub();
    }
  }, [activeTab]);

  useEffect(() => {
    if (user && activeTab === 'agri_inputs') {
      const unsub = dbClient.subscribe('products', [
        { field: 'supplierId', op: '==', value: user.uid },
        { field: 'isAgriInput', op: '==', value: true }
      ], (items) => {
        setAgriInputs(items);
      });
      return () => unsub();
    }
  }, [user, activeTab]);

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
      if (product.quantity !== undefined && existing.quantity >= product.quantity) {
        showNotification(`Only ${product.quantity} ${product.unit} available`, true);
        return;
      }
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (product.quantity !== undefined && product.quantity <= 0) {
        showNotification(`Out of stock`, true);
        return;
      }
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

        // Decrement product quantity
        for (const item of items) {
          if (item.product.quantity !== undefined) {
            const newQuantity = Math.max(0, item.product.quantity - item.quantity);
            await dbClient.update('products', item.product.id, {
              quantity: newQuantity,
              status: newQuantity === 0 ? 'Out of Stock' : (item.product.status || 'Listed')
            });
          }
        }
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

  // Agri Input Handlers
  const handleSaveAgriInput = async () => {
    if (!newInput.name || !newInput.price || newInput.quantity === undefined || !user) return;
    
    try {
      if (editingInput) {
        await dbClient.update('products', editingInput.id, {
          name: newInput.name,
          category: newInput.category || 'Seeds',
          price: Number(newInput.price),
          unit: newInput.unit || 'kg',
          quantity: Number(newInput.quantity),
        });
      } else {
        await dbClient.add('products', {
          supplierId: user.uid,
          name: newInput.name,
          category: newInput.category || 'Seeds',
          price: Number(newInput.price),
          unit: newInput.unit || 'kg',
          quantity: Number(newInput.quantity),
          isAgriInput: true,
          status: 'Listed',
          createdAt: new Date().toISOString()
        });
      }

      setShowAddModal(false);
      setEditingInput(null);
      setNewInput({
        name: '',
        category: 'Seeds',
        price: 0,
        unit: 'kg',
        quantity: 0,
        status: 'Listed'
      });
      showNotification('Agri input saved successfully');
    } catch (e) {
      console.error(e);
      showNotification('Error saving agri input', true);
    }
  };

  const handleDeleteAgriInput = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await dbClient.delete('products', id);
        showNotification('Listing deleted');
      } catch (e) {
        console.error(e);
        showNotification('Error deleting listing', true);
      }
    }
  };

  const handleToggleAgriInputStock = async (p: any) => {
    try {
      await dbClient.update('products', p.id, {
        status: p.status === 'Listed' ? 'Out of Stock' : 'Listed'
      });
    } catch (e) {
      console.error(e);
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

  const generateOrderBill = async (order: any) => {
    const doc = new jsPDF();
    const logoUrl = await getLogoPngBase64();

    // 1. Header with brand color
    doc.setFillColor(5, 150, 105); // emerald-600
    doc.rect(0, 0, 210, 45, 'F');
    
    // Add Logo
    if (logoUrl) {
      doc.addImage(logoUrl, 'PNG', 14, 10, 25, 25);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text('KisanSaathi Fresh', 45, 24);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Official Order Invoice', 45, 32);
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text('KisanSaathi Fresh', 14, 24);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Official Order Invoice', 14, 32);
    }

    // 2. Order Metadata
    doc.setTextColor(55, 65, 81); // gray-700
    doc.setFontSize(10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 14, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(order.buyerName || user?.name || 'Customer', 14, 66);
    doc.text(order.deliveryAddress, 14, 72);
    if (order.buyerPhone) doc.text(`Phone: ${order.buyerPhone}`, 14, 78);

    doc.setFont('helvetica', 'bold');
    doc.text('ORDER DETAILS:', 120, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order ID: #${order.id?.slice(0, 8).toUpperCase()}`, 120, 66);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 120, 72);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', 120, 78);
    const isPaid = order.paymentStatus === 'Done';
    doc.setTextColor(isPaid ? 22 : 202, isPaid ? 163 : 138, isPaid ? 74 : 4); // green-600 : yellow-600
    doc.text(isPaid ? 'PAID' : 'PENDING', 135, 78);
    
    // 3. Table using autotable
    const tableData = order.items.map((item: any) => [
      item.productName,
      `${item.quantity} ${item.unit || ''}`,
      `Rs. ${item.price}`,
      `Rs. ${item.totalAmount}`
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['Item Description', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 6, textColor: [55, 65, 81] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { top: 10, left: 14, right: 14 },
    });

    // 4. Totals summary
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY || 150;
    
    doc.setFillColor(243, 244, 246);
    doc.rect(120, finalY + 10, 76, 25, 'F');
    
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', 125, finalY + 26);
    
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(14);
    doc.text(`Rs. ${order.totalAmount}`, 160, finalY + 26);

    // 5. Footer
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for supporting local Indian farmers!', 105, 280, { align: 'center' });

    doc.save(`KisanSaathi_Invoice_${order.id?.slice(0, 8)}.pdf`);
  };

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
            <button 
              onClick={() => setActiveTab('agri_inputs')}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === 'agri_inputs' ? 'bg-white text-emerald-900 shadow-md transform scale-[1.01]' : 'text-emerald-100 hover:text-white'}`}
            >
              Sell Agri Inputs
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
                      {p.quantity !== undefined && p.quantity > 0 && (
                        <div className="text-[10px] font-medium text-gray-500 mt-1">
                          Available: {p.quantity} {p.unit}
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
                  <div className="flex justify-between items-center pt-2">
                    {o.paymentStatus === 'Done' ? (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold border border-green-200">Payment: Done</span>
                    ) : (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold border border-yellow-200">Payment: Pending</span>
                    )}
                    <button 
                      onClick={() => generateOrderBill(o)}
                      className="text-[10px] bg-emerald-600 text-white flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold shadow hover:bg-emerald-700"
                    >
                      <Download size={12} /> Generate Bill
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'agri_inputs' && (
          <div className="space-y-4">
            <button 
              onClick={() => {
                setEditingInput(null);
                setNewInput({
                  name: '',
                  category: 'Seeds',
                  price: 0,
                  unit: 'kg',
                  quantity: 0,
                  status: 'Listed'
                });
                setShowAddModal(true);
              }}
              className="w-full bg-emerald-50 text-emerald-600 border border-emerald-200 border-dashed rounded-xl p-4 flex items-center justify-center space-x-2 font-bold transition-colors hover:bg-emerald-100"
            >
              <Plus size={20} />
              <span>Add New Agri Input</span>
            </button>

            {agriInputs.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                <Store size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-800">No Agri Inputs Listed</h3>
                <p className="text-sm text-gray-500 mt-1">List seeds, fertilizers or equipment to sell to farmers.</p>
              </div>
            ) : (
              agriInputs.map(p => (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex">
                  <div className="w-28 h-28 relative flex-shrink-0 bg-gray-50 flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover p-2 rounded-2xl" />
                    ) : (
                      <div className="text-emerald-300">
                        {p.category === 'Fertilizers' && <Package size={40} />}
                        {p.category === 'Seeds' && <Leaf size={40} />}
                        {p.category === 'Pesticides' && <Bug size={40} />}
                        {p.category === 'Feed' && <Wheat size={40} />}
                        {!['Fertilizers', 'Seeds', 'Pesticides', 'Feed'].includes(p.category) && <Sprout size={40} />}
                      </div>
                    )}
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {p.status}
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 leading-tight">{p.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{p.category} &bull; {p.quantity} {p.unit} left</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-lg font-bold text-emerald-600">
                        ₹{p.price}<span className="text-sm text-gray-500 font-normal">/{p.unit}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <button onClick={() => handleToggleAgriInputStock(p)} className={`px-2 py-1 text-[10px] font-bold rounded-lg ${p.status === 'Listed' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {p.status === 'Listed' ? 'Out of Stock' : 'List'}
                        </button>
                        <button onClick={() => {
                          setEditingInput(p);
                          setNewInput({ name: p.name, category: p.category, price: p.price, unit: p.unit, quantity: p.quantity, status: p.status });
                          setShowAddModal(true);
                        }} className="px-2 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-lg hover:bg-gray-200">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteAgriInput(p.id)} className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-lg hover:bg-red-200">
                          Delete
                        </button>
                      </div>
                    </div>
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
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-xl"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-800">{editingInput ? 'Edit Agri Input' : 'New Agri Input'}</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-800">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSaveAgriInput(); }} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    value={newInput.name}
                    onChange={(e) => setNewInput({...newInput, name: e.target.value})}
                    placeholder="e.g. Organic Urea (50kg)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                    <select 
                      value={newInput.category}
                      onChange={(e) => setNewInput({...newInput, category: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option>Seeds</option>
                      <option>Fertilizers</option>
                      <option>Pesticides</option>
                      <option>Feed</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Unit</label>
                    <select 
                      value={newInput.unit}
                      onChange={(e) => setNewInput({...newInput, unit: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option>kg</option>
                      <option>gram</option>
                      <option>liter</option>
                      <option>ml</option>
                      <option>bag</option>
                      <option>packet</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Price (₹)</label>
                    <input 
                      type="number" 
                      value={newInput.price || ''}
                      onChange={(e) => setNewInput({...newInput, price: Number(e.target.value)})}
                      placeholder="e.g. 500"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Quantity</label>
                    <input 
                      type="number" 
                      value={newInput.quantity || ''}
                      onChange={(e) => setNewInput({...newInput, quantity: Number(e.target.value)})}
                      placeholder="e.g. 10"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-gray-100">
                  <button 
                    type="submit"
                    disabled={!newInput.name || newInput.price === undefined || newInput.price === 0 || newInput.quantity === undefined || newInput.quantity === 0}
                    className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {editingInput ? 'Update Agri Input' : 'List Agri Input'}
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
