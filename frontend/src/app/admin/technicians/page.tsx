"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminSlotManager from '@/components/admin/AdminSlotManager';
import {
  Users, MapPin, Zap, Trash2, Plus, RefreshCw, Activity,
  Search, Shield, CheckCircle, Calendar, ChevronLeft, Menu,
  Star, Wifi, WifiOff, X,
} from 'lucide-react';
import { fetchWithAuth, getImageUrl } from '@/utils/api';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/admin/AdminNavbar';

/* ── Status Badge ── */
const TechBadge = ({ status, isOnline }: { status: string; isOnline?: boolean }) => {
  const s = (status || '').toLowerCase();
  const isAvailable = s === 'available';
  const isOnJob = ['on job', 'accepted', 'assigned', 'working'].includes(s);
  if (isAvailable) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-600 border border-green-200/60">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
      </span>
      Available
    </span>
  );
  if (isOnJob) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-600 border border-orange-200/60">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
      On Job
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-500/10 text-slate-500 border border-slate-200/40">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      {status || 'Offline'}
    </span>
  );
};

/* ── Stat Card ── */
const StatCard = ({ label, value, icon: Icon, gradient, glow }: any) => (
  <div className={`stat-card ${glow} group`}>
    <div className="flex items-start justify-between mb-5">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
    <h3 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tighter mb-1 group-hover:translate-x-0.5 transition-transform">
      {value}
    </h3>
    <p className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.18em]">{label}</p>
  </div>
);

/* ── Main Page ── */
const AdminTechniciansPage = () => {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSlotManager, setShowSlotManager] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const router = useRouter();

  const loadTechnicians = async () => {
    try {
      const data = await fetchWithAuth('/admin/technicians');
      setTechnicians(data || []);
      setFiltered(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadTechnicians();
    const iv = setInterval(loadTechnicians, 30000);
    return () => clearInterval(iv);
  }, []);

  // Filter logic
  useEffect(() => {
    let list = [...technicians];
    if (search) list = list.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()) || t._id?.includes(search));
    if (statusFilter !== 'all') list = list.filter(t => {
      const s = (t.status || '').toLowerCase();
      if (statusFilter === 'available') return s === 'available';
      if (statusFilter === 'busy') return ['on job', 'accepted', 'assigned', 'working'].includes(s);
      if (statusFilter === 'offline') return !['available', 'on job', 'accepted', 'assigned', 'working'].includes(s);
      return true;
    });
    setFiltered(list);
  }, [search, statusFilter, technicians]);

  const handleAutoAssign = async () => {
    setIsAssigning(true);
    try {
      const r = await fetchWithAuth('/admin/auto-assign', { method: 'POST' });
      alert(r.message);
      loadTechnicians();
    } catch { alert('Auto-assign failed'); }
    finally { setIsAssigning(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this technician?')) return;
    try { await fetchWithAuth(`/admin/technicians/${id}`, { method: 'DELETE' }); loadTechnicians(); }
    catch { alert('Deletion failed'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ep = editingTechnician ? `/admin/technicians/${editingTechnician._id}` : '/admin/technicians';
      await fetchWithAuth(ep, { method: editingTechnician ? 'PATCH' : 'POST', body: JSON.stringify({ ...formData, role: 'technician' }) });
      setShowModal(false); setEditingTechnician(null);
      setFormData({ name: '', email: '', password: '', phone: '', address: '' });
      loadTechnicians();
      alert(editingTechnician ? 'Technician updated' : 'Technician added');
    } catch (e: any) { alert(`Failed: ${e.message}`); }
  };

  const handleEdit = (tech: any) => {
    setEditingTechnician(tech);
    setFormData({ name: tech.name, email: tech.email, password: '', phone: tech.phone || '', address: tech.address || '' });
    setShowModal(true);
  };

  const activeCnt = technicians.filter(t => ['active', 'available', 'assigned', 'on-duty', 'working'].includes((t.status || '').toLowerCase())).length;
  const onJobCnt = technicians.filter(t => ['on job', 'accepted', 'assigned', 'working'].includes((t.status || '').toLowerCase())).length;
  const availCnt = technicians.filter(t => (t.status || '').toLowerCase() === 'available').length;
  const avgRating = (technicians.reduce((a, t) => a + (t.rating || 5), 0) / (technicians.length || 1)).toFixed(2);

  if (loading && technicians.length === 0) return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center animate-pulse shadow-xl">
          <Users className="h-7 w-7 text-white" />
        </div>
        <p className="text-[10px] font-black text-[#475569] uppercase tracking-[0.3em] animate-pulse">Loading Team…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen mesh-bg flex overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 lg:ml-80 flex flex-col min-h-screen animate-fade-in">
        <AdminNavbar />

        <div className="p-6 md:p-10 space-y-10">

          {/* ── Header ── */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-3 glass-card rounded-2xl border border-[#1E3A8A]/15 hover:border-[#1E3A8A]/30 transition-all group">
                <Menu className="h-5 w-5 text-[#1E3A8A] group-hover:scale-110 transition-transform" />
              </button>
              <button onClick={() => router.push('/admin')}
                className="p-3 glass-card rounded-2xl border border-[#1E3A8A]/15 hover:border-[#1E3A8A]/30 hover:shadow-lg hover:shadow-[#1E3A8A]/10 hover:scale-105 transition-all group btn-glass">
                <ChevronLeft className="h-5 w-5 text-[#1E3A8A] group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  <span className="gradient-text">Service</span>
                  <span className="text-[#0f172a] dark:text-white"> Team</span>
                </h1>
                <p className="text-[#64748b] text-xs font-semibold uppercase tracking-[0.2em] mt-1">Technician Performance & Status</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button onClick={handleAutoAssign} disabled={isAssigning}
                className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl btn-primary font-black text-[10px] uppercase tracking-widest disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${isAssigning ? 'animate-spin' : ''}`} />
                {isAssigning ? 'Processing…' : 'Auto-Assign'}
              </button>
              <button
                onClick={() => { setEditingTechnician(null); setFormData({ name: '', email: '', password: '', phone: '', address: '' }); setShowModal(true); }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl border-2 border-[#1E3A8A] text-[#1E3A8A] dark:text-blue-400 bg-transparent hover:bg-[#1E3A8A] hover:text-white dark:hover:bg-[#1E3A8A] font-black text-[10px] uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-[#1E3A8A]/25 group"
              >
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                Add Tech
              </button>
            </div>
          </header>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard label="Active Technicians" value={activeCnt} icon={Activity}
              gradient="from-[#1E3A8A] to-blue-600" glow="glow-blue" />
            <StatCard label="On Job" value={onJobCnt} icon={Zap}
              gradient="from-[#7C3AED] to-purple-700" glow="glow-purple" />
            <StatCard label="Available" value={availCnt} icon={Shield}
              gradient="from-[#22C55E] to-emerald-700" glow="glow-green" />
            <StatCard label="Avg Performance" value={avgRating} icon={Star}
              gradient="from-amber-400 to-orange-500" glow="glow-gold" />
          </div>

          {/* ── Team Table ── */}
          <div className="glass-card rounded-3xl border border-[#1E3A8A]/10 overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-5 border-b border-[#1E3A8A]/06 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 dark:bg-slate-900/40">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-widest">Team Directory</h3>
                {/* View Toggle */}
                <div className="flex bg-[#E2E8F0]/80 dark:bg-slate-800/80 rounded-xl p-1 border border-[#1E3A8A]/08">
                  {(['table', 'map'] as const).map(m => (
                    <button key={m} onClick={() => setViewMode(m)}
                      className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === m ? 'toggle-active' : 'toggle-inactive'}`}>
                      {m === 'table' ? 'Table' : 'Map'} View
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search name or ID…"
                    className="w-full bg-white/80 dark:bg-slate-800/80 border border-[#1E3A8A]/12 rounded-2xl pl-11 pr-4 py-3 text-xs font-medium text-[#0f172a] dark:text-white placeholder:text-[#94a3b8] outline-none focus:border-[#1E3A8A]/40 focus:shadow-sm transition-all"
                  />
                </div>
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-4 py-3 bg-white/80 dark:bg-slate-800/80 border border-[#1E3A8A]/12 rounded-2xl text-xs font-bold text-[#0f172a] dark:text-white outline-none focus:border-[#1E3A8A]/40 transition-all cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="busy">On Job</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex-1">
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead>
                      <tr className="border-b border-[#1E3A8A]/06">
                        {['Technician', 'Status', 'Service Area', 'Jobs Done', 'Rating', 'Actions'].map(h => (
                          <th key={h} className="px-6 py-4 text-[9px] font-black text-[#64748b] uppercase tracking-[0.2em]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E3A8A]/04">
                      {filtered.map((tech: any) => (
                        <tr key={tech._id} className="hover:bg-[#1E3A8A]/03 dark:hover:bg-white/02 transition-colors group">
                          {/* Profile */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-xl bg-[#E2E8F0] dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-[#1E3A8A]/10 group-hover:border-[#1E3A8A]/25 transition-all">
                                {tech.profilePic
                                  ? <img src={getImageUrl(tech.profilePic)} className="w-full h-full object-cover" />
                                  : <span className="flex items-center justify-center h-full font-black text-sm text-[#475569]">
                                      {tech.name?.split(' ').map((n: string) => n[0]).join('') || '??'}
                                    </span>}
                                {/* Online dot */}
                                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-700 ${tech.isOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#0f172a] dark:text-white">{tech.name}</p>
                                <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest">ID: {tech._id?.toString().slice(-6)}</p>
                              </div>
                            </div>
                          </td>
                          {/* Status */}
                          <td className="px-6 py-4"><TechBadge status={tech.status} isOnline={tech.isOnline} /></td>
                          {/* Area */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-[#1E3A8A]/60 flex-shrink-0" />
                              <span className="text-xs font-medium text-[#475569] truncate max-w-[140px]">{tech.address || 'Field Technician'}</span>
                            </div>
                          </td>
                          {/* Jobs */}
                          <td className="px-6 py-4">
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[9px] font-black text-[#64748b]">
                                <span className="uppercase">{tech.completedOrdersCount || 0} jobs</span>
                                <span className="text-[#1E3A8A]">98%</span>
                              </div>
                              <div className="h-1.5 w-32 bg-[#E2E8F0] dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] rounded-full" style={{ width: '95%' }} />
                              </div>
                            </div>
                          </td>
                          {/* Rating */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                              <span className="text-sm font-black text-[#0f172a] dark:text-white tabular-nums">{tech.rating || '5.0'}</span>
                            </div>
                          </td>
                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => router.push('/admin/tracking')} title="Track"
                                className="p-2.5 rounded-xl bg-[#1E3A8A]/08 border border-[#1E3A8A]/15 hover:bg-[#1E3A8A]/15 hover:border-[#1E3A8A]/30 transition-all">
                                <MapPin className="h-3.5 w-3.5 text-[#1E3A8A]" />
                              </button>
                              <button onClick={() => handleEdit(tech)} title="Edit"
                                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:border-[#1E3A8A]/30 hover:bg-[#1E3A8A]/08 transition-all">
                                <Zap className="h-3.5 w-3.5 text-[#475569] hover:text-[#1E3A8A]" />
                              </button>
                              <button onClick={() => { setEditingTechnician(tech); setShowSlotManager(true); }} title="Slots"
                                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:border-purple-500/30 hover:bg-purple-500/08 transition-all">
                                <Calendar className="h-3.5 w-3.5 text-[#475569] hover:text-purple-500" />
                              </button>
                              <button onClick={() => handleDelete(tech._id)} title="Delete"
                                className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr><td colSpan={6} className="py-20 text-center text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.3em]">
                          {search || statusFilter !== 'all' ? 'No results for your filter' : 'No technicians found'}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 space-y-6">
                  <div className="w-20 h-20 rounded-3xl bg-[#1E3A8A]/10 dark:bg-[#1E3A8A]/20 flex items-center justify-center">
                    <MapPin className="h-9 w-9 text-[#1E3A8A] animate-bounce" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-[#0f172a] dark:text-white tracking-tight">Live <span className="gradient-text">Telemetry</span></h3>
                    <p className="text-[#64748b] text-sm max-w-sm">Access GPS tracking to monitor all active units in real time.</p>
                  </div>
                  <button onClick={() => router.push('/admin/tracking')}
                    className="flex items-center gap-2.5 px-8 py-4 btn-primary rounded-2xl font-black text-xs uppercase tracking-[0.25em]">
                    <Activity className="h-4 w-4" />
                    Launch Live Map
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Slot Manager ── */}
      {showSlotManager && editingTechnician && (
        <AdminSlotManager
          technician={editingTechnician}
          onClose={() => { setShowSlotManager(false); setEditingTechnician(null); }}
        />
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="glass-card w-full max-w-md rounded-3xl border border-[#1E3A8A]/15 p-8 animate-slide-up overflow-y-auto max-h-[90vh] shadow-2xl shadow-[#1E3A8A]/15">
            <div className="flex justify-between items-center mb-7">
              <div>
                <h3 className="text-xl font-black text-[#0f172a] dark:text-white tracking-tight">
                  {editingTechnician ? 'Edit' : 'Add'} <span className="gradient-text">Technician</span>
                </h3>
                <p className="text-[10px] text-[#64748b] uppercase tracking-widest mt-0.5">
                  {editingTechnician ? 'Update technician details' : 'Register a new technician'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-[#64748b] hover:text-red-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { placeholder: 'Full Name', type: 'text', key: 'name', required: true },
                { placeholder: 'Email Address', type: 'email', key: 'email', required: true },
                { placeholder: 'Account Password', type: 'password', key: 'password', required: !editingTechnician },
                { placeholder: 'Contact Number', type: 'text', key: 'phone' },
                { placeholder: 'Service Area / Address', type: 'text', key: 'address' },
              ].map(f => (
                <input
                  key={f.key}
                  type={f.type}
                  placeholder={f.placeholder}
                  required={f.required}
                  className="w-full bg-white/80 dark:bg-slate-800/80 border border-[#1E3A8A]/12 rounded-2xl px-5 py-3.5 text-sm font-medium text-[#0f172a] dark:text-white placeholder:text-[#94a3b8] outline-none focus:border-[#1E3A8A]/40 focus:shadow-sm transition-all"
                  value={(formData as any)[f.key]}
                  onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                />
              ))}
              <button type="submit"
                className="w-full py-4 rounded-2xl btn-primary font-black text-sm uppercase tracking-[0.3em] mt-2">
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
