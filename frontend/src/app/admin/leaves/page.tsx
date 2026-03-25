"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  Calendar, CheckCircle2, XCircle, Clock, User, 
  MessageSquare, ShieldAlert, Zap, Menu, ChevronLeft 
} from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';

const LeavesPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadLeaves = async () => {
    try {
      const data = await fetchWithAuth('/internal/leave');
      setLeaves(data);
    } catch (error) {
      console.error("Load Leaves Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleAction = async (id: string, status: string) => {
    try {
      // Assuming a patch route exists or adding one
      await fetchWithAuth(`/internal/leave/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadLeaves();
    } catch (error) {
      alert("Action failed. Verification required.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background transition-colors overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:ml-80 p-6 md:p-12 w-full">
        <header className="mb-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
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
            <div>
              <h1 className="text-5xl font-black text-fg-primary tracking-tighter uppercase leading-none">Leave <span className="text-secondary italic">Management</span></h1>
              <p className="text-fg-muted font-bold text-lg uppercase tracking-widest mt-2 ml-1">Professional Downtime Authorization</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {Array.isArray(leaves) && leaves.map((leave: any) => (
             <div key={leave._id} className="glass-card p-10 rounded-[2.5rem] border border-border-base relative overflow-hidden group">
                <div className={`absolute top-0 right-0 p-4`}>
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${leave.status === 'pending' ? 'bg-orange-500/10 text-orange-500' : leave.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {leave.status || 'pending'}
                   </span>
                </div>
                <div className="space-y-6">
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-bg-muted rounded-2xl flex items-center justify-center">
                         <User className="h-6 w-6 text-fg-muted" />
                      </div>
                      <div>
                         <p className="text-sm font-black text-fg-primary uppercase">{leave.user?.name || 'Professional Technician'}</p>
                         <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">{leave.reason || 'Leave Request'}</p>
                      </div>
                   </div>
                   
                   <div className="space-y-3">
                      <div className="flex items-center text-xs font-bold text-fg-secondary">
                         <Calendar className="h-4 w-4 mr-3 text-blue-600" />
                         <span>{(leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'N/A')} — {(leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'N/A')}</span>
                      </div>
                      <div className="flex items-start text-xs font-medium text-fg-muted leading-relaxed italic">
                         <MessageSquare className="h-4 w-4 mr-3 text-blue-600 mt-1 flex-shrink-0" />
                         <span>"{leave.reasonDetail || 'No detailed intelligence provided.'}"</span>
                      </div>
                   </div>

                   {leave.status === 'pending' && (
                     <div className="pt-6 grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => handleAction(leave._id, 'approved')}
                          className="py-4 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border border-green-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                           Authorize
                        </button>
                        <button 
                          onClick={() => handleAction(leave._id, 'rejected')}
                          className="py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                           Decline
                        </button>
                     </div>
                   )}
                </div>
             </div>
           ))}
           {(!Array.isArray(leaves) || leaves.length === 0) && (
              <div className="md:col-span-3 glass-card p-20 rounded-[3.5rem] border border-border-base text-center">
                 <ShieldAlert className="h-12 w-12 text-fg-muted mx-auto mb-6 opacity-20" />
                 <p className="text-fg-secondary font-bold text-lg uppercase tracking-tight">All Professional Technicians are operational. No pending downtime requests.</p>
              </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default LeavesPage;
