"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth } from '@/utils/api';
import { 
  IndianRupee, FileText, Download, Send, CheckCircle, Clock, 
  Search, Filter, Menu, Printer, ChevronLeft, XCircle, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BillingPage = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Invoice State
  const [newInvoice, setNewInvoice] = useState({
    manualCustomer: { name: '', email: '', phone: '', address: '' },
    gstNumber: '',
    companyLogo: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    taxRate: 18,
    notes: ''
  });

  const router = useRouter();

  const loadData = async () => {
    try {
      setLoading(true);
      const [invData, prodData] = await Promise.all([
        fetchWithAuth('/billing'),
        fetchWithAuth('/products')
      ]);
      setInvoices(invData || []);
      setProducts(prodData.products || prodData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateTotals = (items: any[], taxRate: number) => {
    const subtotal = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    const taxAmount = (subtotal * taxRate) / 100;
    return { subtotal, taxAmount, totalAmount: subtotal + taxAmount };
  };

  const handleAddItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newInvoice.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'unitPrice' || field === 'quantity') {
       updatedItems[index].total = updatedItems[index].unitPrice * updatedItems[index].quantity;
    }
    
    setNewInvoice(prev => ({ ...prev, items: updatedItems }));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      handleUpdateItem(index, 'description', product.name);
      handleUpdateItem(index, 'unitPrice', product.price);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const validItems = newInvoice.items
        .filter(item => item.description.trim() !== '' && item.unitPrice > 0)
        .map(item => ({
          ...item,
          total: item.unitPrice * item.quantity
        }));
      
      if (validItems.length === 0) {
        alert("Please add at least one valid item with description and price.");
        return;
      }

      const { subtotal, taxAmount, totalAmount } = calculateTotals(validItems, newInvoice.taxRate);
      
      const payload = {
        ...newInvoice,
        items: validItems,
        taxAmount,
        totalAmount,
        status: 'sent'
      };

      await fetchWithAuth('/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setIsCreateModalOpen(false);
      setNewInvoice({
        manualCustomer: { name: '', email: '', phone: '', address: '' },
        gstNumber: '',
        companyLogo: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
        taxRate: 18,
        notes: ''
      });
      loadData();
    } catch (err: any) {
      console.error("Invoice Error Details:", err);
      alert(`Failed to create invoice: ${err.message || 'Unknown protocol error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoice = (invoice: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text("SK TECHNOLOGY", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Bill of Supply (Original)", 105, 28, { align: "center" });

    // Corporate Identity
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("SK TECHNOLOGY", 14, 45);
    doc.setFontSize(9);
    doc.text("GSTIN: IN-29ABCDE1234F1Z5", 14, 50);
    doc.text("Phone: +91 9876543210", 14, 55);

    // Invoice Details
    doc.text(`Invoice No: ${invoice.invoiceNumber || 'Manual-' + invoice._id.slice(-6)}`, 140, 45);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 140, 50);
    doc.text(`Due Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 140, 55);

    // Bill To
    doc.setFontSize(10);
    doc.text("BILL TO:", 14, 70);
    doc.setFontSize(9);
    const customer = invoice.manualCustomer || invoice.customer || {};
    doc.text(customer.name || 'Walk-in Personnel', 14, 75);
    doc.text(customer.phone || 'N/A', 14, 80);
    doc.text(customer.address || 'N/A', 14, 85, { maxWidth: 80 });

    // Table
    const tableData = (invoice.items || []).map((item: any) => [
      item.description,
      '8525', // HSN
      item.quantity,
      'INR ' + item.unitPrice.toLocaleString(),
      'INR ' + item.total.toLocaleString()
    ]);

    (doc as any).autoTable({
      startY: 100,
      head: [['Description', 'HSN/SAC', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 8 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.text(`Subtotal: INR ${(invoice.totalAmount - (invoice.taxAmount || 0)).toLocaleString()}`, 140, finalY);
    doc.text(`GST (18%): INR ${(invoice.taxAmount || 0).toLocaleString()}`, 140, finalY + 5);
    doc.setFontSize(11);
    doc.text(`Total Payable: INR ${invoice.totalAmount.toLocaleString()}`, 140, finalY + 15);

    // Bank Details
    doc.setFontSize(10);
    doc.text("OFFICIAL SETTLEMENT INFO:", 14, finalY + 30);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Bank Name: ICICI BANK", 14, finalY + 36);
    doc.text("Account No: 109005001718", 14, finalY + 41);
    doc.text("IFSC: ICIC0001090", 14, finalY + 46);
    doc.text("Holder: FORGE INDIA CONNECT PRIVATE LIMITED", 14, finalY + 51);

    // Signatory
    doc.setTextColor(0);
    doc.text("Authorised Signatory", 140, finalY + 55);
    doc.line(140, finalY + 52, 185, finalY + 52);

    doc.save(`Invoice_${invoice.invoiceNumber || invoice._id}.pdf`);
  };

  const { totalAmount: currentTotal, taxAmount: currentTax } = calculateTotals(newInvoice.items, newInvoice.taxRate);
  const subtotal = newInvoice.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

  const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + inv.totalAmount, 0);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex transition-all duration-500 overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 p-6 md:p-12 w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-bg-muted rounded-2xl border border-border-base">
              <Menu className="h-6 w-6 text-fg-primary" />
            </button>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,1)] animate-pulse"></div>
                <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Revenue Control</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">Billing <span className="text-blue-500 non-italic">System</span></h1>
              <p className="text-fg-muted text-lg md:text-xl font-medium uppercase tracking-widest">Generate Invoices and Track Payments</p>
            </div>
          </div>
          <button 
             onClick={() => setIsCreateModalOpen(true)}
             className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
             Manual Invoice
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
           <div className="glass-card p-10 rounded-[3rem] border border-border-base shadow-xl">
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Total Billed</p>
              <h3 className="text-4xl font-black text-fg-primary tracking-tighter flex items-center gap-2 tabular-nums italic">
                 <IndianRupee className="h-6 w-6 text-blue-500" />
                 {totalBilled.toLocaleString()}
              </h3>
           </div>
           <div className="glass-card p-10 rounded-[3rem] border border-border-base shadow-xl">
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Collected Revenue</p>
              <h3 className="text-4xl font-black text-green-500 tracking-tighter flex items-center gap-2 tabular-nums italic">
                 <IndianRupee className="h-6 w-6" />
                 {paidAmount.toLocaleString()}
              </h3>
           </div>
           <div className="glass-card p-10 rounded-[3rem] border border-border-base shadow-xl">
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Invoice Volume</p>
              <h3 className="text-4xl font-black text-fg-primary tracking-tighter tabular-nums italic">{invoices.length}</h3>
           </div>
        </div>

        <div className="glass-card rounded-[3.5rem] overflow-hidden border border-border-base shadow-2xl bg-card">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-bg-muted/50 text-[10px] font-black uppercase tracking-widest text-fg-muted border-b border-border-base">
                     <tr className="border-b border-border-base">
                        <th className="px-10 py-8 text-fg-primary font-black">Invoice #</th>
                        <th className="px-10 py-8 text-fg-primary font-black">Customer</th>
                        <th className="px-10 py-8 text-fg-primary font-black">Amount</th>
                        <th className="px-10 py-8 text-fg-primary font-black">Status</th>
                        <th className="px-10 py-8 text-right text-fg-primary font-black">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-border-subtle">
                    {invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-bg-muted/30 transition-all group">
                         <td className="px-10 py-10">
                            <span className="font-mono text-sm font-black text-fg-primary tracking-tight bg-bg-muted px-3 py-1.5 rounded-lg border border-border-base shadow-sm">#{inv.invoiceNumber.split('-')[1]}</span>
                         </td>
                         <td className="px-10 py-10">
                            <p className="font-black text-sm text-fg-primary uppercase tracking-tight">{inv.manualCustomer?.name || inv.customer?.name || 'Guest Personnel'}</p>
                            <p className="text-[10px] font-bold text-fg-muted tracking-widest">{inv.manualCustomer?.email || inv.customer?.email}</p>
                         </td>
                         <td className="px-10 py-10">
                            <div className="flex items-center space-x-2 text-blue-600 font-black italic">
                               <IndianRupee className="h-4 w-4" />
                               <span className="tabular-nums">{inv.totalAmount.toLocaleString()}</span>
                            </div>
                         </td>
                         <td className="px-10 py-10">
                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                              inv.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              inv.status === 'overdue' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            } shadow-sm`}>
                               {inv.status}
                            </span>
                         </td>
                         <td className="px-10 py-10 text-right">
                            <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="p-3 bg-bg-muted border border-border-base rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                  <Download className="h-4 w-4" />
                               </button>
                               <button className="p-3 bg-bg-muted border border-border-base rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                  <Printer className="h-4 w-4" />
                               </button>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
              {invoices.length === 0 && !loading && (
                <div className="py-40 text-center space-y-6 opacity-40">
                   <FileText className="h-16 w-16 mx-auto text-fg-muted animate-bounce" />
                   <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.4em]">Ledger Empty: Pending Transactions</p>
                </div>
              )}
           </div>
        </div>
      </main>

      {/* Create Manual Invoice Modal */}
      <AnimatePresence>
         {isCreateModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl overflow-y-auto">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 50 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 50 }}
                 className="relative w-full max-w-5xl bg-card border border-card-border rounded-[4rem] p-12 lg:p-20 shadow-[0_50px_100px_rgba(0,0,0,0.6)] my-20"
               >
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] -z-10 rounded-full -mr-64 -mt-64"></div>
                  
                  <div className="flex justify-between items-start mb-16">
                     <div className="space-y-4">
                        <h2 className="text-5xl font-black text-fg-primary uppercase tracking-tighter italic leading-none">Strategic <span className="text-blue-500 non-italic">Invoice</span></h2>
                        <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.4em] ml-2 font-manrope">Manual Revenue Generation Module</p>
                     </div>
                     <button onClick={() => setIsCreateModalOpen(false)} className="p-4 bg-bg-muted rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg border border-border-base group">
                        <XCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                     </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                     {/* Left: Customer Info */}
                     <div className="lg:col-span-4 space-y-10">
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-blue-500/20 pb-4">Client Intelligence</h4>
                           <div className="space-y-4">
                              <input 
                                placeholder="Customer Full Name" 
                                value={newInvoice.manualCustomer.name}
                                onChange={e => setNewInvoice(p => ({...p, manualCustomer: {...p.manualCustomer, name: e.target.value}}))}
                                className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold focus:border-blue-600 outline-none shadow-inner"
                              />
                              <input 
                                placeholder="Email Communication" 
                                value={newInvoice.manualCustomer.email}
                                onChange={e => setNewInvoice(p => ({...p, manualCustomer: {...p.manualCustomer, email: e.target.value}}))}
                                className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold focus:border-blue-600 outline-none shadow-inner"
                              />
                              <input 
                                placeholder="Phone Signal" 
                                value={newInvoice.manualCustomer.phone}
                                onChange={e => setNewInvoice(p => ({...p, manualCustomer: {...p.manualCustomer, phone: e.target.value}}))}
                                className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold focus:border-blue-600 outline-none shadow-inner"
                              />
                              <textarea 
                                placeholder="Billing Coordinates" 
                                value={newInvoice.manualCustomer.address}
                                onChange={e => setNewInvoice(p => ({...p, manualCustomer: {...p.manualCustomer, address: e.target.value}}))}
                                 className="w-full bg-bg-surface border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary focus:border-blue-600 outline-none shadow-sm h-32 resize-none placeholder:text-fg-dim"
                              />
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-500/20 pb-4">Branding & Tax ID</h4>
                           <input 
                              placeholder="GST NUMBER (IN-XXXXXXXXX)" 
                              value={newInvoice.gstNumber}
                              onChange={e => setNewInvoice(p => ({...p, gstNumber: e.target.value}))}
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-black text-blue-500 focus:border-blue-600 outline-none shadow-inner uppercase tracking-widest mb-4"
                           />
                           <input 
                              placeholder="Company Logo URL (Optional)" 
                              value={newInvoice.companyLogo}
                              onChange={e => setNewInvoice(p => ({...p, companyLogo: e.target.value}))}
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold focus:border-blue-600 outline-none shadow-inner"
                           />
                        </div>
                     </div>

                     {/* Right: Items & Summary */}
                     <div className="lg:col-span-8 space-y-12">
                        <div className="space-y-6">
                           <div className="flex justify-between items-center mb-6">
                              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Inventory Allocation</h4>
                              <button onClick={handleAddItem} className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                                 < IndianRupee className="h-4 w-4" /> Add Line Item
                              </button>
                           </div>
                           
                           <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                              {newInvoice.items.map((item, i) => (
                                 <div key={i} className="grid grid-cols-12 gap-6 bg-bg-muted/30 p-8 rounded-[2rem] border border-border-base relative group">
                                    <div className="col-span-6 space-y-3">
                                       <label className="text-[8px] font-black text-fg-muted uppercase tracking-widest ml-2">Product/Service</label>
                                       <select 
                                         onChange={(e) => handleProductSelect(i, e.target.value)}
                                         className="w-full bg-bg-card border border-border-base rounded-xl p-4 text-xs font-bold outline-none focus:border-blue-600 appearance-none cursor-pointer"
                                       >
                                          <option value="" className="text-black bg-white">Select Prototype...</option>
                                          {products.map(p => (
                                            <option key={p._id} value={p._id} className="text-black bg-white">{p.name}</option>
                                          ))}
                                       </select>
                                       <input 
                                         placeholder="Custom Intel..." 
                                         value={item.description}
                                         onChange={e => handleUpdateItem(i, 'description', e.target.value)}
                                         className="w-full bg-transparent border-none p-2 text-sm font-bold focus:ring-0"
                                       />
                                    </div>
                                    <div className="col-span-2 space-y-3">
                                       <label className="text-[8px] font-black text-fg-muted uppercase tracking-widest ml-2">Qty</label>
                                       <input 
                                         type="number"
                                         value={item.quantity}
                                         onChange={e => handleUpdateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                                         className="w-full bg-bg-card border border-border-base rounded-xl p-4 text-xs font-black text-center outline-none focus:border-blue-600"
                                       />
                                    </div>
                                    <div className="col-span-3 space-y-3">
                                       <label className="text-[8px] font-black text-fg-muted uppercase tracking-widest ml-2">Unit Price</label>
                                       <input 
                                         type="number"
                                         value={item.unitPrice}
                                         onChange={e => handleUpdateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                                         className="w-full bg-bg-card border border-border-base rounded-xl p-4 text-xs font-black text-center outline-none focus:border-blue-600"
                                       />
                                    </div>
                                    <div className="col-span-1 flex items-end justify-center pb-4">
                                       <button 
                                         onClick={() => setNewInvoice(p => ({...p, items: p.items.filter((_, idx) => idx !== i)}))}
                                         className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                       >
                                          <X className="h-4 w-4" />
                                       </button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="pt-8 border-t-2 border-dashed border-border-base">
                           <div className="flex flex-col md:flex-row justify-between gap-12">
                              <div className="space-y-4 flex-1">
                                 <textarea 
                                   placeholder="Strategic Notes & Terms..." 
                                   value={newInvoice.notes}
                                   onChange={e => setNewInvoice(p => ({...p, notes: e.target.value}))}
                                   className="w-full bg-bg-muted border border-border-base rounded-[2rem] p-6 text-xs font-medium focus:border-blue-600 outline-none h-32 resize-none"
                                 />
                              </div>
                              <div className="w-full md:w-80 space-y-5">
                                 <div className="flex justify-between text-[10px] font-black uppercase text-fg-muted">
                                    <span>Subtotal Breakdown</span>
                                    <span className="tabular-nums italic text-fg-primary">₹{subtotal.toLocaleString()}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-500">
                                    <span>Applied GST (18%)</span>
                                    <span className="tabular-nums italic">₹{currentTax.toLocaleString()}</span>
                                 </div>
                                 <div className="pt-4 border-t border-border-base flex justify-between items-end">
                                    <span className="text-sm font-black text-fg-primary uppercase tracking-tighter">Total Payable</span>
                                    <span className="text-4xl font-black text-blue-600 tabular-nums tracking-tighter italic leading-none">₹{currentTotal.toLocaleString()}</span>
                                 </div>
                                 <button 
                                   onClick={handleCreateInvoice}
                                   disabled={isSubmitting}
                                   className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                 >
                                    {isSubmitting ? (
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <>
                                        <Send className="h-4 w-4" />
                                        <span>Deploy Invoice</span>
                                      </>
                                    )}
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default BillingPage;
