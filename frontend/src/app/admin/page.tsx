"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import { 
  TrendingUp, Users, ShoppingCart, ShieldAlert, 
  IndianRupee, Activity, Globe, Zap, Search, Menu, Ticket as TicketIcon,
  Bell
} from 'lucide-react';
import { fetchWithAuth, getImageUrl } from '@/utils/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { NotificationSection } from '@/components/NotificationSection';
import AdminNavbar from '@/components/admin/AdminNavbar';

const DashboardCard = ({ title, value, icon: Icon, color, trend, subValue }: any) => (
  <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-primary-blue transition-all duration-500 group relative overflow-hidden h-full flex flex-col justify-between bg-white dark:bg-slate-900 shadow-md hover:shadow-2xl hover:shadow-primary-blue/10">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-blue/5 to-transparent rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125 duration-700`}></div>
    <div className="relative z-10 space-y-6">
      <div className="flex justify-between items-start">
        <div className={`p-4 bg-bg-muted rounded-2xl w-fit border border-border-subtle shadow-sm flex items-center justify-center`}>
          <Icon className={`h-6 w-6 text-primary-blue`} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${trend.startsWith('+') ? 'text-green-600 bg-green-500/10 border-green-200' : 'text-red-600 bg-red-500/10 border-red-200'}`}>
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-fg-muted text-[9px] font-bold uppercase tracking-[0.2em] mb-3">{title}</p>
        <div className="flex items-baseline space-x-3">
          <h3 className="text-4xl font-black text-fg-primary tracking-tighter leading-none">{value}</h3>
          {subValue && <span className="text-fg-muted text-[10px] font-bold uppercase tracking-widest">{subValue}</span>}
        </div>
      </div>
    </div>
  </div>
);

const AdminHome = () => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    attendance: "0",
    pendingOrders: "0",
    revenue: "₹0",
    activeTechnicians: "0",
    totalOrders: "0"
  });
  const [timeRange, setTimeRange] = useState<'7' | '30'>('7');
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth(`/admin/dashboard-summary?period=${timeRange === '7' ? 'week' : 'month'}`);
      
      if (data) {
        setSubscriptions(data.subscriptions || []);
        setBookings(data.bookings || []);
        setTechnicians(data.technicians || []);
        setTickets(data.tickets || []);

        const summary = data.stats?.summary || { totalRevenue: 0, pendingOrders: 0, activeStreams: 0 };
        const activeTechs = data.technicians?.filter((t: any) => t.status === 'Available' || t.status === 'On-Task').length || 0;
        const totalOrdersCount = (data.bookings?.length || 0) + (summary.pendingOrders || 0);

        setStats({
          attendance: ((activeTechs / (data.technicians?.length || 1)) * 100).toFixed(0) + "%",
          pendingOrders: (summary.pendingOrders || 0).toString().padStart(2, '0'),
          revenue: `₹${((summary.totalRevenue || 0) / 100000).toFixed(1)}L`,
          activeTechnicians: activeTechs.toString().padStart(2, '0'),
          totalOrders: totalOrdersCount.toString().padStart(2, '0')
        });

        const mergedEvents = [
          ...(data.logs || []).map((l: any) => ({ ...l, eventType: 'log' })),
          ...(data.notifications || []).map((n: any) => ({ 
            ...n, 
            eventType: 'notification',
            details: n.message,
            action: (n.type || 'SYSTEM').toUpperCase().replace('_', ' ')
          })),
          ...(data.tickets || []).slice(0, 5).map((t: any) => ({
            ...t,
            eventType: 'notification',
            details: `Ticket: ${t.subject}`,
            action: 'NEW TICKET',
            createdAt: t.createdAt
          }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setLogs(mergedEvents);
      }
    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex transition-all duration-500 overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <AdminNavbar />
        
        <div className="p-6 md:p-12 space-y-16">
          {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-4 bg-primary-blue/10 border border-primary-blue/20 rounded-2xl hover:bg-primary-blue/20 transition-all shadow-lg shadow-primary-blue/5 group"
            >
              <Menu className="h-6 w-6 text-primary-blue group-hover:scale-110 transition-transform" />
            </button>
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-teal rounded-full shadow-[0_0_12px_rgba(13,148,136,0.5)] animate-pulse"></div>
                <span className="text-primary-teal text-[10px] font-black uppercase tracking-[0.3em]">System Engine: Active</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none text-slate-900 dark:text-white">Admin <span className="text-primary-blue">Panel</span></h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Enterprise Command Center</p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-slate-800 dark:text-white lg:hidden">
            {/* Notification Bell */}
            <div className="relative group">
              <button className="p-4 bg-white border border-border-base rounded-2xl hover:bg-white hover:border-primary-blue/30 transition-all relative shadow-sm">
                <Bell className="h-6 w-6 text-fg-secondary" />
                <span className="absolute top-3 right-3 w-3 h-3 bg-danger-red border-2 border-white rounded-full"></span>
              </button>
              
              {/* Dropdown Panel */}
              <div className="absolute top-full right-0 mt-4 w-80 bg-white border border-border-base rounded-[2rem] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-6 ring-1 ring-border-subtle">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Recent Activity</h4>
                  <span className="text-[9px] font-bold text-primary-blue cursor-pointer hover:underline">Clear all</span>
                </div>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                  {logs.slice(0, 4).map((log, i) => (
                    <div key={i} className="p-4 bg-bg-muted/50 rounded-2xl border border-border-subtle hover:border-primary-blue/20 transition-all group/item">
                      <p className="text-[11px] font-bold text-fg-primary line-clamp-2 leading-relaxed">{log.details || log.message}</p>
                      <p className="text-[8px] font-bold text-fg-dim mt-2 uppercase tracking-wider">{new Date(log.createdAt).toLocaleTimeString()}</p>
                    </div>
                  ))}
                  {logs.length === 0 && <p className="text-center py-4 text-[10px] font-bold text-fg-dim uppercase tracking-widest">No Alerts</p>}
                </div>
                <button 
                  onClick={() => router.push('/admin/notifications')}
                  className="w-full mt-6 py-4 bg-primary-blue text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-deep-blue transition-all shadow-lg shadow-primary-blue/20"
                >
                  Enter Ops Center
                </button>
              </div>
            </div>

            <div className="h-10 w-px bg-border-base hidden sm:block"></div>

            <div className="text-right hidden sm:block">
               <p className="text-fg-primary font-black text-xl tracking-tighter uppercase leading-none mb-1">Sup-Admin_01</p>
               <span className="text-[9px] font-black text-fg-muted uppercase tracking-[0.2em] font-mono">HQ-MATRIX-01</span>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-primary-blue to-primary-teal rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-blue/20 transform hover:rotate-3 transition-transform">
              <Zap className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
        </header>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
          <DashboardCard 
            title="Attendance" 
            value={stats.attendance} 
            subValue="Today" 
            icon={Activity} 
            trend="+12% Avg"
          />
          <div onClick={() => router.push('/admin/orders')} className="cursor-pointer">
            <DashboardCard 
              title="Pending Orders" 
              value={stats.pendingOrders} 
              subValue="Waiting" 
              icon={ShoppingCart} 
              trend="Action"
            />
          </div>
          <div onClick={() => document.getElementById('revenue-section')?.scrollIntoView({ behavior: 'smooth' })} className="cursor-pointer">
            <DashboardCard 
              title="Revenue" 
              value={stats.revenue} 
              subValue="Current Month" 
              icon={IndianRupee} 
              trend="+8.2%"
            />
          </div>
          <div onClick={() => router.push('/admin/technicians')} className="cursor-pointer">
            <DashboardCard 
              title="Active Techs" 
              value={stats.activeTechnicians} 
              subValue="In Field" 
              icon={Users} 
            />
          </div>
          <DashboardCard 
            title="Total Orders" 
            value={stats.totalOrders} 
            subValue="Life-time" 
            icon={Globe} 
          />
        </div>

        {/* Analytics & Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-20">
          <div className="lg:col-span-8 space-y-16">
              <div id="revenue-section" className="space-y-10">
                 <div className="flex justify-between items-end bg-transparent">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight uppercase leading-none">Revenue <span className="text-primary-blue">Trends</span></h3>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Revenue Performance</p>
                   </div>
                   <div className="flex bg-bg-muted rounded-2xl p-1.5 border border-border-base shadow-sm">
                      <button 
                        onClick={() => setTimeRange('7')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === '7' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'}`}
                      >
                        7 Days
                      </button>
                      <button 
                        onClick={() => setTimeRange('30')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === '30' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'}`}
                      >
                        30 Days
                      </button>
                   </div>
                </div>
                <div className="glass-card p-4 md:p-10 rounded-[3.5rem] border border-border-base bg-card/30 backdrop-blur-xl">
                   <AnalyticsCharts />
                </div>
             </div>

             <div className="space-y-10">
                 <div className="flex justify-between items-center bg-transparent">
                   <h3 className="text-2xl font-bold tracking-tight uppercase leading-none text-slate-800 dark:text-white">Recent <span className="text-slate-400">Bookings</span></h3>
                   <span className="px-5 py-2 bg-primary-blue/10 text-primary-blue rounded-xl text-[10px] font-bold uppercase tracking-widest border border-primary-blue/20">{bookings.length} Requests</span>
                </div>
                <div className="glass-card rounded-[3.5rem] overflow-x-auto border border-border-base shadow-xl">
                   <table className="w-full text-left min-w-[800px] whitespace-nowrap">
                      <thead className="bg-bg-muted/50 text-[10px] font-black uppercase tracking-widest text-fg-muted border-b border-border-base">
                         <tr>
                            <th className="px-4 lg:px-10 py-4 lg:py-8">Customer</th>
                            <th className="px-4 lg:px-10 py-4 lg:py-8">Service</th>
                            <th className="px-4 lg:px-10 py-4 lg:py-8">Scheduled</th>
                            <th className="px-4 lg:px-10 py-4 lg:py-8">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                         {bookings.slice(0, 5).map((booking: any, i) => (
                            <tr key={i} className="hover:bg-bg-muted/30 transition-all group">
                               <td className="px-4 lg:px-10 py-4 lg:py-8">
                                  <p className="font-black text-sm text-fg-primary uppercase">{booking.customer?.name}</p>
                                  <p className="text-[10px] font-bold text-fg-muted tracking-tight truncate max-w-[200px]">{booking.address}</p>
                               </td>
                               <td className="px-4 lg:px-10 py-4 lg:py-8">
                                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">{booking.serviceType}</span>
                               </td>
                               <td className="px-4 lg:px-10 py-4 lg:py-8 text-xs font-black text-fg-muted uppercase tabular-nums">
                                  {new Date(booking.scheduledDate).toLocaleDateString()}
                               </td>
                                <td className="px-4 lg:px-10 py-4 lg:py-8">
                                  <span className="text-[10px] font-black text-primary-blue uppercase tracking-widest">{booking.status}</span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                   {bookings.length === 0 && <div className="py-20 text-center text-[10px] font-black text-fg-dim uppercase tracking-[0.3em]">No Pending Operations</div>}
                </div>
             </div>

             <div className="space-y-10">
                 <div className="flex justify-between items-center bg-transparent">
                   <h3 className="text-2xl font-bold tracking-tight uppercase leading-none text-slate-800 dark:text-white">Service <span className="text-slate-400">Team</span></h3>
                   <button 
                     onClick={() => window.location.href = '/admin/tracking'}
                     className="px-8 py-3 bg-gradient-to-r from-primary-blue to-primary-teal text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-primary-blue/20 hover:scale-105"
                   >
                     View Team Map
                   </button>
                </div>
                <div className="glass-card rounded-[3.5rem] overflow-x-auto border border-border-base shadow-xl">
                   <table className="w-full text-left min-w-[800px] whitespace-nowrap">
                      <thead className="bg-bg-muted/50 text-[10px] font-black uppercase tracking-widest text-fg-muted border-b border-border-base">
                         <tr>
                             <th className="px-4 lg:px-10 py-4 lg:py-8">Member</th>
                             <th className="px-4 lg:px-10 py-4 lg:py-8">Rating</th>
                             <th className="px-4 lg:px-10 py-4 lg:py-8 text-right">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                         {technicians.slice(0, 5).map((tech: any, i) => (
                            <tr key={i} className="hover:bg-bg-muted/30 transition-colors group">
                               <td className="px-4 lg:px-10 py-4 lg:py-8">
                                  <div className="flex items-center space-x-5">
                                     <div className="w-14 h-14 bg-bg-muted border border-border-base rounded-2xl flex items-center justify-center font-black text-xs text-fg-primary shadow-xl overflow-hidden relative">
                                        {tech.profilePic ? <img src={getImageUrl(tech.profilePic)} className="w-full h-full object-cover" /> : tech.name[0]}
                                     </div>
                                      <div>
                                        <span className="text-lg font-black text-fg-primary tracking-tight uppercase">{tech.name}</span>
                                        <div className={`flex items-center space-x-2 mt-1`}>
                                           <div className={`w-1.5 h-1.5 rounded-full ${tech.status === 'Available' ? 'bg-primary-teal animate-pulse' : 'bg-primary-blue'}`}></div>
                                           <span className="text-[9px] font-bold text-fg-muted uppercase tracking-widest">{tech.status}</span>
                                        </div>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-4 lg:px-10 py-4 lg:py-8">
                                  <button 
                                    onClick={async () => {
                                       const newRating = window.prompt(`Override rating for ${tech.name}:`, tech.rating || '5.0');
                                       if (newRating) {
                                          try {
                                             await fetchWithAuth(`/admin/technicians/${tech._id}/rating`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ rating: parseFloat(newRating) })
                                             });
                                             loadDashboardData();
                                          } catch (e) { alert('Failed to update'); }
                                       }
                                    }}
                                    className="flex items-center space-x-2 hover:bg-blue-500/5 px-4 py-2 rounded-xl transition-all group/rating"
                                  >
                                     <Zap className="h-4 w-4 text-primary-teal fill-primary-teal group-hover/rating:scale-125 transition-all" />
                                     <span className="text-xl font-black text-fg-primary font-mono tabular-nums">{tech.rating || '5.0'}</span>
                                  </button>
                               </td>
                               <td className="px-4 lg:px-10 py-4 lg:py-8 text-right">
                                  <button className="p-4 rounded-2xl bg-bg-muted border border-border-base hover:border-blue-500 hover:bg-blue-600/10 transition-all text-fg-dim hover:text-blue-500">
                                     <Activity className="h-5 w-5" />
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>

          <div className="lg:col-span-4 space-y-12">
             <div className="glass-card p-6 md:p-12 rounded-[3rem] lg:rounded-[4rem] flex flex-col border border-border-base bg-card/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group min-h-[500px] lg:min-h-[800px]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                
                <NotificationSection />

                <button className="w-full mt-12 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 bg-bg-muted rounded-[2rem] hover:bg-blue-600 hover:text-white transition-all border border-border-base shadow-xl">
                   Operational Archives
                </button>
             </div>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const AdminDashboardPage = () => {
  return (
    <ProtectedRoute allowedRoles={['admin', 'sub-admin']}>
      <AdminHome />
    </ProtectedRoute>
  );
};

export default AdminDashboardPage;
