"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  CheckCircle, XCircle, Clock, Eye, Download, 
  MapPin, User, Shield, Camera, Filter, Search,
  AlertTriangle, MessageSquare, Menu, ChevronLeft
} from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const ReportReviewPage = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadReports = async () => {
    try {
      const data = await fetchWithAuth('/admin/reports');
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !reviewReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    try {
      await fetchWithAuth(`/admin/reports/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason: reviewReason })
      });
      loadReports();
      setSelectedReport(null);
      setReviewReason('');
    } catch (e) {
      alert("Review submission failed.");
    }
  };

  const activeReports = reports.filter(r => filterStatus === 'all' || r.adminApproval?.status === filterStatus);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background transition-colors overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:ml-80 p-6 md:p-12 w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="flex items-center gap-6">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-bg-muted rounded-2xl border border-border-base transition-all hover:bg-bg-surface">
                <Menu className="h-6 w-6 text-fg-primary" />
             </button>
             <button 
                onClick={() => window.history.back()}
                className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-bg-surface transition-all group"
             >
                <ChevronLeft className="h-6 w-6 text-fg-primary group-hover:-translate-x-1 transition-transform" />
             </button>
             <div className="space-y-2">
               <h1 className="text-4xl md:text-5xl font-black text-fg-primary uppercase tracking-tighter leading-none">Service <span className="text-blue-500 italic">Reports</span></h1>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">Reviewing technician submissions</p>
             </div>
          </div>
          
          <div className="flex bg-bg-muted rounded-2xl p-1.5 border border-border-base">
             {['all', 'pending', 'approved', 'rejected'].map((s) => (
                <button 
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-fg-muted hover:text-fg-primary'}`}
                >
                  {s}
                </button>
             ))}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           <AnimatePresence>
              {activeReports.map((report) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={report._id}
                  className="glass-card rounded-[2.5rem] border border-border-base p-8 hover:border-indigo-500/30 group"
                >
                   <div className="flex justify-between items-start mb-6">
                      <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                         report.adminApproval?.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                         report.adminApproval?.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                         'bg-blue-500/10 text-blue-500 animate-pulse'
                       }`}>
                         {report.adminApproval?.status || 'Pending Review'}
                      </div>
                      <p className="text-[10px] font-mono text-fg-muted">#{report._id.slice(-6).toUpperCase()}</p>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-bg-muted rounded-xl flex items-center justify-center font-black text-indigo-600">
                            {report.technicianId?.name?.[0]}
                         </div>
                          <div>
                            <p className="text-sm font-black text-fg-primary uppercase leading-none">{report.technicianId?.name}</p>
                            <p className="text-[9px] font-extrabold text-blue-500 uppercase tracking-widest mt-1">Field Technician</p>
                         </div>
                      </div>

                      <div className="p-4 bg-bg-muted/50 rounded-2xl space-y-2 border border-border-base">
                         <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Site Address</p>
                         <p className="text-xs font-bold text-fg-primary line-clamp-1">{report.customerAddress}</p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest pt-4 border-t border-border-base text-fg-primary">
                         <span className="flex items-center gap-2 text-fg-primary">
                           <Shield className="h-3 w-3 text-blue-600" />
                           Service: <span className="text-blue-600 font-black">{report.serviceType}</span>
                         </span>
                         <button 
                            onClick={() => setSelectedReport(report)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all flex items-center space-x-2"
                         >
                            <Eye className="h-3 w-3" />
                            <span>View Details</span>
                         </button>
                      </div>
                   </div>
                </motion.div>
              ))}
           </AnimatePresence>
        </div>

        {/* Audit Modal */}
        <AnimatePresence>
           {selectedReport && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setSelectedReport(null)}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="glass-card w-full max-w-5xl rounded-[3rem] border border-border-base overflow-hidden relative z-10 flex flex-col md:flex-row shadow-2xl h-[85vh]"
                >
                   {/* Left: Images & Info */}
                   <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
                      <div className="flex justify-between items-start mb-10">
                         <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic">Service Report <span className="text-indigo-600">Review</span></h3>
                         <button onClick={() => setSelectedReport(null)} className="p-2 bg-bg-muted rounded-xl hover:bg-bg-card transition-colors">
                            <XCircle className="h-5 w-5 text-fg-muted" />
                         </button>
                      </div>

                      <div className="grid grid-cols-2 gap-8 mb-12">
                         <div className="space-y-4">
                            <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center">
                               <Camera className="h-3 w-3 mr-2" /> Site Before
                            </p>
                            <div className="aspect-video bg-bg-muted rounded-3xl overflow-hidden border border-border-base">
                               <img src={selectedReport.photos?.before} alt="Before" className="w-full h-full object-cover" />
                            </div>
                         </div>
                         <div className="space-y-4">
                            <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center text-green-500">
                               <CheckCircle className="h-3 w-3 mr-2" /> Site After
                            </p>
                            <div className="aspect-video bg-bg-muted rounded-3xl overflow-hidden border border-border-base">
                               <img src={selectedReport.photos?.after} alt="After" className="w-full h-full object-cover" />
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-12">
                         <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Work Details</h4>
                            <div className="space-y-4">
                               <div>
                                  <p className="text-[10px] font-black text-fg-muted uppercase mb-1">Problem Identified</p>
                                  <p className="text-sm font-medium text-fg-primary bg-bg-muted/30 p-4 rounded-2xl border border-border-base">{selectedReport.problemIdentified}</p>
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-fg-muted uppercase mb-1">Work Performed</p>
                                  <p className="text-sm font-medium text-fg-primary bg-bg-muted/30 p-4 rounded-2xl border border-border-base">{selectedReport.workPerformed}</p>
                               </div>
                            </div>
                         </div>
                         <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Materials Used</h4>
                            <div className="space-y-2">
                               {selectedReport.materialsUsed?.map((m: any, i: number) => (
                                 <div key={i} className="flex justify-between items-center p-3 bg-bg-muted/30 rounded-xl border border-border-base">
                                    <span className="text-xs font-bold text-fg-primary uppercase">{m.name}</span>
                                    <span className="text-xs font-black text-indigo-600">x{m.quantity}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Right: Decision Panel */}
                   <div className="w-96 bg-bg-muted/50 p-12 border-l border-border-base flex flex-col justify-between">
                      <div className="space-y-8">
                         <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Admin Action</h4>
                         
                         <div className="space-y-4">
                            <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest">Review Comments</p>
                            <textarea 
                               value={reviewReason}
                               onChange={(e) => setReviewReason(e.target.value)}
                               placeholder="Provide feedback to technician..."
                               className="w-full h-32 p-4 bg-bg-card border border-border-base rounded-2xl outline-none focus:border-indigo-600 text-xs font-medium resize-none shadow-inner"
                            />
                         </div>

                         <div className="space-y-3">
                            <button 
                               onClick={() => handleReview(selectedReport._id, 'approved')}
                               className="w-full py-5 bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-500/20 hover:bg-green-600 transition-all flex items-center justify-center space-x-2"
                            >
                               <CheckCircle className="h-4 w-4" />
                               <span>Approve Report</span>
                            </button>
                            <button 
                               onClick={() => handleReview(selectedReport._id, 'rejected')}
                               className="w-full py-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center space-x-2"
                            >
                               <XCircle className="h-4 w-4" />
                               <span>Need Correction</span>
                            </button>
                         </div>
                      </div>

                      <div className="p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                         <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span className="text-[9px] font-black text-yellow-600 uppercase">Verification Policy</span>
                         </div>
                         <p className="text-[9px] font-bold text-slate-500 leading-relaxed">
                            Approving this report signifies the job is complete and meets all quality standards.
                         </p>
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

export default ReportReviewPage;
