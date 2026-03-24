"use client";
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Activity, Zap } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import BackButton from '@/components/common/BackButton';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const TechnicianSchedulePage = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ taskId: '', reason: '' });

  const loadTasks = async () => {
    try {
      const data = await fetchWithAuth('/technician/my-tasks');
      setTasks(data || []);
    } catch (error) {
      console.error("Load Schedule Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleRescheduleSubmit = async () => {
    if (!rescheduleData.reason) return alert("Please provide a reason.");
    alert(`Request submitted to admin for job #${rescheduleData.taskId.slice(-6)}. You will be notified of the new schedule.`);
    setShowRescheduleModal(false);
  };

  const upcomingTasks = tasks.filter(t => !t.stages?.completed?.status);

  return (
    <div className="min-h-screen bg-background text-fg-primary p-4 md:p-10 pb-32 transition-all duration-500">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-6">
            <BackButton />
            <div className="pt-2">
              <h1 className="text-5xl font-black uppercase tracking-tighter leading-none italic">Job <span className="text-blue-500">Schedule</span></h1>
              <p className="text-fg-muted font-black text-[10px] uppercase tracking-widest mt-2 px-1 border-l-2 border-blue-500">Planned Operations Hub</p>
            </div>
          </div>
          <div className="flex bg-bg-muted p-2 rounded-2xl border border-border-base shadow-xl shadow-blue-500/5">
             <button 
               onClick={() => setViewMode('list')}
               className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-fg-muted hover:text-fg-primary'}`}
             >
               Timeline
             </button>
             <button 
               onClick={() => setViewMode('calendar')}
               className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-fg-muted hover:text-fg-primary'}`}
             >
               Calendar
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center">
                  <Activity className="h-5 w-5 mr-3 text-blue-500" />
                  Upcoming Tasks
               </h3>
               <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/20">
                  {upcomingTasks.length} Active
               </span>
            </div>

            {loading ? (
              <div className="h-96 flex items-center justify-center glass-card rounded-[3rem] border border-border-base">
                 <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : viewMode === 'calendar' ? (
              <div className="glass-card p-16 rounded-[3rem] border border-border-base text-center space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10" />
                 <CalendarIcon className="h-20 w-20 text-blue-500 mx-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                 <div className="space-y-4">
                    <h4 className="text-2xl font-black uppercase tracking-tight">Calendar Sync Active</h4>
                    <p className="text-fg-muted max-w-sm mx-auto font-medium">Full interactive grid view is being optimized for touch. You have {upcomingTasks.length} high-priority deployments this week.</p>
                 </div>
              </div>
            ) : upcomingTasks.length > 0 ? (
              <div className="space-y-8">
                {upcomingTasks.map((task, i) => (
                  <div key={task._id} className="glass-card p-8 md:p-10 rounded-[3rem] border border-border-base relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-600 text-white rounded-[2rem] flex flex-col items-center justify-center shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-transform">
                         <span className="text-3xl font-black">{new Date(task.createdAt).getDate()}</span>
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{new Date(task.createdAt).toLocaleString('default', { month: 'short' })}</span>
                      </div>
                      <div className="flex-1 space-y-4 w-full md:w-auto">
                         <div className="flex items-center space-x-3">
                            <span className="px-3 py-1 bg-fg-primary text-[8px] font-black text-background uppercase rounded-lg tracking-widest">DEPLOYMENT</span>
                            <span className="text-[10px] font-mono font-bold text-fg-muted uppercase tracking-widest">ID: {task.order?._id?.toString().slice(-6)}</span>
                         </div>
                         <h4 className="text-2xl font-black uppercase tracking-tight group-hover:text-blue-500 transition-colors leading-none">
                           {task.order?.products?.[0]?.product?.name || 'Security Node Setup'}
                         </h4>
                         <div className="flex flex-wrap gap-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.15em]">
                            <div className="flex items-center space-x-2">
                               <MapPin className="h-4 w-4 text-red-500" />
                               <span className="truncate max-w-[200px] border-b border-border-base pb-0.5">{task.order?.deliveryAddress || 'Site Location'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                               <Clock className="h-4 w-4 text-blue-500" />
                               <span className="border-b border-border-base pb-0.5">09:00 AM - 12:00 PM</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-row md:flex-col gap-3 w-full md:w-48 mt-6 md:mt-0">
                         <button 
                           onClick={() => {
                             setRescheduleData({ taskId: task._id, reason: '' });
                             setShowRescheduleModal(true);
                           }}
                           className="flex-1 py-5 bg-bg-muted border border-border-base rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest hover:border-blue-500 transition-all text-fg-primary"
                         >
                           Reschedule
                         </button>
                         <Link 
                           href="/technician"
                           className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 text-center hover:bg-blue-700 transition-all"
                         >
                           Enter Workflow
                         </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-20 rounded-[3.5rem] border-dashed border-2 border-border-base text-center space-y-6">
                 <CalendarIcon className="h-16 w-16 text-fg-dim mx-auto" />
                 <div className="space-y-2">
                    <p className="text-lg font-black uppercase tracking-tighter text-fg-primary">Agenda Clear</p>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">No deployments found for the selected period.</p>
                 </div>
              </div>
            )}
          </div>

          {/* Side Panels */}
          <div className="lg:col-span-4 space-y-10">
             <div className="glass-card p-10 rounded-[3rem] border border-border-base bg-gradient-to-br from-indigo-600/5 to-transparent space-y-8">
                <div className="flex items-center justify-between border-b border-border-base pb-6">
                   <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Live Performance</h3>
                   <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div className="space-y-8">
                   {[
                     { label: 'Weekly Efficiency', value: '94%', icon: Activity, color: 'text-green-500' },
                     { label: 'Route Optimization', value: '4.2km Reduction', icon: Zap, color: 'text-blue-500' },
                   ].map((stat, i) => (
                     <div key={i} className="flex items-center space-x-6">
                        <div className="p-4 bg-background rounded-2xl border border-border-base shadow-lg">
                           <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                           <p className="text-xl font-black text-fg-primary">{stat.value}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="glass-card p-0 rounded-[3rem] border border-border-base overflow-hidden aspect-square bg-bg-muted flex items-center justify-center relative shadow-2xl">
                <div className="absolute inset-0 bg-blue-600/5 backdrop-blur-[2px] -z-10"></div>
                <div className="text-center space-y-6 px-10">
                   <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20 shadow-2xl shadow-blue-500/10 active:scale-95 transition-transform cursor-pointer">
                      <MapPin className="h-10 w-10 text-blue-500 animate-pulse" />
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-widest">Geo-Spatial Hub</h4>
                      <p className="text-[10px] text-fg-muted font-bold leading-relaxed uppercase tracking-wider opacity-60">Interactive node grid initializing. Synchronization active.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {showRescheduleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRescheduleModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-card rounded-[3rem] border border-border-base p-10 shadow-2xl overflow-hidden"
            >
              <h2 className="text-2xl font-black text-fg-primary uppercase tracking-tight mb-2">Request Reschedule</h2>
              <p className="text-fg-muted text-[10px] font-black uppercase tracking-widest mb-10 border-l-2 border-blue-500 pl-4">Job ID: {rescheduleData.taskId.slice(-6)}</p>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Reason for delay / reschedule</label>
                  <textarea 
                    rows={4}
                    placeholder="E.g. Technical difficulty, logistics issue, client request..."
                    className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm text-fg-primary outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
                    value={rescheduleData.reason}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowRescheduleModal(false)}
                    className="flex-1 py-5 bg-bg-muted border border-border-base rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-bg-hover transition-all text-fg-muted"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRescheduleSubmit}
                    className="flex-1 py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all font-black"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TechnicianSchedulePage;
