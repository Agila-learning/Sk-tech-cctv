"use client";
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { 
  Users, Search, Download, Printer, Share2, 
  ArrowDownRight, ArrowUpRight, CheckCircle, Clock, Banknote
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function CustomerLedgerModule() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/billing');
      const allBilling = Array.isArray(res) ? res : [];
      const invs = allBilling.filter((item: any) => item.type === 'invoice');
      
      // Parse custom payment histories
      const parsedInvs = invs.map(inv => {
        let history = [];
        try {
          history = JSON.parse(inv.paymentMethod || '[]');
          if (!Array.isArray(history)) throw new Error();
        } catch {
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

      setInvoices(parsedInvs);
      
      // Group by customer phone/name
      const grouped: Record<string, any> = {};
      parsedInvs.forEach(inv => {
        const cust = inv.manualCustomer || inv.customer;
        if (!cust) return;
        const key = cust.phone || cust.name || 'Unknown';
        if (!grouped[key]) {
          grouped[key] = {
            customer: cust,
            invoices: [],
            totalPurchase: 0,
            totalPaid: 0,
            balance: 0,
            timeline: []
          };
        }
        grouped[key].invoices.push(inv);
        grouped[key].totalPurchase += (inv.totalAmount || 0);
        grouped[key].totalPaid += inv.calculatedPaid;

        // Build Timeline: Add invoice creation
        grouped[key].timeline.push({
          type: 'invoice',
          date: inv.createdAt,
          amount: inv.totalAmount,
          id: inv.invoiceNumber || `INV-${inv._id?.slice(-6)}`,
          invRef: inv
        });

        // Add all payments
        inv.paymentHistory.forEach((p: any) => {
          grouped[key].timeline.push({
             type: 'payment',
             date: p.date,
             amount: p.amount,
             method: p.method,
             id: p.id,
             ref: p.reference,
             invRef: inv
          });
        });
      });
      
      Object.keys(grouped).forEach(k => {
        grouped[k].balance = grouped[k].totalPurchase - grouped[k].totalPaid;
        // Sort timeline descending
        grouped[k].timeline.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      
      setLedgers(Object.values(grouped));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLedgers = ledgers.filter(l => 
    l.customer?.name?.toLowerCase().includes(search.toLowerCase()) || 
    l.customer?.phone?.includes(search)
  );

  const exportLedger = async () => {
    if (!selectedLedger) return;
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

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Customer Ledger`, 140, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Customer: ${selectedLedger.customer.name}`, 14, 56);
    doc.text(`Phone: ${selectedLedger.customer.phone}`, 14, 62);
    
    doc.text(`Total Purchase: Rs. ${selectedLedger.totalPurchase}`, 140, 56);
    doc.text(`Total Paid: Rs. ${selectedLedger.totalPaid}`, 140, 62);
    doc.setFont("helvetica", "bold");
    doc.text(`Balance: Rs. ${selectedLedger.balance}`, 140, 68);

    const tableData = selectedLedger.timeline.map((item: any) => [
      new Date(item.date).toLocaleDateString(),
      item.type === 'invoice' ? `Invoice (${item.id})` : `Payment (${item.method})`,
      item.type === 'invoice' ? item.amount : '-',
      item.type === 'payment' ? item.amount : '-',
      item.type === 'payment' ? item.id : '-'
    ]);

    (doc as any).autoTable({
      startY: 75,
      head: [['Date', 'Description', 'Debit (Purchase)', 'Credit (Payment)', 'Ref']],
      body: tableData,
      headStyles: { fillColor: [30, 58, 138] },
      theme: 'striped'
    });

    doc.save(`Ledger_${selectedLedger.customer.name}.pdf`);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 pb-20">
      
      {/* Sidebar: Customer List */}
      <div className="w-full lg:w-1/3 bg-white dark:bg-bg-surface rounded-2xl border border-border-base shadow-sm flex flex-col h-[calc(100vh-140px)]">
        <div className="p-5 border-b border-border-base">
          <h3 className="font-bold text-fg-primary mb-4 text-lg">Customer Ledgers</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search customer by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-bg-base border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : filteredLedgers.map((ledger, idx) => {
            const isActive = selectedLedger?.customer?.phone === ledger.customer.phone;
            return (
              <button 
                key={idx}
                onClick={() => setSelectedLedger(ledger)}
                className={`w-full text-left p-4 rounded-xl transition-all flex justify-between items-center group ${isActive ? 'bg-blue-600 shadow-md text-white' : 'hover:bg-gray-50 dark:hover:bg-bg-base bg-white dark:bg-bg-surface border border-transparent hover:border-gray-200'}`}
              >
                <div>
                  <p className={`font-bold text-sm ${isActive ? 'text-white' : 'text-fg-primary'}`}>{ledger.customer.name || 'Walk-in Customer'}</p>
                  <p className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-fg-muted'}`}>{ledger.customer.phone}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${isActive ? 'text-white' : (ledger.balance > 0 ? 'text-red-600' : 'text-green-600')}`}>
                    ₹{ledger.balance > 0 ? ledger.balance.toLocaleString('en-IN') : '0'}
                  </p>
                  <p className={`text-[10px] uppercase font-bold mt-1 ${isActive ? 'text-blue-200' : 'text-fg-muted'}`}>{ledger.balance > 0 ? 'Due' : 'Clear'}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content: Ledger Details */}
      <div className="w-full lg:w-2/3 bg-white dark:bg-bg-surface rounded-2xl border border-border-base shadow-sm flex flex-col h-[calc(100vh-140px)] overflow-hidden">
        {selectedLedger ? (
          <>
            <div className="p-6 border-b border-border-base bg-gray-50 dark:bg-bg-base flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-fg-primary">{selectedLedger.customer.name}</h2>
                <p className="text-sm text-fg-muted font-medium mt-1">{selectedLedger.customer.phone} | {selectedLedger.customer.address}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={exportLedger} className="flex items-center gap-2 px-4 py-2 bg-white border border-border-base rounded-xl text-sm font-bold text-fg-primary hover:text-blue-600 hover:border-blue-300 shadow-sm transition">
                  <Download size={16}/> Export PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-border-base border-b border-border-base bg-white dark:bg-bg-surface shadow-sm relative z-10">
              <div className="p-5 text-center">
                <p className="text-xs text-fg-muted font-bold uppercase tracking-wider mb-2">Total Purchase</p>
                <p className="text-xl font-black text-fg-primary">₹{selectedLedger.totalPurchase.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-5 text-center">
                <p className="text-xs text-fg-muted font-bold uppercase tracking-wider mb-2">Total Paid</p>
                <p className="text-xl font-black text-green-600">₹{selectedLedger.totalPaid.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-5 text-center bg-red-50/50">
                <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-2">Outstanding Balance</p>
                <p className="text-2xl font-black text-red-600">₹{selectedLedger.balance.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
               <div className="absolute inset-y-0 left-[2.25rem] w-0.5 bg-gray-200 dark:bg-border-base"></div>
               
               <h3 className="font-bold text-fg-primary mb-8 ml-14 text-lg">Detailed Timeline</h3>
               
               <div className="space-y-6">
                 {selectedLedger.timeline.map((item: any, i: number) => (
                    <div key={i} className="relative flex items-start group">
                      
                      {/* Timeline Icon */}
                      <div className="absolute left-0 top-0">
                         <div className={`w-10 h-10 rounded-full border-4 border-white dark:border-bg-surface shadow-md flex items-center justify-center z-10 relative
                           ${item.type === 'payment' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}
                         `}>
                           {item.type === 'payment' ? <Banknote size={16} /> : <ArrowDownRight size={16} />}
                         </div>
                      </div>

                      {/* Content Card */}
                      <div className="ml-16 w-full max-w-lg bg-white dark:bg-bg-surface border border-border-base rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${item.type === 'payment' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                              {item.type === 'payment' ? 'Payment Received' : 'Invoice Generated'}
                            </span>
                          </div>
                          <span className="text-xs text-fg-muted font-semibold flex items-center gap-1">
                            <Clock size={12} /> {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        
                        <div className="flex items-end justify-between">
                          <div>
                            {item.type === 'invoice' ? (
                              <p className="text-sm font-medium text-fg-primary mb-1">Invoice: <span className="font-bold text-blue-600">{item.id}</span></p>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-fg-primary mb-1">Mode: <span className="font-bold">{item.method}</span></p>
                                <p className="text-xs text-fg-muted">Ref: {item.ref || item.id}</p>
                              </>
                            )}
                          </div>
                          <div className={`text-xl font-black ${item.type === 'payment' ? 'text-green-600' : 'text-fg-primary'}`}>
                            {item.type === 'payment' ? '+' : ''}₹{item.amount.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                    </div>
                 ))}
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-fg-muted bg-gray-50/50 dark:bg-bg-base/50">
            <Users size={64} className="text-gray-300 mb-6" />
            <p className="text-xl font-bold text-fg-primary mb-2">Select a Customer</p>
            <p className="text-sm font-medium">Click on any customer ledger from the left panel to view their complete financial history.</p>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}}/>
    </div>
  );
}
