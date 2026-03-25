"use client";
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Download, Search, Filter, 
  ChevronLeft, ChevronRight, User as UserIcon, CheckCircle2, XCircle, AlertCircle, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth, getImageUrl } from '@/utils/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import * as XLSX from 'xlsx';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

const AdminAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [selectedDate, viewType]);

  const loadData = async () => {
    try {
      setLoading(true);
      let start = format(selectedDate, 'yyyy-MM-dd');
      let end = start;

      if (viewType === 'weekly') {
        start = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
        end = format(endOfWeek(selectedDate), 'yyyy-MM-dd');
      } else if (viewType === 'monthly') {
        start = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
        end = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
      }

      const [attData, techData] = await Promise.all([
        fetchWithAuth(`/attendance?startDate=${start}&endDate=${end}`),
        fetchWithAuth('/admin/technicians/status')
      ]);

      setAttendance(attData || []);
      setTechnicians(techData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const dataToExport = attendance.map(row => ({
      Technician: row.user?.name,
      Email: row.user?.email,
      Date: row.date,
      Status: row.status,
      CheckIn: row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : '-',
      CheckOut: row.checkOut ? new Date(row.checkOut).toLocaleTimeString() : '-',
      Remarks: row.remarks || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_Report_${viewType}_${format(selectedDate, 'yyyy-MM-dd')}.xlsx`);
  };

  const filteredTechs = technicians.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceForTech = (techId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendance.find(a => (a.user?._id === techId || a.user === techId) && a.date === dateStr);
  };

  const daysToDisplay = viewType === 'daily' 
    ? [selectedDate] 
    : viewType === 'weekly' 
      ? eachDayOfInterval({ start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) })
      : eachDayOfInterval({ start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) });

  return (
    <div className="min-h-screen bg-background flex transition-all duration-500 overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 p-6 md:p-12 w-full space-y-12 overflow-y-auto">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl hover:bg-blue-600/20 transition-all shadow-lg shadow-blue-500/5 group"
            >
              <Menu className="h-6 w-6 text-fg-primary group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => router.push('/admin')}
              className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-bg-surface transition-all group"
              title="Back to Command Center"
            >
              <ChevronLeft className="h-6 w-6 text-fg-primary group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-fg-primary uppercase tracking-tighter italic leading-none text-nowrap">Command <span className="text-blue-500 non-italic">Log</span></h1>
              <p className="text-fg-muted font-bold text-lg lg:text-xl uppercase tracking-[0.2em] ml-2">Grid Attendance & Deployment Matrix</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-card p-3 rounded-[2rem] border border-card-border shadow-2xl">
            {['daily', 'weekly', 'monthly'].map(t => (
              <button 
                key={t}
                onClick={() => setViewType(t as any)}
                className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === t ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-fg-muted hover:text-fg-primary'}`}
              >
                {t}
              </button>
            ))}
            <div className="w-px h-8 bg-card-border mx-2"></div>
            <button onClick={exportToExcel} className="p-4 bg-bg-muted hover:bg-blue-600 hover:text-white rounded-xl transition-all group">
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Global Pipeline Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { label: 'Currently On-Field', value: technicians.filter(t => t.isOnline).length, icon: CheckCircle2, color: 'text-green-500' },
             { label: 'Late Punch-ins', value: attendance.filter(a => a.isLate && format(new Date(a.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length, icon: AlertCircle, color: 'text-orange-500' },
             { label: 'Total Specialists', value: technicians.length, icon: UserIcon, color: 'text-blue-500' }
           ].map((stat, i) => (
             <div key={i} className="glass-card p-8 rounded-[3rem] border border-border-base flex items-center space-x-6">
                <div className={`p-4 rounded-2xl bg-bg-muted ${stat.color}`}>
                   <stat.icon className="h-6 w-6" />
                </div>
                <div>
                   <p className="text-3xl font-black text-fg-primary tracking-tighter">{stat.value}</p>
                   <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">{stat.label}</p>
                </div>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-12 space-y-8">
            <div className="bg-card p-8 rounded-[3rem] border border-card-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center space-x-6">
                <button onClick={() => {
                  const newDate = new Date(selectedDate);
                  if (viewType === 'daily') newDate.setDate(newDate.getDate() - 1);
                  else if (viewType === 'weekly') newDate.setDate(newDate.getDate() - 7);
                  else newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }} className="p-4 bg-bg-muted rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <div className="text-center min-w-[200px]">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{viewType} Range</p>
                  <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight">
                    {viewType === 'daily' ? format(selectedDate, 'PPPP') : 
                     viewType === 'weekly' ? `${format(startOfWeek(selectedDate), 'MMM d')} - ${format(endOfWeek(selectedDate), 'MMM d, yyyy')}` : 
                     format(selectedDate, 'MMMM yyyy')}
                  </h3>
                </div>
                <button onClick={() => {
                  const newDate = new Date(selectedDate);
                  if (viewType === 'daily') newDate.setDate(newDate.getDate() + 1);
                  else if (viewType === 'weekly') newDate.setDate(newDate.getDate() + 7);
                  else newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }} className="p-4 bg-bg-muted rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              <div className="relative w-full md:w-96">
                <input 
                  type="text" 
                  placeholder="Search Operative..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-bg-muted border border-border-base rounded-2xl py-5 pl-14 pr-6 outline-none focus:border-blue-600 font-bold text-xs uppercase tracking-widest"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-dim" />
              </div>
            </div>

            <div className="glass-card rounded-[3.5rem] border border-border-base overflow-x-auto shadow-2xl relative scrollbar-hide">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-bg-muted/50 border-b border-card-border text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted">
                  <tr>
                    <th className="px-10 py-8 sticky left-0 bg-card z-10 w-80">Operative</th>
                    {daysToDisplay.map(d => (
                      <th key={d.toString()} className="px-6 py-8 text-center min-w-[120px]">
                        {format(d, 'EEE')}<br/>
                        <span className="text-fg-primary">{format(d, 'd')}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {filteredTechs.map(tech => (
                    <tr key={tech._id} className="hover:bg-bg-muted/20 transition-all group">
                      <td className="px-10 py-10 sticky left-0 bg-card group-hover:bg-bg-muted/20 z-10">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-bg-muted flex items-center justify-center text-blue-600 font-black relative overflow-hidden">
                             {tech.profilePic ? <img src={getImageUrl(tech.profilePic)} className="w-full h-full object-cover" /> : tech.name[0]}
                          </div>
                          <div>
                            <p className="font-black text-fg-primary uppercase tracking-tight leading-none mb-1">{tech.name}</p>
                             <p className="text-[9px] font-bold text-fg-dim tracking-widest lowercase">{tech.email}</p>
                          </div>
                        </div>
                      </td>
                      {daysToDisplay.map(d => {
                        const record = getAttendanceForTech(tech._id, d);
                        return (
                          <td key={d.toString()} className="px-6 py-10">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              {record ? (
                                <>
                                  <div className={`w-3 h-3 rounded-full ${record.status === 'present' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : record.status === 'absent' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                  <p className="text-[8px] font-black text-fg-primary uppercase tracking-widest">
                                    {record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '-'}
                                  </p>
                                </>
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-fg-dim/20"></div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTechs.length === 0 && (
                <div className="py-32 text-center space-y-6">
                  <div className="w-20 h-20 bg-bg-muted rounded-[2rem] flex items-center justify-center mx-auto opacity-30">
                    <AlertCircle className="h-10 w-10 text-fg-dim" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-fg-dim">No Operatives Registered in Current Grid</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const AdminAttendancePage = () => {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminAttendance />
    </ProtectedRoute>
  );
};

export default AdminAttendancePage;
