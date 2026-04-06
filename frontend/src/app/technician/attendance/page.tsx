"use client";
import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/utils/api';
import { 
  Clock, MapPin, CheckCircle2, AlertCircle, 
  ChevronRight, Calendar, User, Smartphone,
  Activity, Zap, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TechnicianAttendance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ present: 0, totalHours: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadData = async () => {
    try {
      const now = new Date();
      const [summaryData, myData] = await Promise.all([
        fetchWithAuth(`/attendance/summary?month=${(now.getMonth() + 1).toString().padStart(2, '0')}&year=${now.getFullYear()}`),
        fetchWithAuth('/attendance/my')
      ]);

      setStats(summaryData.stats || { present: 0, totalHours: 0 });
      setHistory(myData || []);
      
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = myData?.find((r: any) => r.date === today);
      setCurrentRecord(todayRecord || null);
    } catch (e) {
      console.error("Attendance Load Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePunch = async () => {
    setPunching(true);
    try {
      // 1. Get GPS Location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
      const endpoint = (!currentRecord || !currentRecord.checkIn?.time) ? '/attendance/punch-in' : '/attendance/punch-out';
      
      const res = await fetchWithAuth(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          deviceInfo: window.navigator.userAgent,
          address: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
        })
      });

      setCurrentRecord(res);
      loadData();
    } catch (e: any) {
      alert(e.message || "Strategic synchronization failed. Check GPS permissions.");
    } finally {
      setPunching(false);
    }
  };

  const calculateDuration = () => {
    if (!currentRecord?.checkIn?.time) return "00:00:00";
    const start = new Date(currentRecord.checkIn.time).getTime();
    const end = currentRecord.checkOut?.time ? new Date(currentRecord.checkOut.time).getTime() : currentTime.getTime();
    const diff = Math.max(0, end - start);
    
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-bg-muted/10 h-screen">
        <Activity className="h-8 w-8 text-blue-600 animate-spin" />
    </div>
  );

  const isPunchedIn = currentRecord?.checkIn?.time && !currentRecord?.checkOut?.time;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 space-y-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-blue-500 font-black text-[10px] uppercase tracking-[0.4em]">
              <Activity className="h-4 w-4 animate-pulse" />
              <span>Personnel Tracking Core</span>
            </div>
            <h1 className="text-5xl lg:text-8xl font-black text-fg-primary uppercase tracking-tighter italic leading-none">
              Attendance <span className="text-blue-500 non-italic">Logistics</span>
            </h1>
            <p className="text-fg-muted font-medium text-lg lg:text-xl">Time-Tracking & Geometric Verification</p>
          </div>
          <div className="bg-card p-6 rounded-[2rem] border border-card-border shadow-xl min-w-[240px] text-center">
             <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] mb-2">Live System Clock</p>
             <p className="text-4xl font-black text-fg-primary tracking-tighter italic">{currentTime.toLocaleTimeString([], { hour12: false })}</p>
             <p className="text-[10px] font-bold text-blue-500 uppercase mt-2">{currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </header>

        {/* Punch Control Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 glass-card rounded-[3.5rem] p-10 lg:p-16 border border-border-base relative overflow-hidden flex flex-col justify-between min-h-[450px]">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                 <Shield className="w-64 h-64 text-blue-600" />
              </div>

              <div className="space-y-8 relative z-10">
                 <div className="space-y-2">
                    <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em]">Operational Status</h3>
                    <p className={`text-3xl font-black uppercase tracking-tighter italic ${isPunchedIn ? 'text-green-500' : 'text-fg-muted'}`}>
                       {isPunchedIn ? 'Active Mission Segment' : 'System Standby / Off-Shift'}
                    </p>
                 </div>

                 <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-fg-muted uppercase tracking-widest pl-1">Mission Duration</h3>
                    <p className="text-8xl lg:text-[10rem] font-black text-fg-primary tracking-tighter leading-none">{calculateDuration()}</p>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                 <button 
                   onClick={handlePunch}
                   disabled={punching || (currentRecord?.checkIn?.time && currentRecord?.checkOut?.time)}
                   className={`flex-1 py-8 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl transition-all flex items-center justify-center gap-4 ${
                     isPunchedIn 
                     ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600' 
                     : (currentRecord?.checkIn?.time && currentRecord?.checkOut?.time) 
                       ? 'bg-fg-dim text-white cursor-not-allowed opacity-50'
                       : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'
                   } active:scale-95 disabled:scale-100`}
                 >
                    {punching ? (
                      <Zap className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Clock className="h-6 w-6" />
                        {isPunchedIn ? 'End Mission segment' : (currentRecord?.checkIn?.time && currentRecord?.checkOut?.time) ? 'Mission Completed' : 'PUNCH IN FOR DUTY'}
                      </>
                    )}
                 </button>
                 
                 {isPunchedIn && (
                    <div className="flex items-center gap-4 px-8 py-6 bg-green-500/10 border border-green-500/20 rounded-[2rem]">
                       <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                       <p className="text-[10px] font-black text-green-600 uppercase tracking-widest whitespace-nowrap">Live Geometric Link Active</p>
                    </div>
                 )}
              </div>
           </div>

           {/* Stats Side Column */}
           <div className="space-y-8">
              <div className="glass-card rounded-[2.5rem] p-8 border border-border-base space-y-6">
                 <h3 className="text-[10px] font-black text-fg-muted uppercase tracking-widest border-b border-border-base pb-4">Monthly Matrix Summary</h3>
                 <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-fg-dim uppercase tracking-widest">Effective Days</p>
                       <p className="text-3xl font-black text-fg-primary italic">{stats.present} <span className="text-blue-500 non-italic text-sm">/ {new Date().getDate()}</span></p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-fg-dim uppercase tracking-widest">Total Worked Hours</p>
                       <p className="text-3xl font-black text-fg-primary italic">{stats.totalHours.toFixed(1)} <span className="text-blue-500 non-italic text-sm">HRS</span></p>
                    </div>
                 </div>
              </div>

              <div className="glass-card rounded-[2.5rem] p-8 border border-border-base space-y-6 bg-blue-600">
                 <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest border-b border-white/10 pb-4">Secure Credentials</h3>
                 <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center font-black text-white text-xl border border-white/20">
                       {user?.name?.[0]}
                    </div>
                    <div>
                       <p className="text-sm font-black text-white uppercase tracking-tight">{user?.name}</p>
                       <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.2em] italic">Authorized Operative</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* History Grid */}
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-fg-primary uppercase tracking-tighter italic">Mission <span className="text-blue-500">History</span></h2>
              <div className="flex items-center space-x-2 text-[10px] font-black text-fg-muted uppercase tracking-widest">
                 <Calendar className="h-4 w-4" />
                 <span>Last 14 Segments</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {history.slice(0, 8).map((record, i) => (
                 <div key={record._id || i} className="glass-card rounded-[2rem] p-6 border border-border-base hover:border-blue-500/50 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                       <div className="p-3 bg-bg-muted rounded-xl text-fg-muted group-hover:text-blue-500 transition-colors">
                          <CheckCircle2 className="h-4 w-4" />
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-fg-dim uppercase tracking-widest">{new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                          <p className="text-[9px] font-bold text-fg-muted uppercase tracking-widest">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short' })}</p>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <p className="text-[8px] font-black text-fg-muted uppercase tracking-widest mb-1">IN</p>
                             <p className="text-xs font-black text-fg-primary uppercase tracking-tight">
                                {record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                             </p>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-fg-muted uppercase tracking-widest mb-1">OUT</p>
                             <p className="text-xs font-black text-fg-primary uppercase tracking-tight">
                                {record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                             </p>
                          </div>
                       </div>
                       <div className="pt-4 border-t border-border-base flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-blue-500">{record.status}</span>
                           <span className="text-sm font-black text-fg-primary italic">{record.hoursWorked?.toFixed(1) || '0.0'}h</span>
                       </div>
                    </div>
                 </div>
              ))}
              {history.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-20 filter grayscale">
                    <Activity className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.3em]">No Recorded Operations Found</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default function AttendancePage() {
  return (
    <ProtectedRoute allowedRoles={['technician']}>
      <TechnicianAttendance />
    </ProtectedRoute>
  );
}
