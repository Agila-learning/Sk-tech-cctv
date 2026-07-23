"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  CheckCircle, XCircle, Clock, Eye, Download, 
  MapPin, User, Shield, Camera, Filter, Search,
  AlertTriangle, MessageSquare, Menu, ChevronLeft, Trash2,
  Calendar, Phone, Mic, Navigation, Circle, X
} from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const ReportReviewPage = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      const data = await fetchWithAuth('/admin/reports');
      setReports(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const deleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this report? This action cannot be undone.")) return;
    try {
      await fetchWithAuth(`/admin/reports/${id}`, { method: 'DELETE' });
      loadReports();
    } catch (e: any) {
      alert("Delete failed.");
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected' | 'rework') => {
    if ((status === 'rejected' || status === 'rework') && !reviewReason.trim()) {
      alert("Please provide a reason.");
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
    } catch (e: any) {
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
      <main className="flex-1 min-w-0 lg:ml-80 p-6 md:p-12">
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
          
          <div className="flex bg-bg-muted rounded-2xl p-1.5 border border-border-base flex-wrap">
             {['all', 'pending', 'approved', 'rejected', 'rework'].map((s) => (
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
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  key={report._id}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-[3.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                   
                   <div className="glass-card rounded-[2.5rem] md:rounded-[3.5rem] border border-border-base p-6 md:p-8 hover:border-indigo-500/30 group flex flex-col justify-between h-full shadow-xl bg-bg-surface">
                      <div className="flex justify-between items-start mb-6">
                         <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                            report.adminApproval?.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                            report.adminApproval?.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                            report.adminApproval?.status === 'rework' ? 'bg-orange-500/10 text-orange-500' :
                            'bg-blue-500/10 text-blue-500 animate-pulse'
                          }`}>
                            {report.adminApproval?.status || 'Pending Review'}
                         </div>
                         <p className="text-[10px] font-mono text-fg-muted">#{report.jobId?._id?.slice(-6).toUpperCase()}</p>
                      </div>

                      <div className="space-y-6">
                         <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-bg-muted rounded-xl flex items-center justify-center font-black text-indigo-600">
                               {report.technicianId?.name?.[0] || '?'}
                            </div>
                             <div>
                               <p className="text-sm font-black text-fg-primary uppercase leading-none">{report.technicianId?.name || 'Unknown'}</p>
                               <p className="text-[9px] font-extrabold text-blue-500 uppercase tracking-widest mt-1">Field Technician</p>
                            </div>
                         </div>

                         <div className="p-4 bg-bg-muted/50 rounded-2xl space-y-2 border border-border-base">
                            <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Site Address</p>
                            <p className="text-xs font-bold text-fg-primary line-clamp-1">{report.customerAddress}</p>
                         </div>

                         <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border-base">
                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-fg-primary min-w-0">
                              <Shield className="h-3 w-3 text-blue-600 shrink-0" />
                              <span className="truncate">Service: <span className="text-blue-600 font-black">{report.serviceType}</span></span>
                            </span>
                            <div className="flex items-center space-x-2 shrink-0">
                                <button
                                   onClick={(e) => deleteReport(report._id, e)}
                                   className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-500/5 group/del"
                                   title="Delete Report"
                                >
                                   <Trash2 className="h-3.5 w-3.5 group-hover/del:scale-110 transition-transform" />
                                </button>
                                <button 
                                   onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                                   className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all flex items-center space-x-2 shadow-lg shadow-indigo-600/20 whitespace-nowrap"
                                >
                                   <Eye className="h-3 w-3" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">View Details</span>
                                </button>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
              ))}
           </AnimatePresence>
        </div>

        {/* Full Screen Image Modal */}
        <AnimatePresence>
          {fullScreenImage && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
             >
                <button 
                  onClick={() => setFullScreenImage(null)}
                  className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                >
                  <X className="w-8 h-8" />
                </button>
                <motion.img 
                   initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                   src={fullScreenImage} 
                   className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" 
                   alt="Fullscreen"
                />
             </motion.div>
          )}
        </AnimatePresence>

        {/* Detailed Service Report Modal */}
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
                   className="glass-card w-full max-w-6xl rounded-[2rem] md:rounded-[3rem] border border-border-base overflow-hidden relative z-10 flex flex-col md:flex-row shadow-2xl h-[90vh] bg-bg-surface"
                >
                   {/* Left/Middle: Info & Media (Scrollable) */}
                   <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col gap-10">
                      
                      <div className="flex justify-between items-start">
                         <div>
                            <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic">Service Report <span className="text-indigo-600">Review</span></h3>
                            <p className="text-sm font-bold text-fg-muted tracking-widest mt-2 uppercase">Order #{selectedReport.jobId?._id?.slice(-6).toUpperCase()}</p>
                         </div>
                         <button onClick={() => setSelectedReport(null)} className="p-2 bg-bg-muted rounded-xl hover:bg-bg-card transition-colors md:hidden">
                            <XCircle className="h-5 w-5 text-fg-muted" />
                         </button>
                      </div>

                      {/* Customer Details & Map Link */}
                      <div className="bg-bg-muted/30 border border-border-base rounded-3xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-[10px] font-black text-fg-muted uppercase mb-3 flex items-center gap-2"><User className="w-3 h-3"/> Customer Details</p>
                            <p className="text-sm font-bold text-fg-primary">{selectedReport.customerName}</p>
                            {selectedReport.jobId?.customer?.phone && (
                               <p className="text-xs font-semibold text-fg-muted mt-1 flex items-center gap-2"><Phone className="w-3 h-3"/> {selectedReport.jobId.customer.phone}</p>
                            )}
                            <p className="text-xs font-medium text-fg-muted mt-2 leading-relaxed">{selectedReport.customerAddress}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-fg-muted uppercase mb-3 flex items-center gap-2"><Navigation className="w-3 h-3"/> Location Coordinates</p>
                            {selectedReport.location?.lat ? (
                               <a 
                                 href={`https://www.google.com/maps/search/?api=1&query=${selectedReport.location.lat},${selectedReport.location.lng}`}
                                 target="_blank" rel="noreferrer"
                                 className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition-colors"
                               >
                                 <MapPin className="w-4 h-4" /> Open in Google Maps
                               </a>
                            ) : (
                               <p className="text-xs font-bold text-slate-400">Location not captured.</p>
                            )}
                          </div>
                      </div>

                      {/* Stage Wise Timeline Flow */}
                      {selectedReport.workflow && selectedReport.workflow.stages && (
                         <div>
                            <p className="text-[10px] font-black text-indigo-600 uppercase mb-6 flex items-center gap-2 tracking-widest"><Clock className="w-3 h-3"/> Stage-Wise Flow</p>
                            <div className="flex justify-between items-center relative before:absolute before:inset-0 before:h-0.5 before:bg-border-base before:top-1/2 before:-translate-y-1/2 before:-z-10">
                               {[
                                 { label: 'Assigned', stage: selectedReport.workflow.stages.assigned },
                                 { label: 'Accepted', stage: selectedReport.workflow.stages.accepted },
                                 { label: 'Reached', stage: selectedReport.workflow.stages.reached },
                                 { label: 'Started', stage: selectedReport.workflow.stages.started },
                                 { label: 'Completed', stage: selectedReport.workflow.stages.completed },
                               ].map((step, idx) => (
                                 <div key={idx} className="flex flex-col items-center gap-2 bg-bg-surface px-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-[3px] ${step.stage?.status ? 'border-green-500 bg-green-50 text-green-500' : 'border-slate-200 bg-slate-50 text-slate-300'}`}>
                                       {step.stage?.status ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                    </div>
                                    <div className="text-center">
                                       <p className={`text-[10px] font-black uppercase tracking-wider ${step.stage?.status ? 'text-fg-primary' : 'text-slate-400'}`}>{step.label}</p>
                                       {step.stage?.timestamp && (
                                         <p className="text-[9px] font-bold text-fg-muted mt-0.5">{format(new Date(step.stage.timestamp), 'h:mm a')}</p>
                                       )}
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                      )}

                      {/* Photos - Click to enlarge */}
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center">
                               <Camera className="h-3 w-3 mr-2" /> Site Before
                            </p>
                            <button 
                              onClick={() => setFullScreenImage(selectedReport.photos?.before)}
                              className="w-full aspect-video bg-bg-muted rounded-3xl overflow-hidden border border-border-base relative group hover:ring-2 hover:ring-indigo-500 transition-all cursor-zoom-in"
                            >
                               <img src={selectedReport.photos?.before} alt="Before" className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="w-8 h-8 text-white" />
                               </div>
                            </button>
                         </div>
                         <div className="space-y-4">
                            <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center text-green-500">
                               <CheckCircle className="h-3 w-3 mr-2" /> Site After
                            </p>
                            <button 
                              onClick={() => setFullScreenImage(selectedReport.photos?.after)}
                              className="w-full aspect-video bg-bg-muted rounded-3xl overflow-hidden border border-border-base relative group hover:ring-2 hover:ring-green-500 transition-all cursor-zoom-in"
                            >
                               <img src={selectedReport.photos?.after} alt="After" className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="w-8 h-8 text-white" />
                               </div>
                            </button>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Work Details</h4>
                            <div className="space-y-4">
                               <div className="bg-bg-muted/30 p-4 rounded-2xl border border-border-base">
                                  <p className="text-[10px] font-black text-fg-muted uppercase mb-2">Problem Identified</p>
                                  <p className="text-sm font-medium text-fg-primary leading-relaxed">{selectedReport.problemIdentified}</p>
                               </div>
                               <div className="bg-bg-muted/30 p-4 rounded-2xl border border-border-base">
                                  <p className="text-[10px] font-black text-fg-muted uppercase mb-2">Work Performed</p>
                                  <p className="text-sm font-medium text-fg-primary leading-relaxed">{selectedReport.workPerformed}</p>
                               </div>
                            </div>
                         </div>
                         <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Materials Used</h4>
                            <div className="space-y-2">
                               {selectedReport.materialsUsed?.map((m: any, i: number) => (
                                 <div key={i} className="flex justify-between items-center p-3.5 bg-bg-muted/30 rounded-xl border border-border-base">
                                    <span className="text-xs font-bold text-fg-primary uppercase">{m.name}</span>
                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">x{m.quantity}</span>
                                 </div>
                               ))}
                               {(!selectedReport.materialsUsed || selectedReport.materialsUsed.length === 0) && (
                                  <div className="p-4 bg-bg-muted/30 rounded-xl border border-border-base text-center">
                                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No materials used</p>
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Right: Unified Notes & Decision Panel */}
                   <div className="w-full md:w-[400px] bg-bg-muted/50 p-8 md:p-12 border-l border-border-base flex flex-col justify-between shrink-0 overflow-y-auto">
                      <div className="space-y-8">
                         
                         {/* Notes Section */}
                         <div>
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2"><MessageSquare className="w-3 h-3"/> Technician Notes</h4>
                            
                            {selectedReport.voiceNote && (
                               <div className="mb-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                  <p className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2"><Mic className="w-3 h-3 text-red-500" /> Voice Note</p>
                                  <audio controls src={selectedReport.voiceNote} className="w-full h-10 custom-audio-player" />
                               </div>
                            )}

                            {selectedReport.technicianRemarks ? (
                              <div className="p-4 bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-2xl text-sm font-medium leading-relaxed italic">
                                 "{selectedReport.technicianRemarks}"
                              </div>
                            ) : (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 italic">
                                 No written remarks provided.
                              </div>
                            )}
                         </div>

                         <div className="h-px bg-border-base" />

                         {/* Admin Decision Area */}
                         <div>
                            <h4 className="text-[10px] font-black text-fg-primary uppercase tracking-widest mb-4 flex items-center gap-2"><Shield className="w-3 h-3"/> Approval Decision</h4>
                            
                            <div className="space-y-4">
                               <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest">Review Comments</p>
                               <textarea
                                  value={reviewReason}
                                  onChange={(e) => setReviewReason(e.target.value)}
                                  placeholder="Type notes for the technician..."
                                  className="w-full bg-bg-surface border border-border-base rounded-2xl p-4 text-sm font-medium text-fg-primary focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32 transition-all placeholder:text-fg-muted/50"
                               />
                               
                               <div className="grid grid-cols-1 gap-3">
                                  <button
                                     onClick={() => handleReview(selectedReport._id, 'approved')}
                                     className="w-full py-4 bg-green-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                                  >
                                     Approve Report
                                  </button>
                                  <button
                                     onClick={() => handleReview(selectedReport._id, 'rework')}
                                     className="w-full py-3.5 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                                  >
                                     Mark for Rework
                                  </button>
                                  <button
                                     onClick={() => handleReview(selectedReport._id, 'rejected')}
                                     className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-100 transition-all border border-red-100"
                                  >
                                     Reject Report
                                  </button>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="pt-8 border-t border-border-base mt-8 hidden md:block">
                         <button onClick={() => setSelectedReport(null)} className="w-full py-4 bg-bg-surface border border-border-base rounded-2xl text-[10px] font-black text-fg-muted uppercase tracking-widest hover:text-fg-primary hover:bg-bg-card transition-all">
                            Close Window
                         </button>
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
