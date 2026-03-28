"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminSlotManager from '@/components/admin/AdminSlotManager';
import { Users, MapPin, Zap, Trash2, Plus, RefreshCw, Activity, Search, Filter, Shield, CheckCircle, Calendar, ChevronLeft, Menu } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { useRouter } from 'next/navigation';

const AdminTechniciansPage = () => {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSlotManager, setShowSlotManager] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const [editingTechnician, setEditingTechnician] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', address: '' });

  const loadTechnicians = async () => {
    try {
      const data = await fetchWithAuth('/admin/technicians/status');
      setTechnicians(data);
    } catch (error) {
      console.error("Load Technicians Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTechnicians();
    const interval = setInterval(loadTechnicians, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleAutoAssign = async () => {
    setIsAssigning(true);
    try {
      const result = await fetchWithAuth('/admin/auto-assign', { method: 'POST' });
      alert(result.message);
      loadTechnicians();
    } catch (error) {
      alert("Auto-assign failed");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this technician?")) return;
    try {
      await fetchWithAuth(`/admin/technicians/${id}`, { method: 'DELETE' });
      loadTechnicians();
    } catch (error) {
      alert("Deletion failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingTechnician ? `/admin/technicians/${editingTechnician._id}` : '/admin/technicians';
      const method = editingTechnician ? 'PATCH' : 'POST';
      
      await fetchWithAuth(endpoint, {
        method,
        body: JSON.stringify({
          ...formData,
          role: 'technician'
        })
      });
      setShowModal(false);
      setEditingTechnician(null);
      setFormData({ name: '', email: '', password: '', phone: '', address: '' });
      loadTechnicians();
      alert(editingTechnician ? "Technician updated successfully" : "Technician successfully added.");
    } catch (error: any) {
      alert(`Operation failed: ${error.message || "Connection Error"}`);
    }
  };

  const handleEdit = (tech: any) => {
    setEditingTechnician(tech);
    setFormData({
      name: tech.name,
      email: tech.email,
      password: '',
      phone: tech.phone || '',
      address: tech.address || ''
    });
    setShowModal(true);
  };

  if (loading && technicians.length === 0) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
       <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex transition-colors overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:ml-80 p-6 md:p-12 overflow-y-auto w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
           <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl hover:bg-blue-600/20 transition-all shadow-lg shadow-blue-500/5 group"
            >
              <Menu className="h-6 w-6 text-fg-primary group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => router.push('/admin')}
              className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-bg-surface transition-all group"
              title="Back to Command Center"
            >
              <ChevronLeft className="h-6 w-6 text-fg-primary group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-3">
               <h1 className="text-4xl md:text-5xl font-black text-fg-primary tracking-tighter uppercase leading-none italic">Service <span className="text-blue-500 non-italic">Team</span></h1>
               <p className="text-fg-muted text-lg font-medium">Manage and track your field service team in real-time.</p>
            </div>
          </div>
          <div className="flex space-x-4 w-full md:w-auto">
            <button 
              onClick={handleAutoAssign}
              disabled={isAssigning}
              className="flex-1 md:flex-none px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isAssigning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isAssigning ? 'Processing' : 'Auto-Assign'}</span>
              <span className="sm:hidden">{isAssigning ? '...' : 'Assign'}</span>
            </button>
            <button 
              onClick={() => { setEditingTechnician(null); setFormData({ name: '', email: '', password: '', phone: '', address: '' }); setShowModal(true); }}
              className="flex-1 md:flex-none px-6 py-4 bg-bg-muted border border-border-base text-fg-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-bg-surface transition-all flex items-center justify-center space-x-2"
            >
               <Plus className="h-4 w-4" />
               <span>Add Tech</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
           {[
             { label: 'Active Technicians', value: technicians.filter(t => t.isOnline).length, icon: Activity },
             { label: 'On Job', value: technicians.filter(t => t.status === 'On Job' || t.status === 'Accepted').length, icon: Zap },
             { label: 'Available', value: technicians.filter(t => t.status === 'Available').length, icon: Shield },
             { label: 'Performance Score', value: '4.85', icon: CheckCircle },
           ].map((stat, i) => (
             <div key={i} className="glass-card p-8 rounded-3xl border border-border-base relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <stat.icon className="h-10 w-10 text-fg-primary" />
                </div>
                <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                <h3 className={`text-4xl font-black text-fg-primary tracking-tighter`}>{stat.value}</h3>
             </div>
           ))}
        </div>

        <div className="glass-card rounded-[3rem] border border-border-base overflow-hidden min-h-[600px] flex flex-col mb-12">
           <div className="p-8 border-b border-border-base flex flex-col md:flex-row justify-between items-center gap-6 bg-bg-surface/50">
              <div className="flex items-center space-x-8">
                 <h3 className="text-fg-primary font-black uppercase tracking-widest text-sm">Service Team</h3>
                 <div className="flex bg-bg-muted rounded-2xl p-1.5 border border-border-base">
                    <button 
                      onClick={() => setViewMode('table')}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-fg-muted hover:text-fg-primary'}`}
                    >
                      Table View
                    </button>
                    <button 
                      onClick={() => setViewMode('map')}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-fg-muted hover:text-fg-primary'}`}
                    >
                      Map View
                    </button>
                 </div>
              </div>
              <div className="flex items-center space-x-4 w-full md:w-auto">
                 <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
                    <input type="text" placeholder="Search technician name or ID..." className="w-full bg-bg-surface border border-border-base rounded-2xl pl-12 pr-4 py-4 text-xs font-bold text-fg-primary outline-none focus:border-blue-600" />
                 </div>
              </div>
           </div>

           <div className="flex-1 relative">
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-bg-muted/30">
                          <th className="px-10 py-8 text-[10px] font-black text-fg-muted uppercase tracking-widest">Technician Profile</th>
                          <th className="px-10 py-8 text-[10px] font-black text-fg-muted uppercase tracking-widest">Status</th>
                          <th className="px-10 py-8 text-[10px] font-black text-fg-muted uppercase tracking-widest">Service Area</th>
                          <th className="px-10 py-8 text-[10px] font-black text-fg-muted uppercase tracking-widest">Jobs Completed</th>
                          <th className="px-10 py-8 text-[10px] font-black text-fg-muted uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-base">
                        {technicians.map((tech: any) => (
                          <tr key={tech._id} className="hover:bg-bg-muted/30 transition-colors group">
                            <td className="px-10 py-8">
                                <div className="flex items-center space-x-5">
                                  <div className="w-12 h-12 bg-bg-muted border border-border-base rounded-2xl flex items-center justify-center text-sm font-black text-fg-primary group-hover:border-blue-500/30 transition-all">
                                      {tech.name?.split(' ').map((n: string)=>n[0]).join('') || '??'}
                                  </div>
                                  <div>
                                      <p className="text-base font-black text-fg-primary">{tech.name}</p>
                                      <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">ID: {tech._id.toString().slice(-6)}</p>
                                  </div>
                                </div>
                            </td>
                            <td className="px-10 py-8">
                                <div className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${tech.isOnline ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-bg-muted text-fg-muted border-border-base'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full mr-2 ${tech.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-fg-dim'}`}></div>
                                  {tech.status}
                                </div>
                            </td>
                            <td className="px-10 py-8">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-blue-500/5 rounded-lg">
                                     <MapPin className="h-3.5 w-3.5 text-blue-500" />
                                  </div>
                                  <span className="text-xs font-bold text-fg-muted">{tech.address || 'Field Technician'}</span>
                                </div>
                            </td>
                            <td className="px-10 py-8">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center text-[9px] font-black text-fg-muted">
                                      <span className="uppercase italic">{tech.completedOrdersCount || 0} JOBS</span>
                                      <span className="text-blue-500">98.2%</span>
                                  </div>
                                  <div className="h-1.5 w-36 bg-bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: `95%` }}></div>
                                  </div>
                                </div>
                            </td>
                            <td className="px-10 py-8 text-right">
                              <div className="flex items-center justify-end space-x-3 text-fg-muted">
                                <button 
                                  onClick={() => handleEdit(tech)}
                                  title="Edit Profile"
                                  className="p-3 bg-bg-muted border border-border-base rounded-xl hover:border-blue-500/50 hover:bg-bg-surface transition-all group/btn"
                                >
                                    <Zap className="h-4 w-4 group-hover/btn:text-blue-500" />
                                </button>
                                <button 
                                  onClick={() => { setEditingTechnician(tech); setShowSlotManager(true); }}
                                  title="Manage Availability"
                                  className="p-3 bg-bg-muted border border-border-base rounded-xl hover:border-purple-500/50 hover:bg-bg-surface transition-all group/btn"
                                >
                                    <Calendar className="h-4 w-4 group-hover/btn:text-purple-500" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(tech._id)}
                                  title="Remove Protocol"
                                  className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl hover:border-red-500/50 hover:bg-red-500/10 transition-all text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="absolute inset-0 bg-background overflow-hidden flex flex-col items-center justify-center p-6">
                   <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-border-base shadow-2xl relative">
                      <iframe 
                         title="Service Map"
                         width="100%" 
                         height="100%" 
                         style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(1.2) contrast(1.1)' }} 
                         loading="lazy" 
                         allowFullScreen 
                         src={`https://www.openstreetmap.org/export/embed.html?bbox=80.1%2C12.9%2C80.3%2C13.1&layer=mapnik&marker=13.045%2C80.22`}
                      ></iframe>
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-md px-8 py-4 rounded-3xl border border-border-base shadow-2xl flex items-center space-x-4">
                         <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,1)]"></div>
                         <span className="text-xs font-black uppercase tracking-widest text-fg-primary">Live GPS Tracking Active</span>
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      </main>

      {/* Availability Manager */}
      {showSlotManager && editingTechnician && (
        <AdminSlotManager 
          technician={editingTechnician} 
          onClose={() => { setShowSlotManager(false); setEditingTechnician(null); }} 
        />
      )}

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
          <div className="glass-card w-full max-w-lg rounded-[2.5rem] md:rounded-[3.5rem] border border-border-base p-8 md:p-12 animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tighter">{editingTechnician ? 'Edit' : 'Add'} <span className="text-blue-500 italic">Technician</span></h3>
                <button onClick={() => setShowModal(false)} className="text-fg-muted hover:text-fg-primary transition-colors p-2"><Plus className="rotate-45 h-6 w-6" /></button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-6">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  required
                  className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all font-manrope"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  required
                  className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all font-manrope"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
                <input 
                  type="password" 
                  placeholder="Account Password" 
                  required={!editingTechnician}
                  className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all font-manrope"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Contact Number" 
                  className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all font-manrope"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
                <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.4em] transition-all shadow-xl shadow-blue-600/30">
                  {editingTechnician ? 'Save Changes' : 'Add Technician'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTechniciansPage;
