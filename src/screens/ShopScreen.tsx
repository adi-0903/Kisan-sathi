import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Search, ShoppingCart, Star, Package, Sprout, TestTube, Bug, Wheat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

type Category = 'All' | 'Seeds' | 'Fertilizers' | 'Pesticides' | 'Feed';

interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  rating: number;
  reviews: number;
  icon: React.ReactNode;
}

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Premium Wheat Seeds HD-3086', category: 'Seeds', price: 450, rating: 4.8, reviews: 124, icon: <Sprout size={40} className="text-emerald-500" /> },
  { id: '2', name: 'Organic Urea Fertilizer (50kg)', category: 'Fertilizers', price: 266, rating: 4.5, reviews: 89, icon: <TestTube size={40} className="text-amber-500" /> },
  { id: '3', name: 'Neem Oil Biopesticide (1L)', category: 'Pesticides', price: 320, rating: 4.2, reviews: 56, icon: <Bug size={40} className="text-red-500" /> },
  { id: '4', name: 'High-Yield Rice Seeds (10kg)', category: 'Seeds', price: 850, rating: 4.9, reviews: 210, icon: <Sprout size={40} className="text-emerald-500" /> },
  { id: '5', name: 'NPK 19:19:19 Water Soluble (1kg)', category: 'Fertilizers', price: 180, rating: 4.6, reviews: 75, icon: <TestTube size={40} className="text-amber-500" /> },
  { id: '6', name: 'Premium Cattle Feed Pellets (50kg)', category: 'Feed', price: 1200, rating: 4.7, reviews: 150, icon: <Wheat size={40} className="text-yellow-600" /> },
];

export function ShopScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pb-safe">
      <header className="bg-white dark:bg-gray-800 px-5 pt-12 pb-4 shadow-sm z-10 sticky top-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate(-1)} 
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('shop_title')}</h1>
          </div>
          <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-secondary text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">
                {cartCount}
              </span>
            )}
          </button>
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
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="bg-gray-100 dark:bg-gray-700/50 h-32 flex items-center justify-center p-4">
                {product.icon}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                  {product.category}
                </span>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight mb-2 flex-1">
                  {product.name}
                </h3>
                <div className="flex items-center space-x-1 mb-3">
                  <Star size={14} className="text-amber-400 fill-current" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{product.rating}</span>
                  <span className="text-xs text-gray-400">({product.reviews})</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-gray-900 dark:text-white">
                    ₹{product.price}
                  </span>
                  <button 
                    onClick={() => setCartCount(prev => prev + 1)}
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
    </div>
  );
}

function PlusIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
