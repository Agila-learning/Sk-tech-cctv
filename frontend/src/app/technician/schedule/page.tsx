"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Activity, Zap, CheckCircle2, 
         ChevronRight, AlertCircle, Star, Package, RefreshCw } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import BackButton from '@/components/common/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

// ─── Status config ────────────────────────────────────────────────────────────
const JOB_STATUSES = [
  { key: 'available',   label: 'Available',    color: 'bg-green-500',  ring: 'ring-green-500/30'  },
  { key: 'on_the_way',  label: 'On the Way',   color: 'bg-blue-500',   ring: 'ring-blue-500/30'   },
  { key: 'work_started',label: 'Work Started',  color: 'bg-orange-500', ring: 'ring-orange-500/30' },
  { key: 'completed',   label: 'Completed',    color: 'bg-emerald-500',ring: 'ring-emerald-500/30'},
];

const SLOT_STATUS_STYLE: Record<string, { dot: string; text: string; bg: string; border: string; label: string }> = {
  available:  { dot: 'bg-green-500',  text: 'text-green-400',   bg: 'bg-green-500/10',  border: 'border-green-500/20',  label: 'Available'   },
  booked:     { dot: 'bg-red-500',    text: 'text-red-400',     bg: 'bg-red-500/10',    border: 'border-red-500/20',    label: 'Booked'      },
  in_progress:{ dot: 'bg-orange-500', text: 'text-orange-400',  bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'In Progress' },
  on_leave:   { dot: 'bg-slate-500',  text: 'text-slate-400',   bg: 'bg-slate-500/10',  border: 'border-slate-500/20',  label: 'On Leave'    },
};

// ─── Live Status Update Buttons ───────────────────────────────────────────────
const LiveStatusBar = ({ workflowId, onSuccess }: { workflowId: string; onSuccess: () => void }) => {
  const [updating, setUpdating] = useState(false);
  const [current, setCurrent] = useState('available');

  const handleUpdate = async (status: string) => {
    setUpdating(true);
    try {
      await fetchWithAuth('/availability/live-status', {
        method: 'PATCH',
        body: JSON.stringify({ workflowId, status }),
      });
      setCurrent(status);
      onSuccess();
    } catch {
      // silent fail
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap mt-4">
      {JOB_STATUSES.map(s => (
        <button
          key={s.key}
          onClick={() => handleUpdate(s.key)}
          disabled={updating || current === s.key}
          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
            current === s.key
              ? `${s.color} text-white border-transparent shadow-lg`
              : 'bg-bg-muted text-fg-muted border-border-base hover:border-blue-500'
          } disabled:opacity-50`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const TechnicianSchedulePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'today' | 'upcoming'>('today');

  const loadSchedule = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/availability/schedule/${user._id}`);
      setSchedule(data);
    } catch (err) {
      console.error('Schedule load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  // Today date string
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-background text-fg-primary p-4 md:p-10 pb-32 transition-all duration-500">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-6">
            <BackButton />
            <div className="pt-2">
              <h1 className="text-5xl font-black uppercase tracking-tighter leading-none italic">
                My <span className="text-blue-500">Schedule</span>
              </h1>
              <p className="text-fg-muted font-black text-[10px] uppercase tracking-widest mt-2 px-1 border-l-2 border-blue-500">{todayLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* View toggle */}
            <div className="flex bg-bg-muted p-2 rounded-2xl border border-border-base">
              {(['today', 'upcoming'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === m ? 'bg-blue-600 text-white shadow-lg' : 'text-fg-muted hover:text-fg-primary'
                  }`}
                >
                  {m === 'today' ? "Today's Jobs" : "Upcoming"}
                </button>
              ))}
            </div>
            {/* Refresh */}
            <button
              onClick={loadSchedule}
              className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-blue-600 hover:text-white transition-all"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* ── Stats Summary ──────────────────────────────────────────── */}
        {!loading && schedule && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Today's Bookings", value: schedule.todaySlots?.length ?? 0, icon: CalendarIcon, color: 'text-blue-500' },
              { label: 'Upcoming Slots',   value: schedule.upcomingSlots?.length ?? 0, icon: Clock,        color: 'text-cyan-500' },
              { label: 'Jobs Completed',   value: schedule.completedJobs ?? 0,         icon: CheckCircle2, color: 'text-green-500' },
              { label: 'On Leave Days',    value: schedule.leaves?.length ?? 0,        icon: AlertCircle,  color: 'text-slate-400' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 rounded-[2rem] border border-border-base flex items-center gap-4">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-black text-fg-primary tabular-nums">{stat.value}</p>
                  <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="glass-card h-40 rounded-[2.5rem] border border-border-base animate-pulse" />)}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── Today's Bookings ─────────────────────────────────────── */}
            {viewMode === 'today' && (
              <motion.div key="today" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Today's Time Slots
                  </h3>
                  <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-full uppercase tracking-widest">
                    {schedule?.todaySlots?.length ?? 0} slots
                  </span>
                </div>

                {schedule?.todaySlots?.length > 0 ? (
                  <div className="space-y-6">
                    {schedule.todaySlots.map((slot: any, i: number) => {
                      const slotKey = slot.isBooked ? (slot.jobStatus === 'in_progress' ? 'in_progress' : 'booked') : 'available';
                      const ss = SLOT_STATUS_STYLE[slotKey] || SLOT_STATUS_STYLE.available;
                      return (
                        <motion.div
                          key={slot._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className={`glass-card p-8 rounded-[2.5rem] border ${ss.border} relative overflow-hidden`}
                        >
                          <div className="flex flex-col md:flex-row gap-6">
                            {/* Left: Time */}
                            <div className={`w-24 h-24 ${ss.bg} border ${ss.border} rounded-[2rem] flex flex-col items-center justify-center shrink-0`}>
                              <span className={`text-2xl font-black ${ss.text}`}>{slot.startTime}</span>
                              <span className="text-[9px] font-black text-fg-muted uppercase">to</span>
                              <span className={`text-sm font-black ${ss.text}`}>{slot.endTime}</span>
                            </div>

                            {/* Center: Details */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${ss.dot}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${ss.text}`}>{ss.label}</span>
                              </div>
                              {slot.order ? (
                                <>
                                  <h4 className="font-black text-lg text-fg-primary uppercase tracking-tight">
                                    Order #{slot.order._id?.toString().slice(-6).toUpperCase()}
                                  </h4>
                                  {slot.order.deliveryAddress && (
                                    <div className="flex items-start gap-2 text-xs text-fg-muted font-bold">
                                      <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                      <span className="max-w-xs">{slot.order.deliveryAddress}</span>
                                    </div>
                                  )}
                                  {slot.order.products?.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs text-fg-muted font-bold">
                                      <Package className="h-4 w-4 text-blue-500" />
                                      <span>{slot.order.products[0]?.product?.name || 'Security Component'}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm font-bold text-fg-muted italic">Open slot — no assignment yet</p>
                              )}

                              {/* Live Status Update Buttons */}
                              {slot.isBooked && slot.order && (
                                <div className="pt-3 border-t border-border-base">
                                  <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest mb-3">Update Live Status:</p>
                                  <LiveStatusBar workflowId={slot._id} onSuccess={loadSchedule} />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="glass-card p-16 rounded-[3rem] border-dashed border-2 border-border-base text-center space-y-4">
                    <CalendarIcon className="h-16 w-16 text-fg-dim mx-auto" />
                    <p className="font-black text-fg-primary uppercase tracking-tight">No bookings today</p>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">You're free! Enjoy the day.</p>
                  </div>
                )}

                {/* Leave dates */}
                {schedule?.leaves?.length > 0 && (
                  <div className="space-y-4 mt-8">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Approved Leave Dates</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {schedule.leaves.map((leave: any) => (
                        <div key={leave._id} className="p-5 bg-slate-500/10 border border-slate-500/20 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{leave.leaveType || 'Leave'}</p>
                          <p className="text-sm font-bold text-fg-primary">
                            {new Date(leave.startDate).toLocaleDateString('en-IN')} — {new Date(leave.endDate).toLocaleDateString('en-IN')}
                          </p>
                          <p className="text-xs text-fg-muted mt-1">{leave.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Upcoming Bookings ─────────────────────────────────────── */}
            {viewMode === 'upcoming' && (
              <motion.div key="upcoming" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                    <Zap className="h-5 w-5 text-blue-500" />
                    Upcoming Bookings (Next 30 Days)
                  </h3>
                  <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-full uppercase tracking-widest">
                    {schedule?.upcomingSlots?.length ?? 0} upcoming
                  </span>
                </div>

                {schedule?.upcomingSlots?.length > 0 ? (
                  <div className="space-y-4">
                    {schedule.upcomingSlots.map((slot: any, i: number) => (
                      <motion.div
                        key={slot._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="glass-card p-6 rounded-[2rem] border border-border-base flex items-center gap-6 hover:border-blue-500/30 transition-all"
                      >
                        {/* Date block */}
                        <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex flex-col items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                          <span className="text-xl font-black leading-none">{new Date(slot.date).getDate()}</span>
                          <span className="text-[9px] font-black uppercase opacity-80">{new Date(slot.date).toLocaleString('default', { month: 'short' })}</span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs font-black text-fg-primary">{slot.startTime} — {slot.endTime}</span>
                          </div>
                          {slot.order?.deliveryAddress && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                              <p className="text-xs text-fg-muted font-bold truncate max-w-xs">{slot.order.deliveryAddress}</p>
                            </div>
                          )}
                        </div>
                        <span className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0">Booked</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-16 rounded-[3rem] border-dashed border-2 border-border-base text-center space-y-4">
                    <Zap className="h-16 w-16 text-fg-dim mx-auto" />
                    <p className="font-black text-fg-primary uppercase tracking-tight">No upcoming bookings</p>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">New assignments will appear here.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default TechnicianSchedulePage;
