"use client";
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Plus, Receipt, Download, Printer, 
  MoreVertical, CheckCircle, Clock, XCircle, AlertCircle, 
  Wallet, Share2, Eye, X, Edit2, Copy, Trash2, Mail
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700',
    'Unpaid': 'bg-red-100 text-red-700',
    'Pending': 'bg-orange-100 text-orange-700',
    'Partial Paid': 'bg-blue-100 text-blue-700',
    'Paid': 'bg-green-100 text-green-700',
    'Cancelled': 'bg-gray-100 text-gray-500',
  };
  const style = styles[status] || 'bg-orange-100 text-orange-700'; // Default to Pending-like
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${style}`}>
      {status || 'Pending'}
    </span>
  );
};

const StatCard = ({ title, count, amount, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-bg-surface p-4 rounded-xl border border-border-base shadow-sm flex items-center justify-between">
    <div>
      <p className="text-xs font-medium text-fg-muted mb-1">{title}</p>
      <div className="flex items-end gap-2">
        <h3 className="text-xl font-bold text-fg-primary">{count}</h3>
        {amount >= 0 && <p className="text-xs text-fg-muted mb-1">({`₹${amount.toLocaleString('en-IN')}`})</p>}
      </div>
    </div>
    <div className={`p-2 bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 rounded-lg`}>
      <Icon size={20} />
    </div>
  </div>
);

export default function SalesInvoiceModule() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [timelineModal, setTimelineModal] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.action-menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getFiltered = () => {
    let result = invoices;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(inv => 
        inv.invoiceNumber?.toLowerCase().includes(q) || 
        inv.manualCustomer?.name?.toLowerCase().includes(q) ||
        inv.manualCustomer?.phone?.toLowerCase().includes(q) ||
        inv.status?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(inv => {
        const s = (inv.status || 'Pending').toLowerCase();
        return s === statusFilter.toLowerCase() || (statusFilter === 'Unpaid' && (s === 'pending' || s === 'waiting'));
      });
    }

    if (dateFilter !== 'All') {
      const now = new Date();
      result = result.filter(inv => {
        const d = new Date(inv.createdAt || Date.now());
        if (dateFilter === 'Today') {
          return d.toDateString() === new Date().toDateString();
        }
        if (dateFilter === 'This Week') {
          const first = now.getDate() - now.getDay();
          const firstDay = new Date(now.setDate(first));
          return d >= firstDay;
        }
        if (dateFilter === 'This Month') {
          return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
        }
        return true;
      });
    }

    return result;
  };

  const filteredInvoices = getFiltered();

  const getStats = (statusList: string[]) => {
    const list = invoices.filter(inv => statusList.includes(inv.status));
    return {
      count: list.length,
      amount: list.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
    };
  };

  const stats = {
    total: {
      count: invoices.length,
      amount: invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
    },
    paid: getStats(['Paid', 'paid']),
    partial: getStats(['Partial Paid', 'partially_paid']),
    unpaid: getStats(['Unpaid', 'Pending', 'Waiting']),
    cancelled: getStats(['Cancelled', 'cancelled']),
  };

  
  const getFollowUpDays = (date: any) => {
    if(!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    if(days < 0) return { text: `${Math.abs(days)} days overdue`, color: 'text-red-500' };
    if(days === 0) return { text: 'Due today', color: 'text-orange-500' };
    return { text: `${days} days left`, color: 'text-blue-500' };
  };

  const handleSetFollowUp = async (inv: any) => {
    const days = prompt('Enter number of days for follow-up reminder (e.g. 10):');
    if(!days || isNaN(Number(days))) return;
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + parseInt(days));
    try {
      await fetchWithAuth(`/billing/${inv._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpDate: followUpDate.toISOString() })
      });
      loadData();
    } catch(e) {
      alert('Failed to set follow up');
    }
  };

  const handleExport = () => {
    if (filteredInvoices.length === 0) return alert('No data to export');
    
    let csv = 'Invoice No,Date,Customer,Phone,Amount,Status,Payment Status\n';
    filteredInvoices.forEach(inv => {
      const invNo = inv.invoiceNumber || `INV-${inv._id?.slice(-6)}`;
      const date = new Date(inv.createdAt || Date.now()).toLocaleDateString('en-IN');
      const customerName = (inv.manualCustomer?.name || inv.customer?.name || 'Walk-in Customer').replace(/,/g, ' ');
      const phone = (inv.manualCustomer?.phone || inv.customer?.phone || '').replace(/,/g, ' ');
      const amount = inv.totalAmount || 0;
      const status = inv.status || 'Pending';
      const payment = inv.paymentStatus || 'Pending';
      
      csv += `${invNo},${date},${customerName},${phone},${amount},${status},${payment}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `sales_invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const generatePDF = async (inv: any, action?: string) => {
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
    
    // Header - Company Details
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
    
    // Invoice Title & Info on Right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text("INVOICE", 150, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Invoice No:", 150, 30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${inv.invoiceNumber || ('INV-' + inv._id?.slice(-6))}`, 175, 30);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Date:", 150, 36);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${new Date(inv.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 175, 36);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Due Date:", 150, 42);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.text(`${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : 'N/A'}`, 175, 42);

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 48, 196, 48);

    // Customer Info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("Billed To:", 14, 56);
    
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const custName = inv.manualCustomer?.name || inv.customer?.name || 'Walk-in Customer';
    const custPhone = inv.manualCustomer?.phone || inv.customer?.phone || '';
    const custAddress = inv.manualCustomer?.address || inv.customer?.address || '';
    doc.text(custName, 14, 62);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    if (custPhone) doc.text(`Phone: ${custPhone}`, 14, 67);
    if (custAddress) {
      const splitAddr = doc.splitTextToSize(custAddress, 80);
      doc.text(splitAddr, 14, 72);
    }

    // Items Table
    const tableColumn = ["#", "Item Description", "Quantity", "Unit Price", "Total Amount"];
    const tableRows: any[] = [];
    
    if (inv.items && inv.items.length > 0) {
      inv.items.forEach((item: any, i: number) => {
        tableRows.push([
          i + 1,
          item.description || 'Custom Item',
          item.quantity || 1,
          `Rs. ${item.unitPrice || 0}`,
          `Rs. ${item.total || 0}`
        ]);
      });
    } else if (inv.products && inv.products.length > 0) {
      inv.products.forEach((p: any, i: number) => {
        tableRows.push([
          i + 1,
          p.product?.name || 'Product',
          p.quantity || 1,
          `Rs. ${p.price || 0}`,
          `Rs. ${(p.price || 0) * (p.quantity || 1)}`
        ]);
      });
    }

    autoTable(doc, {
      startY: 85,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { textColor: 50 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { top: 85 }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY || 85;
    
    // Notes on Left
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("Terms & Conditions:", 14, finalY + 15);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    const terms = doc.splitTextToSize(inv.terms || '1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.\n3. Payment due within 15 days.', 100);
    doc.text(terms, 14, finalY + 20);
    
    // Summary Box on Right
    doc.setFillColor(248, 250, 252);
    doc.rect(130, finalY + 10, 66, 35, 'F');
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Sub Total:", 135, finalY + 18);
    doc.text(`Rs. ${inv.subTotal || inv.totalAmount || 0}`, 192, finalY + 18, { align: 'right' });
    
    doc.text("Tax (GST):", 135, finalY + 24);
    doc.text(`Rs. ${inv.taxAmount || 0}`, 192, finalY + 24, { align: 'right' });
    
    doc.setDrawColor(226, 232, 240);
    doc.line(135, finalY + 28, 192, finalY + 28);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("Total Amount:", 135, finalY + 36);
    doc.text(`Rs. ${inv.totalAmount || 0}`, 192, finalY + 36, { align: 'right' });

    // Footer - Auth Sign
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("For SK TECHNOLOGY", 192, finalY + 65, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Authorized Signature", 192, finalY + 70, { align: 'right' });

    if (action === 'blob') {
      return doc.output('blob');
    } else {
      doc.save(`Invoice_${inv.invoiceNumber || inv._id?.slice(-6)}.pdf`);
    }
  };

  const handleShareWhatsApp = async (inv: any) => {
    const custName = inv.manualCustomer?.name || inv.customer?.name || 'Customer';
    const phone = inv.manualCustomer?.phone || inv.customer?.phone || '';
    const total = inv.totalAmount || 0;
    
    if (!phone) {
      alert('No phone number associated with this customer.');
      return;
    }
    
    const msg = `Hello ${custName},\n\nYour invoice for Rs. ${total} has been generated. Invoice #: ${inv.invoiceNumber || inv._id?.slice(-6)}.\n\nThank you for choosing SK Tech CCTV!`;
    
    try {
      const pdfBlob = await generatePDF(inv, 'blob') as Blob;
      const file = new File([pdfBlob], `Invoice_${inv.invoiceNumber || inv._id?.slice(-6)}.pdf`, { type: 'application/pdf' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice ${inv.invoiceNumber || inv._id?.slice(-6)}`,
          text: msg
        });
      } else {
        // Fallback for desktop WhatsApp
        alert('Web Share API for files is not supported on this browser. Downloading PDF instead. You can attach it manually.');
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${inv.invoiceNumber || inv._id?.slice(-6)}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
      }

      await fetchWithAuth(`/billing/${inv._id}/follow-up`, { 
        method: 'PATCH', 
        body: JSON.stringify({ remarks: 'Invoice shared via WhatsApp', followUpStatus: 'Waiting' }) 
      });
      loadData();
    } catch(e) {
      console.error('Error sharing:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await fetchWithAuth(`/billing/${id}`, { method: 'DELETE' });
      setActiveMenu(null);
      loadData();
    } catch(e) {
      alert('Failed to delete invoice');
    }
  };

  const handleDuplicate = async (inv: any) => {
    if (!confirm('Are you sure you want to duplicate this invoice?')) return;
    try {
      const { _id, invoiceNumber, createdAt, updatedAt, ...rest } = inv;
      rest.status = 'Draft';
      await fetchWithAuth('/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest)
      });
      setActiveMenu(null);
      alert('Invoice duplicated successfully!');
      loadData();
    } catch(e) {
      alert('Failed to duplicate invoice');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fg-primary">Sales Invoices</h2>
          <p className="text-sm text-fg-muted">Manage your billings and collections</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-bg-surface border border-border-base text-fg-primary rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            <Download size={16} /> Export
          </button>
          <Link href="/admin/billing/manual-invoice?type=invoice" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
            <Plus size={16} /> Create Invoice
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total Sales" count={stats.total.count} amount={stats.total.amount} icon={Receipt} color="blue" />
        <StatCard title="Paid" count={stats.paid.count} amount={stats.paid.amount} icon={CheckCircle} color="green" />
        <StatCard title="Partial Paid" count={stats.partial.count} amount={stats.partial.amount} icon={Wallet} color="teal" />
        <StatCard title="Unpaid" count={stats.unpaid.count} amount={stats.unpaid.amount} icon={AlertCircle} color="orange" />
        <StatCard title="Cancelled" count={stats.cancelled.count} amount={stats.cancelled.amount} icon={XCircle} color="gray" />
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-bg-surface p-4 rounded-xl border border-border-base shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center z-10 relative">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search by Inv No or Customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-bg-base border border-border-base rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-bg-base border border-border-base rounded-lg text-sm font-medium hover:bg-gray-100 text-fg-primary">
            <Filter size={16} /> Filters
          </button>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
           <select 
             value={statusFilter}
             onChange={e => setStatusFilter(e.target.value)}
             className="px-3 py-2 bg-gray-50 dark:bg-bg-base border border-border-base rounded-lg text-sm text-fg-primary outline-none"
           >
             <option value="All">All Status</option>
             <option value="Draft">Draft</option>
             <option value="Pending">Pending</option>
             <option value="Partial Paid">Partial Paid</option>
             <option value="Paid">Paid</option>
             <option value="Unpaid">Unpaid</option>
           </select>
           <select 
             value={dateFilter}
             onChange={e => setDateFilter(e.target.value)}
             className="px-3 py-2 bg-gray-50 dark:bg-bg-base border border-border-base rounded-lg text-sm text-fg-primary outline-none"
           >
             <option value="All">Date Range</option>
             <option value="Today">Today</option>
             <option value="This Week">This Week</option>
             <option value="This Month">This Month</option>
           </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-bg-surface rounded-xl border border-border-base shadow-sm overflow-visible relative z-0">
        <div className="overflow-x-auto min-h-[400px] pb-56">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-bg-base border-b border-border-base text-fg-muted text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold whitespace-nowrap">Invoice No</th>
                <th className="p-4 font-semibold whitespace-nowrap">Date</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold whitespace-nowrap">Due Date</th>
                <th className="p-4 font-semibold whitespace-nowrap">Amount</th>
                <th className="p-4 font-semibold whitespace-nowrap">Balance</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border-base">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-fg-muted">
                    <div className="flex flex-col items-center justify-center">
                      <Receipt size={48} className="text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No invoices found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv: any) => {
                  const total = inv.totalAmount || 0;
                  // For now simulate balance based on status if paidAmount isn't strictly maintained
                  const paid = inv.status === 'Paid' ? total : inv.paidAmount || 0;
                  const balance = total - paid;
                  
                  return (
                    <tr key={inv._id} className="hover:bg-gray-50 dark:hover:bg-bg-base/50 transition-colors group">
                      <td className="p-4 font-medium text-blue-600">
                        {inv.invoiceNumber || `INV-${inv._id?.slice(-6)}`}
                      </td>
                      <td className="p-4 text-fg-primary whitespace-nowrap">
                        {new Date(inv.createdAt || Date.now()).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-4 text-fg-primary font-medium max-w-[200px] truncate">
                        {inv.manualCustomer?.name || inv.customer?.name || 'Walk-in Customer'}
                        <div className="text-xs text-fg-muted font-normal mt-0.5">{inv.manualCustomer?.phone || ''}</div>
                      </td>
                      <td className="p-4 text-fg-muted whitespace-nowrap">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="p-4 font-bold text-fg-primary whitespace-nowrap">
                        ₹{total.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 font-semibold text-orange-600 whitespace-nowrap">
                        ₹{balance > 0 ? balance.toLocaleString('en-IN') : '0'}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={inv.status || 'Pending'} />
                      </td>
                      <td className="p-4 text-center relative action-menu-container">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => generatePDF(inv)} className="p-1.5 text-fg-muted hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Print/PDF">
                            <Printer size={16} />
                          </button>
                          <button onClick={() => handleShareWhatsApp(inv)} className="p-1.5 text-fg-muted hover:text-green-600 hover:bg-green-50 rounded transition" title="Share WhatsApp">
                            <Share2 size={16} />
                          </button>
                          <button onClick={() => setTimelineModal(inv)} className="p-1.5 text-fg-muted hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="View Timeline">
                            <Eye size={16} />
                          </button>
                          
                          <div className="relative">
                            <button 
                              onClick={() => setActiveMenu(activeMenu === inv._id ? null : inv._id)} 
                              className={`p-1.5 rounded transition ${activeMenu === inv._id ? 'bg-gray-200 text-fg-primary' : 'text-fg-muted hover:text-fg-primary hover:bg-gray-100'}`} 
                              title="More Options"
                            >
                              <MoreVertical size={16} />
                            </button>

                            <AnimatePresence>
                              {activeMenu === inv._id && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-bg-surface border border-border-base shadow-xl rounded-xl z-50 overflow-hidden py-1"
                                >
                                  <Link href={`/admin/billing/manual-invoice?type=invoice&id=${inv._id}`} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-fg-primary hover:bg-gray-50 dark:hover:bg-bg-hover transition-colors text-left">
                                    <Edit2 size={14} /> Edit Invoice
                                  </Link>
                                  <button onClick={() => handleDuplicate(inv)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-fg-primary hover:bg-gray-50 dark:hover:bg-bg-hover transition-colors text-left">
                                    <Copy size={14} /> Duplicate
                                  </button>
                                  <button onClick={() => generatePDF(inv)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-fg-primary hover:bg-gray-50 dark:hover:bg-bg-hover transition-colors text-left">
                                    <Download size={14} /> Download PDF
                                  </button>
                                  
                                    <button onClick={() => handleSetFollowUp(inv)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-fg-primary hover:bg-gray-50 dark:hover:bg-bg-hover transition-colors text-left">
                                      <Clock size={14} /> Set Follow-up
                                    </button>
                                    <hr className="my-1 border-border-base" />
                                  <button onClick={() => handleDelete(inv._id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left">
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline Modal */}
      {timelineModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-bg-surface w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border-base flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-fg-primary flex items-center gap-2">
                <Clock className="text-blue-500" /> Activity Timeline
              </h3>
              <button onClick={() => setTimelineModal(null)} className="text-fg-muted hover:text-fg-primary">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {(!timelineModal.followUpHistory || timelineModal.followUpHistory.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                    <Clock size={32} />
                  </div>
                  <p className="text-fg-primary font-bold">No Activity Yet</p>
                  <p className="text-sm text-fg-muted">No follow-ups or updates recorded for this invoice.</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border-base before:to-transparent">
                  {timelineModal.followUpHistory.map((item: any, idx: number) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Clock size={16} />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border-base bg-white dark:bg-bg-surface shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-fg-primary text-sm">{item.status || 'Update'}</span>
                          <span className="text-[10px] font-semibold text-fg-muted px-2 py-0.5 bg-gray-100 rounded-full">
                            {new Date(item.date).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-sm text-fg-secondary mt-2">{item.remarks}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
