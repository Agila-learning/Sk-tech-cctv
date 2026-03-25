"use client";
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, LogIn, LogOut, Calendar, Loader2, Activity, Info } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import BackButton from '@/components/common/BackButton';

const AttendancePage = () => {
  const [isPresent, setIsPresent] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
    checkTodayStatus();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await fetchWithAuth('/attendance/my');
      setAttendanceHistory(data);
    } catch (error) {
      console.error("Fetch History Error:", error);
    }
  };

  const checkTodayStatus = async () => {
    try {
      const data = await fetchWithAuth('/attendance/my');
      const today = new Date().toISOString().split('T')[0];
      const todayLog = data.find((log: any) => log.date === today);
      if (todayLog) {
        setIsPresent(true);
        setCheckInTime(new Date(todayLog.checkIn).toLocaleTimeString());
      }
    } catch (error) {
      console.error("Status Check Error:", error);
    }
  };

  const handleAttendance = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/attendance/punch', {
        method: 'POST'
      });
      setIsPresent(!isPresent);
      if (!isPresent) {
        setCheckInTime(new Date(data.checkIn).toLocaleTimeString());
      }
      fetchHistory();
    } catch (error) {
      alert("Attendance protocol failed. Check network link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-fg-primary p-6 md:p-10 pb-32 transition-all">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
            <BackButton />
            <div className="px-6 py-3 glass-card rounded-2xl border border-border-base flex items-center space-x-3 shadow-xl shadow-blue-500/5">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="font-black text-[10px] uppercase tracking-widest text-fg-muted">{new Date().toDateString()}</span>
            </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-fg-primary tracking-tighter uppercase italic">Attendance<span className="text-blue-500">Portal</span></h1>
            <p className="text-fg-muted font-medium">Record your active hours and verify site arrival status.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-5 glass-card p-10 rounded-[3rem] border border-border-base flex flex-col items-center text-center space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -z-10" />
              <div className={`w-28 h-28 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl ${isPresent ? 'bg-green-500/10 text-green-500 border border-green-500/20 rotate-6' : 'bg-blue-600 text-white shadow-blue-500/20 -rotate-3'}`}>
                {isPresent ? <CheckCircle className="h-14 w-14" /> : <Clock className="h-14 w-14" />}
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight">{isPresent ? 'Shift Active' : 'Offline'}</h3>
                <p className="text-fg-muted font-bold text-sm leading-relaxed">{isPresent ? `Checked in at ${checkInTime}` : 'Initiate your workflow by marking presence'}</p>
              </div>
              <button 
                onClick={handleAttendance}
                disabled={loading}
                className={`w-full py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl flex items-center justify-center space-x-4 ${isPresent ? 'bg-bg-muted text-fg-muted border border-border-base hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20' : 'bg-blue-600 text-white shadow-blue-500/20 hover:scale-[1.02] hover:bg-blue-700'}`}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isPresent ? (
                  <>
                    <LogOut className="h-5 w-5" />
                    <span>End Shift</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Punch In</span>
                  </>
                )}
              </button>
           </div>

           <div className="lg:col-span-7 glass-card p-10 rounded-[3rem] border border-border-base bg-indigo-600/5 space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-fg-muted uppercase tracking-[0.2em]">Recent Activity</h3>
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                {attendanceHistory.map((log) => (
                  <div key={log._id} className="flex justify-between items-center p-5 rounded-2xl bg-background border border-border-base group hover:border-blue-500/30 transition-all">
                    <div className="space-y-1">
                      <p className="font-black text-xs uppercase text-fg-primary">{log.date}</p>
                      <p className="text-[10px] font-bold text-fg-muted tracking-wide">
                        {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ' Online'}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${log.remarks === 'Late Arrival' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                      {log.remarks || 'Standard'}
                    </span>
                  </div>
                ))}
                {attendanceHistory.length === 0 && (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 bg-bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Info className="h-8 w-8 text-fg-dim" />
                    </div>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">No history available</p>
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
