"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import { 
  TrendingUp, Users, ShoppingCart, ShieldAlert, 
  IndianRupee, Activity, Globe, Zap, Search, Menu, Ticket as TicketIcon
} from 'lucide-react';
import { fetchWithAuth, getImageUrl } from '@/utils/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';

const DashboardCard = ({ title, value, icon: Icon, color, trend, subValue }: any) => (
  <div className="glass-card p-6 md:p-10 rounded-[3rem] border border-border-base hover:border-blue-500/30 transition-all duration-700 group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700`}></div>
    <div className="relative z-10 space-y-8">
      <div className={`p-4 bg-bg-muted rounded-2xl w-fit border border-border-base shadow-xl`}>
        <Icon className={`h-7 w-7 text-${color}-500`} />
      </div>
      <div>
        <p className="text-fg-muted text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
        <div className="flex items-baseline space-x-3">
          <h3 className="text-3xl lg:text-5xl font-black text-fg-primary tracking-tighter leading-none">{value}</h3>
          {subValue && <span className="text-fg-muted text-xs font-bold uppercase tracking-widest">{subValue}</span>}
        </div>
      </div>
      {trend && (
        <div className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl w-fit border ${trend.startsWith('+') ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
          <TrendingUp className={`h-3.5 w-3.5 ${!trend.startsWith('+') && 'rotate-180'}`} />
          <span>{trend}</span>
        </div>
      )}
    </div>
  </div>
);

const AdminHome = () => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: "₹0",
    activeNodes: "0",
    pendingOrders: "0",
    serviceAlerts: "0",
    openTickets: "0"
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
        const alertsCount = (summary.pendingOrders || 0) + (data.technicians?.filter((t: any) => t.status === 'Offline').length || 0);

        setStats({
          revenue: `₹${((summary.totalRevenue || 0) / 100000).toFixed(1)}L`,
          activeNodes: summary.activeStreams ? summary.activeStreams.toString() : "0",
          pendingOrders: summary.pendingOrders ? summary.pendingOrders.toString() : "0",
          serviceAlerts: alertsCount.toString().padStart(2, '0'),
          openTickets: (data.tickets?.filter((t: any) => t.status === 'Open').length || 0).toString()
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
      
      <main className="flex-1 lg:ml-80 p-6 md:p-12 overflow-y-auto w-full">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl hover:bg-blue-600/20 transition-all shadow-lg shadow-blue-500/5 group"
            >
              <Menu className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
            </button>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,1)] animate-pulse"></div>
                <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">System Status: Stable</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">Admin <span className="text-blue-500 non-italic">Panel</span></h1>
              <p className="text-fg-muted text-lg md:text-xl font-medium uppercase tracking-widest">Management & Control Center</p>
            </div>
          </div>

          <div className="flex items-center space-x-8 text-fg-primary">
            <div className="text-right hidden sm:block">
               <div className="flex items-center justify-end space-x-2 text-fg-muted mb-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">Region: SKYNET-01</span>
               </div>
               <p className="text-fg-primary font-black text-2xl tracking-tighter uppercase italic">Sup-Admin_01</p>
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white ring-[12px] ring-white/[0.03] shadow-2xl shadow-blue-500/30">
              <Zap className="h-10 w-10 text-white fill-white" />
            </div>
          </div>
        </header>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-20">
          <div onClick={() => document.getElementById('revenue-section')?.scrollIntoView({ behavior: 'smooth' })} className="cursor-pointer">
            <DashboardCard title="Total Revenue" value={stats.revenue} subValue="Monthly" icon={IndianRupee} color="blue" trend="+5.4% Target" />
          </div>
          <DashboardCard title="Active Nodes" value={stats.activeNodes} subValue="Online" icon={Activity} color="cyan" />
          <div onClick={() => router.push('/admin/tickets')} className="cursor-pointer">
            <DashboardCard title="Support Tickets" value={stats.openTickets} subValue="Open" icon={TicketIcon} color="orange" trend="Action Required" />
          </div>
          <DashboardCard title="Pending Orders" value={stats.pendingOrders} subValue="Items" icon={ShoppingCart} color="indigo" />
          <DashboardCard title="Service Alerts" value={stats.serviceAlerts} subValue="Critical" icon={ShieldAlert} color="red" />
        </div>

        {/* Analytics & Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-20">
          <div className="lg:col-span-8 space-y-16">
              <div id="revenue-section" className="space-y-12">
                 <div className="flex justify-between items-end">
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black text-fg-primary tracking-tight uppercase italic leading-none">Revenue <span className="text-blue-500 non-italic">Trends</span></h3>
                      <p className="text-fg-muted text-sm font-medium uppercase tracking-widest">Revenue Performance</p>
                   </div>
                   <div className="flex bg-bg-muted rounded-2xl p-1.5 border border-border-base shadow-sm">
                      <button 
                        onClick={() => setTimeRange('7')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === '7' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-fg-muted hover:text-fg-primary'}`}
                      >
                        7 Days
                      </button>
                      <button 
                        onClick={() => setTimeRange('30')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === '30' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-fg-muted hover:text-fg-primary'}`}
                      >
                        30 Days
                      </button>
                   </div>
                </div>
                <div className="glass-card p-4 md:p-10 rounded-[3.5rem] border border-border-base bg-card/30 backdrop-blur-xl">
                   <AnalyticsCharts />
                </div>
             </div>

             <div className="space-y-12">
                <div className="flex justify-between items-center">
                   <h3 className="text-3xl font-black tracking-tight uppercase italic leading-none text-fg-primary">Recent <span className="text-fg-muted not-italic">Bookings</span></h3>
                   <span className="px-5 py-2 bg-blue-600/10 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20">{bookings.length} Requests</span>
                </div>
                <div className="glass-card rounded-[3.5rem] overflow-x-auto border border-border-base shadow-xl">
                   <table className="w-full text-left">
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
                                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">{booking.status}</span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                   {bookings.length === 0 && <div className="py-20 text-center text-[10px] font-black text-fg-dim uppercase tracking-[0.3em]">No Pending Operations</div>}
                </div>
             </div>

             <div className="space-y-12">
                <div className="flex justify-between items-center">
                   <h3 className="text-3xl font-black tracking-tight uppercase italic leading-none text-fg-primary">Service <span className="text-fg-muted not-italic">Team</span></h3>
                   <button 
                     onClick={() => window.location.href = '/admin/tracking'}
                     className="px-8 py-5 bg-bg-muted border border-border-base text-fg-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-xl"
                   >
                     View Team Map
                   </button>
                </div>
                <div className="glass-card rounded-[3.5rem] overflow-x-auto border border-border-base shadow-xl">
                   <table className="w-full text-left">
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
                                        <span className="text-lg font-black text-fg-primary tracking-tight uppercase italic">{tech.name}</span>
                                        <div className={`flex items-center space-x-2 mt-1`}>
                                           <div className={`w-1.5 h-1.5 rounded-full ${tech.status === 'Available' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
                                           <span className="text-[9px] font-black text-fg-muted uppercase tracking-widest">{tech.status}</span>
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
                                     <Zap className="h-4 w-4 text-blue-500 fill-blue-500 group-hover/rating:scale-125 transition-all" />
                                     <span className="text-xl font-black text-fg-primary font-mono italic tabular-nums">{tech.rating || '5.0'}</span>
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
                
                <div className="mb-12 flex justify-between items-center relative z-10 text-fg-primary">
                  <div className="space-y-1">
                     <h3 className="text-2xl font-black tracking-tight uppercase italic leading-none">Activity <span className="text-blue-500">Logs</span></h3>
                     <p className="text-fg-muted text-[10px] font-black uppercase tracking-widest italic">Live Feed</p>
                  </div>
                  <div className="flex items-center space-x-3">
                     <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                     <span className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">Signal: Online</span>
                  </div>
                </div>

                <div className="space-y-10 flex-1 overflow-y-auto pr-4 scrollbar-hide">
                   {logs.map((log: any, i) => (
                     <div key={i} className="flex items-start space-x-6 group/log cursor-pointer relative">
                       <div className="absolute left-1.5 top-8 bottom-0 w-[1px] bg-border-subtle group-last/log:hidden transition-all group-hover/log:bg-blue-500/50"></div>
                       <div className="p-3 bg-blue-600/10 rounded-xl group-hover/log:scale-110 group-hover/log:bg-blue-600/20 transition-all relative z-10">
                         <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,1)]"></div>
                       </div>
                       <div className="flex-1 pb-10 border-b border-border-subtle group-last/log:border-none">
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">{log.action || 'SIGNAL'}</span>
                            <span className="text-[10px] font-bold text-fg-muted tabular-nums">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                         <p className="text-sm font-medium text-fg-muted group-hover/log:text-fg-primary transition-colors leading-relaxed tracking-tight">{log.details || log.action}</p>
                       </div>
                     </div>
                   ))}
                </div>

                <button className="w-full mt-12 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 bg-bg-muted rounded-[2rem] hover:bg-blue-600 hover:text-white transition-all border border-border-base shadow-xl">
                   Activity History
                </button>
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
