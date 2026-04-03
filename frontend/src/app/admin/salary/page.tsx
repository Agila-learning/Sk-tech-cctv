"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  CreditCard, IndianRupee, Clock, TrendingUp, Users, 
  Search, Menu, ChevronLeft, Plus, Settings, Eye, 
  Calendar, CheckCircle, AlertCircle, Download, 
  ArrowUpRight, ArrowDownRight, RefreshCw, X 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
  PointElement, LineElement, Title, Tooltip, Legend 
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, 
  LineElement, Title, Tooltip, Legend
);

const SalaryManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTech, setSelectedTech] = useState<any>(null);
  const [salaryDetails, setSalaryDetails] = useState<any>(null);
  const [techStats, setTechStats] = useState<any>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustment, setAdjustment] = useState({ amount: 0, reason: '', type: 'addition' });
  const [config, setConfig] = useState({ 
    baseSalary: 0, 
    standardHoursPerDay: 8, 
    otRatePerHour: 0,
    commissionPerService: 0,
    type: 'monthly'
  });
  const [incentiveData, setIncentiveData] = useState({ amount: 0, reason: '' });
  const [isIncentiveModalOpen, setIsIncentiveModalOpen] = useState(false);
  const [isManualLogModalOpen, setIsManualLogModalOpen] = useState(false);
  const [manualLog, setManualLog] = useState({ date: new Date().toISOString().split('T')[0], hoursWorked: 8, reason: '' });

  const exportToPDF = async () => {
    if (!selectedTech || !salaryDetails) {
      alert("No data available for export");
      return;
    }
    
    try {
      const doc = new jsPDF();
      const techName = (selectedTech.name || "TECHNICIAN").toUpperCase();
      
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235);
      doc.text("SK TECHNOLOGY - PAYROLL", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      doc.text(`Statement for: ${currentMonth}`, 14, 30);
      doc.text(`Technician: ${techName}`, 14, 35);
      doc.text(`City: ${selectedTech.serviceCity || 'N/A'}`, 14, 40);

      const breakdown = salaryDetails.breakdown || {};
      
      autoTable(doc, {
        startY: 50,
        head: [['Component', 'Value']],
        body: [
          ['Base Salary', `INR ${(breakdown.base || 0).toLocaleString()}`],
          ['Overtime Amount', `INR ${(breakdown.overtime || 0).toLocaleString()}`],
          ['Commission Earnings', `INR ${(salaryDetails.commissionAmount || 0).toLocaleString()}`],
          [`Total Services (${salaryDetails.totalServiceReports || 0})`, 'Included in Commission'],
          ['Adjustments', `INR ${(breakdown.adjustments || 0).toLocaleString()}`],
          ['Total Payable', `INR ${(salaryDetails.payout || 0).toLocaleString()}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 9 }
      });

      let finalY = (doc as any).lastAutoTable.finalY + 15;

      if (salaryDetails.adjustmentHistory && salaryDetails.adjustmentHistory.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(30);
        doc.text("Adjustment Logs:", 14, finalY);
        
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Date', 'Reason', 'Amount']],
          body: salaryDetails.adjustmentHistory.map((adj: any) => [
            adj.date ? new Date(adj.date).toLocaleDateString() : 'N/A',
            adj.reason || 'No reason',
            `${(adj.amount || 0) >= 0 ? '+' : ''}${adj.amount || 0}`
          ]),
          theme: 'striped',
          styles: { fontSize: 8 }
        });
        finalY = (doc as any).lastAutoTable.finalY + 15;
      }

      // Add Payment Details Section
      if (finalY > 200) {
        doc.addPage();
        finalY = 20;
      }

      doc.setDrawColor(200);
      doc.line(14, finalY, 196, finalY);
      finalY += 10;
      
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.text("PAYMENT INFORMATION", 14, finalY);
      finalY += 8;

      try {
        // Adding Bank Details Image
        doc.addImage('/assets/bank_details.png', 'PNG', 14, finalY, 90, 50);
        // Adding QR Code Image
        doc.addImage('/assets/payment_qr.png', 'PNG', 110, finalY, 40, 40);
        
        finalY += 60;
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Authorized by SK TECHNOLOGY", 14, finalY);
      } catch (imgErr) {
        console.warn("Could not add images to PDF", imgErr);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Manual Payment Details: SK TECHNOLOGY | AXIS BANK | UTIB0004965", 14, finalY + 10);
      }

      doc.save(`Salary_${techName}_${new Date().getMonth()+1}_${new Date().getFullYear()}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to generate PDF. Check console for details.");
    }
  };

  const exportToExcel = () => {
    const data = technicians.map(t => ({
      'Technician Name': t.name,
      'Region': t.serviceCity,
      'Base Salary': t.salaryConfig?.base,
      'Status': t.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MonthlySummary");
    XLSX.writeFile(wb, `Salary_Summary_${new Date().getMonth()+1}_${new Date().getFullYear()}.xlsx`);
  };

  const router = useRouter();

  const loadData = async () => {
    try {
      const data = await fetchWithAuth('/admin/technicians/status');
      setTechnicians(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const viewSalaryBreakdown = async (tech: any) => {
    setSelectedTech(tech);
    try {
      const date = new Date();
      const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      const [salaryData, statsData] = await Promise.all([
        fetchWithAuth(`/salary/admin/technician/${tech._id}?month=${year}-${monthStr}`),
        fetchWithAuth(`/salary/admin/stats/${tech._id}`)
      ]);

      setSalaryDetails(salaryData);
      setTechStats(statsData);

      if (tech.salaryConfig) {
        setConfig({
          baseSalary: tech.salaryConfig.base || 0,
          standardHoursPerDay: tech.salaryConfig.workingHoursPerDay || 8,
          otRatePerHour: tech.salaryConfig.overtimeRate || 0,
          commissionPerService: tech.salaryConfig.commissionPerService || 0,
          type: tech.salaryConfig.type || 'monthly'
        });
      } else {
        setConfig({ baseSalary: 20000, standardHoursPerDay: 8, otRatePerHour: 150, commissionPerService: 0, type: 'monthly' });
      }
    } catch (error) {
      alert("Failed to load salary details");
    }
  };

  const updateConfig = async () => {
    try {
      await fetchWithAuth(`/salary/admin/config/${selectedTech._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...config,
          base: config.baseSalary,
          workingHoursPerDay: config.standardHoursPerDay,
          overtimeRate: config.otRatePerHour
        })
      });
      setIsConfigModalOpen(false);
      loadData();
    } catch (error) {
      alert("Failed to update config");
    }
  };

  const addAdjustment = async () => {
    try {
      const finalAmount = adjustment.type === 'deduction' ? -Math.abs(adjustment.amount) : Math.abs(adjustment.amount);
      await fetchWithAuth(`/salary/admin/adjust/${salaryDetails._id}`, {
        method: 'POST',
        body: JSON.stringify({
          amount: finalAmount,
          reason: adjustment.reason
        })
      });
      setIsAdjustModalOpen(false);
      viewSalaryBreakdown(selectedTech);
    } catch (error) {
      alert("Failed to add adjustment");
    }
  };

  const handleManualLog = async () => {
    try {
      await fetchWithAuth('/salary/admin/manual-log', {
        method: 'POST',
        body: JSON.stringify({
          technicianId: selectedTech._id,
          date: manualLog.date,
          hoursWorked: manualLog.hoursWorked,
          reason: manualLog.reason
        })
      });
      setIsManualLogModalOpen(false);
      viewSalaryBreakdown(selectedTech);
      alert("Hours logged and salary recalculated.");
    } catch (error) {
      alert("Failed to log hours");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex transition-all duration-500 overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 p-6 md:p-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
              <Menu className="h-6 w-6 text-blue-600" />
            </button>
            <button onClick={() => router.push('/admin')} className="p-4 bg-bg-muted border border-border-base rounded-2xl group">
              <ChevronLeft className="h-6 w-6 text-fg-primary group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-600/10 border border-green-600/20 rounded-full w-fit">
                <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Finance Module</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-fg-primary tracking-tighter uppercase italic">Salary <span className="text-blue-500 non-italic">Management</span></h1>
            </div>
          </div>
          <button onClick={exportToExcel} className="px-8 py-5 bg-bg-muted border border-border-base text-fg-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center gap-3">
            <Download className="h-4 w-4" />
            Summary Excel
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-black text-fg-primary uppercase italic">Service Team</h3>
              <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">{technicians.length} Members</span>
            </div>
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-hide">
              {technicians.map((tech) => (
                <button
                  key={tech._id}
                  onClick={() => viewSalaryBreakdown(tech)}
                  className={`w-full p-6 rounded-[2.5rem] border transition-all text-left flex items-center justify-between group ${selectedTech?._id === tech._id ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-500/30' : 'bg-bg-muted/50 border-border-base hover:bg-bg-muted/80'}`}
                >
                  <div className="flex items-center space-x-5">
                    <div className="w-14 h-14 bg-bg-surface rounded-2xl flex items-center justify-center font-black text-blue-500 shadow-xl overflow-hidden">
                      {tech.profilePic ? <img src={tech.profilePic} className="w-full h-full object-cover" /> : tech.name[0]}
                    </div>
                    <div>
                      <p className="text-lg font-black tracking-tight uppercase italic">{tech.name}</p>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${selectedTech?._id === tech._id ? 'text-white/70' : 'text-fg-muted'}`}>
                        ₹{tech.salaryConfig?.base || 0} / month
                      </p>
                    </div>
                  </div>
                  <Eye className={`h-5 w-5 ${selectedTech?._id === tech._id ? 'text-white' : 'text-fg-dim group-hover:text-blue-500'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            {salaryDetails ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="glass-card p-8 rounded-[3rem] border border-border-base">
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Today</p>
                    <h3 className="text-xl font-black text-blue-500 tracking-tighter italic truncate">₹{techStats?.today?.earnings.toLocaleString() || '0'}</h3>
                    <p className="text-[10px] font-bold text-fg-muted mt-2">{techStats?.today?.hours || 0} hrs logged</p>
                  </div>
                  <div className="glass-card p-8 rounded-[3rem] border border-border-base">
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">This Week</p>
                    <h3 className="text-xl font-black text-green-500 tracking-tighter italic truncate">₹{techStats?.week?.earnings.toLocaleString() || '0'}</h3>
                    <p className="text-[10px] font-bold text-fg-muted mt-2">{techStats?.week?.hours || 0} hrs logged</p>
                  </div>
                  <div className="glass-card p-8 rounded-[3rem] border border-border-base">
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Monthly Estimate</p>
                    <h3 className="text-xl font-black text-purple-500 tracking-tighter italic truncate">₹{techStats?.month?.earnings.toLocaleString() || '0'}</h3>
                    <p className="text-[10px] font-bold text-fg-muted mt-2">{techStats?.month?.hours || 0} hrs logged</p>
                  </div>
                  <div className="glass-card p-8 rounded-[3rem] border border-border-base bg-blue-600/5">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Final Payable</p>
                    <h3 className="text-xl font-black text-fg-primary tracking-tighter italic truncate">₹{salaryDetails.payout?.toLocaleString() || '0'}</h3>
                    <p className="text-[10px] font-bold text-fg-muted mt-2">Current Month Record</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-card p-8 rounded-[3rem] border border-card-border shadow-xl h-[350px]">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted mb-6">Earnings Trend (Daily)</h4>
                    <div className="h-[250px]">
                       <Bar 
                        data={{
                          labels: techStats?.history?.map((h: any) => h.date.split('-').slice(1).join('/')) || [],
                          datasets: [{ label: 'Earnings', data: techStats?.history?.map((h: any) => h.earnings) || [], backgroundColor: '#2563eb', borderRadius: 6 }]
                        }} 
                        options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
                       />
                    </div>
                  </div>
                  <div className="bg-card p-8 rounded-[3rem] border border-card-border shadow-xl h-[350px]">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted mb-6">Activity Density (Hours)</h4>
                    <div className="h-[250px]">
                       <Line 
                        data={{
                          labels: techStats?.history?.map((h: any) => h.date.split('-').slice(1).join('/')) || [],
                          datasets: [{ label: 'Hours', data: techStats?.history?.map((h: any) => h.hours) || [], borderColor: '#10b981', tension: 0.4, fill: true, backgroundColor: 'rgba(16, 185, 129, 0.05)' }]
                        }} 
                        options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
                       />
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-[3.5rem] border border-border-base overflow-hidden p-10 space-y-10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-fg-primary uppercase italic">Earning Breakdown</h3>
                    <div className="flex gap-4">
                      <button onClick={() => setIsConfigModalOpen(true)} className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-blue-600/10 hover:text-blue-500 transition-all">
                        <Settings className="h-5 w-5" />
                      </button>
                      <button onClick={() => setIsManualLogModalOpen(true)} className="px-6 py-4 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20">
                        Log Hours (Admin)
                      </button>
                      <button onClick={exportToPDF} className="px-6 py-4 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20">
                        Export PDF
                      </button>
                      <button onClick={() => setIsAdjustModalOpen(true)} className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20">
                        Add Adjustment
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Clock className="h-3 w-3 text-blue-500" /> Base Earnings
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600">Monthly Fixed</span>
                            <span className="text-sm font-black text-slate-900">₹{salaryDetails.salaryMonthly?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600">Daily Payouts</span>
                            <span className="text-sm font-black text-slate-900">₹{salaryDetails.salaryDaily?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600">Hourly Wage</span>
                            <span className="text-sm font-black text-slate-900">₹{salaryDetails.salaryHourly?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <TrendingUp className="h-3 w-3 text-green-500" /> Variable Pay
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600">Overtime (OT)</span>
                            <span className="text-sm font-black text-slate-900">₹{salaryDetails.overtimeAmount?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600">Service Commission</span>
                            <span className="text-sm font-black text-slate-900">₹{salaryDetails.commissionAmount?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-6 bg-blue-600/5 border border-blue-600/10 rounded-3xl space-y-4">
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                           <CheckCircle className="h-3 w-3 text-blue-600" /> Extras & Deductions
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-bold text-slate-600">Performance Incentive</span>
                             <span className="text-sm font-black text-blue-600">+₹{salaryDetails.incentiveAmount?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-bold text-slate-600">Monthly Bonus</span>
                             <span className="text-sm font-black text-green-600">+₹{salaryDetails.bonus?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-bold text-slate-600">Manual Adjustments</span>
                             <span className={`text-sm font-black ${salaryDetails.breakdown?.adjustments >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                               {salaryDetails.breakdown?.adjustments >= 0 ? '+' : ''}₹{salaryDetails.breakdown?.adjustments?.toLocaleString() || 0}
                             </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 bg-slate-900 rounded-3xl space-y-2 flex flex-col justify-center items-center text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Net Payout</p>
                        <h4 className="text-4xl font-black text-white tracking-tighter italic">₹{salaryDetails.totalPayable?.toLocaleString() || 0}</h4>
                        <p className="text-[10px] font-bold text-blue-400 italic">Ready for disbursement</p>
                      </div>
                    </div>
                  </div>
                  {techStats?.history?.length > 0 && (
                    <div className="space-y-6 pt-10 border-t border-border-base">
                       <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Attendance & Hours Logs</h4>
                       <div className="space-y-3">
                        {techStats.history.map((log: any, i: number) => (
                           <div key={i} className="flex justify-between items-center p-4 bg-bg-muted/30 rounded-2xl border border-border-base/50 group">
                             <div className="space-y-1">
                               <p className="text-xs font-bold text-fg-primary uppercase tracking-tight">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                               <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest">{log.hours} Hours Logged ({log.type || 'auto'})</p>
                             </div>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    setManualLog({ date: log.date, hoursWorked: log.hours, reason: log.remarks || '' });
                                    setIsManualLogModalOpen(true);
                                  }}
                                  className="p-2 hover:bg-blue-600/10 rounded-lg text-blue-500 transition-colors"
                                >
                                  <Settings className="h-3.5 w-3.5" />
                                </button>
                             </div>
                           </div>
                        ))}
                       </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-[600px] glass-card rounded-[4rem] border border-border-base flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="p-8 bg-blue-600/10 rounded-[2.5rem]">
                  <CreditCard className="h-16 w-16 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-fg-primary uppercase italic">No Member Selected</h3>
                  <p className="text-fg-muted text-lg max-w-sm mt-2">Select a technician from the list to view their monthly salary breakdown and performance.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden fixed bottom-8 right-8 p-6 bg-blue-600 text-white rounded-full shadow-2xl z-[100]">
          <Menu className="h-6 w-6" />
        </button>

        {/* Manual Log Modal */}
        <AnimatePresence>
          {isManualLogModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-md rounded-[3rem] border border-border-base p-10 space-y-8 shadow-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-fg-primary uppercase italic">Log Hours</h3>
                  <button onClick={() => setIsManualLogModalOpen(false)}><X className="h-6 w-6 text-fg-muted" /></button>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500" 
                      value={manualLog.date} 
                      onChange={e => setManualLog({ ...manualLog, date: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Hours Logged (e.g. 8)</label>
                    <input 
                      type="number" 
                      className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500" 
                      value={manualLog.hoursWorked} 
                      onChange={e => setManualLog({ ...manualLog, hoursWorked: parseFloat(e.target.value) })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Notes / Reason</label>
                    <textarea 
                      rows={2} 
                      className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500 resize-none" 
                      placeholder="Manual admin entry..."
                      value={manualLog.reason} 
                      onChange={e => setManualLog({ ...manualLog, reason: e.target.value })} 
                    />
                  </div>
                  <button onClick={handleManualLog} className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-green-700 transition-all shadow-xl">Update & Recalculate</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Adjust Modal */}
        <AnimatePresence>
          {isAdjustModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-md rounded-[3rem] border border-border-base p-10 space-y-8 shadow-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-fg-primary uppercase italic">Adjustment</h3>
                  <button onClick={() => setIsAdjustModalOpen(false)}><X className="h-6 w-6 text-fg-muted" /></button>
                </div>
                <div className="space-y-6">
                  <div className="flex bg-bg-muted rounded-2xl p-1.5 border border-border-base">
                    <button onClick={() => setAdjustment({ ...adjustment, type: 'addition' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adjustment.type === 'addition' ? 'bg-green-500 text-white' : 'text-fg-muted'}`}>Addition</button>
                    <button onClick={() => setAdjustment({ ...adjustment, type: 'deduction' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adjustment.type === 'deduction' ? 'bg-red-500 text-white' : 'text-fg-muted'}`}>Deduction</button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Amount</label>
                    <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500" value={adjustment.amount} onChange={e => setAdjustment({ ...adjustment, amount: parseFloat(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Reason</label>
                    <textarea rows={3} className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500 resize-none" value={adjustment.reason} onChange={e => setAdjustment({ ...adjustment, reason: e.target.value })} />
                  </div>
                  <button onClick={addAdjustment} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-xl">Apply Adjustment</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Config Modal */}
        <AnimatePresence>
          {isConfigModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-lg rounded-[3rem] border border-border-base p-10 space-y-8 shadow-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-fg-primary uppercase italic">Salary Config</h3>
                  <button onClick={() => setIsConfigModalOpen(false)}><X className="h-6 w-6 text-fg-muted" /></button>
                </div>
                <div className="space-y-6">
                  <div className="flex bg-slate-100 rounded-2xl p-1.5 border border-slate-200 mb-6">
                    <button onClick={() => setConfig({ ...config, type: 'monthly' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${config.type === 'monthly' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400'}`}>Monthly Fixed</button>
                    <button onClick={() => setConfig({ ...config, type: 'daily' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${config.type === 'daily' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400'}`}>Daily Pay</button>
                    <button onClick={() => setConfig({ ...config, type: 'hourly' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${config.type === 'hourly' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400'}`}>Hourly Wage</button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">{config.type === 'monthly' ? 'Base Salary / Month' : 'Hourly Rate'}</label>
                    <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-600" value={config.baseSalary} onChange={e => setConfig({ ...config, baseSalary: parseFloat(e.target.value) })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Work Hrs/Day</label>
                      <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-600" value={config.standardHoursPerDay} onChange={e => setConfig({ ...config, standardHoursPerDay: parseFloat(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">OT Rate / Hr</label>
                      <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-600" value={config.otRatePerHour} onChange={e => setConfig({ ...config, otRatePerHour: parseFloat(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Commission / Job</label>
                      <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-600" value={config.commissionPerService} onChange={e => setConfig({ ...config, commissionPerService: parseFloat(e.target.value) })} />
                    </div>
                  </div>
                  <button onClick={updateConfig} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl">Save Configuration</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const SalaryPage = () => (
  <ProtectedRoute allowedRoles={['admin']}>
    <SalaryManagement />
  </ProtectedRoute>
);

export default SalaryPage;
