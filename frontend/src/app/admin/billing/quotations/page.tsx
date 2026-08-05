"use client";
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Plus, FileText, Download, Printer, 
  MoreVertical, CheckCircle, Clock, XCircle, AlertCircle, 
  ArrowRight, FileOutput, Edit2, Copy, Trash2
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700',
    'Pending': 'bg-orange-100 text-orange-700',
    'Approved': 'bg-teal-100 text-teal-700',
    'Converted to Invoice': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
    'Expired': 'bg-red-50 text-red-600',
  };
  const style = styles[status] || 'bg-blue-100 text-blue-700';
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${style}`}>
      {status || 'Unknown'}
    </span>
  );
};

const StatCard = ({ title, count, amount, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-bg-surface p-4 rounded-xl border border-border-base shadow-sm flex items-center justify-between min-w-0 gap-2">
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-fg-muted mb-1 truncate">{title}</p>
      <div className="flex items-end gap-2 truncate min-w-0">
        <h3 className="text-lg xl:text-xl font-bold text-fg-primary truncate">{count}</h3>
        {amount > 0 && <p className="text-xs text-fg-muted mb-1 truncate">({`₹${amount.toLocaleString('en-IN')}`})</p>}
      </div>
    </div>
    <div className={`p-2 bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 rounded-lg flex-shrink-0`}>
      <Icon size={20} />
    </div>
  </div>
);

export default function QuotationsModule() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

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
      setQuotations(allBilling.filter((item: any) => item.type === 'quotation'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    try {
      await fetchWithAuth(`/billing/${id}`, { method: 'DELETE' });
      setActiveMenu(null);
      loadData();
    } catch (error) {
      alert('Failed to delete quotation');
    }
  };

  const handleDuplicate = async (q: any) => {
    if (!confirm('Are you sure you want to duplicate this quotation?')) return;
    try {
      const { _id, invoiceNumber, createdAt, updatedAt, ...rest } = q;
      rest.status = 'Draft';
      await fetchWithAuth('/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest)
      });
      setActiveMenu(null);
      alert('Quotation duplicated successfully!');
      loadData();
    } catch (error) {
      alert('Failed to duplicate quotation');
    }
  };

  const handleConvert = async (q: any) => {
    if (!confirm('Are you sure you want to convert this quotation to an invoice?')) return;
    try {
      const { _id, invoiceNumber, createdAt, updatedAt, ...rest } = q;
      rest.type = 'invoice';
      rest.status = 'draft';
      
      // Update original quotation status
      await fetchWithAuth(`/billing/${q._id}/follow-up`, {
        method: 'PATCH',
        body: JSON.stringify({ followUpStatus: 'Converted to Invoice' })
      });
      
      // Create new invoice
      await fetchWithAuth('/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest)
      });
      
      setActiveMenu(null);
      alert('Converted to Invoice successfully!');
      loadData();
    } catch(e) {
      alert('Conversion failed!');
    }
  };

  const generatePDF = async (inv: any, action?: string) => {
    const doc = new jsPDF();
    
    // Try to load Logo
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
      // Add logo on left
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
    
    // Quotation Title & Info on Right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text("QUOTATION", 150, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Quote No:", 150, 30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${inv.invoiceNumber || ('QTN-' + inv._id?.slice(-6))}`, 175, 30);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Date:", 150, 36);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${new Date(inv.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 175, 36);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Valid Until:", 150, 42);
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
    doc.text("Quote For:", 14, 56);
    
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
    const terms = doc.splitTextToSize(inv.terms || '1. Prices are subject to change.\n2. Quotation is valid for 15 days.\n3. Warranty as per manufacturer terms.', 100);
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
    doc.text("Total Estimate:", 135, finalY + 36);
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
      doc.save(`Quotation_${inv.invoiceNumber || inv._id?.slice(-6)}.pdf`);
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
    
    const msg = `Hello ${custName},\n\nYour invoice for Rs. ${total} has been generated. Quotation #: ${inv.invoiceNumber || inv._id?.slice(-6)}.\n\nThank you for choosing SK Tech CCTV!`;
    
    try {
      const pdfBlob = await generatePDF(inv, 'blob') as Blob;
      const file = new File([pdfBlob], `Quotation_${inv.invoiceNumber || inv._id?.slice(-6)}.pdf`, { type: 'application/pdf' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Quotation ${inv.invoiceNumber || inv._id?.slice(-6)}`,
          text: msg
        });
      } else {
        // Fallback for desktop WhatsApp
        alert('Web Share API for files is not supported on this browser. Downloading PDF instead. You can attach it manually.');
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Quotation_${inv.invoiceNumber || inv._id?.slice(-6)}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
      }

      await fetchWithAuth(`/billing/${inv._id}/follow-up`, { 
        method: 'PATCH', 
        body: JSON.stringify({ remarks: 'Quotation shared via WhatsApp', followUpStatus: 'Waiting' }) 
      });
      loadData();
    } catch(e) {
      console.error('Error sharing:', e);
    }
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
    if (filteredQuotes.length === 0) return alert('No data to export');
    
    let csv = 'Qtn No,Date,Customer,Phone,Valid Till,Amount,Status\n';
    filteredQuotes.forEach(q => {
      const qtnNo = q.invoiceNumber || `QTN-${q._id?.slice(-6)}`;
      const date = new Date(q.createdAt || Date.now()).toLocaleDateString('en-IN');
      const customerName = (q.manualCustomer?.name || q.customer?.name || 'Walk-in Customer').replace(/,/g, ' ');
      const phone = (q.manualCustomer?.phone || q.customer?.phone || '').replace(/,/g, ' ');
      const validTill = q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN') : 'N/A';
      const amount = q.totalAmount || 0;
      const status = q.status || 'Draft';
      
      csv += `${qtnNo},${date},${customerName},${phone},${validTill},${amount},${status}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `quotations_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getFiltered = () => {
    let result = quotations;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(quote => 
        quote.invoiceNumber?.toLowerCase().includes(q) || 
        quote.manualCustomer?.name?.toLowerCase().includes(q) ||
        quote.manualCustomer?.phone?.toLowerCase().includes(q) ||
        quote.status?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(quote => {
        const s = (quote.status || 'Draft').toLowerCase();
        return s === statusFilter.toLowerCase() || (statusFilter === 'Pending' && (s === 'waiting' || s === 'called'));
      });
    }

    if (dateFilter !== 'All') {
      const now = new Date();
      result = result.filter(quote => {
        const d = new Date(quote.createdAt || Date.now());
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

  const filteredQuotes = getFiltered();

  const getStats = (statusList: string[]) => {
    const list = quotations.filter(q => statusList.includes(q.status));
    return {
      count: list.length,
      amount: list.reduce((sum, q) => sum + (q.totalAmount || 0), 0)
    };
  };

  const stats = {
    draft: getStats(['Draft', 'draft']),
    pending: getStats(['Waiting', 'Pending', 'Called']),
    approved: getStats(['Approved', 'Customer Interested']),
    converted: getStats(['Converted to Invoice', 'Confirmed']),
    rejected: getStats(['Rejected']),
    expired: getStats(['Expired', 'Cancelled'])
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-fg-primary">Quotations</h2>
          <p className="text-sm text-fg-muted">Manage all estimates and quotes</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-bg-surface border border-border-base text-fg-primary rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            <Download size={16} /> Export
          </button>
          <Link href="/admin/billing/manual-invoice?type=quotation" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
            <Plus size={16} /> Create Quotation
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Draft" count={stats.draft.count} amount={stats.draft.amount} icon={FileText} color="gray" />
        <StatCard title="Pending" count={stats.pending.count} amount={stats.pending.amount} icon={Clock} color="orange" />
        <StatCard title="Approved" count={stats.approved.count} amount={stats.approved.amount} icon={CheckCircle} color="teal" />
        <StatCard title="Converted" count={stats.converted.count} amount={stats.converted.amount} icon={FileOutput} color="green" />
        <StatCard title="Rejected" count={stats.rejected.count} amount={stats.rejected.amount} icon={XCircle} color="red" />
        <StatCard title="Expired" count={stats.expired.count} amount={stats.expired.amount} icon={AlertCircle} color="red" />
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-bg-surface p-4 rounded-xl border border-border-base shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center z-10 relative">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search by Qtn No or Customer..."
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
             <option value="Approved">Approved</option>
             <option value="Converted to Invoice">Converted to Invoice</option>
             <option value="Rejected">Rejected</option>
             <option value="Expired">Expired</option>
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
                <th className="p-4 font-semibold whitespace-nowrap">Qtn No</th>
                <th className="p-4 font-semibold whitespace-nowrap">Date</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold whitespace-nowrap">Valid Till</th>
                <th className="p-4 font-semibold whitespace-nowrap">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border-base">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-fg-muted">
                    <div className="flex flex-col items-center justify-center">
                      <FileText size={48} className="text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No quotations found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q: any) => (
                  <tr key={q._id} className="hover:bg-gray-50 dark:hover:bg-bg-base/50 transition-colors group">
                    <td className="p-4 font-medium text-blue-600">
                      {q.invoiceNumber || `QTN-${q._id?.slice(-6)}`}
                    </td>
                    <td className="p-4 text-fg-primary whitespace-nowrap">
                      {new Date(q.createdAt || Date.now()).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4 text-fg-primary font-medium max-w-[200px] truncate">
                      {q.manualCustomer?.name || q.customer?.name || 'Walk-in Customer'}
                      <div className="text-xs text-fg-muted font-normal mt-0.5">{q.manualCustomer?.phone || ''}</div>
                    </td>
                    <td className="p-4 text-fg-muted whitespace-nowrap">
                      {q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td className="p-4 font-bold text-fg-primary whitespace-nowrap">
                      ₹{(q.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={q.status || 'Draft'} />
                    </td>
                    <td className="p-4 text-center relative action-menu-container">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => generatePDF(q)} className="p-1.5 text-fg-muted hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Print/PDF">
                          <Printer size={16} />
                        </button>
                        <button onClick={() => handleConvert(q)} className="p-1.5 text-fg-muted hover:text-green-600 hover:bg-green-50 rounded transition" title="Convert to Invoice">
                          <ArrowRight size={16} />
                        </button>
                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenu(activeMenu === q._id ? null : q._id)} 
                            className={`p-1.5 rounded transition ${activeMenu === q._id ? 'bg-gray-200 text-fg-primary' : 'text-fg-muted hover:text-fg-primary hover:bg-gray-100'}`} 
                            title="More Options"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          <AnimatePresence>
                            {activeMenu === q._id && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-bg-surface border border-border-base shadow-xl rounded-xl z-[100] overflow-hidden py-1"
                              >
                                <Link href={`/admin/billing/manual-invoice?type=quotation&id=${q._id}`} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-fg-primary hover:bg-gray-50 dark:hover:bg-bg-hover transition-colors text-left">
                                  <Edit2 size={14} /> Edit Quotation
                                </Link>
                                <button onClick={() => handleDuplicate(q)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-fg-primary hover:bg-gray-50 dark:hover:bg-bg-hover transition-colors text-left">
                                  <Copy size={14} /> Duplicate
                                </button>
                                <button onClick={() => handleConvert(q)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors text-left">
                                  <ArrowRight size={14} /> Convert to Invoice
                                </button>
                                <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-fg-primary hover:bg-gray-50 dark:hover:bg-bg-hover transition-colors text-left">
                                  <Download size={14} /> Download PDF
                                </button>
                                
                                    <button onClick={() => handleSetFollowUp(q)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-fg-primary hover:bg-gray-50 dark:hover:bg-bg-hover transition-colors text-left">
                                      <Clock size={14} /> Set Follow-up
                                    </button>
                                    <hr className="my-1 border-border-base" />
                                <button onClick={() => handleDelete(q._id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left">
                                  <Trash2 size={14} /> Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
