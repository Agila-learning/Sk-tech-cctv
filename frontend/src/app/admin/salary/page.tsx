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
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const SalaryManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTech, setSelectedTech] = useState<any>(null);
  const [salaryDetails, setSalaryDetails] = useState<any>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustment, setAdjustment] = useState({ amount: 0, reason: '', type: 'addition' });
  const [config, setConfig] = useState({ 
    baseSalary: 0, 
    standardHoursPerDay: 8, 
    otRatePerHour: 0,
    commissionPerService: 0
  });

  const exportToPDF = () => {
    if (!selectedTech || !salaryDetails) return;
    
    const doc = new (jsPDF as any)();
    const techName = selectedTech.name.toUpperCase();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text("SK TECHNOLOGY - PAYROLL", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Statement for: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`, 14, 30);
    doc.text(`Technician: ${techName}`, 14, 35);
    doc.text(`City: ${selectedTech.serviceCity || 'N/A'}`, 14, 40);

    // Summary Table
    (doc as any).autoTable({
      startY: 50,
      head: [['Component', 'Value']],
      body: [
        ['Base Salary', `INR ${salaryDetails.breakdown?.base?.toLocaleString()}`],
        ['Overtime Amount', `INR ${salaryDetails.breakdown?.overtime?.toLocaleString()}`],
        ['Commision Earnings', `INR ${salaryDetails.commissionAmount?.toLocaleString()}`],
        [`Total Services (${salaryDetails.totalServiceReports || 0})`, 'Included in Commission'],
        ['Adjustments', `INR ${salaryDetails.breakdown?.adjustments?.toLocaleString()}`],
        ['Total Payable', `INR ${salaryDetails.payout?.toLocaleString()}`]
      ],
      theme: 'grid',
      headStyles: { fillStyle: [37, 99, 235] }
    });

    // History
    if (salaryDetails.adjustmentHistory?.length > 0) {
      doc.text("Adjustment Logs:", 14, (doc as any).lastAutoTable.finalY + 15);
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Date', 'Reason', 'Amount']],
        body: salaryDetails.adjustmentHistory.map((adj: any) => [
          new Date(adj.date).toLocaleDateString(),
          adj.reason,
          `${adj.amount >= 0 ? '+' : ''}${adj.amount}`
        ])
      });
    }

    doc.save(`Salary_${techName}_${new Date().getMonth()+1}_${new Date().getFullYear()}.pdf`);
  };

  const exportToExcel = () => {
    const data = technicians.map(t => ({
      'Technician Name': t.name,
      'Region': t.serviceCity,
      'Base Salary': t.salaryConfig?.baseSalary,
      'Commission Rate': t.salaryConfig?.commissionPerService,
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
      console.error("Load Technicians Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const viewSalaryBreakdown = async (tech: any) => {
    setSelectedTech(tech);
    try {
      const date = new Date();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const data = await fetchWithAuth(`/salary/admin/technician/${tech._id}?month=${year}-${month}`);
      setSalaryDetails(data);
      setConfig(tech.salaryConfig || { baseSalary: 20000, standardHoursPerDay: 8, otRatePerHour: 150 });
    } catch (error) {
      alert("Failed to load salary details");
    }
  };

  const updateConfig = async () => {
    try {
      await fetchWithAuth(`/salary/config/${selectedTech._id}`, {
        method: 'PATCH',
        body: JSON.stringify(config)
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
      await fetchWithAuth(`/salary/adjustment/${selectedTech._id}`, {
        method: 'POST',
        body: JSON.stringify({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
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

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex transition-all duration-500 overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 p-6 md:p-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl hover:bg-blue-600/20 transition-all">
              <Menu className="h-6 w-6 text-blue-600" />
            </button>
            <button onClick={() => router.push('/admin')} className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-bg-surface transition-all group">
              <ChevronLeft className="h-6 w-6 text-fg-primary group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-600/10 border border-green-600/20 rounded-full w-fit">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Finance Module</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-fg-primary tracking-tighter uppercase italic">Salary <span className="text-blue-500 non-italic">Management</span></h1>
              <p className="text-fg-muted text-lg font-medium">Payroll, OT Calculations & Adjustments</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
             <button 
               onClick={exportToExcel}
               className="px-8 py-5 bg-bg-muted border border-border-base text-fg-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-xl flex items-center gap-3"
             >
               <Download className="h-4 w-4" />
               Summary Excel
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Technician List */}
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
                  className={`w-full p-6 rounded-[2.5rem] border transition-all text-left flex items-center justify-between group ${selectedTech?._id === tech._id ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-500/30' : 'bg-bg-muted/50 border-border-base hover:border-blue-500/50 hover:bg-bg-muted/80'}`}
                >
                  <div className="flex items-center space-x-5">
                    <div className="w-14 h-14 bg-bg-surface rounded-2xl flex items-center justify-center font-black text-blue-500 shadow-xl overflow-hidden">
                      {tech.profilePic ? <img src={tech.profilePic} className="w-full h-full object-cover" /> : tech.name[0]}
                    </div>
                    <div>
                      <p className="text-lg font-black tracking-tight uppercase italic">{tech.name}</p>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${selectedTech?._id === tech._id ? 'text-white/70' : 'text-fg-muted'}`}>
                        ₹{tech.salaryConfig?.baseSalary || 0} / month
                      </p>
                    </div>
                  </div>
                  <Eye className={`h-5 w-5 ${selectedTech?._id === tech._id ? 'text-white' : 'text-fg-dim group-hover:text-blue-500'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Breakdown / Details */}
          <div className="lg:col-span-8">
            {salaryDetails ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card p-8 rounded-[3rem] border border-border-base relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <IndianRupee className="h-12 w-12" />
                    </div>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Final Payout</p>
                    <h3 className="text-4xl font-black text-blue-500 tracking-tighter italic">₹{salaryDetails.payout?.toLocaleString()}</h3>
                    <p className="text-[10px] font-bold text-fg-muted mt-2">Current Month Estimated</p>
                  </div>
                  <div className="glass-card p-8 rounded-[3rem] border border-border-base relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Clock className="h-12 w-12" />
                    </div>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Worked Hours</p>
                    <h3 className="text-4xl font-black text-fg-primary tracking-tighter italic">{salaryDetails.totalHours || 0}h</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                      <span className="text-[10px] font-bold text-green-500 uppercase">{salaryDetails.otHours || 0}h OT</span>
                    </div>
                  </div>
                  <div className="glass-card p-8 rounded-[3rem] border border-border-base relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-12 w-12" />
                    </div>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">Attendance</p>
                    <h3 className="text-4xl font-black text-fg-primary tracking-tighter italic">{salaryDetails.attendanceDays || 0} Days</h3>
                    <p className="text-[10px] font-bold text-fg-muted mt-2">Active this month</p>
                  </div>
                </div>

                {/* Breakdown List */}
                <div className="glass-card rounded-[3.5rem] border border-border-base overflow-hidden p-10 space-y-10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-fg-primary uppercase italic">Earning Breakdown</h3>
                    <div className="flex gap-4">
                      <button onClick={() => setIsConfigModalOpen(true)} className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-blue-600/10 hover:text-blue-500 transition-all">
                        <Settings className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={exportToPDF}
                        className="px-6 py-4 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20"
                      >
                        Export PDF
                      </button>
                      <button onClick={() => setIsAdjustModalOpen(true)} className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20">
                        Add Adjustment
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-6 bg-bg-muted/50 rounded-3xl border border-border-base">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold text-fg-primary">Base Salary</span>
                      </div>
                      <span className="text-lg font-black text-fg-primary">₹{salaryDetails.breakdown?.base?.toLocaleString() || 0}</span>
                    </div>

                    <div className="flex justify-between items-center p-6 bg-bg-muted/50 rounded-3xl border border-border-base">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold text-fg-primary">Overtime (OT)</span>
                      </div>
                      <span className="text-lg font-black text-fg-primary">₹{salaryDetails.breakdown?.overtime?.toLocaleString() || 0}</span>
                    </div>

                    <div className="flex justify-between items-center p-6 bg-bg-muted/50 rounded-3xl border border-border-base">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                           <span className="text-sm font-bold text-fg-primary block">Service Commission</span>
                           <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest">{salaryDetails.totalServiceReports || 0} Reports Secured</span>
                        </div>
                      </div>
                      <span className="text-lg font-black text-fg-primary">₹{salaryDetails.commissionAmount?.toLocaleString() || 0}</span>
                    </div>

                    <div className="flex justify-between items-center p-6 bg-bg-muted/50 rounded-3xl border border-border-base">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
                          <Plus className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold text-fg-primary">Adjustments</span>
                      </div>
                      <span className={`text-lg font-black ${salaryDetails.breakdown?.adjustments >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {salaryDetails.breakdown?.adjustments >= 0 ? '+' : ''}₹{salaryDetails.breakdown?.adjustments?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>

                  {salaryDetails.adjustmentHistory?.length > 0 && (
                    <div className="space-y-6 pt-10 border-t border-border-base">
                      <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Recent Adjustments</h4>
                      <div className="space-y-4">
                        {salaryDetails.adjustmentHistory.map((adj: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <div className="space-y-1">
                              <p className="font-bold text-fg-primary">{adj.reason}</p>
                              <p className="text-[10px] font-medium text-fg-muted">{new Date(adj.date).toLocaleDateString()}</p>
                            </div>
                            <span className={`font-black ${adj.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {adj.amount >= 0 ? '+' : ''}₹{adj.amount?.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-[600px] glass-card rounded-[4rem] border border-border-base flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="p-8 bg-blue-600/10 rounded-[2.5rem] border border-blue-500/20">
                  <CreditCard className="h-16 w-16 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-fg-primary uppercase italic">No Member Selected</h3>
                  <p className="text-fg-muted text-lg max-w-sm">Select a technician from the list to view their monthly salary breakdown and performance.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Adjust Modal */}
        <AnimatePresence>
          {isAdjustModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card w-full max-w-md rounded-[3rem] border border-border-base p-10 space-y-8 shadow-2xl"
              >
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
                  <button onClick={addAdjustment} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">Apply Adjustment</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Config Modal */}
        <AnimatePresence>
          {isConfigModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card w-full max-w-lg rounded-[3rem] border border-border-base p-10 space-y-8 shadow-2xl"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-fg-primary uppercase italic">Salary Config</h3>
                  <button onClick={() => setIsConfigModalOpen(false)}><X className="h-6 w-6 text-fg-muted" /></button>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Base Salary / Month</label>
                    <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500" value={config.baseSalary} onChange={e => setConfig({ ...config, baseSalary: parseFloat(e.target.value) })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Work Hrs/Day</label>
                      <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500" value={config.standardHoursPerDay} onChange={e => setConfig({ ...config, standardHoursPerDay: parseFloat(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">OT Rate / Hr</label>
                      <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500" value={config.otRatePerHour} onChange={e => setConfig({ ...config, otRatePerHour: parseFloat(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Commission / Job</label>
                      <input type="number" className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500" value={config.commissionPerService} onChange={e => setConfig({ ...config, commissionPerService: parseFloat(e.target.value) })} />
                    </div>
                  </div>
                  <button onClick={updateConfig} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">Save Configuration</button>
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
