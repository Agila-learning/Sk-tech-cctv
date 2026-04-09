"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth } from '@/utils/api';
import { 
  IndianRupee, FileText, Download, Send, CheckCircle, Clock, 
  Search, Filter, Menu, Printer, ChevronLeft, XCircle, X, Trash2, Edit2,
  Plus, Activity
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

  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

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
    setIsSubmitting(true);
    try {
      const validItems = newInvoice.items
        .filter(item => item.description.trim() !== '' && item.unitPrice > 0)
        .map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity
        }));
      
      if (validItems.length === 0) {
        alert("Please add at least one valid item with description and price.");
        setIsSubmitting(false);
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

      if (editingInvoiceId) {
        await fetchWithAuth(`/billing/${editingInvoiceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetchWithAuth('/billing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      setIsCreateModalOpen(false);
      setEditingInvoiceId(null);
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
      alert(`Failed to save invoice: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditInitiate = (inv: any) => {
    setEditingInvoiceId(inv._id);
    setNewInvoice({
      manualCustomer: inv.manualCustomer || { name: '', email: '', phone: '', address: '' },
      gstNumber: inv.gstNumber || '',
      companyLogo: inv.companyLogo || '',
      items: inv.items || [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      taxRate: inv.taxRate || 18,
      notes: inv.notes || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm("Permanently remove this invoice from the system?")) return;
    try {
      await fetchWithAuth(`/billing/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert("Failed to delete invoice");
    }
  };


  const handleDownloadInvoice = async (invoice: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header styling
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Attempt to add Logo
    try {
      doc.addImage('/logo.png', 'PNG', 14, 5, 30, 30);
    } catch (imgErr) {
      console.warn("Logo not found", imgErr);
    }

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('SK TECHNOLOGY', pageWidth / 2 + 15, 16, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('CCTV | BIOMETRIC | NETWORKING | SECURITY SOLUTIONS', pageWidth / 2, 24, { align: 'center' });
    doc.text('Bill of Supply (Original for Recipient)', pageWidth / 2, 31, { align: 'center' });

    // Company details
    doc.setFillColor(243, 244, 246);
    doc.rect(0, 40, pageWidth, 34, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175);
    doc.text('SK TECHNOLOGY', 14, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    doc.text('2/222 A, Down Street, Berigai Road, Shoolagiri,', 14, 57);
    doc.text('Krishnagiri, Tamil Nadu - 635117', 14, 63);
    doc.text('Mobile: 9600975483', 14, 69);
    doc.text('Email: sktechnologycctv@gmail.com', 14, 74);
    doc.setFont('helvetica', 'bold');
    doc.text('GSTIN: 33BWOPN1889F1Z4', 110, 57);
    doc.text('PAN: BWOPN1889F', 110, 63);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${invoice.invoiceNumber || 'INV-' + invoice._id?.slice(-6)}`, 110, 69);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 110, 74);

    // Bill To
    doc.setDrawColor(210, 210, 210);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 78, 90, 26, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('BILL TO', 16, 85);
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    const customer = invoice.manualCustomer || invoice.customer || {};
    doc.text(customer.name || 'Walk-in Customer', 16, 92);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Ph: ${customer.phone || 'N/A'}`, 16, 98);
    if (customer.address) doc.text(String(customer.address).substring(0, 55), 16, 103);

    // Items table
    const tableData = (invoice.items || []).map((item: any, idx: number) => [
      String(idx + 1), item.description || 'Service', '8525', String(item.quantity),
      `Rs. ${Number(item.unitPrice).toLocaleString('en-IN')}`,
      `Rs. ${Number(item.total).toLocaleString('en-IN')}`
    ]);
    (doc as any).autoTable({
      startY: 108,
      head: [['#', 'Description / Particulars', 'HSN/SAC', 'Qty', 'Unit Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center' },
      columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 1: { cellWidth: 68 }, 2: { halign: 'center', cellWidth: 20 }, 3: { halign: 'center', cellWidth: 12 }, 4: { halign: 'right', cellWidth: 28 }, 5: { halign: 'right', cellWidth: 30 } },
      bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [248, 249, 255] },
    });
    const finalY = (doc as any).lastAutoTable.finalY + 6;

    // Totals
    const subtotal = invoice.totalAmount - (invoice.taxAmount || 0);
    doc.setFillColor(248, 249, 255);
    doc.roundedRect(115, finalY, 78, 30, 2, 2, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 80);
    doc.text('Subtotal:', 120, finalY + 9);
    doc.text(`Rs. ${subtotal.toLocaleString('en-IN')}`, 190, finalY + 9, { align: 'right' });
    doc.text(`GST (${invoice.taxRate || 18}%):`, 120, finalY + 17);
    doc.text(`Rs. ${(invoice.taxAmount || 0).toLocaleString('en-IN')}`, 190, finalY + 17, { align: 'right' });
    doc.setFillColor(30, 64, 175);
    doc.roundedRect(115, finalY + 21, 78, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text('Total Payable:', 120, finalY + 28);
    doc.text(`Rs. ${invoice.totalAmount.toLocaleString('en-IN')}`, 190, finalY + 28, { align: 'right' });

    // Payment Info
    const payY = finalY + 38;
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
    doc.line(14, payY, pageWidth - 14, payY);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(30, 64, 175);
    doc.text('PAYMENT DETAILS', 14, payY + 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(50, 50, 50);
    doc.text('Bank: Axis Bank, THIYAGARASANAPALLI', 14, payY + 15);
    doc.text('A/c Name: SK TECHNOLOGY', 14, payY + 21);
    doc.text('A/c No: 924020061649159', 14, payY + 27);
    doc.text('IFSC: UTIB0004965', 14, payY + 33);

    // QR & Logos (Placeholder logic)
    try {
      doc.addImage('/assets/payment_qr.png', 'PNG', 165, payY + 2, 25, 25);
    } catch (err) {
       console.warn("QR missing");
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(30);
    doc.line(pageWidth - 80, payY + 38, pageWidth - 14, payY + 38);
    doc.text('Authorised Signatory', pageWidth - 47, payY + 44, { align: 'center' });
    
    // Footer
    const footY = doc.internal.pageSize.getHeight() - 14;
    doc.setFillColor(30, 64, 175);
    doc.rect(0, footY, pageWidth, 14, 'F');
    doc.setFontSize(7); doc.setTextColor(255);
    doc.text('SK TECHNOLOGY | Ph: 9600975483 | Shoolagiri, Krishnagiri, TN - 635117', pageWidth / 2, footY + 7, { align: 'center' });

    doc.save(`SKTech_Invoice_${invoice.invoiceNumber || invoice._id}.pdf`);
  };

  const { totalAmount: currentTotal, taxAmount: currentTax } = calculateTotals(newInvoice.items, newInvoice.taxRate);
  const subtotal = newInvoice.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

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
            </div>
          </div>
          <button 
             onClick={() => {
               setEditingInvoiceId(null);
               setNewInvoice({
                 manualCustomer: { name: '', email: '', phone: '', address: '' },
                 gstNumber: '',
                 companyLogo: '',
                 items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
                 taxRate: 18,
                 notes: ''
               });
               setIsCreateModalOpen(true);
             }}
             className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl active:scale-95"
          >
             Manual Invoice
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
           <div className="glass-card p-10 rounded-[3rem] border border-border-base shadow-xl">
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Total Billed</p>
              <h3 className="text-4xl font-black text-fg-primary tracking-tighter flex items-center gap-2 tabular-nums italic">
                 <IndianRupee className="h-6 w-6 text-blue-500" />
                 {invoices.reduce((acc, inv) => acc + inv.totalAmount, 0).toLocaleString()}
              </h3>
           </div>
           <div className="glass-card p-10 rounded-[3rem] border border-border-base shadow-xl">
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Collected</p>
              <h3 className="text-4xl font-black text-green-500 tracking-tighter flex items-center gap-2 tabular-nums italic">
                 <IndianRupee className="h-6 w-6" />
                 {invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + inv.totalAmount, 0).toLocaleString()}
              </h3>
           </div>
           <div className="glass-card p-10 rounded-[3rem] border border-border-base shadow-xl">
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Volume</p>
              <h3 className="text-4xl font-black text-fg-primary tracking-tighter italic">{invoices.length}</h3>
           </div>
        </div>

        <div className="glass-card rounded-[3.5rem] overflow-hidden border border-border-base shadow-2xl bg-card">
           <div className="overflow-x-auto overflow-y-hidden">
              <table className="w-full text-left">
                 <thead className="bg-bg-muted/50 text-[10px] font-black uppercase tracking-widest text-fg-muted border-b border-border-base">
                     <tr>
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
                            <span className="font-mono text-sm font-black text-fg-primary tracking-tight bg-bg-muted px-3 py-1.5 rounded-lg border border-border-base">#{inv.invoiceNumber?.split('-')[1] || inv._id.slice(-6)}</span>
                         </td>
                         <td className="px-10 py-10">
                            <p className="font-black text-sm text-fg-primary uppercase tracking-tight">{inv.manualCustomer?.name || inv.customer?.name || 'Walk-in'}</p>
                            <p className="text-[10px] font-bold text-fg-muted tracking-widest">{inv.manualCustomer?.phone || inv.customer?.phone}</p>
                         </td>
                         <td className="px-10 py-10">
                            <div className="flex items-center space-x-2 text-blue-600 font-black italic">
                               <IndianRupee className="h-4 w-4" />
                               <span className="tabular-nums">{inv.totalAmount?.toLocaleString()}</span>
                            </div>
                         </td>
                         <td className="px-10 py-10">
                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                              inv.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>{inv.status}</span>
                         </td>
                         <td className="px-10 py-10 text-right">
                            <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => handleEditInitiate(inv)} className="p-3 bg-bg-muted border border-border-base rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Edit">
                                  <Edit2 className="h-4 w-4" />
                               </button>
                               <button onClick={() => handleDownloadInvoice(inv)} className="p-3 bg-bg-muted border border-border-base rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="PDF">
                                  <Download className="h-4 w-4" />
                               </button>
                               <button onClick={() => handleDeleteInvoice(inv._id)} className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all" title="Delete">
                                  <Trash2 className="h-4 w-4" />
                               </button>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        <AnimatePresence>
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl overflow-y-auto">
               <motion.div initial={{ opacity: 0, scale: 0.95, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 50 }} className="relative w-full max-w-5xl bg-card border border-card-border rounded-[4rem] p-12 lg:p-20 shadow-2xl my-20">
                  <div className="flex justify-between items-start mb-16">
                     <div className="space-y-4">
                        <h2 className="text-5xl font-black text-fg-primary uppercase tracking-tighter italic leading-none">{editingInvoiceId ? 'Edit' : 'Strategic'} <span className="text-blue-500 non-italic">Invoice</span></h2>
                        <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.4em] ml-2">Manual Transaction Entry</p>
                     </div>
                     <button onClick={() => setIsCreateModalOpen(false)} className="p-4 bg-bg-muted rounded-2xl hover:bg-red-500 hover:text-white transition-all"><X className="h-6 w-6" /></button>
                  </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
                   <div className="lg:col-span-4 space-y-10">
                      <div className="space-y-6">
                         <div className="flex items-center space-x-3 mb-2">
                           <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                           <h4 className="text-[10px] font-black text-fg-primary uppercase tracking-[0.2em] italic">Recipient Information</h4>
                         </div>
                         <div className="space-y-4">
                           <div className="relative group">
                              <input placeholder="Tactical Name" value={newInvoice.manualCustomer.name} onChange={e => setNewInvoice(p => ({...p, manualCustomer: {...p.manualCustomer, name: e.target.value}}))} className="w-full bg-bg-muted border border-border-base rounded-[1.5rem] p-5 text-xs font-black uppercase tracking-tight focus:border-blue-600 focus:bg-bg-surface transition-all outline-none text-fg-primary" />
                           </div>
                           <div className="relative group">
                              <input placeholder="+91 Signal Phone" value={newInvoice.manualCustomer.phone} onChange={e => setNewInvoice(p => ({...p, manualCustomer: {...p.manualCustomer, phone: e.target.value}}))} className="w-full bg-bg-muted border border-border-base rounded-[1.5rem] p-5 text-xs font-black uppercase tracking-tight focus:border-blue-600 focus:bg-bg-surface transition-all outline-none text-fg-primary" />
                           </div>
                           <div className="relative group">
                              <textarea placeholder="Deployment Address" value={newInvoice.manualCustomer.address} onChange={e => setNewInvoice(p => ({...p, manualCustomer: {...p.manualCustomer, address: e.target.value}}))} className="w-full bg-bg-muted border border-border-base rounded-[1.5rem] p-5 text-xs font-black uppercase tracking-tight focus:border-blue-600 focus:bg-bg-surface transition-all outline-none text-fg-primary h-40 resize-none" />
                           </div>
                         </div>
                      </div>
                   </div>

                   <div className="lg:col-span-8 space-y-12">
                      <div className="space-y-6">
                         <div className="flex justify-between items-center bg-bg-muted/50 p-6 rounded-[2rem] border border-border-base">
                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Inventory Selection</h4>
                            <button onClick={handleAddItem} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20">
                               <Plus className="h-3.5 w-3.5" />
                               <span>Initialize Item</span>
                            </button>
                         </div>
                         <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                            {newInvoice.items.map((item, i) => (
                               <div key={i} className="grid grid-cols-12 gap-4 md:gap-6 items-end bg-bg-muted/10 p-6 md:p-8 rounded-[2.5rem] border border-border-base hover:border-blue-500/30 transition-all relative group">
                                  <div className="col-span-12 lg:col-span-5 space-y-4">
                                     <div className="relative">
                                        <select onChange={(e) => handleProductSelect(i, e.target.value)} className="w-full bg-bg-surface border border-border-base rounded-xl p-4 text-[10px] font-black uppercase focus:border-blue-600 outline-none text-fg-primary [&>option]:bg-bg-surface">
                                           <option value="">Select Protocol Asset...</option>
                                           {products.map(p => (<option key={p._id} value={p._id}>{p.name}</option>))}
                                        </select>
                                     </div>
                                     <input placeholder="Manual Override Description..." value={item.description} onChange={e => handleUpdateItem(i, 'description', e.target.value)} className="w-full bg-transparent border-b border-border-base p-2 text-xs font-black uppercase tracking-tight text-fg-primary outline-none focus:border-blue-600" />
                                  </div>
                                  <div className="col-span-5 lg:col-span-3">
                                     <label className="text-[8px] font-black text-fg-muted uppercase tracking-widest block mb-2 ml-1">Quantity</label>
                                     <input type="number" value={item.quantity} onChange={e => handleUpdateItem(i, 'quantity', parseInt(e.target.value) || 0)} className="w-full bg-bg-surface border border-border-base rounded-xl p-4 text-[10px] font-black text-center text-fg-primary focus:border-blue-600 outline-none transition-all" />
                                  </div>
                                  <div className="col-span-5 lg:col-span-3">
                                     <label className="text-[8px] font-black text-fg-muted uppercase tracking-widest block mb-2 ml-1">Unit Rate (₹)</label>
                                     <input type="number" value={item.unitPrice} onChange={e => handleUpdateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-bg-surface border border-border-base rounded-xl p-4 text-[10px] font-black text-center text-fg-primary focus:border-blue-600 outline-none transition-all" />
                                  </div>
                                  <div className="col-span-2 lg:col-span-1 flex items-center justify-center h-[52px]">
                                     <button onClick={() => setNewInvoice(p => ({...p, items: p.items.filter((_, idx) => idx !== i)}))} className="p-3.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm w-full flex justify-center">
                                        <Trash2 className="h-4 w-4" />
                                     </button>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="pt-10 border-t-2 border-dashed border-border-base flex flex-col md:flex-row justify-between gap-12">
                         <div className="flex-1 space-y-4">
                            <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest italic ml-1">Transaction Remarks</h4>
                            <textarea placeholder="Internal mission notes or additional details..." value={newInvoice.notes} onChange={e => setNewInvoice(p => ({...p, notes: e.target.value}))} className="w-full bg-bg-muted/50 border border-border-base rounded-[2rem] p-6 text-[11px] font-medium focus:border-blue-600 transition-all outline-none h-40 resize-none text-fg-primary" />
                         </div>
                         <div className="w-full md:w-80 p-8 bg-blue-600 rounded-[2.5rem] shadow-2xl shadow-blue-500/20 space-y-6">
                            <div className="space-y-4">
                               <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/50 tracking-widest">
                                  <span>Sub-Sum:</span>
                                  <span className="text-white">₹{subtotal.toLocaleString()}</span>
                               </div>
                               <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/50 tracking-widest">
                                  <span>GST ({newInvoice.taxRate}%):</span>
                                  <span className="text-white">₹{currentTax.toLocaleString()}</span>
                               </div>
                            </div>
                            <div className="pt-6 border-t border-white/10">
                               <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] mb-2">Total Extraction</span>
                                  <span className="text-5xl font-black text-white tracking-tighter italic leading-none">₹{currentTotal.toLocaleString()}</span>
                                </div>
                            </div>
                            <button onClick={handleCreateInvoice} disabled={isSubmitting} className="w-full py-6 mt-4 bg-white text-blue-600 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
                               {isSubmitting ? <Activity className="w-5 h-5 animate-spin" /> : <><Send className="h-5 w-5" /><span>{editingInvoiceId ? 'Update Data' : 'Deploy Bill'}</span></>}
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default BillingPage;
