"use client";
import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TechnicianSidebar from '@/components/technician/TechnicianSidebar';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/utils/api';
import { 
  Calendar, Plus, Clock, CheckCircle2, XCircle, AlertCircle, 
  Menu, ChevronLeft, CalendarDays, FileText, Send, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const TechnicianLeaves = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/internal/leave');
      setLeaves(data || []);
    } catch (error) {
      console.error("Load Leaves Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleSumbitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      setSubmitting(true);
      await fetchWithAuth('/internal/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, reason })
      });
      alert("Leave request successfully submitted to Admin Command.");
      setStartDate('');
      setEndDate('');
      setReason('');
      setShowAddForm(false);
      loadLeaves();
    } catch (error: any) {
      alert(error.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Approved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest shadow-sm">
            <XCircle className="h-3.5 w-3.5" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest shadow-sm">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending Admin Review</span>
          </span>
        );
    }
  };

  if (loading && leaves.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex transition-all duration-500 overflow-x-hidden">
      <TechnicianSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <main className="flex-1 flex flex-col min-h-screen bg-background">
        <div className="p-4 md:p-8 lg:p-12 overflow-y-auto w-full space-y-12 max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full">
            <div className="flex items-center gap-4 md:gap-6">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="lg:hidden p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl hover:bg-blue-600/20 transition-all shadow-lg shadow-blue-500/5 group"
              >
                <Menu className="h-6 w-6 text-fg-primary group-hover:scale-110 transition-transform" />
              </button>
              <button 
                onClick={() => router.push('/technician')}
                className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-bg-surface transition-all group"
                title="Back to Dashboard"
              >
                <ChevronLeft className="h-6 w-6 text-fg-primary group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] animate-pulse"></div>
                  <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Field Personnel Management</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none italic">Leave <span className="text-fg-primary not-italic">Portal</span></h1>
                <p className="text-fg-muted text-sm md:text-base font-medium uppercase tracking-widest italic leading-none">Submit & Track Time-Off Requests</p>
              </div>
            </div>

            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center justify-center space-x-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/30 w-full sm:w-auto"
            >
              <Plus className={`h-5 w-5 transition-transform duration-300 ${showAddForm ? 'rotate-45' : ''}`} />
              <span>{showAddForm ? 'Close Form' : 'New Leave Request'}</span>
            </button>
          </header>

          {/* New Leave Request Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleSumbitLeave} className="glass-card rounded-[3rem] border border-border-base p-8 md:p-12 relative shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
                  <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight italic mb-8 flex items-center gap-3">
                    <CalendarDays className="h-7 w-7 text-blue-500" />
                    <span>File New <span className="text-blue-500 not-italic">Absence Request</span></span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">Start Date</label>
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="w-full bg-bg-muted border border-border-base rounded-[1.5rem] p-5 text-xs font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">End Date</label>
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className="w-full bg-bg-muted border border-border-base rounded-[1.5rem] p-5 text-xs font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 mb-10">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">Reason for Leave</label>
                    <textarea 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      rows={4}
                      placeholder="Specify comprehensive details regarding your time-off requirements..."
                      className="w-full bg-bg-muted border border-border-base rounded-[2rem] p-6 text-xs font-medium text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <button 
                      type="button" 
                      onClick={() => setShowAddForm(false)}
                      className="px-8 py-5 border border-border-base rounded-[1.5rem] font-black text-xs uppercase tracking-widest text-fg-muted hover:bg-bg-muted transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="px-10 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/30 flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
                    >
                      {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      <span>Submit Request</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Leaves List */}
          <div className="space-y-6 pb-24">
            <h3 className="text-xl font-black text-fg-primary uppercase tracking-widest italic ml-2">Historical Records</h3>
            
            {leaves.length === 0 ? (
              <div className="glass-card rounded-[3rem] border border-border-base p-16 text-center space-y-6 opacity-60">
                <div className="w-20 h-20 bg-bg-muted rounded-[2.5rem] flex items-center justify-center mx-auto border border-border-base">
                  <FileText className="h-10 w-10 text-fg-dim" />
                </div>
                <div>
                  <p className="text-base font-black text-fg-primary uppercase tracking-widest italic">No Leave Requests Logged</p>
                  <p className="text-xs font-medium text-fg-muted mt-2">Submit a request above to notify Admin Command.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {leaves.map((leave: any) => (
                  <motion.div 
                    key={leave._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-[2.5rem] border border-border-base p-8 hover:border-blue-500/30 transition-all duration-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-500 shadow-inner">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-lg font-black text-fg-primary tracking-tight uppercase">
                            {new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest mt-1">
                            Submitted: {new Date(leave.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-fg-muted italic pt-3 border-t border-border-base/50 leading-relaxed">
                        &ldquo;{leave.reason}&rdquo;
                      </p>
                      {leave.adminRemarks && (
                        <div className="p-4 bg-bg-muted rounded-2xl border border-border-base mt-2">
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <AlertCircle className="h-3 w-3" />
                            <span>Admin Dispatch Remarks</span>
                          </p>
                          <p className="text-xs font-bold text-fg-primary">{leave.adminRemarks}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center self-end md:self-center">
                      {getStatusBadge(leave.status)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default function TechnicianLeavesPage() {
  return (
    <ProtectedRoute allowedRoles={['technician']}>
      <TechnicianLeaves />
    </ProtectedRoute>
  );
}
