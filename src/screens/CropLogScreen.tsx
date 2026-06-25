import React, { useState } from 'react';
import { 
  ChevronLeft, Plus, X, Trash2, Sprout, Pencil, 
  Droplets, FlaskConical, Shield, Eye, Clipboard, 
  Calendar, Ruler, CheckCircle, HelpCircle, AlertCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSyncState } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  { id: 'fertilizer', label: 'Fertilizer (खाद)', icon: '🧪', defaultTitle: 'Fertilizer Applied', placeholder: 'e.g. Applied 2 bags of Urea (100 kg total).' },
  { id: 'irrigation', label: 'Irrigation (सिंचाई)', icon: '💧', defaultTitle: 'Irrigation', placeholder: 'e.g. Watered the entire field for 4 hours.' },
  { id: 'pesticide', label: 'Pesticide Spray (कीटनाशक)', icon: '🛡️', defaultTitle: 'Pesticide Sprayed', placeholder: 'e.g. Sprayed Neem Oil solution for aphid prevention.' },
  { id: 'weeding', label: 'Weeding (निराई-गुड़ाई)', icon: '🌱', defaultTitle: 'Weeding Done', placeholder: 'e.g. Completed manual weeding on rows 1 to 12.' },
  { id: 'inspection', label: 'Inspection (निरीक्षण)', icon: '🔍', defaultTitle: 'Crop Inspected', placeholder: 'e.g. Crop leaves checked; growth is healthy and normal.' },
  { id: 'other', label: 'Other Work (अन्य कार्य)', icon: '📝', defaultTitle: 'Milestone logged', placeholder: 'e.g. Cleaned drainage channels, set up mulch, etc.' }
];

// Utility to parse localized date or raw date back to HTML input YYYY-MM-DD
const toInputDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch(e) {}
  return new Date().toISOString().split('T')[0];
};

const getActivityCategory = (activity: any) => {
  if (activity.category) return activity.category;
  
  const title = (activity.title || '').toLowerCase();
  if (title.includes('fertilizer') || title.includes('urea') || title.includes('dap') || title.includes('khad') || title.includes('feed') || title.includes('potash') || title.includes('nutrient')) {
    return 'fertilizer';
  }
  if (title.includes('water') || title.includes('irrigation') || title.includes('droplet') || title.includes('sinchai') || title.includes('sprinkler')) {
    return 'irrigation';
  }
  if (title.includes('spray') || title.includes('pest') || title.includes('insecticide') || title.includes('fungicide') || title.includes('chemical') || title.includes('neem')) {
    return 'pesticide';
  }
  if (title.includes('weed') || title.includes('till') || title.includes('plow') || title.includes('hoe') || title.includes('nirai') || title.includes('gudai')) {
    return 'weeding';
  }
  if (title.includes('inspect') || title.includes('check') || title.includes('health') || title.includes('look') || title.includes('visit')) {
    return 'inspection';
  }
  if (title.includes('harvest') || title.includes('yield')) {
    return 'harvest';
  }
  return 'other';
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'irrigation': return <Droplets size={16} className="text-blue-500" />;
    case 'fertilizer': return <FlaskConical size={16} className="text-emerald-500" />;
    case 'pesticide': return <Shield size={16} className="text-amber-500" />;
    case 'weeding': return <Sprout size={16} className="text-green-500" />;
    case 'inspection': return <Eye size={16} className="text-indigo-500" />;
    case 'harvest': return <CheckCircle size={16} className="text-purple-500" />;
    default: return <Clipboard size={16} className="text-gray-500" />;
  }
};

const getCategoryBg = (category: string) => {
  switch (category) {
    case 'irrigation': return 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/20';
    case 'fertilizer': return 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/20';
    case 'pesticide': return 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/20';
    case 'weeding': return 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/20';
    case 'inspection': return 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/20';
    case 'harvest': return 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/20';
    default: return 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700';
  }
};

export function CropLogScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [crops, setCrops] = useSyncState<any[]>('ks_crops', []);
  const crop = crops.find(c => c.id === Number(id));

  const [activities, setActivities] = useSyncState<any[]>('ks_activities', []);
  
  // Crop edit state
  const [showEditCrop, setShowEditCrop] = useState(false);
  const [editName, setEditName] = useState('');
  const [editVariety, setEditVariety] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editSown, setEditSown] = useState('');

  // Activity log/edit state
  const [showAdd, setShowAdd] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [showHarvest, setShowHarvest] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [yieldAmount, setYieldAmount] = useState(crop?.yield || '');

  const cropActivities = activities.filter(a => a.cropId === Number(id)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!crop) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500 mb-4">Crop not found</p>
        <button onClick={() => navigate(-1)} className="bg-primary text-white px-4 py-2 rounded-lg">Go Back</button>
      </div>
    );
  }

  const handleDeleteCrop = () => {
    if (window.confirm('Are you sure you want to delete this crop? All activities associated with it will also be deleted.')) {
      setCrops(crops.filter(c => c.id !== Number(id)));
      setActivities(activities.filter(a => a.cropId !== Number(id)));
      navigate(-1);
    }
  };

  const handleOpenEditCrop = () => {
    setEditName(crop.name);
    setEditVariety(crop.variety || 'Standard');
    setEditArea(crop.area ? crop.area.replace(/[^\d.]/g, '') : '');
    setEditSown(toInputDate(crop.sown));
    setShowEditCrop(true);
  };

  const handleSaveCropDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editSown.trim()) return;

    let displaySown = editSown;
    try {
      const d = new Date(editSown);
      if (!isNaN(d.getTime())) {
        displaySown = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch(e) {}

    const updatedCrops = crops.map(c => 
      c.id === crop.id 
        ? { 
            ...c, 
            name: editName, 
            variety: editVariety || 'Standard', 
            sown: displaySown, 
            area: editArea ? `${editArea} Acres` : '1 Acre' 
          } 
        : c
    );
    setCrops(updatedCrops);
    setShowEditCrop(false);
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim()) return;

    let displayDate = date;
    try {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch(e) {}

    if (editingActivity) {
      // Edit existing
      const updated = activities.map(a => 
        a.id === editingActivity.id 
          ? { 
              ...a, 
              title: title.trim(), 
              date: displayDate, 
              rawDate: date, 
              description: description.trim(), 
              category: selectedCategory 
            } 
          : a
      );
      setActivities(updated);
    } else {
      // Add new
      const newActivity = {
        id: Date.now(),
        cropId: crop.id,
        title: title.trim(),
        date: displayDate,
        rawDate: date,
        description: description.trim(),
        category: selectedCategory
      };
      setActivities([newActivity, ...activities]);
    }

    setShowAdd(false);
    setEditingActivity(null);
    setTitle('');
    setDate('');
    setDescription('');
    setSelectedCategory('other');
  };

  const handleEditActivityClick = (activity: any) => {
    setEditingActivity(activity);
    setTitle(activity.title);
    setDate(activity.rawDate || toInputDate(activity.date));
    setDescription(activity.description || '');
    setSelectedCategory(activity.category || getActivityCategory(activity));
    setShowAdd(true);
  };

  const handleDeleteActivity = (activityId: number) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      setActivities(activities.filter(a => a.id !== activityId));
    }
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    const catObj = CATEGORIES.find(c => c.id === catId);
    if (catObj) {
      setTitle(catObj.defaultTitle);
    }
  };

  const handleHarvest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yieldAmount) return;

    // Update crop
    const updatedCrops = crops.map(c => 
      c.id === crop.id ? { ...c, yield: yieldAmount } : c
    );
    setCrops(updatedCrops);

    // Add activity
    const newActivity = {
      id: Date.now(),
      cropId: crop.id,
      title: 'Harvested',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      rawDate: toInputDate(new Date().toISOString()),
      description: `Yield recorded: ${yieldAmount} t/ha`,
      category: 'harvest'
    };
    setActivities([newActivity, ...activities]);

    setShowHarvest(false);
  };

  const getPlaceholder = () => {
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    return cat ? cat.placeholder : 'e.g. Details about the action...';
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-[#121212] min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Crop Diary</h1>
        </div>
        <button 
          onClick={() => {
            setEditingActivity(null);
            setTitle('');
            setDate(toInputDate(new Date().toISOString()));
            setDescription('');
            setSelectedCategory('other');
            setShowAdd(true);
          }}
          className="bg-primary text-white p-2 rounded-full shadow-md hover:bg-primary-dark transition-colors active:scale-95"
          title="Add Timeline Entry"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Crop Info Card */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Crop</h2>
        <div className="flex justify-between items-start mb-4">
          <div className="text-2xl font-bold text-primary">{crop.name} {crop.variety !== 'Standard' && crop.variety}</div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleOpenEditCrop} 
              className="p-2 text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition"
              title="Edit Crop Details"
            >
              <Pencil size={18} />
            </button>
            <button 
              onClick={handleDeleteCrop} 
              className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition"
              title="Delete Crop"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Area</div>
            <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{crop.area}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Sown Date</div>
            <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{crop.sown}</div>
          </div>
        </div>

        <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-800/30">
          <div>
            <div className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider mb-1">Recorded Yield</div>
            <div className="text-sm font-bold text-green-800 dark:text-green-300">{crop.yield ? `${crop.yield} t/ha` : 'Not recorded'}</div>
          </div>
          <button onClick={() => setShowHarvest(true)} className="flex items-center text-xs font-bold text-green-700 bg-green-100 dark:bg-green-800 border border-green-200 dark:border-green-700 px-3 py-2 rounded-lg">
            <Sprout size={14} className="mr-1" /> Log Harvest
          </button>
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-3">Activity Timeline</h3>
      
      {cropActivities.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-12 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <Clipboard className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={40} />
          <p className="font-medium text-gray-600 dark:text-gray-300">No activities recorded yet.</p>
          <p className="text-xs text-gray-400 mt-1">Tap the plus (+) button to log fertilizers, irrigation, sprayings, and other events!</p>
        </div>
      ) : (
        <div className="relative pl-4 space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-600 before:to-transparent">
          {cropActivities.map((activity, i) => {
            const cat = getActivityCategory(activity);
            return (
              <div key={activity.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full border border-white dark:border-gray-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 mt-4 ${i === 0 ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-600'}`}>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <div className={`w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border ${getCategoryBg(cat)} bg-white dark:bg-gray-800 shadow-sm relative transition-all hover:shadow-md`}>
                  
                  {/* Category Indicator Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {activity.date}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center" title={cat}>
                        {getCategoryIcon(cat)}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-800 dark:text-gray-200 font-bold mb-1">{activity.title}</div>
                  {activity.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/40 p-2 rounded-lg border border-gray-100/50 dark:border-gray-700/50 mt-1 whitespace-pre-wrap leading-relaxed">
                      {activity.description}
                    </div>
                  )}

                  {/* Actions Bar for individual timeline entry */}
                  <div className="flex justify-end space-x-3 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                    <button 
                      onClick={() => handleEditActivityClick(activity)} 
                      className="text-xs font-medium text-gray-500 hover:text-primary flex items-center space-x-1 py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <Pencil size={12} />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteActivity(activity.id)} 
                      className="text-xs font-medium text-gray-500 hover:text-red-500 flex items-center space-x-1 py-1 px-2 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Crop Details Modal */}
      <AnimatePresence>
        {showEditCrop && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl h-[80vh] sm:h-auto overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Crop Details</h2>
                <button onClick={() => setShowEditCrop(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSaveCropDetails} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Crop Name *</label>
                  <input required value={editName} onChange={e => setEditName(e.target.value)} type="text" placeholder="e.g. Wheat" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Variety</label>
                  <input value={editVariety} onChange={e => setEditVariety(e.target.value)} type="text" placeholder="e.g. HD 3226" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Sown Date *</label>
                  <input required value={editSown} onChange={e => setEditSown(e.target.value)} type="date" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white [&::-webkit-calendar-picker-indicator]:dark:invert" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Area (Acres)</label>
                  <input value={editArea} onChange={e => setEditArea(e.target.value)} type="number" step="0.1" placeholder="e.g. 5" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white" />
                </div>
                <div className="pt-4 flex space-x-3">
                  <button type="button" onClick={() => setShowEditCrop(false)} className="w-1/2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-4 rounded-xl transition hover:bg-gray-200">
                    Cancel
                  </button>
                  <button type="submit" className="w-1/2 bg-primary text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-transform">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Add/Edit Activity Modal */}
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl h-[90vh] sm:h-auto overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingActivity ? 'Edit Timeline Entry' : 'Log Farm Activity'}
                </h2>
                <button onClick={() => setShowAdd(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300">
                  <X size={20} />
                </button>
              </div>

              {/* Quick Category Presets */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Select Activity Type (कार्य प्रकार)
                </label>
                <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                        selectedCategory === cat.id
                          ? 'bg-primary border-primary text-white'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <form onSubmit={handleAddActivity} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Activity Title *</label>
                  <input 
                    required 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    type="text" 
                    placeholder="e.g. Applied Urea, Irrigation, Spraying" 
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                  <input 
                    required 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    type="date" 
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white [&::-webkit-calendar-picker-indicator]:dark:invert" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Description / Notes</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder={getPlaceholder()} 
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white min-h-[100px]" 
                  />
                </div>
                <div className="pt-2 flex space-x-3">
                  <button type="button" onClick={() => setShowAdd(false)} className="w-1/2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-4 rounded-xl transition hover:bg-gray-200">
                    Cancel
                  </button>
                  <button type="submit" className="w-1/2 bg-primary text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-transform">
                    {editingActivity ? 'Save Changes' : 'Log Activity'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Harvest Yield Modal */}
        {showHarvest && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl h-[50vh] sm:h-auto overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Log Harvest Yield</h2>
                <button onClick={() => setShowHarvest(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleHarvest} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Total Yield (t/ha) *</label>
                  <input required value={yieldAmount} onChange={e => setYieldAmount(e.target.value)} type="number" step="0.1" placeholder="e.g. 4.5" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none dark:text-white" />
                </div>
                <div className="pt-4 flex space-x-3">
                  <button type="button" onClick={() => setShowHarvest(false)} className="w-1/2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-4 rounded-xl transition hover:bg-gray-200">
                    Cancel
                  </button>
                  <button type="submit" className="w-1/2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-transform">
                    Save Yield Data
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


