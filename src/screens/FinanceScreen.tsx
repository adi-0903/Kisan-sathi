import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import { IndianRupee, ArrowUpRight, ArrowDownRight, Plus, X, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSyncState } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { useSubscription } from '../lib/subscription';
import { PremiumModal } from '../components/PremiumModal';
import { getLogoPngBase64 } from '../lib/pdfLogo';

export function FinanceScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isExpired } = useSubscription();
  const [showPremiumOptions, setShowPremiumOptions] = useState(false);
  const [finances, setFinances] = useSyncState<any[]>('ks_finances', []);

  // Finance modal state
  const [showAddFinance, setShowAddFinance] = useState(false);
  const [financeType, setFinanceType] = useState<'income' | 'expense'>('expense');
  const [financeAmount, setFinanceAmount] = useState('');
  const [financeCategory, setFinanceCategory] = useState('');
  const [financeDate, setFinanceDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddFinance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeAmount || !financeCategory) return;
    const newEntry = {
      id: Date.now(),
      type: financeType,
      amount: parseFloat(financeAmount),
      category: financeCategory,
      date: financeDate
    };
    setFinances([newEntry, ...finances].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setShowAddFinance(false);
    setFinanceAmount('');
    setFinanceCategory('');
  };

  const financeSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    finances.forEach(f => {
      if (f.type === 'income') income += f.amount;
      else expense += f.amount;
    });
    return { income, expense, balance: income - expense };
  }, [finances]);

  const handleDownloadPDF = async () => {
    if (isExpired) {
      setShowPremiumOptions(true);
      return;
    }
    const doc = new jsPDF();
    const logoUrl = await getLogoPngBase64();
    
    // Header section
    doc.setFillColor(22, 163, 74); // primary green color
    doc.rect(0, 0, 210, 40, 'F');
    
    if (logoUrl) {
      doc.addImage(logoUrl, 'PNG', 14, 10, 20, 20);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('KisanSaathi', 40, 22);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Farm Financial Report', 40, 31);
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('KisanSaathi', 14, 25);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Farm Financial Report', 14, 34);
    }
    
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated: ${currentDate}`, 130, 31);

    // Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 14, 55);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99); // gray-600
    
    doc.text('Total Income:', 14, 65);
    doc.setTextColor(22, 163, 74); // green
    doc.setFont('helvetica', 'bold');
    doc.text(`+ Rs. ${financeSummary.income.toLocaleString()}`, 50, 65);
    
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Expense:', 14, 73);
    doc.setTextColor(220, 38, 38); // red
    doc.setFont('helvetica', 'bold');
    doc.text(`- Rs. ${financeSummary.expense.toLocaleString()}`, 50, 73);
    
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');
    doc.text('Net Balance:', 14, 81);
    doc.setTextColor(financeSummary.balance >= 0 ? 22 : 220, financeSummary.balance >= 0 ? 163 : 38, financeSummary.balance >= 0 ? 74 : 38);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${financeSummary.balance.toLocaleString()}`,  50, 81);

    let currentY = 100;
    
    // Transactions Table
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Transactions Log', 14, currentY);
    currentY += 8;
    
    // Table Header
    doc.setFillColor(243, 244, 246); // gray-100
    doc.rect(14, currentY, 182, 10, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 18, currentY + 7);
    doc.text('Category', 70, currentY + 7);
    doc.text('Amount', 150, currentY + 7);
    currentY += 10;
    
    // Table Body
    doc.setFont('helvetica', 'normal');
    finances.forEach((f, idx) => {
      // Alternate row background
      if (idx % 2 === 0) {
        doc.setFillColor(249, 250, 251); // gray-50
        doc.rect(14, currentY, 182, 10, 'F');
      }
      
      const amtStr = `${f.type === 'income' ? '+' : '-'}Rs. ${f.amount.toLocaleString()}`;
      
      doc.setTextColor(75, 85, 99);
      doc.text(new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 18, currentY + 7);
      
      doc.setTextColor(17, 24, 39);
      doc.setFont('helvetica', 'bold');
      doc.text(f.category, 70, currentY + 7);
      
      doc.setFont('helvetica', 'bold');
      if (f.type === 'income') {
          doc.setTextColor(22, 163, 74);
      } else {
          doc.setTextColor(220, 38, 38);
      }
      doc.text(amtStr, 150, currentY + 7);
      
      currentY += 10;
      
      // Page break if too long
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
    });

    doc.save('KisanSaathi_Finance_Report.pdf');
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-gray-50 dark:bg-[#121212]">
      <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm z-10 sticky top-0">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3 p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Financials</h1>
        </div>
        <button 
          onClick={handleDownloadPDF} 
          className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Download size={20} />
        </button>
      </header>

      <div className="p-4 space-y-6 flex-1 pb-24">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800 shadow-sm">
            <div className="flex items-center text-green-600 dark:text-green-400 mb-2">
              <ArrowUpRight size={18} className="mr-1" />
              <span className="text-xs font-bold uppercase tracking-wider">Income</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{financeSummary.income.toLocaleString()}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-800 shadow-sm">
            <div className="flex items-center text-red-600 dark:text-red-400 mb-2">
              <ArrowDownRight size={18} className="mr-1" />
              <span className="text-xs font-bold uppercase tracking-wider">Expense</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{financeSummary.expense.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Recent Transactions</h3>
            </div>
            <button onClick={() => setShowAddFinance(true)} className="flex items-center text-xs font-bold text-primary bg-primary/10 dark:bg-primary/20 px-3 py-1.5 rounded-full">
              <Plus size={14} className="mr-1" /> Add Entry
            </button>
        </div>

        <div className="space-y-3 pb-8">
          {finances.map(f => (
            <div key={f.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${f.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                  {f.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">{f.category}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
              </div>
              <div className={`font-bold ${f.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {f.type === 'income' ? '+' : '-'}₹{f.amount.toLocaleString()}
              </div>
            </div>
          ))}
          {finances.length === 0 && (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <div className="bg-gray-100 dark:bg-gray-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <IndianRupee size={24} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No transactions recorded yet</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddFinance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 pb-24 shadow-2xl max-h-[90vh] sm:max-h-[none] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">Record Transaction</h3>
                <button onClick={() => setShowAddFinance(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddFinance} className="space-y-4">
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl space-x-1">
                  <button type="button" onClick={() => setFinanceType('income')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${financeType === 'income' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Income</button>
                  <button type="button" onClick={() => setFinanceType('expense')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${financeType === 'expense' ? 'bg-white dark:bg-gray-700 text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Expense</button>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Amount (₹)</label>
                  <input type="number" required min="1" value={financeAmount} onChange={e => setFinanceAmount(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white text-lg font-bold" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <input type="text" required value={financeCategory} onChange={e => setFinanceCategory(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white" placeholder={financeType === 'income' ? "e.g., Sold Wheat" : "e.g., Seeds & Fertilizer"} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                  <input type="date" required value={financeDate} onChange={e => setFinanceDate(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none dark:text-white" />
                </div>
                <button type="submit" className="w-full mt-4 bg-primary text-primary-foreground p-4 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                  Save Transaction
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <PremiumModal isOpen={showPremiumOptions} onClose={() => setShowPremiumOptions(false)} message="Your 30-day free trial has expired. Upgrade to download detailed reports." />
    </div>
  );
}
