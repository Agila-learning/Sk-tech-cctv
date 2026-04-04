"use client";
import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth } from '@/utils/api';
import { 
  Users, UserCheck, UserX, Clock, AlertTriangle, Calendar, 
  Filter, RefreshCw, Menu, MapPin, Star, Zap, CheckCircle2,
  ChevronDown, X, Search, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  { label: '9:00 AM – 11:00 AM', start: '09:00', end: '11:00' },
  { label: '11:00 AM – 1:00 PM', start: '11:00', end: '13:00' },
  { label: '1:00 PM – 3:00 PM',  start: '13:00', end: '15:00' },
  { label: '3:00 PM – 5:00 PM',  start: '15:00', end: '17:00' },
  { label: '5:00 PM – 7:00 PM',  start: '17:00', end: '19:00' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  available: { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30',  label: 'Available'    },
  busy:      { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', label: 'In Job'       },
  booked:    { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/30',    label: 'Booked'       },
  on_leave:  { bg: 'bg-slate-500/10',  text: 'text-slate-400',  border: 'border-slate-500/30',  label: 'On Leave'     },
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
  status: 'available' | 'busy' | 'booked' | 'on_leave';
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
  <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-border-base flex items-center gap-4 md:gap-6 overflow-hidden">
    <div className={`p-3 md:p-4 rounded-2xl ${color}/10 shrink-0`}>
      <Icon className={`h-5 w-5 md:h-6 md:w-6 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] md:text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1 truncate">{label}</p>
      <p className="text-2xl md:text-3xl font-black text-fg-primary tabular-nums">{value}</p>
    </div>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.available;
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
  const [selectedDate, setSelectedDate]       = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot]       = useState(TIME_SLOTS[0]);
  const [skillFilter, setSkillFilter]         = useState('');
  const [areaFilter, setAreaFilter]           = useState('');
  const [searchQuery, setSearchQuery]         = useState('');

  // Assignment popup
  const [assignTarget, setAssignTarget]       = useState<any>(null);
  const [assignOrderId, setAssignOrderId]     = useState('');
  const [assigning, setAssigning]             = useState(false);
  const [assignMessage, setAssignMessage]     = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Load summary (live counts) ───────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await fetchWithAuth('/slots/summary');
      setSummary(data);
    } catch {
      // silently fail — counters stay at 0
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // ── Load technicians for selected date + slot ─────────────────────────────
  const loadTechnicians = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        ...(skillFilter && { skill: skillFilter }),
        ...(areaFilter  && { area: areaFilter  }),
      });
      const data = await fetchWithAuth(`/slots/availability?${params.toString()}`);
      setTechnicians(data);
    } catch {
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedSlot, skillFilter, areaFilter]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadTechnicians(); }, [loadTechnicians]);

  // ── Assign technician ────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!assignOrderId.trim()) { setAssignMessage({ type: 'error', text: 'Please enter a valid Order ID.' }); return; }
    // Removed strict availability check to allow Force Assignment as requested
    setAssignMessage(null);
    setAssigning(true);
    try {
      await fetchWithAuth('/availability/assign', {
        method: 'POST',
        body: JSON.stringify({
          orderId:      assignOrderId,
          technicianId: assignTarget._id,
          date:         selectedDate,
          startTime:    selectedSlot.start,
          endTime:      selectedSlot.end,
        }),
      });
      setAssignMessage({ type: 'success', text: `✅ ${assignTarget.name} assigned successfully! Slot is now blocked.` });
      setTimeout(() => { setAssignTarget(null); setAssignMessage(null); setAssignOrderId(''); loadTechnicians(); loadSummary(); }, 2000);
    } catch (err: any) {
      setAssignMessage({ type: 'error', text: err.message || 'Assignment failed.' });
    } finally {
      setAssigning(false);
    }
  };

  // ── Filtered technicians ─────────────────────────────────────────────────
  const filtered = technicians.filter(t =>
    !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.zone || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const freeForSlot = filtered.filter(t => t.status === 'available').length;

  return (
    <div className="flex min-h-screen bg-background transition-colors overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 lg:ml-80 p-6 md:p-12 space-y-12">
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
              <p className="text-fg-muted text-lg font-medium">Real-time slot tracking and smart assignment</p>
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <CounterCard label="Total Technicians" value={summaryLoading ? '—' : summary.total}        icon={Users}       color="bg-blue-500"   />
          <CounterCard label="Available Now"     value={summaryLoading ? '—' : summary.availableNow} icon={UserCheck}   color="bg-green-500"  />
          <CounterCard label="Busy Now"           value={summaryLoading ? '—' : summary.busyNow}      icon={Activity}    color="bg-orange-500" />
          <CounterCard label="On Leave"           value={summaryLoading ? '—' : summary.onLeave}      icon={Calendar}    color="bg-slate-500"  />
          <CounterCard label="Free for Slot"      value={loading ? '—' : freeForSlot}                 icon={CheckCircle2} color="bg-cyan-500"  />
        </div>

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="glass-card p-8 rounded-[3rem] border border-border-base">
          <div className="flex items-center gap-3 mb-8">
            <Filter className="h-5 w-5 text-blue-500" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-fg-primary">Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full bg-bg-muted border border-border-base rounded-2xl px-5 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
              />
            </div>

            {/* Time Slot */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Time Slot</label>
              <select
                value={selectedSlot.label}
                onChange={e => setSelectedSlot(TIME_SLOTS.find(s => s.label === e.target.value) || TIME_SLOTS[0])}
                className="w-full bg-bg-muted border border-border-base rounded-2xl px-5 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer"
              >
                {TIME_SLOTS.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
              </select>
            </div>

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
              Technicians — {selectedSlot.label}
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
                const s = STATUS_STYLES[tech.status] || STATUS_STYLES.available;
                return (
                  <motion.div
                    key={tech._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass-card p-8 rounded-[2.5rem] border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer overflow-hidden ${s.border}`}
                    onClick={() => setAssignTarget(tech)}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white ${
                          tech.status === 'available' ? 'bg-green-500' :
                          tech.status === 'busy'     ? 'bg-orange-500' :
                          tech.status === 'booked'   ? 'bg-red-500' : 'bg-slate-500'
                        }`}>
                          {tech.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-sm text-fg-primary uppercase tracking-tight">{tech.name}</p>
                          <p className="text-[10px] font-bold text-fg-muted">{tech.phone || '—'}</p>
                        </div>
                      </div>
                      <StatusBadge status={tech.status} />
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

                    {tech.status === 'available' ? (
                      <div className="mt-4 pt-4 border-t border-border-base">
                        <button className="w-full py-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all">
                          Click to Assign
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-border-base">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setAssignTarget(tech); }}
                          className="w-full py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                        >
                          Force Slot Assignment
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Slot-Wise Availability Table ─────────────────────────────── */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-fg-primary mb-8 flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-500" />
            Slot-Wise Overview — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>

          <div className="glass-card rounded-[2.5rem] border border-border-base overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-bg-muted/50 border-b border-border-base">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-widest">Technician</th>
                  {TIME_SLOTS.map(slot => (
                    <th key={slot.label} className={`px-6 py-6 text-center text-[9px] font-black uppercase tracking-widest ${
                      slot.label === selectedSlot.label ? 'text-blue-500 bg-blue-600/5' : 'text-fg-muted'
                    }`}>
                      {slot.label.split('–')[0].trim()}<br />
                      <span className="text-[8px] opacity-70">— {slot.label.split('–')[1]?.trim()}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {filtered.slice(0, 10).map(tech => (
                  <tr key={tech._id} className="hover:bg-bg-muted/20 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 font-black text-xs">
                          {tech.name.slice(0, 1)}
                        </div>
                        <span className="text-sm font-bold text-fg-primary">{tech.name}</span>
                      </div>
                    </td>
                    {TIME_SLOTS.map(slot => {
                      // For the selected slot, use real data; for others, show available as placeholder
                      const isSelectedSlot = slot.label === selectedSlot.label;
                      const cellStatus = isSelectedSlot ? tech.status : 'available';
                      const cs = STATUS_STYLES[cellStatus];
                      return (
                        <td key={slot.label} className={`px-6 py-5 text-center ${isSelectedSlot ? 'bg-blue-600/5' : ''}`}>
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider ${cs.bg} ${cs.text}`}>
                            {cs.label}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={TIME_SLOTS.length + 1} className="py-20 text-center text-fg-muted font-black text-xs uppercase tracking-widest opacity-40">
                      No technicians to display
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── Assignment Popup ───────────────────────────────────────────── */}
      <AnimatePresence>
        {assignTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-card-border rounded-[3rem] p-12 shadow-2xl"
            >
              <button
                onClick={() => { setAssignTarget(null); setAssignMessage(null); setAssignOrderId(''); }}
                className="absolute top-6 right-6 p-3 bg-bg-muted rounded-2xl hover:bg-red-500 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Assign Technician</p>
                  <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tight">{assignTarget.name}</h3>
                </div>

                {/* Status display */}
                <div className={`p-5 rounded-2xl border ${
                  assignTarget.status === 'available'
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center gap-3">
                    {assignTarget.status === 'available'
                      ? <CheckCircle2 className="h-5 w-5 text-green-400" />
                      : <AlertTriangle className="h-5 w-5 text-red-400" />
                    }
                    <div>
                      <p className={`text-xs font-black uppercase tracking-widest ${assignTarget.status === 'available' ? 'text-green-400' : 'text-red-400'}`}>
                        {assignTarget.status === 'available' ? 'Available for this slot' : 'Not available for this slot'}
                      </p>
                      {assignTarget.reason && (
                        <p className="text-[10px] text-fg-muted mt-1">{assignTarget.reason}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Slot info */}
                <div className="p-5 bg-bg-muted rounded-2xl border border-border-base space-y-2">
                  <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest">Selected Slot</p>
                  <p className="text-sm font-bold text-fg-primary">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-sm font-black text-blue-500">{selectedSlot.label}</p>
                </div>

                {/* Order ID input */}
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Order ID to Assign</label>
                  <input
                    type="text"
                    placeholder="Enter Order ID..."
                    value={assignOrderId}
                    onChange={e => setAssignOrderId(e.target.value)}
                    className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary placeholder:text-fg-dim outline-none focus:border-blue-600 transition-all"
                  />
                </div>

                {/* Message */}
                {assignMessage && (
                  <div className={`p-4 rounded-2xl text-sm font-bold border ${
                    assignMessage.type === 'success'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {assignMessage.text}
                  </div>
                )}

                <button
                  onClick={handleAssign}
                  disabled={assigning}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {assigning
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /><span>Assigning...</span></>
                    : <><Zap className="h-4 w-4" /><span>Confirm Assignment</span></>
                  }
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAvailabilityPage;
