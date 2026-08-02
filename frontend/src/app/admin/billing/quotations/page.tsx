"use client";
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Plus, FileText, Download, Printer, 
  MoreVertical, CheckCircle, Clock, XCircle, AlertCircle, 
  ArrowRight, FileOutput
} from 'lucide-react';
import Link from 'next/link';

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

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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
      loadData();
    } catch (error) {
      alert('Failed to delete quotation');
    }
  };

  const handleExport = () => {
    if (quotations.length === 0) return alert('No data to export');
    
    let csv = 'Qtn No,Date,Customer,Valid Till,Amount,Status\n';
    quotations.forEach(q => {
      const qtnNo = q.invoiceNumber || `QTN-${q._id?.slice(-6)}`;
      const date = new Date(q.createdAt || Date.now()).toLocaleDateString('en-IN');
      const customerName = (q.manualCustomer?.name || q.customer?.name || 'Walk-in Customer').replace(/,/g, '');
      const validTill = q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN') : 'N/A';
      const amount = q.totalAmount || 0;
      const status = q.status || 'Draft';
      
      csv += `${qtnNo},${date},${customerName},${validTill},${amount},${status}\n`;
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
    if (!search) return quotations;
    return quotations.filter(q => 
      q.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || 
      q.manualCustomer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.status?.toLowerCase().includes(search.toLowerCase())
    );
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
           <select className="px-3 py-2 bg-gray-50 dark:bg-bg-base border border-border-base rounded-lg text-sm text-fg-primary outline-none">
             <option>All Status</option>
             <option>Draft</option>
             <option>Pending</option>
             <option>Approved</option>
           </select>
           <select className="px-3 py-2 bg-gray-50 dark:bg-bg-base border border-border-base rounded-lg text-sm text-fg-primary outline-none">
             <option>Date Range</option>
             <option>This Month</option>
             <option>Last 30 Days</option>
             <option>This Year</option>
           </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-bg-surface rounded-xl border border-border-base shadow-sm overflow-visible relative z-0">
        <div className="overflow-x-auto min-h-[400px]">
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
                    <td className="p-4 text-center relative">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1.5 text-fg-muted hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Print/PDF">
                          <Printer size={16} />
                        </button>
                        <button className="p-1.5 text-fg-muted hover:text-green-600 hover:bg-green-50 rounded transition" title="Convert to Invoice">
                          <ArrowRight size={16} />
                        </button>
                        <div className="relative">
                          <button onClick={() => setActiveMenu(activeMenu === q._id ? null : q._id)} className="p-1.5 text-fg-muted hover:text-fg-primary hover:bg-gray-100 rounded transition" title="More Options">
                            <MoreVertical size={16} />
                          </button>
                          {activeMenu === q._id && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-bg-surface border border-border-base rounded-lg shadow-lg overflow-hidden z-[100]">
                              <button onClick={() => { setActiveMenu(null); alert('View feature coming soon') }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-bg-base text-fg-primary">View Details</button>
                              <button onClick={() => { setActiveMenu(null); handleDelete(q._id) }} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600">Delete</button>
                            </div>
                          )}
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
