"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { fetchWithAuth } from '@/utils/api';
import { 
  Target, Plus, Clock, CheckCircle, AlertCircle, 
  Search, Filter, Menu, User, Users, Calendar, MoreVertical,
  X, Send, AlertTriangle, Hammer, Clipboard, Phone, Navigation, MapPin, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SmartAssignModal from '@/components/admin/SmartAssignModal';

const AdminTasksPage = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSmartAssignOpen, setIsSmartAssignOpen] = useState(false);
  const [selectedJobForAssign, setSelectedJobForAssign] = useState<{id: string, type: 'task' | 'order'} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'medium',
    dueDate: '',
    timeToComplete: '',
    customerName: '',
    customerPhone: '',
    liveLocation: '',
    supportingTechnicians: [] as string[]
  });

  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskData, techData, orderData] = await Promise.all([
        fetchWithAuth('/internal/tasks'),
        fetchWithAuth('/admin/technicians'),
        fetchWithAuth('/orders/all').catch(() => [])
      ]);

      // Normalize internal tasks from /internal/tasks
      const internalTasks = (taskData || []).map((t: any) => ({ ...t, _source: 'internal' }));

      // Map offline orders that were created as "Internal Tasks" from mobile
      // (serviceType starts with 'Internal Task:' OR notes contains 'Internal Task')
      const offlineOrders = (orderData || []).filter((o: any) =>
        o.orderType === 'offline' && (
          (o.serviceType && o.serviceType.toString().startsWith('Internal Task:')) ||
          (o.notes && o.notes.toString().startsWith('Internal Task:')) ||
          (o.category === 'service' && !o.customer?.email?.startsWith('offline_') === false && o.notes?.includes('Internal'))
        )
      );

      // Convert offline orders to task-like shape for rendering
      const offlineAsTasks = offlineOrders.map((o: any) => ({
        _id: o._id,
        _source: 'offline_order',
        title: o.serviceType?.replace('Internal Task:', '').trim() || o.notes?.replace('Internal Task:', '').trim() || `Order #${o._id.toString().slice(-6)}`,
        description: o.notes || o.problemDescription || 'Offline task from mobile',
        status: o.status === 'completed' ? 'completed' : o.status === 'in_progress' ? 'in_progress' : 'pending',
        priority: 'medium',
        assignee: o.technician || null,
        customerName: o.customerName || o.customer?.name || '',
        customerPhone: o.contactNumber || o.customer?.phone || '',
        dueDate: o.preferredDate || o.createdAt,
        createdAt: o.createdAt,
        isOfflineOrder: true
      }));

      // Merge without duplicating by _id
      const existingIds = new Set(internalTasks.map((t: any) => t._id?.toString()));
      const uniqueOffline = offlineAsTasks.filter((t: any) => !existingIds.has(t._id?.toString()));

      setTasks([...internalTasks, ...uniqueOffline]);
      setTechnicians(techData || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const intervalId = setInterval(() => {
      loadData();
    }, 300000); // 5 minutes
    return () => clearInterval(intervalId);
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.assignee) return alert("Please select an employee");
    
    try {
      setIsSubmitting(true);
      await fetchWithAuth('/internal/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      setIsCreateModalOpen(false);
      setNewTask({ title: '', description: '', assignee: '', priority: 'medium', dueDate: '', timeToComplete: '', customerName: '', customerPhone: '', liveLocation: '', supportingTechnicians: [] });
      loadData();
    } catch (err: any) {
      alert("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      await fetchWithAuth(`/internal/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      loadData();
    } catch (err: any) {
      alert("Failed to update status");
    }
  };
  
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    
    try {
      setIsSubmitting(true);
      await fetchWithAuth(`/internal/tasks/${selectedTask._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedTask.title,
          description: selectedTask.description,
          assignee: selectedTask.assignee?._id || selectedTask.assignee,
          priority: selectedTask.priority,
          dueDate: selectedTask.dueDate,
          timeToComplete: selectedTask.timeToComplete,
          customerName: selectedTask.customerName,
          customerPhone: selectedTask.customerPhone,
          liveLocation: selectedTask.liveLocation,
          supportingTechnicians: selectedTask.supportingTechnicians || []
        })
      });
      setIsEditModalOpen(false);
      setSelectedTask(null);
      loadData();
    } catch (err: any) {
      alert("Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to terminate this task protocol?")) return;
    
    try {
      await fetchWithAuth(`/internal/tasks/${taskId}`, {
        method: 'DELETE'
      });
      loadData();
      setActiveMenu(null);
    } catch (err: any) {
      alert("Failed to delete task");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'started': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      default: return 'bg-bg-muted text-fg-muted border-border-base';
    }
  };

  const filteredTasks = tasks.filter(task => {
    let match = true;
    if (filterStatus !== 'all' && task.status !== filterStatus) match = false;
    if (filterDate) {
      const taskDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
      if (taskDate !== filterDate) match = false;
    }
    return match;
  });

  const stats = {
    total: filteredTasks.length,
    pending: filteredTasks.filter(t => t.status === 'pending').length,
    active: filteredTasks.filter(t => ['started', 'in_progress'].includes(t.status)).length,
    completed: filteredTasks.filter(t => t.status === 'completed').length
  };

  if (loading) return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center animate-pulse shadow-xl">
          <Target className="h-7 w-7 text-white" />
        </div>
        <p className="text-[10px] font-black text-[#475569] uppercase tracking-[0.3em] animate-pulse">Loading Tasksâ€¦</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen mesh-bg flex overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0 lg:ml-80 flex flex-col min-h-screen animate-fade-in">
        <AdminNavbar />
        <div className="p-6 md:p-10 space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 glass-card rounded-2xl border border-[#1E3A8A]/15 hover:border-[#1E3A8A]/30 transition-all group">
              <Menu className="h-5 w-5 text-[#1E3A8A] group-hover:scale-110 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="relative w-2 h-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-50" />
                </div>
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">Internal Logistics</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                <span className="gradient-text">Task</span>
                <span className="text-fg-primary"> Allocation</span>
              </h1>
              <p className="text-[#64748b] text-xs font-semibold uppercase tracking-[0.2em] mt-1">Assign & Monitor Employee Productivity</p>
            </div>
          </div>
          <button 
             onClick={() => setIsCreateModalOpen(true)}
             className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl btn-primary font-black text-[10px] uppercase tracking-widest"
          >
             <Plus className="h-4 w-4" /> 
             <span>Create Task</span>
          </button>
        </header>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Status Filter */}
          <div className="flex-1 glass-card rounded-2xl border border-[#1E3A8A]/12 flex items-center gap-3 px-4 py-3.5 hover:border-[#1E3A8A]/25 transition-all">
            <div className="p-2 bg-[#1E3A8A]/10 rounded-xl flex-shrink-0">
              <Filter className="h-4 w-4 text-[#1E3A8A] dark:text-blue-400" />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-[#0f172a] dark:text-white text-xs font-bold uppercase tracking-widest outline-none border-none flex-1 appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="started">Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          {/* Date Filter */}
          <div className="flex-1 glass-card rounded-2xl border border-[#1E3A8A]/12 flex items-center gap-3 px-4 py-3.5 hover:border-[#1E3A8A]/25 transition-all">
            <div className="p-2 bg-[#1E3A8A]/10 rounded-xl flex-shrink-0">
              <Calendar className="h-4 w-4 text-[#1E3A8A] dark:text-blue-400" />
            </div>
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-[#0f172a] dark:text-white text-xs font-bold uppercase tracking-widest outline-none border-none flex-1 cursor-pointer"
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="p-1.5 text-[#94a3b8] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            {[['Total Assignments', stats.total, Target, 'text-blue-500'],
             ['Pending Action', stats.pending, Clock, 'text-fg-muted'],
             ['Active In-Field', stats.active, Hammer, 'text-indigo-500'],
             ['Completed Nodes', stats.completed, CheckCircle, 'text-green-500']].map((s: any, i) => {
               const Icon = s[2];
               return (
                 <div key={i} className="glass-card p-10 rounded-[3rem] border border-border-base shadow-xl flex flex-col justify-between">
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4 whitespace-normal leading-tight min-h-[2.5rem] flex items-center">{s[0]}</p>
                    <div className="flex items-center justify-between">
                       <h3 className="text-4xl font-black text-fg-primary tracking-tighter tabular-nums italic">{s[1]}</h3>
                        <Icon className={`h-8 w-8 ${s[3]}`} />
                     </div>
                  </div>
                );
             })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
           {filteredTasks.map((task) => (
             <motion.div 
               layout
               key={task._id} 
               className="glass-card p-10 rounded-[3.5rem] border border-border-base bg-card shadow-2xl relative group h-full flex flex-col justify-between"
             >
                <div className={`absolute top-0 right-0 w-2 h-full ${
                   task.status === 'completed' ? 'bg-green-500' : 
                   task.status === 'in_progress' ? 'bg-blue-500' : 'bg-fg-dim'
                }`}></div>
                
                <div className="flex justify-between items-start mb-8">
                   <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                   </span>
                   <span className={`text-[8px] font-black uppercase tracking-widest ${
                      task.priority === 'urgent' ? 'text-red-500 animate-pulse' : 
                      task.priority === 'high' ? 'text-amber-500' : 'text-fg-dim'
                   }`}>
                      {task.priority} priority
                   </span>
                </div>

                <h4 className="text-xl font-black text-fg-primary uppercase tracking-tight mb-4 leading-tight">
                   {task.title}
                   {task.isOfflineOrder && (
                     <span className="ml-3 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-lg align-middle">ðŸ“± Mobile</span>
                   )}
                </h4>
                <p className="text-xs text-fg-muted font-medium mb-6 line-clamp-3 leading-relaxed">{task.description}</p>
                
                {/* Customer Contact & Live Location */}
                <div className="space-y-3 p-5 bg-bg-muted/40 rounded-3xl border border-border-base mb-8">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-fg-dim uppercase tracking-widest">Customer Assigned</p>
                         <p className="text-sm font-black text-fg-primary uppercase tracking-tight">{task.customerName || 'Standard Client'}</p>
                      </div>
                      {task.customerPhone && (
                         <a 
                           href={`tel:${task.customerPhone.replace(/\D/g, '')}`} 
                           className="p-3 bg-green-500/10 hover:bg-green-500 hover:text-white text-green-500 border border-green-500/20 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
                           title="Direct Call Customer"
                         >
                            <Phone className="h-4 w-4" />
                            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Call</span>
                         </a>
                      )}
                   </div>
                   {task.liveLocation && (
                      <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                         <div className="flex items-center gap-2 text-blue-500">
                            <Navigation className="h-4 w-4 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Live Telemetry</span>
                         </div>
                         <a 
                            href={task.liveLocation} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-500 border border-blue-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
                         >
                            <span>Open Live Map</span>
                         </a>
                      </div>
                   )}
                </div>

                <div className="space-y-6 pt-6 border-t border-border-subtle">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         {task.assignee?.name ? (
                           <>
                             <div className="w-10 h-10 bg-bg-muted rounded-xl flex items-center justify-center border border-border-base overflow-hidden">
                                <span className="text-[10px] font-black text-blue-500">{task.assignee.name[0]}</span>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black text-fg-primary uppercase">{task.assignee.name}</span>
                                <span className="text-[8px] font-bold text-fg-dim capitalize">{task.assignee.role}</span>
                             </div>
                           </>
                         ) : (
                           <>
                             <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 overflow-hidden">
                                <User className="h-4 w-4 text-red-500" />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Unassigned</span>
                                <span className="text-[8px] font-bold text-fg-dim capitalize">Needs Allocation</span>
                             </div>
                           </>
                         )}
                      </div>
                       <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black text-fg-dim uppercase tracking-widest mb-1">Time Goal</span>
                          <span className="text-[10px] font-black text-blue-500 uppercase italic leading-none">{task.timeToComplete || 'Rapid'}</span>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black text-fg-dim uppercase tracking-widest mb-1">Due Date</span>
                          <span className="text-[10px] font-black text-fg-primary italic">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Unset'}</span>
                       </div>
                   </div>

                   <div className="flex gap-2">
                      <select 
                         value={task.status}
                         onChange={(e) => handleUpdateStatus(task._id, e.target.value)}
                         className="flex-1 bg-bg-muted border border-border-base rounded-xl p-3 text-[9px] font-black text-fg-primary uppercase tracking-widest focus:border-blue-500 outline-none appearance-none cursor-pointer"
                      >
                         <option value="pending">Mark Pending</option>
                         <option value="started">Task Started</option>
                         <option value="in_progress">In Progress</option>
                         <option value="completed">Completed</option>
                      </select>
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === task._id ? null : task._id);
                          }}
                          className="p-3 bg-bg-muted border border-border-base rounded-xl hover:bg-blue-600 hover:text-white transition-all text-fg-muted"
                        >
                           <MoreVertical className="h-4 w-4" />
                        </button>

                        <AnimatePresence>
                           {activeMenu === task._id && (
                             <motion.div 
                               initial={{ opacity: 0, scale: 0.95, y: 10 }}
                               animate={{ opacity: 1, scale: 1, y: 0 }}
                               exit={{ opacity: 0, scale: 0.95, y: 10 }}
                               className="absolute right-0 mt-2 w-48 bg-card border border-border-base rounded-2xl shadow-2xl z-[50] overflow-hidden p-2"
                             >
                                <button 
                                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-600/10 text-fg-primary rounded-xl transition-all text-left group"
                                  onClick={() => { 
                                    setSelectedTask(task);
                                    setIsEditModalOpen(true);
                                    setActiveMenu(null);
                                  }}
                                >
                                   <Plus className="h-4 w-4 text-blue-500" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Edit Protocol</span>
                                </button>
                                <button 
                                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-indigo-600/10 text-indigo-500 rounded-xl transition-all text-left group"
                                  onClick={() => { 
                                    setSelectedJobForAssign({ id: task._id, type: task.isOfflineOrder ? 'order' : 'task' });
                                    setIsSmartAssignOpen(true);
                                    setActiveMenu(null);
                                  }}
                                >
                                   <User className="h-4 w-4 text-indigo-500" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Smart Assign</span>
                                </button>
                                <button 
                                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-600/10 text-red-500 rounded-xl transition-all text-left group"
                                  onClick={() => handleDeleteTask(task._id)}
                                >
                                   <X className="h-4 w-4" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Terminate Task</span>
                                </button>
                             </motion.div>
                           )}
                        </AnimatePresence>
                      </div>
                   </div>
                </div>
             </motion.div>
           ))}

           {tasks.length === 0 && (
             <div className="md:col-span-3 py-40 text-center opacity-40">
                <Clipboard className="h-20 w-20 mx-auto text-fg-muted mb-6" />
                <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.4em] mb-2">No Tasks Distributed In Grid</p>
             </div>
           )}
        </div>
      </div>
    </main>

      {/* Create Task Modal */}
      <AnimatePresence>
         {isCreateModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 50 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 50 }}
                 className="relative w-full max-w-2xl bg-white border border-gray-100 rounded-[2.5rem] p-10 lg:p-12 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide text-slate-800"
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] -z-10 rounded-full"></div>
                  
                  <div className="flex justify-between items-start mb-10">
                     <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Strategic <span className="text-blue-600 non-italic">Tasking</span></h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">New Assignment Protocol</p>
                     </div>
                     <button type="button" onClick={() => setIsCreateModalOpen(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-gray-200">
                        <X className="h-5 w-5" />
                     </button>
                  </div>

                  <form onSubmit={handleCreateTask} className="space-y-8">
                     <div className="grid grid-cols-2 gap-8">
                        <div className="col-span-2 space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Objective Title</label>
                           <input 
                              required
                              placeholder="e.g. Server Room Maintenance" 
                              value={newTask.title}
                              onChange={e => setNewTask(p => ({...p, title: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400"
                           />
                        </div>
                        <div className="col-span-2 p-5 bg-blue-50/50 border border-blue-100 rounded-3xl space-y-5">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <User className="h-3 w-3" /> Primary Operative
                              </label>
                              <select 
                                 required
                                 value={newTask.assignee}
                                 onChange={e => {
                                   const val = e.target.value;
                                   setNewTask(p => ({
                                     ...p, 
                                     assignee: val,
                                     supportingTechnicians: p.supportingTechnicians.filter(id => id !== val)
                                   }));
                                 }}
                                 className="w-full bg-white border border-blue-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 outline-none cursor-pointer shadow-sm"
                              >
                                 <option value="">Select Lead Technician...</option>
                                 {technicians.map(t => (
                                   <option key={t._id} value={t._id}>{t.name} ({t.role})</option>
                                 ))}
                              </select>
                           </div>
                           
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <Users className="h-3 w-3" /> Supporting Team
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                {technicians.filter(t => t._id !== newTask.assignee).map(t => {
                                  const isSelected = newTask.supportingTechnicians.includes(t._id);
                                  return (
                                    <button
                                      key={t._id}
                                      type="button"
                                      onClick={() => setNewTask(p => ({
                                        ...p,
                                        supportingTechnicians: isSelected 
                                          ? p.supportingTechnicians.filter(id => id !== t._id)
                                          : [...p.supportingTechnicians, t._id]
                                      }))}
                                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                                        isSelected 
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                          : 'bg-white border-blue-100 text-slate-600 hover:border-blue-300'
                                      }`}
                                    >
                                       <span className="font-bold text-xs">{t.name}</span>
                                       {isSelected && <CheckCircle className="h-4 w-4" />}
                                    </button>
                                  );
                                })}
                              </div>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Priority Level</label>
                           <select 
                              value={newTask.priority}
                              onChange={e => setNewTask(p => ({...p, priority: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none cursor-pointer"
                           >
                              <option value="low">Low Intensity</option>
                              <option value="medium">Standard Priority</option>
                              <option value="high">High Strategic Value</option>
                              <option value="urgent">Critical/Urgent</option>
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Due Date</label>
                           <input 
                              type="date"
                              value={newTask.dueDate}
                              onChange={e => setNewTask(p => ({...p, dueDate: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Time Allocation</label>
                           <input 
                              placeholder="e.g. 2 Hours, 1 Day" 
                              value={newTask.timeToComplete}
                              onChange={e => setNewTask(p => ({...p, timeToComplete: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Customer Name</label>
                           <input 
                              placeholder="e.g. Rahul Sharma" 
                              value={newTask.customerName}
                              onChange={e => setNewTask(p => ({...p, customerName: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Customer Phone</label>
                           <input 
                              type="tel"
                              placeholder="e.g. 9876543210" 
                              value={newTask.customerPhone}
                              onChange={e => setNewTask(p => ({...p, customerPhone: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400"
                           />
                        </div>
                        <div className="col-span-2 space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Live Location URL</label>
                           <input 
                              type="url"
                              placeholder="e.g. https://maps.google.com/..." 
                              value={newTask.liveLocation}
                              onChange={e => setNewTask(p => ({...p, liveLocation: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400"
                           />
                        </div>
                        <div className="col-span-2 space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Detailed Instructions</label>
                           <textarea 
                              required
                              placeholder="Outline the operational steps..." 
                              value={newTask.description}
                              onChange={e => setNewTask(p => ({...p, description: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none h-32 resize-none placeholder:text-slate-400"
                           />
                        </div>
                     </div>

                     <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            <span>Dispatch Task</span>
                          </>
                        )}
                     </button>
                  </form>
               </motion.div>
            </div>
         )}

         {isEditModalOpen && selectedTask && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 50 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 50 }}
                 className="relative w-full max-w-2xl bg-white border border-gray-100 rounded-[2.5rem] p-10 lg:p-12 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide text-slate-800"
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] -z-10 rounded-full"></div>
                  
                  <div className="flex justify-between items-start mb-10">
                     <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Edit <span className="text-blue-600 non-italic">Protocol</span></h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Modify Task Assignment</p>
                     </div>
                     <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-gray-200">
                        <X className="h-5 w-5" />
                     </button>
                  </div>

                  <form onSubmit={handleUpdateTask} className="space-y-8">
                     <div className="grid grid-cols-2 gap-8">
                        <div className="col-span-2 space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Objective Title</label>
                           <input 
                              required
                              placeholder="e.g. Server Room Maintenance" 
                              value={selectedTask.title}
                              onChange={e => setSelectedTask((p: any) => ({...p, title: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400"
                           />
                        </div>
                        <div className="col-span-2 p-5 bg-blue-50/50 border border-blue-100 rounded-3xl space-y-5">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <User className="h-3 w-3" /> Primary Operative
                              </label>
                              <select 
                                 required
                                 value={selectedTask.assignee?._id || selectedTask.assignee}
                                 onChange={e => {
                                   const val = e.target.value;
                                   setSelectedTask((p: any) => ({
                                     ...p, 
                                     assignee: val,
                                     supportingTechnicians: (p.supportingTechnicians || []).filter((id: string) => id !== val)
                                   }));
                                 }}
                                 className="w-full bg-white border border-blue-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 outline-none cursor-pointer shadow-sm"
                              >
                                 {technicians.map(t => (
                                   <option key={t._id} value={t._id}>{t.name} ({t.role})</option>
                                 ))}
                              </select>
                           </div>
                           
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <Users className="h-3 w-3" /> Supporting Team
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                {technicians.filter(t => t._id !== (selectedTask.assignee?._id || selectedTask.assignee)).map(t => {
                                  const isSelected = (selectedTask.supportingTechnicians || []).includes(t._id);
                                  return (
                                    <button
                                      key={t._id}
                                      type="button"
                                      onClick={() => setSelectedTask((p: any) => ({
                                        ...p,
                                        supportingTechnicians: isSelected 
                                          ? (p.supportingTechnicians || []).filter((id: string) => id !== t._id)
                                          : [...(p.supportingTechnicians || []), t._id]
                                      }))}
                                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                                        isSelected 
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                          : 'bg-white border-blue-100 text-slate-600 hover:border-blue-300'
                                      }`}
                                    >
                                       <span className="font-bold text-xs">{t.name}</span>
                                       {isSelected && <CheckCircle className="h-4 w-4" />}
                                    </button>
                                  );
                                })}
                              </div>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Priority Level</label>
                           <select 
                              value={selectedTask.priority}
                              onChange={e => setSelectedTask((p: any) => ({...p, priority: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none cursor-pointer"
                           >
                              <option value="low">Low Intensity</option>
                              <option value="medium">Standard Priority</option>
                              <option value="high">High Strategic Value</option>
                              <option value="urgent">Critical/Urgent</option>
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Due Date</label>
                           <input 
                              type="date"
                              value={selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : ''}
                              onChange={e => setSelectedTask((p: any) => ({...p, dueDate: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Time Allocation</label>
                           <input 
                              placeholder="e.g. 2 Hours, 1 Day" 
                              value={selectedTask.timeToComplete}
                              onChange={e => setSelectedTask((p: any) => ({...p, timeToComplete: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Customer Name</label>
                           <input 
                              placeholder="e.g. Rahul Sharma" 
                              value={selectedTask.customerName || ''}
                              onChange={e => setSelectedTask((p: any) => ({...p, customerName: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Customer Phone</label>
                           <input 
                              type="tel"
                              placeholder="e.g. 9876543210" 
                              value={selectedTask.customerPhone || ''}
                              onChange={e => setSelectedTask((p: any) => ({...p, customerPhone: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400"
                           />
                        </div>
                        <div className="col-span-2 space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Live Location URL</label>
                           <input 
                              type="url"
                              placeholder="e.g. https://maps.google.com/..." 
                              value={selectedTask.liveLocation || ''}
                              onChange={e => setSelectedTask((p: any) => ({...p, liveLocation: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400"
                           />
                        </div>
                        <div className="col-span-2 space-y-3">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Detailed Instructions</label>
                           <textarea 
                              required
                              placeholder="Outline the operational steps..." 
                              value={selectedTask.description}
                              onChange={e => setSelectedTask((p: any) => ({...p, description: e.target.value}))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none h-32 resize-none placeholder:text-slate-400"
                           />
                        </div>
                     </div>

                     <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            <span>Update Protocol</span>
                          </>
                        )}
                     </button>

                     {selectedTask && (
                       <button
                         type="button"
                         onClick={async () => {
                           try {
                              await fetchWithAuth('/notifications', {
                                method: 'POST',
                                body: JSON.stringify({
                                  title: 'Task Follow-up',
                                  message: `Follow up required for Task: ${selectedTask.title}`,
                                  role: 'technician',
                                  type: 'followup',
                                  userId: selectedTask.assignee || 'all'
                                })
                              });
                              alert("Follow-up notification sent to Technician.");
                           } catch (e) { alert("Failed to send follow-up."); }
                         }}
                         className="w-full py-4 mt-4 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center space-x-2"
                       >
                         <Bell className="h-4 w-4" />
                         <span>Send Follow-up Reminder</span>
                       </button>
                     )}
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
      
      {isSmartAssignOpen && selectedJobForAssign && (
        <SmartAssignModal
          isOpen={isSmartAssignOpen}
          onClose={() => setIsSmartAssignOpen(false)}
          jobId={selectedJobForAssign.id}
          jobType={selectedJobForAssign.type}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default AdminTasksPage;
