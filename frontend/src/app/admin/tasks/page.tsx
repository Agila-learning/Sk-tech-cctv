"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth } from '@/utils/api';
import { 
  Target, Plus, Clock, CheckCircle, AlertCircle, 
  Search, Filter, Menu, User, Calendar, MoreVertical,
  X, Send, AlertTriangle, Hammer, Clipboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminTasksPage = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'medium',
    dueDate: ''
  });

  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskData, techData] = await Promise.all([
        fetchWithAuth('/internal/tasks'),
        fetchWithAuth('/admin/technicians')
      ]);
      setTasks(taskData || []);
      setTechnicians(techData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
      setNewTask({ title: '', description: '', assignee: '', priority: 'medium', dueDate: '' });
      loadData();
    } catch (err) {
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
    } catch (err) {
      alert("Failed to update status");
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex transition-all duration-500 overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 p-6 md:p-12 w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-bg-muted rounded-2xl border border-border-base">
              <Menu className="h-6 w-6 text-fg-primary" />
            </button>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,1)] animate-pulse"></div>
                <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Internal Logistics</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">Task <span className="text-blue-500 non-italic">Allocation</span></h1>
              <p className="text-fg-muted text-lg md:text-xl font-medium uppercase tracking-widest">Assign & Monitor Employee Productivity</p>
            </div>
          </div>
          <button 
             onClick={() => setIsCreateModalOpen(true)}
             className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-3"
          >
             <Plus className="h-4 w-4" /> Create Task
          </button>
        </header>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 bg-bg-muted p-5 rounded-3xl border border-border-base flex items-center gap-4">
            <Filter className="h-5 w-5 text-fg-muted" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-fg-primary text-xs font-black uppercase tracking-widest outline-none border-none flex-1 appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="started">Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div className="flex-1 bg-bg-muted p-5 rounded-3xl border border-border-base flex items-center gap-4">
            <Calendar className="h-5 w-5 text-fg-muted" />
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-fg-primary text-xs font-black uppercase tracking-widest outline-none border-none flex-1 cursor-pointer"
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="p-2 text-fg-muted hover:text-red-500 bg-border-base rounded-xl transition-colors">
                <X className="h-4 w-4" />
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
                 <div key={i} className="glass-card p-10 rounded-[3rem] border border-border-base shadow-xl">
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-4">{s[0]}</p>
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
               className="glass-card p-10 rounded-[3.5rem] border border-border-base bg-card shadow-2xl relative group"
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

                <h4 className="text-xl font-black text-fg-primary uppercase tracking-tight mb-4 leading-tight">{task.title}</h4>
                <p className="text-xs text-fg-muted font-medium mb-10 line-clamp-3 leading-relaxed">{task.description}</p>
                
                <div className="space-y-6 pt-8 border-t border-border-subtle">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-bg-muted rounded-xl flex items-center justify-center border border-border-base overflow-hidden">
                            <span className="text-[10px] font-black text-blue-500">{task.assignee?.name?.[0]}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-fg-primary uppercase">{task.assignee?.name}</span>
                            <span className="text-[8px] font-bold text-fg-dim capitalize">{task.assignee?.role}</span>
                         </div>
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
                                  onClick={() => { setActiveMenu(null); alert("Protocol edit initialized."); }}
                                >
                                   <Plus className="h-4 w-4 text-blue-500" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Edit Protocol</span>
                                </button>
                                <button 
                                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-600/10 text-red-500 rounded-xl transition-all text-left group"
                                  onClick={() => { setActiveMenu(null); alert("Task deletion protocol confirmed."); }}
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
                <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.4em]">No Tasks Distributed In Grid</p>
             </div>
           )}
        </div>
      </main>

      {/* Create Task Modal */}
      <AnimatePresence>
         {isCreateModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 50 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 50 }}
                 className="relative w-full max-w-2xl bg-card border border-card-border rounded-[4rem] p-12 lg:p-16 shadow-2xl"
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -z-10 rounded-full"></div>
                  
                  <div className="flex justify-between items-start mb-16">
                     <div className="space-y-4">
                        <h2 className="text-4xl font-black text-fg-primary uppercase tracking-tighter italic">Strategic <span className="text-blue-500 non-italic">Tasking</span></h2>
                        <p className="text-[9px] font-black text-fg-muted uppercase tracking-[0.4em] ml-1">New Assignment Protocol</p>
                     </div>
                     <button onClick={() => setIsCreateModalOpen(false)} className="p-4 bg-bg-muted rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg border border-border-base">
                        <X className="h-6 w-6" />
                     </button>
                  </div>

                  <form onSubmit={handleCreateTask} className="space-y-8">
                     <div className="grid grid-cols-2 gap-8">
                        <div className="col-span-2 space-y-3">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-2">Objective Title</label>
                           <input 
                              required
                              placeholder="e.g. Server Room Maintenance" 
                              value={newTask.title}
                              onChange={e => setNewTask(p => ({...p, title: e.target.value}))}
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-6 text-sm font-bold focus:border-blue-600 outline-none"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-2">Assign operative</label>
                           <select 
                              required
                              value={newTask.assignee}
                              onChange={e => setNewTask(p => ({...p, assignee: e.target.value}))}
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-6 text-sm font-bold focus:border-blue-600 outline-none cursor-pointer"
                           >
                              <option value="">Select Technician...</option>
                              {technicians.map(t => (
                                <option key={t._id} value={t._id}>{t.name} ({t.role})</option>
                              ))}
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-2">Priority Level</label>
                           <select 
                              value={newTask.priority}
                              onChange={e => setNewTask(p => ({...p, priority: e.target.value}))}
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-6 text-sm font-bold focus:border-blue-600 outline-none cursor-pointer"
                           >
                              <option value="low">Low Intensity</option>
                              <option value="medium">Standard Priority</option>
                              <option value="high">High Strategic Value</option>
                              <option value="urgent">Critical/Urgent</option>
                           </select>
                        </div>
                        <div className="col-span-2 space-y-3">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-2">Due Date</label>
                           <input 
                              type="date"
                              value={newTask.dueDate}
                              onChange={e => setNewTask(p => ({...p, dueDate: e.target.value}))}
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-6 text-sm font-bold focus:border-blue-600 outline-none"
                           />
                        </div>
                        <div className="col-span-2 space-y-3">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-2">Detailed Instructions</label>
                           <textarea 
                              required
                              placeholder="Outline the operational steps..." 
                              value={newTask.description}
                              onChange={e => setNewTask(p => ({...p, description: e.target.value}))}
                              className="w-full bg-bg-muted border border-border-base rounded-3xl p-6 text-sm font-medium focus:border-blue-600 outline-none h-40 resize-none"
                           />
                        </div>
                     </div>

                     <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
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
      </AnimatePresence>
    </div>
  );
};

export default AdminTasksPage;
