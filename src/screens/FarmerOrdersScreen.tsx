import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { dbClient } from '../lib/dbClient';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoPngBase64 } from '../lib/pdfLogo';

export function FarmerOrdersScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      const unsub = dbClient.subscribe('orders', [
        { field: 'buyerId', op: '==', value: user.uid },
        { field: 'isAgriInput', op: '==', value: true }
      ], (items) => {
        // sort by newest
        const sorted = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(sorted);
      });
      return () => unsub();
    }
  }, [user]);

  const downloadInvoice = async (order: any) => {
    const doc = new jsPDF();
    const logoUrl = await getLogoPngBase64();

    // Header section
    doc.setFillColor(22, 163, 74); // primary green color
    doc.rect(0, 0, 210, 40, 'F');

    if (logoUrl) {
      doc.addImage(logoUrl, 'PNG', 14, 10, 20, 20);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('KisanSaathi', 40, 22);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Agri-Input Order Invoice', 40, 31);

    doc.setTextColor(255, 255, 255);
    doc.text(`Order #: ${order.id.slice(0, 8).toUpperCase()}`, 130, 22);
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Date: ${orderDate}`, 130, 31);

    // Bill To Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${order.buyerName || user?.displayName || 'Farmer'}`, 14, 62);
    doc.text(`Phone: ${order.buyerPhone || user?.phoneNumber || 'N/A'}`, 14, 69);
    doc.text(`Address: ${order.deliveryAddress || 'N/A'}`, 14, 76);

    // Status Section
    doc.setFont('helvetica', 'bold');
    doc.text('Order Details:', 130, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Delivery Status: ${order.status || 'Pending'}`, 130, 62);
    doc.text(`Payment Status: ${order.paymentStatus || 'Pending'}`, 130, 69);

    // Table Data
    const tableBody = order.items.map((item: any, index: number) => [
      index + 1,
      item.productName,
      `${item.quantity} ${item.unit || 'unit'}`,
      `Rs. ${item.price.toFixed(2)}`,
      `Rs. ${item.totalAmount.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 15 },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;

    // Total Amount Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: Rs. ${order.totalAmount.toFixed(2)}`, 140, finalY + 15);

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for choosing KisanSaathi Agri-Input Store!', 105, 280, { align: 'center' });

    doc.save(`KisanSaathi_Invoice_${order.id.slice(0, 8).toUpperCase()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <header className="bg-white dark:bg-gray-800 px-5 pt-12 pb-4 shadow-sm z-10 sticky top-0 flex items-center space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('my_orders', 'My Agri Orders')}</h1>
      </header>

      <div className="p-5 max-w-lg mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800 dark:text-gray-100">Order History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Track and download invoices for your purchases</p>
          </div>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-sm">
              <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">No orders placed yet.</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Your purchased items will appear here.</p>
              <button
                onClick={() => navigate('/shop')}
                className="mt-6 bg-primary text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-primary-dark transition-colors"
              >
                Go to Shop
              </button>
            </div>
          ) : (
            orders.map((o, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={o.id}
                className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[10px] font-black tracking-wider text-primary mb-1 uppercase">ORDER #{o.id?.slice(0, 8)}</div>
                    <div className="text-sm font-bold text-gray-500 dark:text-gray-400">
                      {new Date(o.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <div className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        o.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          o.status === 'Accepted' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                      }`}>
                      {o.status || 'Pending'}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 mb-4">
                  <div className="space-y-2">
                    {o.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">₹{item.totalAmount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Amount</span>
                    <span className="text-lg font-black text-primary">₹{o.totalAmount}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-bold ${o.paymentStatus === 'Done'
                      ? 'bg-green-50 text-green-700 border border-green-100'
                      : 'bg-orange-50 text-orange-700 border border-orange-100'
                    }`}>
                    Payment: {o.paymentStatus || 'Pending'}
                  </div>
                  <button
                    onClick={() => downloadInvoice(o)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2.5 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Download size={14} />
                    Invoice
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
