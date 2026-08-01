"use client";
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { motion } from 'framer-motion';
import { 
  IndianRupee, FileText, CheckCircle, Clock, 
  TrendingUp, AlertCircle, RefreshCw, Shield, 
  Wallet, PieChart
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend
);

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-bg-surface p-6 rounded-2xl border border-border-base shadow-sm relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`} />
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-sm font-medium text-fg-muted mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-fg-primary">{value}</h3>
        {trend && (
          <p className="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> {trend}
          </p>
        )}
      </div>
      <div className={`p-3 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 rounded-xl`}>
        <Icon size={24} />
      </div>
    </div>
  </motion.div>
);

export default function BillingDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchWithAuth('/billing');
        setData(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Derived Stats
  const quotations = data.filter(d => d.type === 'quotation');
  const invoices = data.filter(d => d.type === 'invoice');

  const totalQuotations = quotations.length;
  const draftQuotations = quotations.filter(q => q.status === 'Draft' || q.status === 'draft').length;
  const approvedQuotations = quotations.filter(q => ['Approved', 'Converted to Invoice'].includes(q.status)).length;
  
  const totalSalesAmount = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const pendingAmount = totalSalesAmount - paidAmount; // Simplified logic

  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 19000, 15000, 22000, 28000, totalSalesAmount || 35000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4
      }
    ]
  };

  const barChartData = {
    labels: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'],
    datasets: [
      {
        label: 'Payment Methods',
        data: [40, 35, 15, 10],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ]
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          title="Total Sales (YTD)" 
          value={`₹${totalSalesAmount.toLocaleString('en-IN')}`} 
          icon={IndianRupee} 
          color="blue" 
          trend="+12% from last month"
        />
        <StatCard 
          title="Total Quotations" 
          value={totalQuotations} 
          icon={FileText} 
          color="indigo" 
        />
        <StatCard 
          title="Payment Received" 
          value={`₹${paidAmount.toLocaleString('en-IN')}`} 
          icon={CheckCircle} 
          color="green" 
        />
        <StatCard 
          title="Pending Collection" 
          value={`₹${pendingAmount.toLocaleString('en-IN')}`} 
          icon={Clock} 
          color="orange" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-4">
         <StatCard title="Draft Quotations" value={draftQuotations} icon={PieChart} color="gray" />
         <StatCard title="Approved Quotations" value={approvedQuotations} icon={CheckCircle} color="teal" />
         <StatCard title="AMC Renewals Due" value="12" icon={RefreshCw} color="yellow" />
         <StatCard title="Warranty Expiring" value="8" icon={Shield} color="red" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-bg-surface p-6 rounded-2xl border border-border-base shadow-sm">
          <h3 className="text-lg font-bold text-fg-primary mb-4">Revenue Trend</h3>
          <div className="h-[300px] flex items-center justify-center">
            <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-bg-surface p-6 rounded-2xl border border-border-base shadow-sm">
          <h3 className="text-lg font-bold text-fg-primary mb-4">Collection by Mode</h3>
          <div className="h-[300px] flex items-center justify-center">
            <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Recent Activity Table (Skeleton/Mock for now) */}
      <div className="bg-white dark:bg-bg-surface rounded-2xl border border-border-base shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-border-base flex justify-between items-center">
          <h3 className="text-lg font-bold text-fg-primary">Recent Invoices</h3>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-bg-base text-fg-muted text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Invoice No</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border-base">
              {invoices.slice(0, 5).map((inv: any, idx: number) => (
                <tr key={inv._id || idx} className="hover:bg-gray-50 dark:hover:bg-bg-base/50 transition-colors">
                  <td className="p-4 text-fg-primary">
                    {new Date(inv.createdAt || Date.now()).toLocaleDateString('en-IN')}
                  </td>
                  <td className="p-4 font-medium text-blue-600">
                    {inv.invoiceNumber || `INV-${(inv._id || '').slice(-6)}`}
                  </td>
                  <td className="p-4 text-fg-primary">{inv.manualCustomer?.name || 'Walk-in Customer'}</td>
                  <td className="p-4 font-medium">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {inv.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-fg-muted">
                    No recent invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
