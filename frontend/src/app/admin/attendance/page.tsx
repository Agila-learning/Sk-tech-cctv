"use client";
import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle2, XCircle, Clock, MapPin, 
  Search, Filter, Download, ArrowLeft, RefreshCw,
  MoreVertical, Edit3, Trash2, Smartphone, Shield, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '@/utils/api';
import { useRouter } from 'next/navigation';

const AttendanceManagementPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    technicianId: ''
  });
  
  const [syncing, setSyncing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideData, setOverrideData] = useState({
    status: '',
    remarks: '',
    checkIn: '',
    checkOut: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attData, techData] = await Promise.all([
        fetchWithAuth(`/admin/attendance/all?startDate=${filters.startDate}&endDate=${filters.endDate}&technicianId=${filters.technicianId}`),
        fetchWithAuth('/admin/technicians')
      ]);
      setAttendance(attData || []);
      setTechnicians(techData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    const month = prompt("Enter month (MM):", (new Date().getMonth() + 1).toString().padStart(2, '0'));
    const year = prompt("Enter year (YYYY):", new Date().getFullYear().toString());
    if (!month || !year) return;

    setSyncing(true);
    try {
      const res = await fetchWithAuth('/admin/attendance/sync', {
        method: 'POST',
        body: JSON.stringify({ month, year })
      });
      alert(res.message);
      loadData();
    } catch (e: any) {
      alert(e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth(`/admin/attendance/${selectedRecord._id}/override`, {
        method: 'PATCH',
        body: JSON.stringify(overrideData)
      });
      setIsOverrideModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(e.message || "Override failed");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'sunday_present': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'half_day': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'absent': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'holiday': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'sunday': return 'bg-fg-muted/10 text-fg-muted border-fg-muted/20';
      default: return 'bg-bg-muted text-fg-muted border-border-base';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div className="space-y-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-fg-muted hover:text-blue-500 transition-colors group mb-4"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dashboard</span>
            </button>
            <h1 className="text-4xl lg:text-7xl font-black text-fg-primary uppercase tracking-tighter italic leading-none">
              Attendance <span className="text-blue-500 non-italic">Control</span>
            </h1>
            <p className="text-fg-muted font-medium text-lg lg:text-xl">Personnel Work History & Tracking</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <button 
               onClick={handleSync}
               disabled={syncing}
               className="px-8 py-4 bg-bg-muted text-fg-primary rounded-2xl border border-border-base font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:border-blue-500/50 transition-all flex items-center gap-3"
             >
               <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
               Sync Month
             </button>
             <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
               <Download className="h-4 w-4" />
               Export Report
             </button>
          </div>
        </header>

        {/* Filters */}
        <div className="glass-card p-6 rounded-[2.5rem] border border-border-base overflow-x-auto">
          <div className="flex flex-wrap items-center gap-6 min-w-[800px]">
             <div className="flex-1 space-y-2">
                <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest pl-2">Range Start</label>
                <div className="relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
                   <input 
                     type="date"
                     value={filters.startDate}
                     onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                     className="w-full pl-12 pr-4 py-3 bg-bg-muted/50 rounded-xl border border-border-base focus:border-blue-500 transition-all font-bold text-xs"
                   />
                </div>
             </div>
             <div className="flex-1 space-y-2">
                <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest pl-2">Range End</label>
                <div className="relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
                   <input 
                     type="date"
                     value={filters.endDate}
                     onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                     className="w-full pl-12 pr-4 py-3 bg-bg-muted/50 rounded-xl border border-border-base focus:border-blue-500 transition-all font-bold text-xs"
                   />
                </div>
             </div>
             <div className="flex-1 space-y-2">
                <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest pl-2">Filter Technician</label>
                <select 
                  value={filters.technicianId}
                  onChange={(e) => setFilters({...filters, technicianId: e.target.value})}
                  className="w-full p-4 bg-bg-muted/50 rounded-xl border border-border-base focus:border-blue-500 transition-all font-bold text-xs uppercase"
                >
                  <option value="">All Personnel</option>
                  {technicians.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
             </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="glass-card rounded-[3.5rem] overflow-hidden border border-border-base shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1200px] whitespace-nowrap">
              <thead className="bg-bg-muted/50 border-b border-border-base">
                <tr>
                  <th className="px-10 py-8 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Technician</th>
                  <th className="px-10 py-8 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Date</th>
                  <th className="px-10 py-8 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Status</th>
                  <th className="px-10 py-8 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">In / Out</th>
                  <th className="px-10 py-8 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Hours</th>
                  <th className="px-10 py-8 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Device / GPS</th>
                  <th className="px-10 py-8 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-10 py-6"><div className="h-6 bg-bg-muted rounded-xl w-full"></div></td>
                    </tr>
                  ))
                ) : attendance.map((record) => (
                  <tr key={record._id} className="hover:bg-bg-muted/30 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-600/10 rounded-2xl flex items-center justify-center font-black text-blue-500 uppercase text-xs">
                          {record.user?.name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-fg-primary uppercase">{record.user?.name}</p>
                          <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">{record.user?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                       <span className="text-xs font-black text-fg-primary tracking-widest">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${getStatusStyle(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs font-bold text-fg-secondary">IN: {record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</span>
                        <span className="text-xs font-bold text-fg-muted">OUT: {record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-sm font-black text-fg-primary">{record.hoursWorked?.toFixed(2) || '0.00'}h</span>
                    </td>
                    <td className="px-10 py-6">
                       <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-[10px] text-fg-muted">
                             <Smartphone className="h-3 w-3 mr-2" />
                             {record.checkIn?.deviceInfo?.slice(0, 15) || 'Web'}
                          </div>
                          <div className="flex items-center text-[10px] text-blue-500">
                             <MapPin className="h-3 w-3 mr-2" />
                             Verified: {record.checkIn?.location?.lat?.toFixed(4)}, {record.checkIn?.location?.lng?.toFixed(4)}
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => {
                            setSelectedRecord(record);
                            setOverrideData({
                              status: record.status,
                              remarks: record.adminRemarks || '',
                              checkIn: record.checkIn?.time ? new Date(record.checkIn.time).toISOString().slice(0, 16) : '',
                              checkOut: record.checkOut?.time ? new Date(record.checkOut.time).toISOString().slice(0, 16) : ''
                            });
                            setIsOverrideModalOpen(true);
                          }}
                          className="p-3 bg-bg-muted border border-border-base rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-fg-muted hover:text-blue-500"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && attendance.length === 0 && (
            <div className="text-center py-20 text-fg-muted opacity-30 font-black uppercase text-xs tracking-widest">
               No Attendance Grid Generated
            </div>
          )}
        </div>

        {/* Override Modal */}
        <AnimatePresence>
          {isOverrideModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass-card w-full max-w-xl rounded-[3rem] border border-border-base p-10 overflow-hidden relative shadow-2xl"
              >
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Override <span className="text-blue-500">Record</span></h2>
                  <button onClick={() => setIsOverrideModalOpen(false)} className="p-4 bg-bg-muted rounded-2xl border border-border-base">
                    <XCircle className="h-5 w-5 text-fg-muted" />
                  </button>
                </div>

                <form onSubmit={handleOverride} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Set Status</label>
                      <select 
                        value={overrideData.status}
                        onChange={(e) => setOverrideData({...overrideData, status: e.target.value})}
                        className="w-full p-4 bg-bg-muted rounded-2xl border border-border-base focus:border-blue-500 transition-all font-bold text-sm uppercase"
                      >
                        <option value="present">Present</option>
                        <option value="sunday_present">Sunday Present</option>
                        <option value="half_day">Half-Day</option>
                        <option value="absent">Absent</option>
                        <option value="holiday">Holiday</option>
                        <option value="on_leave">On Leave</option>
                      </select>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Punch In</label>
                        <input 
                          type="datetime-local"
                          value={overrideData.checkIn}
                          onChange={(e) => setOverrideData({...overrideData, checkIn: e.target.value})}
                          className="w-full p-4 bg-bg-muted rounded-2xl border border-border-base appearance-none font-bold text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Punch Out</label>
                        <input 
                          type="datetime-local"
                          value={overrideData.checkOut}
                          onChange={(e) => setOverrideData({...overrideData, checkOut: e.target.value})}
                          className="w-full p-4 bg-bg-muted rounded-2xl border border-border-base appearance-none font-bold text-xs"
                        />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Override Reason / Admin Remarks</label>
                      <textarea 
                        required
                        value={overrideData.remarks}
                        onChange={(e) => setOverrideData({...overrideData, remarks: e.target.value})}
                        className="w-full p-4 bg-bg-muted rounded-2xl border border-border-base focus:border-blue-500 transition-all font-bold text-sm h-24"
                        placeholder="Why is this record being manually adjusted?"
                      />
                   </div>

                   <button className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all">
                      Confirm Strategic Override
                   </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default AttendanceManagementPage;
