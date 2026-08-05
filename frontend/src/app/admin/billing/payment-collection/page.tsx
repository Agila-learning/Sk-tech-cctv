"use client";
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { motion } from 'framer-motion';
import { 
  Wallet, QrCode, Banknote, History, CheckCircle, 
  Clock, AlertCircle, FileText, Download, Printer, ShieldCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatCard = ({ title, amount, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-bg-surface p-5 rounded-2xl border border-border-base shadow-sm flex items-center gap-4">
    <div className={`p-3 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 rounded-xl`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm font-medium text-fg-muted">{title}</p>
      <h3 className="text-2xl font-bold text-fg-primary">₹{amount.toLocaleString('en-IN')}</h3>
    </div>
  </div>
);

export default function PaymentCollectionModule() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'UPI',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [companyUpiId] = useState('sktechnology@ybl'); // Example UPI

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/billing');
      const allBilling = Array.isArray(res) ? res : [];
      setInvoices(allBilling.filter((item: any) => item.type === 'invoice'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Parse custom payment histories serialized in `paymentMethod`
  const parsedInvoices = invoices.map(inv => {
    let history = [];
    try {
      history = JSON.parse(inv.paymentMethod || '[]');
      if (!Array.isArray(history)) throw new Error('Not an array');
    } catch (e) {
      // Legacy fallback
      if (inv.paymentMethod && inv.paymentMethod !== 'null') {
        history = [{
          id: `LEGACY-${inv._id?.slice(-4)}`,
          amount: inv.paidAmount || (inv.status === 'Paid' ? inv.totalAmount : 0),
          method: inv.paymentMethod,
          date: inv.paidAt || inv.createdAt,
          reference: ''
        }];
      }
    }
    const calculatedPaid = history.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    return { ...inv, paymentHistory: history, calculatedPaid };
  });

  const totalCollected = parsedInvoices.reduce((sum, inv) => sum + inv.calculatedPaid, 0);
  const pendingCollection = parsedInvoices.reduce((sum, inv) => sum + ((inv.totalAmount || 0) - inv.calculatedPaid), 0);

  const pendingInvoicesList = parsedInvoices.filter(inv => inv.calculatedPaid < (inv.totalAmount || 0));

  // Analytics for Doughnut Chart
  const methodStats = parsedInvoices.reduce((acc, inv) => {
    inv.paymentHistory.forEach((p: any) => {
      acc[p.method] = (acc[p.method] || 0) + Number(p.amount);
    });
    return acc;
  }, {} as Record<string, number>);

  const chartData = {
    labels: Object.keys(methodStats).length ? Object.keys(methodStats) : ['No Data'],
    datasets: [{
      data: Object.values(methodStats).length ? Object.values(methodStats) : [1],
      backgroundColor: ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444'],
      borderWidth: 0
    }]
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice || paymentForm.amount <= 0) return alert('Invalid amount');
    try {
      const newPayment = {
        id: `TXN-${Date.now()}`,
        amount: paymentForm.amount,
        method: paymentForm.method,
        reference: paymentForm.reference,
        date: paymentForm.date,
        verified: true
      };

      const newHistory = [...selectedInvoice.paymentHistory, newPayment];
      const newCalculatedPaid = selectedInvoice.calculatedPaid + paymentForm.amount;
      const totalAmount = selectedInvoice.totalAmount || 0;
      
      const newStatus = newCalculatedPaid >= totalAmount ? 'Paid' : 'Partial Paid';
      const newPaymentHistoryJSON = JSON.stringify(newHistory);

      // We serialize the array back into the paymentMethod string to avoid touching DB Schema
      await fetchWithAuth(`/billing/${selectedInvoice._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...selectedInvoice, 
          paidAmount: newCalculatedPaid, // updating legacy field too
          paymentStatus: newStatus,
          paymentMethod: newPaymentHistoryJSON // Serialized!
        })
      });
      
      alert('Payment Recorded Successfully!');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error recording payment: ${err.message}`);
    }
  };

  const generateReceipt = async (invoice: any, payment: any) => {
    const doc = new jsPDF();
    
    try {
      const imgData = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject('Load failed');
        img.src = '/logo.png';
      });
      doc.addImage(imgData, 'PNG', 14, 15, 20, 20);
    } catch(e) {
      console.log('Logo load failed', e);
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); 
    doc.text("SK TECHNOLOGY", 38, 22);
    
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38); 
    doc.text("Your life is in your hands", 38, 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text("2/222 A, Down Street, Berigai Road, Shoolagiri", 38, 34);
    doc.text("Krishnagiri, Tamil Nadu - 635117", 38, 38);
    doc.text("Ph: 9600975483 | GSTIN: 33BWOPN1889F1Z4 | PAN: BWOPN1889F", 38, 42);

    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text('PAYMENT RECEIPT', 130, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Receipt No: ${payment.id}`, 14, 56);
    doc.text(`Date: ${new Date(payment.date).toLocaleDateString('en-IN')}`, 14, 62);
    
    doc.text(`Received From: ${invoice.manualCustomer?.name || 'Customer'}`, 14, 70);
    doc.text(`For Invoice: ${invoice.invoiceNumber || `INV-${invoice._id?.slice(-6)}`}`, 14, 76);
    
    doc.setFontSize(14);
    doc.text(`Amount Received: Rs. ${payment.amount.toLocaleString('en-IN')}`, 14, 88);
    doc.text(`Payment Mode: ${payment.method}`, 14, 96);
    if(payment.reference) doc.text(`Transaction Ref: ${payment.reference}`, 14, 104);
    
    doc.setFontSize(10);
    doc.text('This is a computer-generated receipt and does not require a physical signature.', 14, 120);
    
    doc.save(`Receipt_${payment.id}.pdf`);
  };

  const getUpiUrl = (amount: number, invNumber: string) => {
    return `upi://pay?pa=${companyUpiId}&pn=SK_TECHNOLOGY&am=${amount}&cu=INR&tn=${invNumber}`;
  };

  return (
    <div className="space-y-6 relative pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fg-primary">Payment Collection ERP</h2>
          <p className="text-sm text-fg-muted">Record Split Payments, Verify UPI, Generate Receipts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Collected" amount={totalCollected} icon={Wallet} color="blue" />
        <StatCard title="Today's Collection" amount={0} icon={CheckCircle} color="green" /> 
        <StatCard title="Pending Outstanding" amount={pendingCollection} icon={Clock} color="orange" />
        <div className="bg-white dark:bg-bg-surface p-4 rounded-2xl border border-border-base shadow-sm flex flex-col items-center justify-center">
           <div className="w-24 h-24">
             <Doughnut data={chartData} options={{ plugins: { legend: { display: false } }, cutout: '70%' }} />
           </div>
           <p className="text-xs font-semibold mt-2 text-fg-muted">Collection Distribution</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Invoices */}
        <div className="lg:col-span-2 bg-white dark:bg-bg-surface rounded-2xl border border-border-base shadow-sm overflow-hidden">
           <div className="p-5 border-b border-border-base flex justify-between items-center">
             <h3 className="font-bold text-fg-primary flex items-center gap-2"><Clock size={18} className="text-orange-500" /> Action Required: Pending Payments</h3>
           </div>
           <div className="overflow-x-auto min-h-[300px]">
             <table className="w-full text-left">
               <thead className="text-xs text-fg-muted uppercase bg-gray-50/50 dark:bg-bg-base/50">
                 <tr>
                   <th className="p-4 font-semibold">Customer</th>
                   <th className="p-4 font-semibold">Invoice No</th>
                   <th className="p-4 font-semibold text-right">Balance Due</th>
                   <th className="p-4 font-semibold text-center">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border-base text-sm">
                 {pendingInvoicesList.map(inv => {
                   const total = inv.totalAmount || 0;
                   const paid = inv.calculatedPaid;
                   const balance = total - paid;
                   return (
                     <tr key={inv._id} className="hover:bg-gray-50 dark:hover:bg-bg-base transition group">
                       <td className="p-4">
                         <p className="font-medium text-fg-primary">{inv.manualCustomer?.name || 'Walk-in'}</p>
                         <p className="text-xs text-fg-muted">{inv.manualCustomer?.phone || ''}</p>
                       </td>
                       <td className="p-4">
                         <p className="text-blue-600 font-medium">{inv.invoiceNumber || `INV-${inv._id?.slice(-6)}`}</p>
                         {paid > 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full mt-1 inline-block">Partially Paid</span>}
                       </td>
                       <td className="p-4 text-right">
                         <p className="font-bold text-orange-600">₹{balance.toLocaleString('en-IN')}</p>
                         <p className="text-xs text-fg-muted">of ₹{total.toLocaleString('en-IN')}</p>
                       </td>
                       <td className="p-4 text-center">
                         <button 
                           onClick={() => {
                             setSelectedInvoice(inv);
                             setPaymentForm(p => ({ ...p, amount: balance, method: 'UPI' }));
                             setIsModalOpen(true);
                           }}
                           className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-500/20 text-xs flex items-center justify-center mx-auto gap-2"
                         >
                           <Wallet size={14} /> Record Payment
                         </button>
                       </td>
                     </tr>
                   )
                 })}
                 {pendingInvoicesList.length === 0 && !loading && (
                   <tr><td colSpan={4} className="p-12 text-center text-fg-muted">All invoices are cleared!</td></tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-bg-surface rounded-2xl border border-border-base shadow-sm overflow-hidden flex flex-col">
           <div className="p-5 border-b border-border-base flex justify-between items-center">
             <h3 className="font-bold text-fg-primary flex items-center gap-2"><History size={18} className="text-blue-500" /> Recent Transactions</h3>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {parsedInvoices.flatMap(inv => 
                inv.paymentHistory.map((p: any) => ({ ...p, inv }))
             ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
             .slice(0, 10).map((txn: any, idx: number) => (
               <div key={idx} className="flex justify-between items-start p-3 border border-border-base rounded-xl hover:bg-gray-50 transition">
                 <div>
                   <div className="flex items-center gap-2 mb-1">
                     <span className="font-bold text-sm text-fg-primary">₹{Number(txn.amount).toLocaleString('en-IN')}</span>
                     <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{txn.method}</span>
                   </div>
                   <p className="text-xs text-fg-muted">{txn.inv.manualCustomer?.name} • {txn.inv.invoiceNumber}</p>
                 </div>
                 <button onClick={() => generateReceipt(txn.inv, txn)} className="p-2 text-fg-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Download Receipt">
                   <Download size={16} />
                 </button>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Advanced Record Payment Modal */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-bg-surface w-full max-w-2xl rounded-2xl shadow-2xl border border-border-base overflow-hidden flex flex-col md:flex-row">
             
             {/* Dynamic QR Panel (Left) */}
             <div className="bg-blue-50 dark:bg-blue-900/10 p-6 md:w-1/3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-blue-100 dark:border-blue-900/30">
               <h4 className="text-blue-800 dark:text-blue-400 font-bold text-center mb-4 text-sm">Scan to Pay (UPI)</h4>
               <div className="bg-white p-2 rounded-xl shadow-sm mb-4">
                 {/* Uses public free QR generator API since qrcode package is missing */}
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getUpiUrl(paymentForm.amount, selectedInvoice.invoiceNumber))}`} alt="UPI QR" className="w-32 h-32" />
               </div>
               <p className="text-xs text-center text-blue-600 font-medium">Amount auto-filled: ₹{paymentForm.amount}</p>
               <div className="mt-4 flex items-center gap-1 text-green-600 text-xs font-bold bg-green-100 px-3 py-1 rounded-full">
                 <ShieldCheck size={14} /> Safe & Secure
               </div>
             </div>

             {/* Form Panel (Right) */}
             <div className="p-6 flex-1 flex flex-col">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="font-bold text-xl text-fg-primary">Record Payment</h3>
                   <p className="text-xs text-fg-muted mt-1">{selectedInvoice.manualCustomer?.name} • {selectedInvoice.invoiceNumber}</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="text-fg-muted hover:text-red-500 bg-gray-100 p-2 rounded-full">✕</button>
               </div>

               <div className="space-y-5 flex-1">
                 <div>
                   <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Amount Received (₹)</label>
                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted font-bold">₹</span>
                     <input 
                       type="number"
                       value={paymentForm.amount || ''}
                       onChange={e => setPaymentForm(p => ({...p, amount: Number(e.target.value)}))}
                       className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-border-base rounded-xl font-black text-xl text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                     />
                   </div>
                   <div className="flex justify-between mt-1 text-xs font-medium text-fg-muted">
                     <span>Total Due: ₹{(selectedInvoice.totalAmount - selectedInvoice.calculatedPaid).toLocaleString('en-IN')}</span>
                     {paymentForm.amount < (selectedInvoice.totalAmount - selectedInvoice.calculatedPaid) && (
                       <span className="text-orange-500">Records as Partial Split Payment</span>
                     )}
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Payment Mode</label>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     {['UPI', 'Cash', 'Bank', 'Card'].map(mode => (
                       <button
                         key={mode}
                         onClick={() => setPaymentForm(p => ({...p, method: mode}))}
                         className={`py-2 rounded-xl text-sm font-bold border transition ${paymentForm.method === mode ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-border-base text-fg-muted hover:border-blue-300'}`}
                       >
                         {mode}
                       </button>
                     ))}
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Transaction Ref No (Optional)</label>
                   <input 
                     type="text"
                     placeholder="e.g. TXN9876543210"
                     value={paymentForm.reference}
                     onChange={e => setPaymentForm(p => ({...p, reference: e.target.value}))}
                     className="w-full px-4 py-2.5 bg-gray-50 border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
                   />
                 </div>
               </div>
               
               <div className="pt-6 border-t border-border-base flex gap-3 mt-4">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-fg-primary font-bold rounded-xl transition">Cancel</button>
                 <button onClick={handleRecordPayment} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md shadow-green-500/20 transition flex items-center justify-center gap-2">
                   <CheckCircle size={18} /> Verify & Update
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
