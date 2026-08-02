"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth } from '@/utils/api';
import { motion } from 'framer-motion';
import { MapPin, Clock, Search, Filter, Menu, User, Calendar, CheckCircle, XCircle, Download } from 'lucide-react';
import { API_URL } from '@/utils/api';

const AdminAttendance = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedUserForPanel, setSelectedUserForPanel] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/attendance?startDate=${startDate}&endDate=${endDate}`);
      setAttendance(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const uniqueUsers = Array.from(new Map(attendance.map(a => [a.user?._id, a.user])).values()).filter(Boolean);
  const filteredAttendance = selectedUserId ? attendance.filter(a => a.user?._id === selectedUserId) : attendance;

  const presentCount = filteredAttendance.filter(a => a.status === 'present').length;
  const absentCount = filteredAttendance.filter(a => a.status === 'absent').length;
  const halfDayCount = filteredAttendance.filter(a => a.status === 'half_day').length;
  const leaveCount = filteredAttendance.filter(a => a.status === 'leave').length;

  const updateAttendanceStatus = async (recordId: string, status: string) => {
    try {
      const res = await fetchWithAuth(`/attendance/${recordId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadData();
    } catch(err) {
      alert("Failed to update status");
    }
  };

  const handleExport = async (format: string) => {
    try {
      setIsExporting(true);
      const token = localStorage.getItem('token');
      const url = `${API_URL}/attendance/export?format=${format}&startDate=${startDate}&endDate=${endDate}${selectedUserId ? `&userId=${selectedUserId}` : ''}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const extension = format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv';
      a.download = `attendance_${startDate}_to_${endDate}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch(err) {
      alert(`Failed to export ${format} report.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-bg-base text-fg-base overflow-hidden selection:bg-blue-500/30 font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0 lg:ml-[280px] relative overflow-y-auto no-scrollbar">
        {/* Dynamic Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen" />
        </div>

        <div className="relative z-10 p-6 md:p-10 mx-auto min-h-screen flex flex-col">
          {/* Header */}
          <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-fg-primary">Staff Attendance</h1>
              <p className="text-fg-muted font-medium mt-1">Monitor daily logs & locations</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" size={16} />
                <select 
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-bg-surface border border-border-base rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                >
                  <option value="">All Staff</option>
                  {uniqueUsers.map((u: any) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                 <input 
                   type="date" 
                   value={startDate}
                   onChange={(e) => setStartDate(e.target.value)}
                   className="px-4 py-2 bg-bg-surface border border-border-base rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                 />
                 <span className="text-fg-muted font-black uppercase text-[10px]">to</span>
                 <input 
                   type="date" 
                   value={endDate}
                   onChange={(e) => setEndDate(e.target.value)}
                   className="px-4 py-2 bg-bg-surface border border-border-base rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                 />
              </div>
              <div className="relative group">
                <button
                  disabled={isExporting}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <Download size={16} />
                  {isExporting ? '...' : 'Export'}
                </button>
                <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-bg-surface border border-border-base rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2 text-sm text-fg-primary hover:bg-gray-50 dark:hover:bg-bg-hover transition-colors rounded-t-xl">Excel</button>
                  <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-fg-primary hover:bg-gray-50 dark:hover:bg-bg-hover transition-colors">PDF</button>
                  <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-sm text-fg-primary hover:bg-gray-50 dark:hover:bg-bg-hover transition-colors rounded-b-xl">CSV</button>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-3 rounded-full bg-bg-surface border border-border-base text-fg-base hover:bg-bg-hover transition-colors"
              >
                <Menu size={24} />
              </button>
            </div>
          </header>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-bg-surface border border-border-base p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-fg-muted uppercase tracking-widest">Present</p>
                <p className="text-2xl font-black text-green-500">{presentCount}</p>
              </div>
              <div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><CheckCircle size={20} /></div>
            </div>
            <div className="bg-bg-surface border border-border-base p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-fg-muted uppercase tracking-widest">Absent</p>
                <p className="text-2xl font-black text-red-500">{absentCount}</p>
              </div>
              <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><XCircle size={20} /></div>
            </div>
            <div className="bg-bg-surface border border-border-base p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-fg-muted uppercase tracking-widest">Half Day</p>
                <p className="text-2xl font-black text-yellow-500">{halfDayCount}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl"><Clock size={20} /></div>
            </div>
            <div className="bg-bg-surface border border-border-base p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-fg-muted uppercase tracking-widest">Leave</p>
                <p className="text-2xl font-black text-purple-500">{leaveCount}</p>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl"><Calendar size={20} /></div>
            </div>
          </div>

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
                    <th className="p-5 text-xs font-bold uppercase tracking-widest text-fg-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-fg-muted font-medium animate-pulse">Loading attendance logs...</td>
                    </tr>
                  ) : filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-fg-muted font-medium">No attendance found for this criteria.</td>
                    </tr>
                  ) : (
                    filteredAttendance.map((record: any) => (
                      <tr 
                        key={record._id} 
                        onClick={() => setSelectedUserForPanel(record.user)}
                        className="hover:bg-bg-muted/30 transition-colors cursor-pointer"
                      >
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                              {record.user?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-bold text-fg-primary text-sm">{record.user?.name || 'Unknown'}</p>
                              <p className="text-[10px] font-black tracking-widest text-fg-muted uppercase">{new Date(record.date).toLocaleDateString()}</p>
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
                        <td className="p-5 text-right">
                          <select
                            onClick={e => e.stopPropagation()}
                            value={record.status || 'present'}
                            onChange={(e) => updateAttendanceStatus(record._id, e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-bg-base border border-border-base rounded-lg text-xs font-bold uppercase tracking-wider text-fg-primary outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="half_day">Half Day</option>
                            <option value="leave">Leave</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Side Panel for User Calendar */}
        {selectedUserForPanel && (
          <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white dark:bg-bg-surface shadow-2xl z-50 transform transition-transform translate-x-0 border-l border-border-base flex flex-col">
            <div className="p-6 border-b border-border-base flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                  {selectedUserForPanel.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-fg-primary">{selectedUserForPanel.name}</h3>
                  <p className="text-xs font-medium text-fg-muted uppercase tracking-widest">{selectedUserForPanel.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUserForPanel(null)} className="text-fg-muted hover:text-fg-primary">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <h4 className="font-bold text-fg-primary flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" /> Recent Attendance History
              </h4>
              <div className="space-y-4">
                {attendance
                  .filter(a => a.user?._id === selectedUserForPanel._id)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 30) // Show last 30 entries
                  .map((log: any) => (
                  <div key={log._id} className="bg-gray-50 dark:bg-bg-base border border-border-base p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-fg-primary">{new Date(log.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      <p className="text-xs font-medium text-fg-muted mt-1">{log.hoursWorked ? `${log.hoursWorked} hrs logged` : 'No hours logged'}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                      ${log.status === 'present' ? 'bg-green-500/10 text-green-500' :
                        log.status === 'absent' ? 'bg-red-500/10 text-red-500' :
                        'bg-yellow-500/10 text-yellow-500'}`}>
                      {log.status === 'present' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminAttendance;
