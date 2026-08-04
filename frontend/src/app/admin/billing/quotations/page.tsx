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
  <div className="bg-white dark:bg-bg-surface p-4 rounded-xl border border-border-base shadow-sm flex items-center justify-between">
    <div>
      <p className="text-xs font-medium text-fg-muted mb-1">{title}</p>
      <div className="flex items-end gap-2">
        <h3 className="text-xl font-bold text-fg-primary">{count}</h3>
        {amount > 0 && <p className="text-xs text-fg-muted mb-1">({`₹${amount.toLocaleString('en-IN')}`})</p>}
      </div>
    </div>
    <div className={`p-2 bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 rounded-lg`}>
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

const generatePDF = (inv: any, action?: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("SK TECH CCTV", 14, 22);
    doc.setFontSize(10);
    doc.text("123 Security Avenue, Chennai, TN, India", 14, 30);
    doc.text("Phone: +91 9876543210 | Email: contact@sktech.com", 14, 35);
    
    // Quotation Info
    doc.setFontSize(16);
    doc.text("INVOICE", 150, 22);
    doc.setFontSize(10);
    doc.text(`Quotation #: ${inv.invoiceNumber || ('QTN-' + inv._id?.slice(-6))}`, 150, 30);
    doc.text(`Date: ${new Date(inv.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 150, 35);
    doc.text(`Due Date: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : 'N/A'}`, 150, 40);

    // Customer Info
    doc.setFontSize(12);
    doc.text("Bill To:", 14, 50);
    doc.setFontSize(10);
    const custName = inv.manualCustomer?.name || inv.customer?.name || 'Walk-in Customer';
    const custPhone = inv.manualCustomer?.phone || inv.customer?.phone || '';
    const custAddress = inv.manualCustomer?.address || inv.customer?.address || '';
    doc.text(custName, 14, 56);
    if (custPhone) doc.text(custPhone, 14, 61);
    if (custAddress) {
      const splitAddr = doc.splitTextToSize(custAddress, 80);
      doc.text(splitAddr, 14, 66);
    }

    // Items Table
    const tableColumn = ["#", "Description", "Qty", "Price", "Total"];
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
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY || 85;
    doc.text(`Sub Total: Rs. ${inv.subTotal || inv.totalAmount || 0}`, 140, finalY + 10);
    doc.text(`Tax: Rs. ${inv.taxAmount || 0}`, 140, finalY + 15);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount: Rs. ${inv.totalAmount || 0}`, 140, finalY + 22);

    // Footer / Terms
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Terms & Conditions:", 14, finalY + 40);
    doc.setFontSize(8);
    const terms = doc.splitTextToSize(inv.terms || '1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.', 100);
    doc.text(terms, 14, finalY + 45);

    doc.text("Authorized Signature", 150, finalY + 55);
    doc.line(140, finalY + 50, 190, finalY + 50);

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
      const pdfBlob = generatePDF(inv, 'blob') as Blob;
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
        doc.save(`Quotation_${inv.invoiceNumber || inv._id?.slice(-6)}.pdf`);
        const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
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

  
  
  const getFollowUpDays = (date) => {
    if(!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    if(days < 0) return { text: `${Math.abs(days)} days overdue`, color: 'text-red-500' };
    if(days === 0) return { text: 'Due today', color: 'text-orange-500' };
    return { text: `${days} days left`, color: 'text-blue-500' };
  };

  const handleSetFollowUp = async (inv) => {
    const days = prompt('Enter number of days for follow-up reminder (e.g. 10):');
    if(!days || isNaN(days)) return;
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
