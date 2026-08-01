"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth } from '@/utils/api';
import { motion } from 'framer-motion';
import { MapPin, Clock, Search, Filter, Menu, User, Calendar, CheckCircle, XCircle } from 'lucide-react';

const AdminAttendance = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/attendance?startDate=${filterDate}&endDate=${filterDate}`);
      setAttendance(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterDate]);

  return (
    <div className="flex h-screen bg-bg-base text-fg-base overflow-hidden selection:bg-blue-500/30 font-sans">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 relative overflow-y-auto no-scrollbar">
        {/* Dynamic Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen" />
        </div>

        <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto min-h-screen flex flex-col">
          {/* Header */}
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase text-fg-primary">Staff Attendance</h1>
              <p className="text-fg-muted font-medium mt-1">Monitor daily logs & locations</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" size={16} />
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-bg-surface border border-border-base rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-3 rounded-full bg-bg-surface border border-border-base text-fg-base hover:bg-bg-hover transition-colors"
              >
                <Menu size={24} />
              </button>
            </div>
          </header>

          {/* Data Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-surface border border-border-base rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-base bg-bg-muted/50">
                    <th className="p-5 text-xs font-bold uppercase tracking-widest text-fg-muted">Staff Member</th>
                    <th className="p-5 text-xs font-bold uppercase tracking-widest text-fg-muted">Status</th>
                    <th className="p-5 text-xs font-bold uppercase tracking-widest text-fg-muted">Check In</th>
                    <th className="p-5 text-xs font-bold uppercase tracking-widest text-fg-muted">Check Out</th>
                    <th className="p-5 text-xs font-bold uppercase tracking-widest text-fg-muted">Hours</th>
                    <th className="p-5 text-xs font-bold uppercase tracking-widest text-fg-muted">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-fg-muted font-medium animate-pulse">Loading attendance logs...</td>
                    </tr>
                  ) : attendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-fg-muted font-medium">No attendance recorded for this date.</td>
                    </tr>
                  ) : (
                    attendance.map((record) => (
                      <tr key={record._id} className="hover:bg-bg-muted/30 transition-colors">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                              {record.user?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-bold text-fg-primary text-sm">{record.user?.name || 'Unknown'}</p>
                              <p className="text-xs text-fg-muted capitalize">{record.user?.role || 'Staff'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                            ${record.status === 'present' ? 'bg-green-500/10 text-green-500' :
                              record.status === 'absent' ? 'bg-red-500/10 text-red-500' :
                              'bg-yellow-500/10 text-yellow-500'}`}>
                            {record.status === 'present' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            {record.status}
                          </span>
                        </td>
                        <td className="p-5">
                          {record.checkIn?.time ? (
                            <div>
                              <p className="font-bold text-sm text-fg-primary">{new Date(record.checkIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              <p className="text-xs text-fg-muted">{record.checkIn.deviceInfo?.split(' ')[0]}</p>
                            </div>
                          ) : '--'}
                        </td>
                        <td className="p-5">
                           {record.checkOut?.time ? (
                            <div>
                              <p className="font-bold text-sm text-fg-primary">{new Date(record.checkOut.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              <p className="text-xs text-fg-muted">{record.checkOut.deviceInfo?.split(' ')[0]}</p>
                            </div>
                          ) : '--'}
                        </td>
                        <td className="p-5 text-sm font-black text-fg-primary">
                          {record.hoursWorked ? `${record.hoursWorked}h` : '--'}
                        </td>
                        <td className="p-5">
                          {record.checkIn?.location?.lat && (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${record.checkIn.location.lat},${record.checkIn.location.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full transition-colors"
                            >
                              <MapPin size={14} /> View Map
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AdminAttendance;
