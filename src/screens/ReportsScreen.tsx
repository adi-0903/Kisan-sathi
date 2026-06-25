import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import { ChevronLeft, Download, FileText, FileSpreadsheet, TrendingUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSyncState } from '../lib/store';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useSubscription } from '../lib/subscription';
import { PremiumModal } from '../components/PremiumModal';
import { getLogoPngBase64 } from '../lib/pdfLogo';

export function ReportsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isExpired } = useSubscription();
  const [showPremiumOptions, setShowPremiumOptions] = useState(false);
  const [crops] = useSyncState<any[]>('ks_crops', []);
  const [cattle] = useSyncState<any[]>('ks_cattle', []);
  const [milkLogs] = useSyncState<any[]>('ks_milk_logs', []);

  // Compute live yield data from actual crops rather than demo data
  const liveYieldData = crops?.filter(c => c.yield).map((c, i) => ({
    year: c.sown ? new Date(c.sown).getFullYear().toString() : `Crop ${i+1}`,
    yourYield: parseFloat(c.yield) || 0,
    localAvg: 3.8 + (Math.random() * 0.5) // Example baseline
  })).sort((a,b) => a.year.localeCompare(b.year)) || [];

  const [tasks] = useSyncState<any[]>('ks_tasks', []);
  const [activeTab, setActiveTab] = useState<'exports' | 'trends'>('exports');
  
  // Export filters
  const [reportPeriodType, setReportPeriodType] = useState('30'); // 7, 15, 30, 60, single, range
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportDataType, setReportDataType] = useState('full'); // full, dairy, crop

  const filterByDate = (dateString: string) => {
    if (!dateString) return true;
    
    let date: Date;
    if (dateString.includes('-') && !dateString.includes(' ') && !dateString.includes(',')) {
      // It looks like a YYYY-MM-DD format
      date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
    } else {
      // It is a localized format like "Jun 24, 2026"
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) return false;

    // Normalize log date to start of day
    const logDateStart = new Date(date);
    logDateStart.setHours(0, 0, 0, 0);

    const now = new Date();
    
    if (['7', '15', '30', '60'].includes(reportPeriodType)) {
      const daysToSubtract = parseInt(reportPeriodType, 10);
      const pastDate = new Date();
      pastDate.setDate(now.getDate() - daysToSubtract);
      pastDate.setHours(0, 0, 0, 0); // start of pastDate in local timezone
      
      const futureLimit = new Date();
      futureLimit.setHours(23, 59, 59, 999); // end of today
      
      return logDateStart >= pastDate && logDateStart <= futureLimit;
    } else if (reportPeriodType === 'single') {
      const start = new Date(`${reportStartDate}T00:00:00`);
      const end = new Date(`${reportStartDate}T23:59:59.999`);
      return logDateStart >= start && logDateStart <= end;
    } else if (reportPeriodType === 'range') {
      const start = new Date(`${reportStartDate}T00:00:00`);
      const end = new Date(`${reportEndDate}T23:59:59.999`);
      return logDateStart >= start && logDateStart <= end;
    }
    return true;
  };

  const generateData = () => {
    // Convert tasks into activity
    const activity = (tasks || []).filter(t => filterByDate(t.date || new Date().toISOString().split('T')[0])).map(task => ({
      date: task.date || new Date().toISOString().split('T')[0],
      activity: task.title,
      status: task.completed ? 'Completed' : 'Pending'
    }));

    const filteredMilkLogs = (milkLogs || []).filter((l: any) => filterByDate(l.date));

    const milkProduction = cattle?.map(c => {
      const cowLogs = filteredMilkLogs.filter((l: any) => l.cattleId === c.id);
      const periodTotal = cowLogs.reduce((acc: number, curr: any) => acc + curr.amount, 0);

      return {
        tag: c.id,
        breed: c.breed,
        yieldTotal: `${periodTotal.toFixed(1)} L`
      };
    }) || [];

    const cropProduction = crops?.filter(c => filterByDate(c.sown)).map((c: any) => ({
      name: c.name,
      area: c.area,
      yield: c.yield ? `${c.yield} t/ha` : 'N/A',
      sown: c.sown
    })) || [];

    return { activity, milkProduction, cropProduction };
  };

  const handleDownloadPDF = async () => {
    if (isExpired) {
      setShowPremiumOptions(true);
      return;
    }
    const doc = new jsPDF();
    const data = generateData();
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
      doc.text('Farm Activity Report', 40, 31);
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('KisanSaathi', 14, 25);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Farm Activity Report', 14, 34);
    }
    
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated: ${currentDate}`, 130, 31);
    
    let periodText = `Last ${reportPeriodType} Days`;
    if (reportPeriodType === '7') periodText = 'Last 7 Days (1 Week)';
    else if (reportPeriodType === 'single') periodText = reportStartDate;
    else if (reportPeriodType === 'range') periodText = `${reportStartDate} to ${reportEndDate}`;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text(`Report Period: ${periodText}`, 14, 50);

    let currentY = 60;

    // Helper to draw a modern row
    const drawRow = (rowText: string[], y: number, isHeader: boolean = false) => {
      doc.setTextColor(isHeader ? 0 : 75, isHeader ? 0 : 85, isHeader ? 0 : 99);
      doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
      doc.text(rowText[0] ? rowText[0].toString() : '', 18, y);
      doc.text(rowText[1] ? rowText[1].toString() : '', 70, y);
      doc.text(rowText[2] ? rowText[2].toString() : '', 140, y);
    };

    const maybeAddPage = (expectedHeight: number) => {
        if (currentY + expectedHeight > 270) {
            doc.addPage();
            currentY = 20;
        }
    };

    if (reportDataType === 'full' || reportDataType === 'dairy') {
      maybeAddPage(40);
      // Milk Production Table
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Dairy & Milk Production', 14, currentY);
      currentY += 8;
      
      doc.setFillColor(243, 244, 246);
      doc.rect(14, currentY, 182, 10, 'F');
      doc.setFontSize(10);
      drawRow(['Cattle Tag', 'Breed', 'Total Yield'], currentY + 7, true);
      currentY += 10;
      
      data.milkProduction.forEach((m, idx) => {
        maybeAddPage(15);
        if (idx % 2 === 0) {
            doc.setFillColor(249, 250, 251);
            doc.rect(14, currentY, 182, 10, 'F');
        }
        drawRow([m.tag, m.breed, m.yieldTotal], currentY + 7);
        currentY += 10;
      });

      currentY += 10;
    }

    if (reportDataType === 'full' || reportDataType === 'crop') {
      maybeAddPage(40);
      // Crop Production Table
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Crop Production', 14, currentY);
      currentY += 8;

      doc.setFillColor(243, 244, 246);
      doc.rect(14, currentY, 182, 10, 'F');
      doc.setFontSize(10);
      drawRow(['Crop Name', 'Area', 'Yield (t/ha)'], currentY + 7, true);
      currentY += 10;
      
      data.cropProduction.forEach((c, idx) => {
        maybeAddPage(15);
        if (idx % 2 === 0) {
            doc.setFillColor(249, 250, 251);
            doc.rect(14, currentY, 182, 10, 'F');
        }
        drawRow([c.name, c.area, c.yield], currentY + 7);
        currentY += 10;
      });

      currentY += 10;
    }

    if (reportDataType === 'full') {
      maybeAddPage(40);
      // Activities Table
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Farm Tasks & Activities', 14, currentY);
      currentY += 8;

      doc.setFillColor(243, 244, 246);
      doc.rect(14, currentY, 182, 10, 'F');
      doc.setFontSize(10);
      drawRow(['Date', 'Activity', 'Status'], currentY + 7, true);
      currentY += 10;

      data.activity.forEach((a, idx) => {
        maybeAddPage(15);
        if (idx % 2 === 0) {
            doc.setFillColor(249, 250, 251);
            doc.rect(14, currentY, 182, 10, 'F');
        }
        drawRow([a.date, a.activity, a.status], currentY + 7);
        currentY += 10;
      });
    }

    doc.save('KisanSaathi_Report.pdf');
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-gray-50 dark:bg-[#121212]">
      <div className="sticky top-0 z-10">
        <header className="flex items-center p-4 bg-white dark:bg-gray-800 shadow-sm">
          <button onClick={() => navigate(-1)} className="mr-3 p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Farm Reports</h1>
        </header>

        <div className="flex px-4 pt-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 space-x-6 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('exports')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors duration-200 ${activeTab === 'exports' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Export
        </button>
        <button 
          onClick={() => setActiveTab('trends')}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors duration-200 ${activeTab === 'trends' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Yield Trends
        </button>
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1 pb-24">
        {activeTab === 'exports' ? (
          <>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Generate Report</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Download your aggregated farm activity, expenses, and dairy production data.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Content</label>
                  <select 
                    value={reportDataType}
                    onChange={(e) => setReportDataType(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 dark:text-gray-100"
                  >
                    <option value="full">Full Report (All Data)</option>
                    <option value="dairy">Dairy / Milk Report</option>
                    <option value="crop">Crop Report</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reporting Period</label>
                  <select 
                    value={reportPeriodType}
                    onChange={(e) => setReportPeriodType(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 dark:text-gray-100"
                  >
                    <option value="7">1 Week</option>
                    <option value="15">15 Days</option>
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="single">Single Date</option>
                    <option value="range">Date Range</option>
                  </select>
                </div>

                {reportPeriodType === 'single' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Date</label>
                    <input 
                      type="date" 
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 dark:text-gray-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                    />
                  </div>
                )}

                {reportPeriodType === 'range' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                      <input 
                        type="date" 
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 dark:text-gray-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                      <input 
                        type="date" 
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 dark:text-gray-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button 
                    onClick={handleDownloadPDF}
                    className="w-full flex items-center justify-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <FileText size={28} />
                    <span className="text-sm font-bold">Download PDF Report</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-xl border border-primary/20 text-sm text-primary dark:text-primary-light">
              <strong>Tip:</strong> These reports can be shared directly with your local bank branch for agricultural loans (KCC).
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-6 text-gray-800 dark:text-gray-100">
              <TrendingUp size={24} className="text-primary" />
              <h2 className="text-lg font-bold">Wheat Yield vs. Local Average</h2>
            </div>
            
            <div className="h-64 mb-6">
              {liveYieldData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <AreaChart data={liveYieldData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} className="text-xs text-gray-500" />
                    <YAxis axisLine={false} tickLine={false} className="text-xs text-gray-500" unit="t/ha" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', background: 'var(--tw-prose-bg, white)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" name="Your Yield" dataKey="yourYield" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorYield)" />
                    <Line type="monotone" name="Local Avg" dataKey="localAvg" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <TrendingUp size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500">Record crop yields to see trends</p>
                </div>
              )}
            </div>

            {liveYieldData.length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1">Yield Insights</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-500/80 leading-relaxed">
                  Based on your logged data, your yield is trending against the local baseline. Continue adding harvest data to build a complete profile.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <PremiumModal isOpen={showPremiumOptions} onClose={() => setShowPremiumOptions(false)} message="Your 30-day free trial has expired. Upgrade to download detailed reports." />
    </div>
  );
}
