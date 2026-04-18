"use client";
import React, { useState, useEffect, useRef } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import {
  TrendingUp, Users, ShoppingCart, IndianRupee, Activity,
  Globe, Zap, Menu, Bell, ArrowRight, Star, CheckCircle2, Clock
} from 'lucide-react';
import { fetchWithAuth, getImageUrl } from '@/utils/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { NotificationSection } from '@/components/NotificationSection';
import AdminNavbar from '@/components/admin/AdminNavbar';

/* ── Animated count-up hook ── */
function useCountUp(target: string | number, duration = 1200) {
  const [display, setDisplay] = useState('0');
  const numStr = String(target);
  const num = parseFloat(numStr.replace(/[^0-9.]/g, '')) || 0;
  const prefix = numStr.match(/^[₹$]/)?.[0] || '';
  const suffix = numStr.match(/[%LK+]+$/)?.[0] || '';

  useEffect(() => {
    if (num === 0) { setDisplay(numStr); return; }
    let start = 0;
    const step = num / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setDisplay(numStr); clearInterval(timer); return; }
      const val = num > 100 ? Math.floor(start) : start.toFixed(1);
      setDisplay(`${prefix}${val}${suffix}`);
    }, 16);
    return () => clearInterval(timer);
  }, [numStr]);
  return display;
}

/* ── Tiny sparkline SVG ── */
const Spark = ({ color }: { color: string }) => {
  const pts = [40,28,35,42,25,38,20,45,15,30,10].map((y, i) => `${i * 12},${y}`).join(' ');
  return (
    <svg viewBox="0 0 120 55" className="w-full h-10 opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${pts} 120,55 0,55`} fill={color} opacity="0.15" />
    </svg>
  );
};

/* ── Dashboard Stat Card ── */
const DashboardCard = ({ title, value, icon: Icon, trend, subValue, gradient, glowClass, sparkColor, onClick }: any) => {
  const animVal = useCountUp(value);
  return (
    <div
      onClick={onClick}
      className={`stat-card ${glowClass} ${onClick ? 'cursor-pointer' : ''} flex flex-col gap-5 group`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
            trend.startsWith('+') ? 'bg-green-500/10 text-green-600 border-green-200/60' : 'bg-blue-500/10 text-blue-600 border-blue-200/60'
          }`}>
            <TrendingUp className="h-2.5 w-2.5" />
            {trend}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <h3 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tighter animate-count-up" style={{ color: 'var(--fg-primary)', opacity: 1 }}>
          {animVal}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[10px] font-black text-[#475569] dark:text-slate-400 uppercase tracking-[0.18em]">{title}</p>
          {subValue && (
            <>
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest">{subValue}</span>
            </>
          )}
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-auto -mx-1 -mb-1">
        <Spark color={sparkColor} />
      </div>
    </div>
  );
};

/* ── Status Badge ── */
const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toLowerCase();
  const cls = s === 'completed' ? 'badge-green' : s === 'pending' ? 'badge-orange' : s === 'cancelled' ? 'badge-grey' : 'badge-blue';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};

/* ── Main Component ── */
const AdminHome = () => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    attendance: '0%', 
    pendingOrders: '00', 
    revenue: '₹0', 
    activeTechnicians: '00', 
    totalOrders: '00',
    ongoingTasks: '00',
    completedTasks: '00',
    presentTasks: '00'
  });
  const [timeRange, setTimeRange] = useState<'7' | '30'>('7');
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const loadDashboardData = async () => {
    try {
      const [data, tasksData] = await Promise.all([
        fetchWithAuth(`/admin/dashboard-summary?period=${timeRange === '7' ? 'week' : 'month'}`),
        fetchWithAuth('/internal/tasks')
      ]);
      
      if (data) {
        setBookings(data.bookings || []);
        setTechnicians(data.technicians || []);
        const summary = data.stats?.summary || {};
        const activeTechs = data.technicians?.filter((t: any) => t.status === 'Available' || t.status === 'On-Task').length || 0;
        
        // Task statistics
        const allTasks = tasksData || [];
        setTasks(allTasks);
        const ongoing = allTasks.filter((t: any) => t.status === 'in_progress').length;
        const completed = allTasks.filter((t: any) => t.status === 'completed').length;
        const present = allTasks.filter((t: any) => t.status === 'started').length;

        setStats({
          attendance: ((activeTechs / (data.technicians?.length || 1)) * 100).toFixed(0) + '%',
          pendingOrders: (summary.pendingOrders || 0).toString().padStart(2, '0'),
          revenue: `₹${((summary.totalRevenue || 0) / 100000).toFixed(1)}L`,
          activeTechnicians: activeTechs.toString().padStart(2, '0'),
          totalOrders: ((data.bookings?.length || 0) + (summary.pendingOrders || 0)).toString().padStart(2, '0'),
          ongoingTasks: ongoing.toString().padStart(2, '0'),
          completedTasks: completed.toString().padStart(2, '0'),
          presentTasks: present.toString().padStart(2, '0'),
        });
        const merged = [
          ...(data.logs || []).map((l: any) => ({ ...l, eventType: 'log' })),
          ...(data.notifications || []).map((n: any) => ({ ...n, eventType: 'notification', details: n.message })),
          ...(data.tickets || []).slice(0, 5).map((t: any) => ({ ...t, details: `Ticket: ${t.subject}`, createdAt: t.createdAt })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLogs(merged);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadDashboardData(); }, [timeRange]);

  if (loading) return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center animate-pulse shadow-xl">
          <Zap className="h-7 w-7 text-white" />
        </div>
        <p className="text-[10px] font-black text-[#475569] uppercase tracking-[0.3em] animate-pulse">Loading Dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen mesh-bg flex overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 lg:ml-80 flex flex-col min-h-screen animate-fade-in">
        <AdminNavbar />

        <div className="p-6 md:p-10 space-y-10">

          {/* ── Header ── */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-3 glass-card rounded-2xl border border-[#1E3A8A]/15 hover:border-[#1E3A8A]/30 transition-all shadow-sm group"
              >
                <Menu className="h-5 w-5 text-[#1E3A8A] group-hover:scale-110 transition-transform" />
              </button>
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="relative w-2 h-2">
                    <div className="w-2 h-2 bg-[#22C55E] rounded-full" />
                    <div className="absolute inset-0 bg-[#22C55E] rounded-full animate-ping opacity-50" />
                  </div>
                  <span className="text-[9px] font-black text-[#22C55E] uppercase tracking-[0.3em]">System Active</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  <span className="gradient-text">Admin</span>
                  <span className="text-[#0f172a] dark:text-white font-black"> Panel</span>
                </h1>
                <p className="text-[#64748b] text-xs font-semibold uppercase tracking-[0.2em] mt-1">Enterprise Command Center</p>
              </div>
            </div>

            {/* Time Range Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex bg-white/70 dark:bg-slate-800/70 backdrop-blur rounded-2xl p-1.5 border border-[#1E3A8A]/10 shadow-sm">
                {(['7', '30'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                      timeRange === r ? 'toggle-active' : 'toggle-inactive'
                    }`}
                  >
                    {r} Days
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-5">
            <DashboardCard title="Ongoing Tasks" value={stats.ongoingTasks} icon={Zap} trend="Active" subValue="Live"
              gradient="from-amber-500 to-orange-600" glowClass="glow-orange" sparkColor="#f59e0b"
              onClick={() => router.push('/admin/tasks?status=in_progress')} />
            <DashboardCard title="Present Tasks" value={stats.presentTasks} icon={Clock} trend="Assigned" subValue="Started"
              gradient="from-blue-500 to-indigo-600" glowClass="glow-blue" sparkColor="#3b82f6"
              onClick={() => router.push('/admin/tasks?status=started')} />
            <DashboardCard title="Completed" value={stats.completedTasks} icon={CheckCircle2} trend="Finalized" subValue="Tasks"
              gradient="from-green-500 to-emerald-600" glowClass="glow-green" sparkColor="#22c55e"
              onClick={() => router.push('/admin/tasks?status=completed')} />
            <DashboardCard title="Total Revenue" value={stats.revenue} icon={IndianRupee} trend="+8.2%" subValue="This Month"
              gradient="from-[#14B8A6] to-teal-700" glowClass="glow-green" sparkColor="#14B8A6"
              onClick={() => document.getElementById('revenue-section')?.scrollIntoView({ behavior: 'smooth' })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <DashboardCard title="Attendance" value={stats.attendance} icon={Activity} trend="+12% Avg" subValue="Today"
              gradient="from-indigo-500 to-indigo-700" glowClass="glow-blue" sparkColor="#6366f1" />
            <DashboardCard title="Pending Orders" value={stats.pendingOrders} icon={ShoppingCart} trend="Action" subValue="Waiting"
              gradient="from-[#1E3A8A] to-blue-600" glowClass="glow-blue" sparkColor="#1E3A8A"
              onClick={() => router.push('/admin/orders')} />
            <DashboardCard title="Active Techs" value={stats.activeTechnicians} icon={Users} subValue="In Field"
              gradient="from-[#7C3AED] to-purple-700" glowClass="glow-purple" sparkColor="#7C3AED"
              onClick={() => router.push('/admin/technicians')} />
            <DashboardCard title="Total Orders" value={stats.totalOrders} icon={Globe} subValue="Lifetime"
              gradient="from-cyan-500 to-cyan-700" glowClass="glow-blue" sparkColor="#06b6d4" />
          </div>

          {/* ── Analytics & Activity ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-10">

              {/* Revenue Trends */}
              <section id="revenue-section">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-black text-[#0f172a] dark:text-white tracking-tight">
                      Revenue <span className="gradient-text">Trends</span>
                    </h2>
                    <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest mt-0.5">Performance Analytics</p>
                  </div>
                  <div className="flex bg-white/70 dark:bg-slate-800/70 backdrop-blur rounded-2xl p-1.5 border border-[#1E3A8A]/10 shadow-sm">
                    {(['7', '30'] as const).map(r => (
                      <button key={r} onClick={() => setTimeRange(r)}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${timeRange === r ? 'toggle-active' : 'toggle-inactive'}`}>
                        {r}D
                      </button>
                    ))}
                  </div>
                </div>
                <div className="glass-card p-6 rounded-3xl border border-[#1E3A8A]/10">
                  <AnalyticsCharts />
                </div>
              </section>

              {/* Recent Bookings */}
              <section>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h2 className="text-xl font-black text-[#0f172a] dark:text-white tracking-tight">Recent <span className="text-[#64748b]">Bookings</span></h2>
                    <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest mt-0.5">{bookings.length} Requests</p>
                  </div>
                  <button onClick={() => router.push('/admin/orders')}
                    className="flex items-center gap-2 text-[10px] font-black text-[#1E3A8A] dark:text-blue-400 uppercase tracking-widest hover:gap-3 transition-all">
                    View All <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="glass-card rounded-3xl border border-[#1E3A8A]/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                      <thead>
                        <tr className="border-b border-[#1E3A8A]/06">
                          {['Customer', 'Service', 'Scheduled', 'Status'].map(h => (
                            <th key={h} className="px-6 py-4 text-[9px] font-black text-[#64748b] uppercase tracking-[0.2em]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E3A8A]/04">
                        {bookings.slice(0, 6).map((b: any, i) => (
                          <tr key={i} className="hover:bg-[#1E3A8A]/03 dark:hover:bg-white/02 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                  {b.customer?.name?.[0] || '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-[#0f172a] dark:text-white">{b.customer?.name}</p>
                                  <p className="text-[9px] text-[#64748b] font-medium truncate max-w-[160px]">{b.address}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="badge-blue px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{b.serviceType}</span>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-[#475569] tabular-nums">
                              {new Date(b.scheduledDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={b.status} />
                            </td>

                          </tr>
                        ))}
                        {bookings.length === 0 && (
                          <tr><td colSpan={4} className="py-16 text-center text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.3em]">No bookings yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Service Team Preview */}
              <section>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h2 className="text-xl font-black text-[#0f172a] dark:text-white tracking-tight">Service <span className="text-[#64748b]">Team</span></h2>
                    <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest mt-0.5">{technicians.length} Technicians</p>
                  </div>
                  <button onClick={() => router.push('/admin/technicians')}
                    className="flex items-center gap-2 text-[10px] font-black text-[#1E3A8A] dark:text-blue-400 uppercase tracking-widest hover:gap-3 transition-all">
                    Manage Team <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="glass-card rounded-3xl border border-[#1E3A8A]/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead>
                        <tr className="border-b border-[#1E3A8A]/06">
                          {['Technician', 'Rating', 'Status'].map(h => (
                            <th key={h} className="px-6 py-4 text-[9px] font-black text-[#64748b] uppercase tracking-[0.2em]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E3A8A]/04">
                        {technicians.slice(0, 5).map((tech: any, i) => (
                          <tr key={i} className="hover:bg-[#1E3A8A]/03 dark:hover:bg-white/02 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-xl bg-[#E2E8F0] dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-[#1E3A8A]/10">
                                  {tech.profilePic
                                    ? <img src={getImageUrl(tech.profilePic)} className="w-full h-full object-cover" />
                                    : <span className="flex items-center justify-center h-full font-black text-sm text-[#475569]">{tech.name?.[0]}</span>}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-[#0f172a] dark:text-white">{tech.name}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${tech.status === 'Available' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
                                    <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider">{tech.status}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-sm font-black text-[#0f172a] dark:text-white tabular-nums">{tech.rating || '5.0'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={tech.status || 'Unknown'} />
                            </td>
                          </tr>
                        ))}
                        {technicians.length === 0 && (
                          <tr><td colSpan={3} className="py-16 text-center text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.3em]">No technicians found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>

            {/* ── Right Panel ── */}
            <div className="lg:col-span-4">
              <div className="glass-card rounded-3xl border border-[#1E3A8A]/10 p-6 min-h-[600px] flex flex-col sticky top-24">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-widest">Activity Feed</h2>
                  <button onClick={() => router.push('/admin/notifications')}
                    className="text-[9px] font-black text-[#1E3A8A] dark:text-blue-400 uppercase tracking-widest hover:underline">
                    View All
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <NotificationSection />
                </div>
                <button
                  onClick={() => router.push('/admin/notifications')}
                  className="mt-5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-[#1E3A8A]/30 hover:-translate-y-0.5"
                >
                  Open Operations Center
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const AdminDashboardPage = () => (
  <ProtectedRoute allowedRoles={['admin', 'sub-admin']}>
    <AdminHome />
  </ProtectedRoute>
);

export default AdminDashboardPage;
