import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, TestTube2, AlertCircle, Sparkles, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSyncState } from '../lib/store';
import { motion } from 'framer-motion';

export interface SoilReport {
  id: string;
  date: string;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicCarbon?: number;
  aiRecommendation?: string;
}

export function SoilHealthScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [reports, setReports] = useSyncState<SoilReport[]>('ks_soilHealth', []);
  const [isAdding, setIsAdding] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [formData, setFormData] = useState<Partial<SoilReport>>({
    date: new Date().toISOString().split('T')[0],
    ph: 7.0,
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
    organicCarbon: 0,
  });

  const getRecommendation = async (report: Partial<SoilReport>) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `I have a soil health report. The pH is ${report.ph}, Nitrogen (N) is ${report.nitrogen} kg/ha, Phosphorus (P) is ${report.phosphorus} kg/ha, Potassium (K) is ${report.potassium} kg/ha, and Organic Carbon is ${report.organicCarbon}%. Give me a short, highly customized fertilizer recommendation for upcoming wheat or paddy cultivation based on this data. Keep it practical and less than 100 words.`
        })
      });
      const data = await response.json();
      return data.response;
    } catch (e) {
      return "Unable to fetch AI recommendation at this moment.";
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rec = await getRecommendation(formData);
    const newReport: SoilReport = {
      ...(formData as SoilReport),
      id: Date.now().toString(),
      aiRecommendation: rec
    };
    setReports([newReport, ...reports]);
    setIsAdding(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      ph: 7.0,
      nitrogen: 0,
      phosphorus: 0,
      potassium: 0,
      organicCarbon: 0,
    });
  };

  return (
    <div className="pb-24">
      <header className="bg-white dark:bg-gray-800 p-4 sticky top-0 z-30 shadow-sm border-b border-gray-100 dark:border-gray-700 flex items-center space-x-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-xl font-bold">{t('soil_health')}</h1>
      </header>

      <div className="p-4 space-y-6">
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 rounded-3xl shadow-md flex items-center justify-between hover:shadow-lg transition group">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full"><TestTube2 size={24} /></div>
              <span className="font-bold">Log New Soil Test</span>
            </div>
            <Search className="group-hover:scale-110 transition-transform" />
          </button>
        )}

        {isAdding && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-200">Soil Health Card Data</h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Test Date</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">pH Level</label>
                <input required type="number" step="0.1" value={formData.ph} onChange={e => setFormData({...formData, ph: parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3" placeholder="7.0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Org. Carbon (%)</label>
                <input type="number" step="0.1" value={formData.organicCarbon} onChange={e => setFormData({...formData, organicCarbon: parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3" placeholder="e.g. 0.5" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">N (kg/ha)</label>
                <input required type="number" value={formData.nitrogen} onChange={e => setFormData({...formData, nitrogen: parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">P (kg/ha)</label>
                <input required type="number" value={formData.phosphorus} onChange={e => setFormData({...formData, phosphorus: parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">K (kg/ha)</label>
                <input required type="number" value={formData.potassium} onChange={e => setFormData({...formData, potassium: parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3" />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={() => setIsAdding(false)} disabled={isAnalyzing} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl">Cancel</button>
              <button type="submit" disabled={isAnalyzing} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center space-x-2">
                {isAnalyzing ? <><Loader2 size={18} className="animate-spin" /><span>Analyzing...</span></> : <span>Log & Analyze</span>}
              </button>
            </div>
          </motion.form>
        )}

        <div className="space-y-4 pt-2">
          {reports.map((report) => (
            <motion.div key={report.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <div className="font-bold text-gray-700 dark:text-gray-300">Report from: <span className="text-gray-900 dark:text-white ml-2">{report.date}</span></div>
                <div className="text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 px-2 py-1 rounded">pH: {report.ph}</div>
              </div>
              <div className="p-4">
                <div className="flex justify-between text-center divide-x divide-gray-100 dark:divide-gray-700 mb-4">
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nitrogen</div>
                    <div className="text-xl font-bold">{report.nitrogen}<span className="text-xs text-gray-500 font-normal"> kg/ha</span></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phosphorus</div>
                    <div className="text-xl font-bold">{report.phosphorus}<span className="text-xs text-gray-500 font-normal"> kg/ha</span></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Potassium</div>
                    <div className="text-xl font-bold">{report.potassium}<span className="text-xs text-gray-500 font-normal"> kg/ha</span></div>
                  </div>
                </div>

                {report.aiRecommendation && (
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-2xl p-4 mt-2">
                    <div className="flex items-center space-x-2 text-green-700 dark:text-green-500 mb-2">
                      <Sparkles size={16} />
                      <h4 className="font-bold text-sm">AI Recommendation</h4>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {report.aiRecommendation}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {reports.length === 0 && !isAdding && (
            <div className="text-center py-10 opacity-60">
              <TestTube2 size={48} className="mx-auto mb-4 text-gray-400" />
              <p>No soil health records found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
