"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  CreditCard, IndianRupee, Clock, TrendingUp, Users, 
  Search, Menu, ChevronLeft, Plus, Settings, Eye, 
  Calendar, CheckCircle, AlertCircle, Download, 
  ArrowUpRight, ArrowDownRight, RefreshCw, X,
  Briefcase, Percent, Wallet, MinusCircle, FileText
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
  const [isPayoutItemModalOpen, setIsPayoutItemModalOpen] = useState(false);
  const [isManualLogModalOpen, setIsManualLogModalOpen] = useState(false);

  const [payoutItem, setPayoutItem] = useState({ type: 'bonus', amount: 0, description: '' });
  const [config, setConfig] = useState({ 
    types: ['monthly'],
    monthlyRate: 0,
    dailyRate: 0,
    hourlyRate: 0,
    overtimeRate: 0,
    commissionRate: 0,
    allowanceRate: 0,
    workingHoursPerDay: 8
  });
  
  const [manualLog, setManualLog] = useState({ date: new Date().toISOString().split('T')[0], hoursWorked: 8, reason: '' });

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
          types: tech.salaryConfig.types || ['monthly'],
          monthlyRate: tech.salaryConfig.monthlyRate || 0,
          dailyRate: tech.salaryConfig.dailyRate || 0,
          hourlyRate: tech.salaryConfig.hourlyRate || 0,
          overtimeRate: tech.salaryConfig.overtimeRate || 0,
          commissionRate: tech.salaryConfig.commissionRate || 0,
          allowanceRate: tech.salaryConfig.allowanceRate || 0,
          workingHoursPerDay: tech.salaryConfig.workingHoursPerDay || 8
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCalculate = async () => {
    if (!selectedTech) return;
    try {
      const date = new Date();
      const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      const res = await fetchWithAuth('/salary/calculate', {
        method: 'POST',
        body: JSON.stringify({ technicianId: selectedTech._id, month: `${year}-${monthStr}` })
      });
      setSalaryDetails(res);
      alert("Salary recalculated based on latest logs.");
    } catch (error) {
      alert("Calculation failed");
    }
  };

  const updateConfig = async () => {
    try {
      await fetchWithAuth(`/salary/admin/config/${selectedTech._id}`, {
        method: 'PATCH',
        body: JSON.stringify(config)
      });
      setIsConfigModalOpen(false);
      loadData();
      alert("Technician pay structure updated.");
    } catch (error) {
      alert("Failed to update config");
    }
  };

  const addPayoutItem = async () => {
    if (!salaryDetails?._id) {
      alert("Please calculate the salary record for this month before adding payout items.");
      return;
    }
    try {
      const res = await fetchWithAuth(`/salary/admin/payout-item/${salaryDetails._id}`, {
        method: 'POST',
        body: JSON.stringify(payoutItem)
      });
      setSalaryDetails(res);
      setIsPayoutItemModalOpen(false);
      setPayoutItem({ type: 'bonus', amount: 0, description: '' });
      alert("Payout item added successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to add payout item");
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
      alert("Hours logged successfully.");
    } catch (error) {
      alert("Failed to log hours");
    }
  };

  const exportToPDF = () => {
    if (!selectedTech || !salaryDetails) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("PAYSLIP - SK TECHNOLOGY", 14, 20);
    doc.setFontSize(10);
    doc.text(`${selectedTech.name} | ${salaryDetails.month}`, 14, 30);
    
    autoTable(doc, {
      startY: 40,
      head: [['Component', 'Breakdown', 'Amount']],
      body: [
        ['Fixed Salary', '-', `₹${salaryDetails.fixedSalary || 0}`],
        ['Daily Wage', `${salaryDetails.dailyWage?.days || 0} days @ ₹${salaryDetails.dailyWage?.rate || 0}`, `₹${salaryDetails.dailyWage?.total || 0}`],
        ['Hourly Wage', `${salaryDetails.hourlyWage?.hours?.toFixed(1) || 0} hrs @ ₹${salaryDetails.hourlyWage?.rate || 0}`, `₹${salaryDetails.hourlyWage?.total || 0}`],
        ['Incentive', 'Task Commissions', `₹${salaryDetails.incentive || 0}`],
        ['Overtime', `${salaryDetails.overtime?.hours?.toFixed(1) || 0} hrs @ ₹${salaryDetails.overtime?.rate || 0}`, `₹${salaryDetails.overtime?.total || 0}`],
        ['Bonus', '-', `₹${salaryDetails.bonus || 0}`],
        ['Allowances', '-', `₹${salaryDetails.allowances || 0}`],
        ['Deductions', '-', `-₹${salaryDetails.deductions || 0}`],
        ['Advance (Debit)', '-', `-₹${salaryDetails.advanceTaken || 0}`],
        ['TOTAL PAYABLE', '', `₹${salaryDetails.totalPayable || 0}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save(`Payslip_${selectedTech.name}_${salaryDetails.month}.pdf`);
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
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full w-fit">
                <Wallet className="h-3 w-3 text-blue-600" />
                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Payroll Control Panel</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-fg-primary tracking-tighter uppercase italic">Salary <span className="text-blue-500 non-italic">Ledger</span></h1>
            </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => XLSX.writeFile(XLSX.utils.book_new(), 'ledger.xlsx')} className="px-8 py-5 bg-bg-muted border border-border-base text-fg-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center gap-3">
                <Download className="h-4 w-4" /> Export Report
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Tech List */}
          <div className="lg:col-span-4 space-y-8">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-xl font-black text-fg-primary uppercase italic">Team Members</h3>
              <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest bg-bg-muted px-3 py-1 rounded-full">{technicians.length} Active</span>
            </div>
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              {technicians.map((tech) => (
                <button
                  key={tech._id}
                  onClick={() => viewSalaryBreakdown(tech)}
                  className={`w-full p-6 rounded-[2.5rem] border transition-all text-left flex items-center justify-between group ${selectedTech?._id === tech._id ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-500/30' : 'bg-bg-muted/50 border-border-base hover:bg-bg-muted/80'}`}
                >
                  <div className="flex items-center space-x-5">
                    <div className="w-14 h-14 bg-bg-surface rounded-2xl flex items-center justify-center font-black text-blue-500 shadow-lg overflow-hidden border border-border-base">
                      {tech.profilePic ? <img src={tech.profilePic} className="w-full h-full object-cover" /> : tech.name[0]}
                    </div>
                    <div>
                      <p className="text-lg font-black tracking-tight uppercase italic leading-tight">{tech.name}</p>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${selectedTech?._id === tech._id ? 'text-white/70' : 'text-fg-muted'}`}>
                        {tech.serviceCity || 'Regional Tech'}
                      </p>
                    </div>
                  </div>
                  <Eye className={`h-5 w-5 ${selectedTech?._id === tech._id ? 'text-white' : 'text-fg-dim group-hover:text-blue-500'} transition-colors`} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Calculations & Controls */}
          <div className="lg:col-span-8">
            {selectedTech && salaryDetails ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card p-10 rounded-[3.5rem] border border-border-base bg-gradient-to-br from-blue-600/5 to-transparent">
                    <div className="p-4 bg-blue-600 text-white rounded-2xl w-fit mb-6 shadow-xl shadow-blue-500/20">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-2">Net Payable</p>
                    <h3 className="text-4xl font-black text-fg-primary tracking-tighter italic">₹{salaryDetails.totalPayable?.toLocaleString()}</h3>
                    <p className="text-[10px] font-bold text-blue-500 mt-3 uppercase tracking-widest tracking-widest">{salaryDetails.status} • {salaryDetails.month}</p>
                  </div>
                  <div className="glass-card p-10 rounded-[3.5rem] border border-border-base">
                     <div className="p-4 bg-green-500 text-white rounded-2xl w-fit mb-6 shadow-xl shadow-green-500/20">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-2">Incentives</p>
                    <h3 className="text-4xl font-black text-fg-primary tracking-tighter italic">₹{salaryDetails.incentive?.toLocaleString()}</h3>
                    <p className="text-[10px] font-bold text-fg-muted mt-3 uppercase tracking-widest">{techStats?.month?.hours || 0} Work Hours Logged</p>
                  </div>
                  <div className="glass-card p-10 rounded-[3.5rem] border border-border-base">
                    <div className="p-4 bg-purple-500 text-white rounded-2xl w-fit mb-6 shadow-xl shadow-purple-500/20">
                      <Clock className="h-6 w-6" />
                    </div>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-2">OT & Addons</p>
                    <h3 className="text-4xl font-black text-fg-primary tracking-tighter italic">₹{(salaryDetails.overtime?.total + salaryDetails.bonus + salaryDetails.allowances).toLocaleString()}</h3>
                    <p className="text-[10px] font-bold text-fg-muted mt-3 uppercase tracking-widest">{salaryDetails.overtime?.hours?.toFixed(1) || 0} Extra Hours</p>
                  </div>
                </div>

                {/* Independent Components Breakdown */}
                <div className="glass-card rounded-[4rem] border border-border-base p-12 space-y-12 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -mr-32 -mt-32"></div>
                   
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-fg-primary uppercase italic tracking-tight">Independent <span className="text-blue-600 non-italic">Components</span></h3>
                        <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.3em]">Non-Merged Payroll Breakdown</p>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <button onClick={() => setIsConfigModalOpen(true)} className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-blue-600 hover:text-white transition-all group">
                          <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                        </button>
                        <button onClick={handleCalculate} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all">
                          <RefreshCw className="h-4 w-4" /> Recalculate Base
                        </button>
                        <button onClick={() => setIsPayoutItemModalOpen(true)} className="px-8 py-4 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-green-700 active:scale-95 transition-all">
                          <Plus className="h-4 w-4" /> Add Pay Item
                        </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Auto-Calculated Base */}
                      <div className="space-y-6">
                         <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-3 bg-blue-50/50 px-4 py-2 rounded-full w-fit">
                            <Briefcase className="h-3.5 w-3.5" /> Base Earnings (Auto-Logged)
                         </h4>
                         <div className="space-y-4">
                            <div className="p-6 bg-bg-muted/50 border border-border-base rounded-[2rem] flex justify-between items-center group hover:border-blue-500/30 transition-all">
                               <div>
                                  <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Monthly Fixed</p>
                                  <p className="text-sm font-bold text-fg-primary">Professional Retainer</p>
                               </div>
                               <h5 className="text-xl font-black text-fg-primary tracking-tight">₹{salaryDetails.fixedSalary?.toLocaleString() || 0}</h5>
                            </div>
                            <div className="p-6 bg-bg-muted/50 border border-border-base rounded-[2rem] flex justify-between items-center group hover:border-blue-500/30 transition-all">
                               <div>
                                  <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Daily Wages</p>
                                  <p className="text-sm font-bold text-fg-primary">{salaryDetails.dailyWage?.days || 0} Active Units</p>
                               </div>
                               <h5 className="text-xl font-black text-fg-primary tracking-tight">₹{salaryDetails.dailyWage?.total?.toLocaleString() || 0}</h5>
                            </div>
                            <div className="p-6 bg-bg-muted/50 border border-border-base rounded-[2rem] flex justify-between items-center group hover:border-blue-500/30 transition-all">
                               <div>
                                  <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Hourly Output</p>
                                  <p className="text-sm font-bold text-fg-primary">{salaryDetails.hourlyWage?.hours?.toFixed(1) || 0} Logged Units</p>
                               </div>
                               <h5 className="text-xl font-black text-fg-primary tracking-tight">₹{salaryDetails.hourlyWage?.total?.toLocaleString() || 0}</h5>
                            </div>
                         </div>
                      </div>

                      {/* Right: Variable & Adjustments */}
                      <div className="space-y-6">
                         <h4 className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-3 bg-green-50/50 px-4 py-2 rounded-full w-fit">
                            <Percent className="h-3.5 w-3.5" /> Variable & Credits
                         </h4>
                         <div className="space-y-4">
                            <div className="p-6 bg-bg-muted/50 border border-border-base rounded-[2rem] flex justify-between items-center group hover:border-green-500/30 transition-all">
                               <div>
                                  <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Project Incentives</p>
                                  <p className="text-sm font-bold text-fg-primary">Task-Based Earnings</p>
                               </div>
                               <h5 className="text-xl font-black text-green-600 tracking-tight">+₹{salaryDetails.incentive?.toLocaleString() || 0}</h5>
                            </div>
                            <div className="p-6 bg-bg-muted/50 border border-border-base rounded-[2rem] flex justify-between items-center group hover:border-green-500/30 transition-all">
                               <div>
                                  <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Overtime (OT)</p>
                                  <p className="text-sm font-bold text-fg-primary">{salaryDetails.overtime?.hours?.toFixed(1) || 0} Extra Hours</p>
                               </div>
                               <h5 className="text-xl font-black text-green-600 tracking-tight">+₹{salaryDetails.overtime?.total?.toLocaleString() || 0}</h5>
                            </div>
                            <div className="p-6 bg-slate-900 rounded-[2rem] flex justify-between items-center">
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Debits & Advances</p>
                                  <p className="text-sm font-bold text-white">Salary Advance Deductions</p>
                               </div>
                               <h5 className="text-xl font-black text-red-400 tracking-tight">-₹{salaryDetails.advanceTaken?.toLocaleString() || 0}</h5>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Ledger History */}
                   <div className="pt-10 border-t border-border-base space-y-8">
                      <div className="flex justify-between items-center">
                         <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-[0.3em] flex items-center gap-3">
                            <FileText className="h-3.5 w-3.5" /> Transaction Ledger
                         </h4>
                         <button onClick={exportToPDF} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                            Generate Payslip <ArrowUpRight className="h-3.5 w-3.5" />
                         </button>
                      </div>
                      <div className="space-y-3">
                        {salaryDetails.ledger && salaryDetails.ledger.length > 0 ? (
                           salaryDetails.ledger.map((item: any, i: number) => (
                             <div key={i} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-bg-muted/30 rounded-3xl border border-border-base/50 group hover:shadow-lg transition-all gap-4">
                               <div className="flex items-center gap-5">
                                 <div className={`p-3 rounded-2xl ${
                                   ['deduction', 'advance'].includes(item.type) ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                                 }`}>
                                   {['deduction', 'advance'].includes(item.type) ? <MinusCircle className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                 </div>
                                 <div>
                                   <p className="font-black text-sm text-fg-primary uppercase tracking-tight">{item.type} Component</p>
                                   <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest mt-1">{item.description || 'Processed by Admin'}</p>
                                 </div>
                               </div>
                               <div className="text-right w-full md:w-auto">
                                 <p className={`text-lg font-black tracking-tighter ${['deduction', 'advance'].includes(item.type) ? 'text-red-500' : 'text-green-600'}`}>
                                   {['deduction', 'advance'].includes(item.type) ? '-' : '+'}₹{item.amount?.toLocaleString()}
                                 </p>
                                 <p className="text-[9px] font-black text-fg-dim uppercase tracking-widest mt-1">{new Date(item.date).toLocaleDateString()}</p>
                               </div>
                             </div>
                           ))
                        ) : (
                          <div className="py-12 text-center bg-bg-muted/20 rounded-3xl border border-dashed border-border-base">
                             <p className="text-[10px] font-black text-fg-dim uppercase tracking-widest animate-pulse">No manual transaction logs for this period</p>
                          </div>
                        )}
                      </div>
                   </div>
                </div>

                {/* Stats charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-card p-10 rounded-[4rem] border border-card-border shadow-xl h-[400px]">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted mb-8">Monthly Earnings Flow</h4>
                    <div className="h-[280px]">
                       <Bar 
                        data={{
                          labels: techStats?.history?.slice(-7).map((h: any) => h.date.split('-').slice(1).join('/')) || [],
                          datasets: [{ 
                            label: 'Daily Yield', 
                            data: techStats?.history?.slice(-7).map((h: any) => h.earnings) || [], 
                            backgroundColor: '#2563eb', 
                            borderRadius: 12,barThickness: 24
                          }]
                        }} 
                        options={{ 
                          maintainAspectRatio: false, 
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { font: { weight: 'bold', size: 10 }, color: 'var(--fg-dim)' } },
                            x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 }, color: 'var(--fg-dim)' } }
                          }
                        }} 
                       />
                    </div>
                  </div>
                  <div className="bg-card p-10 rounded-[4rem] border border-card-border shadow-xl h-[400px]">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted mb-8">Work Efficiency (Hours)</h4>
                    <div className="h-[280px]">
                       <Line 
                        data={{
                          labels: techStats?.history?.slice(-7).map((h: any) => h.date.split('-').slice(1).join('/')) || [],
                          datasets: [{ 
                            label: 'Hours', 
                            data: techStats?.history?.slice(-7).map((h: any) => h.hours) || [], 
                            borderColor: '#10b981', 
                            borderWidth: 4,
                            pointRadius: 6,
                            pointBackgroundColor: '#fff',
                            tension: 0.5, 
                            fill: true, 
                            backgroundColor: 'rgba(16, 185, 129, 0.05)' 
                          }]
                        }} 
                        options={{ 
                          maintainAspectRatio: false, 
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { font: { weight: 'bold', size: 10 }, color: 'var(--fg-dim)' } },
                            x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 }, color: 'var(--fg-dim)' } }
                          }
                        }} 
                       />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[700px] glass-card rounded-[4rem] border border-border-base flex flex-col items-center justify-center text-center p-12 space-y-10">
                <div className="p-10 bg-blue-600/5 rounded-[3rem] relative">
                  <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full"></div>
                  <CreditCard className="h-24 w-24 text-blue-500 relative z-10" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-fg-primary uppercase italic tracking-tighter">Command Center <span className="text-blue-500 non-italic">Idle</span></h3>
                  <p className="text-fg-muted text-lg max-w-md mx-auto leading-relaxed">Select a technician from the ledger list to analyze their performance and manage independent pay components.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                   <div className="p-6 bg-bg-muted/50 rounded-3xl border border-border-base text-center">
                      <p className="text-2xl font-black text-fg-primary italic leading-none">{technicians.length}</p>
                      <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest mt-2">Active Techs</p>
                   </div>
                   <div className="p-6 bg-bg-muted/50 rounded-3xl border border-border-base text-center">
                      <p className="text-2xl font-black text-fg-primary italic leading-none">₹0.00</p>
                      <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest mt-2">Drafted Payroll</p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- MODALS --- */}

        {/* Structure Config Modal */}
        <AnimatePresence>
          {isConfigModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="glass-card w-full max-w-2xl bg-card rounded-[3.5rem] border border-card-border p-12 space-y-10 shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-fg-primary uppercase italic italic tracking-tight">Pay <span className="text-blue-600 non-italic">Structure</span></h3>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.3em]">Configure rates for: {selectedTech?.name}</p>
                  </div>
                  <button onClick={() => setIsConfigModalOpen(false)} className="p-4 bg-bg-muted rounded-2xl hover:bg-red-500 hover:text-white transition-all"><X className="h-6 w-6" /></button>
                </div>
                
                <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-fg-secondary uppercase tracking-widest">Earning Models (Independent)</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                         {['monthly', 'daily', 'hourly', 'ot', 'incentive', 'allowance'].map(type => (
                           <button
                             key={type}
                             onClick={() => {
                               const newTypes = config.types.includes(type) ? config.types.filter(t => t !== type) : [...config.types, type];
                               setConfig({...config, types: newTypes});
                             }}
                             className={`px-4 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${config.types.includes(type) ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-bg-muted text-fg-dim border-border-base hover:bg-bg-muted/80'}`}
                           >
                             {type}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      {config.types.includes('monthly') && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-fg-secondary uppercase tracking-widest ml-1">Fixed Monthly Retainer</label>
                          <div className="relative">
                            <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                            <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl pl-14 pr-6 py-5 text-sm font-black text-fg-primary outline-none focus:border-blue-600" value={config.monthlyRate} onChange={e => setConfig({ ...config, monthlyRate: parseFloat(e.target.value) || 0 })} />
                          </div>
                        </div>
                      )}
                      {config.types.includes('daily') && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-fg-secondary uppercase tracking-widest ml-1">Daily Rate (Per Unit)</label>
                          <div className="relative">
                            <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                            <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl pl-14 pr-6 py-5 text-sm font-black text-fg-primary outline-none focus:border-blue-600" value={config.dailyRate} onChange={e => setConfig({ ...config, dailyRate: parseFloat(e.target.value) || 0 })} />
                          </div>
                        </div>
                      )}
                      {config.types.includes('hourly') && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-fg-secondary uppercase tracking-widest ml-1">Hourly Rate (Per Unit)</label>
                          <div className="relative">
                            <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                            <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl pl-14 pr-6 py-5 text-sm font-black text-fg-primary outline-none focus:border-blue-600" value={config.hourlyRate} onChange={e => setConfig({ ...config, hourlyRate: parseFloat(e.target.value) || 0 })} />
                          </div>
                        </div>
                      )}
                      {config.types.includes('ot') && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">OT Rate / Hour</label>
                          <div className="relative">
                            <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl pl-14 pr-6 py-5 text-sm font-black text-fg-primary outline-none focus:border-blue-600" value={config.overtimeRate} onChange={e => setConfig({ ...config, overtimeRate: parseFloat(e.target.value) || 0 })} />
                          </div>
                        </div>
                      )}
                      {config.types.includes('incentive') && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-fg-secondary uppercase tracking-widest ml-1">Incentive / Task</label>
                          <div className="relative">
                            <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                            <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl pl-14 pr-6 py-5 text-sm font-black text-fg-primary outline-none focus:border-blue-600" value={config.commissionRate} onChange={e => setConfig({ ...config, commissionRate: parseFloat(e.target.value) || 0 })} />
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-fg-secondary uppercase tracking-widest ml-1">Working hours (Day)</label>
                        <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 text-sm font-black text-fg-primary outline-none focus:border-blue-600" value={config.workingHoursPerDay} onChange={e => setConfig({ ...config, workingHoursPerDay: parseFloat(e.target.value) || 8 })} />
                      </div>
                   </div>
                </div>

                <div className="pt-8 border-t border-border-base">
                  <button onClick={updateConfig} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95">Set New Structure</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Payout Item Modal */}
        <AnimatePresence>
          {isPayoutItemModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="glass-card w-full max-w-md bg-card rounded-[3.5rem] border border-card-border p-12 space-y-10 shadow-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-fg-primary uppercase italic tracking-tight italic">Post <span className="text-blue-600 non-italic">Pay Item</span></h3>
                  <button onClick={() => setIsPayoutItemModalOpen(false)}><X className="h-6 w-6 text-fg-muted" /></button>
                </div>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Entry Type</label>
                    <div className="grid grid-cols-2 gap-3">
                       {['bonus', 'incentive', 'deduction', 'advance', 'allowance'].map(type => (
                         <button
                           key={type}
                           onClick={() => setPayoutItem({...payoutItem, type})}
                           className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${payoutItem.type === type ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-bg-muted text-fg-dim'}`}
                         >
                           {type}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Component Amount</label>
                    <div className="relative">
                       <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                       <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl pl-14 pr-6 py-5 text-sm font-black text-fg-primary outline-none focus:border-blue-600" value={payoutItem.amount} onChange={e => setPayoutItem({ ...payoutItem, amount: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Transaction Note</label>
                    <textarea rows={3} className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 resize-none placeholder:text-fg-dim/40" placeholder="Reason for this payout/deduction..." value={payoutItem.description} onChange={e => setPayoutItem({ ...payoutItem, description: e.target.value })} />
                  </div>
                  <button onClick={addPayoutItem} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-700 transition-all">Submit to Ledger</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Manual Log Modal */}
        <AnimatePresence>
          {isManualLogModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-md rounded-[3rem] border border-border-base p-12 space-y-8 shadow-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-fg-primary uppercase italic italic">Time <span className="text-blue-600 non-italic">Capture</span></h3>
                  <button onClick={() => setIsManualLogModalOpen(false)}><X className="h-6 w-6 text-fg-muted" /></button>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Event Date</label>
                    <input type="date" className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:border-blue-500 font-manrope" value={manualLog.date} onChange={e => setManualLog({ ...manualLog, date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Total Logic Units (Hours)</label>
                    <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 text-sm font-black outline-none focus:border-blue-500" value={manualLog.hoursWorked} onChange={e => setManualLog({ ...manualLog, hoursWorked: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Justification</label>
                    <textarea rows={2} className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 resize-none placeholder:text-fg-dim/40" placeholder="Reason for manual adjustment..." value={manualLog.reason} onChange={e => setManualLog({ ...manualLog, reason: e.target.value })} />
                  </div>
                  <button onClick={handleManualLog} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-700 transition-all font-inter">Commit Units</button>
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
