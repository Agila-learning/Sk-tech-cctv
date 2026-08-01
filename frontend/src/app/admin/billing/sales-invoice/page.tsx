"use client";
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Plus, Receipt, Download, Printer, 
  MoreVertical, CheckCircle, Clock, XCircle, AlertCircle, 
  Wallet, Share2
} from 'lucide-react';
import Link from 'next/link';

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
    if (!search) return invoices;
    return invoices.filter(inv => 
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || 
      inv.manualCustomer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.status?.toLowerCase().includes(search.toLowerCase())
    );
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
    cancelled: getStats(['Cancelled', 'cancelled'])
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
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-bg-surface border border-border-base text-fg-primary rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            <Download size={16} /> Export
          </button>
          <Link href="/admin/billing/manual-invoice" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
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
           <select className="px-3 py-2 bg-gray-50 dark:bg-bg-base border border-border-base rounded-lg text-sm text-fg-primary outline-none">
             <option>All Status</option>
             <option>Paid</option>
             <option>Unpaid</option>
             <option>Partial Paid</option>
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
                      <td className="p-4 text-center relative">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1.5 text-fg-muted hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Print/PDF">
                            <Printer size={16} />
                          </button>
                          <button className="p-1.5 text-fg-muted hover:text-green-600 hover:bg-green-50 rounded transition" title="Share WhatsApp">
                            <Share2 size={16} />
                          </button>
                          <button className="p-1.5 text-fg-muted hover:text-fg-primary hover:bg-gray-100 rounded transition" title="More Options">
                            <MoreVertical size={16} />
                          </button>
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
    </div>
  );
}
