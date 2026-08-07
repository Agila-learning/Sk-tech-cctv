"use client";
import React, { useState, useEffect } from 'react';

import { fetchWithAuth } from '@/utils/api';
import { motion } from 'framer-motion';
import { MapPin, Clock, LogIn, LogOut, CheckCircle, AlertTriangle, Calendar, Activity, Menu } from 'lucide-react';

const TechnicianAttendance = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [locationError, setLocationError] = useState('');

  const loadData = async () => {
    try {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const res = await fetchWithAuth(`/attendance/summary?month=${month}&year=${year}`);
      setAttendanceStats(res.stats);
      setAttendanceHistory(res.history || []);
      
      const todayString = now.toISOString().split('T')[0];
      const todayRec = (res.history || []).find((r: any) => r.date === todayString);
      setTodayRecord(todayRec);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      }
    });
  };

  const handlePunch = async (type: 'in' | 'out') => {
    setLoading(true);
    setLocationError('');
    try {
      let position: any = null;
      try {
        position = await getLocation();
      } catch (err: any) {
        console.warn('Geolocation failed:', err);
      }
      
      const payload = {
        lat: position?.coords?.latitude || null,
        lng: position?.coords?.longitude || null,
        address: position ? 'Fetched via Browser GPS' : 'Location Denied',
        deviceInfo: navigator.userAgent
      };

      if (type === 'in') {
        await fetchWithAuth('/attendance/punch-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetchWithAuth('/attendance/punch-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      loadData();
    } catch (err: any) {
      setLocationError(err.message || 'Failed to punch in/out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isPunchedIn = todayRecord && todayRecord.checkIn && !todayRecord.checkOut;
  const isPunchedOut = todayRecord && todayRecord.checkOut;

  return (
    <>
      {/* Dynamic Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen" />
        </div>

        <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto min-h-screen flex flex-col">
          {/* Header */}
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase text-fg-primary">Attendance</h1>
              <p className="text-fg-muted font-medium mt-1">Log your daily working hours</p>
            </div>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-3 rounded-full bg-bg-surface border border-border-base text-fg-base hover:bg-bg-hover transition-colors"
            >
              <Menu size={24} />
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Punch Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-1 bg-bg-surface border border-border-base rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="w-40 h-40 rounded-full border-4 border-border-base flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin-slow opacity-20" />
                <div className="text-center">
                  <div className="text-4xl font-black tabular-nums tracking-tight">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-fg-muted uppercase font-bold tracking-widest mt-1">
                    {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {locationError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 w-full">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-red-500/90 font-medium">{locationError}</p>
                </div>
              )}

              {!todayRecord && (
                <button
                  onClick={() => handlePunch('in')}
                  disabled={loading}
                  className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-500 transition-all shadow-xl hover:shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Activity className="animate-spin" size={20} /> : <LogIn size={20} />}
                  Punch In
                </button>
              )}

              {isPunchedIn && (
                <div className="w-full space-y-4">
                  <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex flex-col items-center gap-2">
                    <CheckCircle className="text-green-500" size={24} />
                    <span className="text-sm font-bold text-green-500">Punched In at {new Date(todayRecord.checkIn.time).toLocaleTimeString()}</span>
                  </div>
                  <button
                    onClick={() => handlePunch('out')}
                    disabled={loading}
                    className="w-full py-5 rounded-2xl bg-red-600 text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-red-500 transition-all shadow-xl hover:shadow-red-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Activity className="animate-spin" size={20} /> : <LogOut size={20} />}
                    Punch Out
                  </button>
                </div>
              )}

              {isPunchedOut && (
                <div className="w-full p-6 rounded-2xl bg-bg-muted border border-border-base flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                    <CheckCircle size={24} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-fg-primary">Shift Completed</h3>
                    <p className="text-xs text-fg-muted mt-1">
                      {todayRecord.hoursWorked} hours logged today
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Stats & History */}
            <div className="lg:col-span-2 space-y-8">
              {/* Monthly Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Present', value: attendanceStats?.present || 0, color: 'text-green-500' },
                  { label: 'Absent', value: attendanceStats?.absent || 0, color: 'text-red-500' },
                  { label: 'Half Day', value: attendanceStats?.half_day || 0, color: 'text-yellow-500' },
                  { label: 'Hours', value: attendanceStats?.totalHours || 0, color: 'text-blue-500' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-bg-surface border border-border-base p-6 rounded-3xl"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-fg-muted mb-2">{stat.label}</p>
                    <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* History Table */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-bg-surface border border-border-base rounded-3xl overflow-hidden"
              >
                <div className="p-6 border-b border-border-base flex items-center gap-3">
                  <Calendar className="text-fg-muted" size={20} />
                  <h3 className="font-bold text-fg-primary uppercase tracking-widest text-sm">Monthly History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-base bg-bg-muted/50">
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-fg-muted">Date</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-fg-muted">Status</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-fg-muted">Check In</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-fg-muted">Check Out</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-fg-muted">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-base">
                      {attendanceHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-fg-muted text-sm font-medium">
                            No attendance records found for this month.
                          </td>
                        </tr>
                      ) : (
                        attendanceHistory.map((record, i) => (
                          <tr key={i} className="hover:bg-bg-muted/30 transition-colors">
                            <td className="p-4 text-sm font-medium">{record.date}</td>
                            <td className="p-4">
                              <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                                ${record.status === 'present' ? 'bg-green-500/10 text-green-500' :
                                  record.status === 'absent' ? 'bg-red-500/10 text-red-500' :
                                  'bg-yellow-500/10 text-yellow-500'}`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-fg-muted">
                              {record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                            </td>
                            <td className="p-4 text-sm text-fg-muted">
                              {record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                            </td>
                            <td className="p-4 text-sm font-bold text-fg-primary">
                              {record.hoursWorked ? `${record.hoursWorked}h` : '--'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
    </>
  );
};

export default TechnicianAttendance;
