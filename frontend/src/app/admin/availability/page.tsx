"use client";
import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth } from '@/utils/api';
import { 
  Users, UserCheck, Activity, Calendar, 
  Filter, RefreshCw, Menu, MapPin, Star,
  Search, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  available: { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30',  label: 'Available'    },
  busy:      { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', label: 'In Job'       },
  booked:    { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/30',    label: 'Booked'       },
  on_leave:  { bg: 'bg-slate-500/10',  text: 'text-slate-400',  border: 'border-slate-500/30',  label: 'On Leave'     },
  // Backend / mobile app values
  'assigned':  { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', label: 'Assigned'     },
  'on leave':  { bg: 'bg-slate-500/10',  text: 'text-slate-400',  border: 'border-slate-500/30',  label: 'On Leave'     },
  'offline':   { bg: 'bg-slate-500/10',  text: 'text-slate-400',  border: 'border-slate-500/30',  label: 'Offline'      },
};

const getStatusStyle = (status: string) => {
  const s = (status || '').toLowerCase();
  return STATUS_STYLES[s] || STATUS_STYLES.available;
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Technician {
  _id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  zone: string;
  rating: number;
  status: string;
  availabilityStatus?: string;
  reason: string | null;
  todayJobCount: number;
}

interface Summary {
  total: number;
  availableNow: number;
  busyNow: number;
  onLeave: number;
}

// ─── Counter Card ─────────────────────────────────────────────────────────────
const CounterCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="glass-card p-5 md:p-6 rounded-[2rem] border border-border-base flex flex-col justify-between overflow-hidden relative group transition-all hover:-translate-y-1">
    <div className={`p-3 rounded-xl ${color}/10 w-fit mb-4 shrink-0`}>
      <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] md:text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1 truncate">{label}</p>
      <p className="text-3xl font-black text-fg-primary tabular-nums">{value}</p>
    </div>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const s = getStatusStyle(status);
  return (
    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminAvailabilityPage = () => {
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [technicians, setTechnicians]         = useState<Technician[]>([]);
  const [summary, setSummary]                 = useState<Summary>({ total: 0, availableNow: 0, busyNow: 0, onLeave: 0 });
  const [loading, setLoading]                 = useState(false);
  const [summaryLoading, setSummaryLoading]   = useState(true);

  // Filters
  const [skillFilter, setSkillFilter]         = useState('');
  const [areaFilter, setAreaFilter]           = useState('');
  const [searchQuery, setSearchQuery]         = useState('');

  // ── Load summary (live counts) ───────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await fetchWithAuth('/availability/summary');
      setSummary(data);
    } catch {
      // silently fail — counters stay at 0
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // ── Load live technicians ─────────────────────────────
  const loadTechnicians = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(skillFilter && { skill: skillFilter }),
        ...(areaFilter  && { area: areaFilter  }),
      });
      // By omitting date, startTime, and endTime, the backend defaults to live availability
      const data = await fetchWithAuth(`/availability/technicians?${params.toString()}`);
      setTechnicians(data);
    } catch {
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  }, [skillFilter, areaFilter]);

  useEffect(() => {
    loadSummary();
    const intervalId = setInterval(() => { loadSummary(); }, 300000);
    return () => clearInterval(intervalId);
  }, [loadSummary]);

  useEffect(() => {
    loadTechnicians();
    const intervalId = setInterval(() => { loadTechnicians(); }, 300000);
    return () => clearInterval(intervalId);
  }, [loadTechnicians]);

  // ── Filtered technicians ─────────────────────────────────────────────────
  const filtered = technicians.filter(t =>
    !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.zone || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const freeNow = filtered.filter(t => (t.availabilityStatus || t.status || '').toLowerCase() === 'available').length;

  return (
    <div className="flex min-h-screen bg-background transition-colors overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 min-w-0 lg:ml-80 p-6 md:p-12 space-y-12">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-bg-muted border border-border-base rounded-2xl">
              <Menu className="h-6 w-6 text-fg-primary" />
            </button>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Live Availability</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                Technician <span className="text-blue-500 italic">Availability</span>
              </h1>
              <p className="text-fg-muted text-lg font-medium">Real-time tracking of attendance and workload</p>
            </div>
          </div>
          <button 
            onClick={() => { loadTechnicians(); loadSummary(); }}
            className="flex items-center gap-3 px-8 py-4 bg-bg-muted border border-border-base rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </header>

        {/* ── Live Counter Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
          <CounterCard label="Total Technicians" value={summaryLoading ? '—' : summary.total}        icon={Users}       color="bg-blue-500"   />
          <CounterCard label="Available Now"     value={summaryLoading ? '—' : summary.availableNow} icon={UserCheck}   color="bg-green-500"  />
          <CounterCard label="Busy Now"           value={summaryLoading ? '—' : summary.busyNow}      icon={Activity}    color="bg-orange-500" />
          <CounterCard label="On Leave"           value={summaryLoading ? '—' : summary.onLeave}      icon={Calendar}    color="bg-slate-500"  />
          <CounterCard label="Free in View"       value={loading ? '—' : freeNow}                     icon={CheckCircle2} color="bg-cyan-500"  />
        </div>

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="glass-card p-8 rounded-[3rem] border border-border-base">
          <div className="flex items-center gap-3 mb-8">
            <Filter className="h-5 w-5 text-blue-500" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-fg-primary">Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Area */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Area / Zone</label>
              <input
                type="text"
                placeholder="e.g. Krishnagiri"
                value={areaFilter}
                onChange={e => setAreaFilter(e.target.value)}
                className="w-full bg-bg-muted border border-border-base rounded-2xl px-5 py-4 text-sm font-bold text-fg-primary placeholder:text-fg-dim outline-none focus:border-blue-600 transition-all"
              />
            </div>

            {/* Skill */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Skill</label>
              <select
                value={skillFilter}
                onChange={e => setSkillFilter(e.target.value)}
                className="w-full bg-bg-muted border border-border-base rounded-2xl px-5 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="" className="bg-bg-surface text-fg-primary">All Skills</option>
                {['CCTV', 'Biometric', 'Networking', 'Video Door Phone', 'UPS', 'Burglar Alarm'].map(s => (
                  <option key={s} value={s} className="bg-bg-surface text-fg-primary">{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-6">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
            <input
              type="text"
              placeholder="Search by name or zone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-bg-muted border border-border-base rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-fg-primary placeholder:text-fg-dim outline-none focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        {/* ── Technician Cards Grid ────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-fg-primary flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-blue-500" />
              Live Team Status
            </h3>
            <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-full uppercase tracking-widest">
              {filtered.length} found
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="glass-card p-8 rounded-[2.5rem] border border-border-base animate-pulse h-48" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-20 rounded-[3rem] border-dashed border-2 border-border-base text-center space-y-4">
              <Users className="h-16 w-16 text-fg-dim mx-auto" />
              <p className="font-black text-fg-primary uppercase tracking-tight">No technicians found</p>
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((tech) => {
                const currentStatus = tech.availabilityStatus || tech.status || 'Available';
                const s = getStatusStyle(currentStatus);
                const isAvail = currentStatus.toLowerCase() === 'available';
                return (
                  <motion.div
                    key={tech._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass-card p-8 rounded-[2.5rem] border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden ${s.border}`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white ${
                          isAvail ? 'bg-green-500' :
                          currentStatus.toLowerCase() === 'assigned' || currentStatus.toLowerCase() === 'busy' ? 'bg-orange-500' :
                          currentStatus.toLowerCase() === 'booked' ? 'bg-red-500' : 'bg-slate-500'
                        }`}>
                          {tech.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-sm text-fg-primary uppercase tracking-tight">{tech.name}</p>
                          <p className="text-[10px] font-bold text-fg-muted">{tech.phone || '—'}</p>
                        </div>
                      </div>
                      <StatusBadge status={currentStatus} />
                    </div>

                    {tech.reason && (
                      <div className="mb-4 px-4 py-2 bg-bg-muted rounded-xl border border-border-base">
                        <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest truncate">{tech.reason}</p>
                      </div>
                    )}

                    <div className="space-y-3 text-[10px] font-bold text-fg-muted">
                      {tech.zone && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span className="uppercase tracking-wider">{tech.zone}</span>
                        </div>
                      )}
                      {tech.skills.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {tech.skills.slice(0, 3).map(skill => (
                            <span key={skill} className="px-2 py-1 bg-blue-600/10 text-blue-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-blue-500/20">{skill}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-border-base">
                        <div className="flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-fg-primary font-black">{tech.rating}/5</span>
                        </div>
                        <span className="text-fg-muted">{tech.todayJobCount} job{tech.todayJobCount !== 1 ? 's' : ''} today</span>
                      </div>
                    </div>

                    {/* Live Mobile Sync Status Update Select */}
                    <div className="mt-4 pt-4 border-t border-border-base space-y-3">
                      <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                        <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest">Mobile App Sync</label>
                        <select 
                          value={currentStatus}
                          onChange={async (e) => {
                            e.stopPropagation();
                            const newStatus = e.target.value;
                            try {
                              await fetchWithAuth(`/availability/${tech._id}`, {
                                method: 'PUT',
                                body: JSON.stringify({ status: newStatus })
                              });
                              loadTechnicians();
                              loadSummary();
                            } catch (err: any) {
                              alert('Failed to update live status.');
                            }
                          }}
                          className="bg-bg-surface border border-border-base text-fg-primary rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-600 cursor-pointer"
                        >
                          <option value="Available">Available</option>
                          <option value="Assigned">Assigned</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Offline">Offline</option>
                        </select>
                      </div>

                      <div className="w-full py-3 bg-bg-muted border border-border-base text-fg-secondary text-center rounded-xl text-[9px] font-black uppercase tracking-widest">
                        Status computed via workload & attendance
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAvailabilityPage;
