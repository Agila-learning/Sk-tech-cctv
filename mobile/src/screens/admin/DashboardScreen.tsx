import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, RefreshControl, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, Activity, Bell } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors } from '../../theme/colors';
import { StatCard } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashScreen({ navigation }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const load = async () => {
    try { setLoading(true);
      const [s, o] = await Promise.all([fetchWithAuth('/admin/dashboard-summary'), fetchWithAuth('/orders/all')]);
      setStats(s || {}); setRecentOrders((o || []).slice(0, 5));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch { return 'N/A'; } };
  const statusColor: Record<string, string> = { pending: Colors.warning, confirmed: Colors.primary, processing: Colors.info, delivered: Colors.success, completed: Colors.success, cancelled: Colors.danger };
  
  const screenWidth = Dimensions.get('window').width;
  const chartConfig = {
    backgroundGradientFrom: Colors.bgCard,
    backgroundGradientTo: Colors.bgCard,
    color: (opacity = 1) => `rgba(20, 184, 166, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  return (
    <View style={s2.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
        <View style={s2.hdr}>
          <View><View style={s2.tagRow}><Activity color={Colors.primary} size={12} /><Text style={s2.tag}>ADMIN HQ</Text></View>
            <Text style={s2.name}>{user?.name || 'Admin'}</Text></View>
          <TouchableOpacity style={s2.bellBtn} onPress={() => Alert.alert('Notifications', 'You have no new alerts.')}><Bell color={Colors.fgMuted} size={20} /></TouchableOpacity>
        </View>
        <View style={s2.sr}>
          <StatCard icon={<ShoppingCart color={Colors.primary} size={20} />} label="Orders" value={stats.stats?.summary?.pendingOrders || 0} color={Colors.primary} onPress={() => navigation.navigate('AdminOrders')} />
          <StatCard icon={<DollarSign color={Colors.success} size={20} />} label="Revenue" value={`₹${(stats.stats?.summary?.totalRevenue || 0).toLocaleString()}`} color={Colors.success} />
        </View>
        <View style={s2.sr}>
          <StatCard icon={<Users color={Colors.info} size={20} />} label="Technicians" value={stats.stats?.summary?.totalTechs || 0} color={Colors.info} onPress={() => navigation.navigate('AdminTechs')} />
          <StatCard icon={<Package color={Colors.warning} size={20} />} label="Active Jobs" value={stats.stats?.summary?.activeStreams || 0} color={Colors.warning} onPress={() => navigation.navigate('AdminTracking')} />
        </View>

        <View style={s2.chartSec}>
          <Text style={s2.secT}>Revenue Trend</Text>
          <LineChart data={{ labels: stats.stats?.revenueLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ data: stats.stats?.revenueGrowth || [0, 0, 0, 0, 0, 0] }] }} width={screenWidth - 40} height={220} chartConfig={chartConfig} bezier style={s2.chart} />
        </View>

        <View style={s2.chartSec}>
          <Text style={s2.secT}>Orders This Week</Text>
          <BarChart data={{ labels: stats.stats?.revenueLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ data: stats.stats?.revenueGrowth || [0, 0, 0, 0, 0, 0, 0] }] }} width={screenWidth - 40} height={220} chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})` }} style={s2.chart} yAxisLabel="" yAxisSuffix="" />
        </View>

        <View style={s2.sec}><Text style={s2.secT}>Recent Orders</Text>
          {recentOrders.slice(0, 5).map(o => (
            <View key={o._id} style={s2.oCard}>
              <View style={s2.oRow}><Text style={s2.oId}>#{o._id?.slice(-6)}</Text>
                <View style={[s2.oBadge, { backgroundColor: (statusColor[o.status] || Colors.fgMuted) + '20' }]}><Text style={[s2.oBadgeT, { color: statusColor[o.status] || Colors.fgMuted }]}>{o.status}</Text></View></View>
              <View style={s2.oRow}><Text style={s2.oDate}>{fmtDate(o.createdAt)}</Text><Text style={s2.oPrice}>₹{o.totalAmount?.toLocaleString()}</Text></View>
            </View>
          ))}
          {recentOrders.length === 0 && <Text style={s2.empty}>No orders yet</Text>}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s2 = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  tag: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 3 },
  name: { fontSize: 26, fontWeight: '900', color: Colors.fgPrimary },
  bellBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sr: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  chartSec: { paddingHorizontal: 20, marginTop: 12 },
  chart: { marginVertical: 8, borderRadius: 16 },
  sec: { paddingHorizontal: 20, marginTop: 12, gap: 10 },
  secT: { fontSize: 14, fontWeight: '900', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  oCard: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10 },
  oRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  oId: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  oBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  oBadgeT: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  oDate: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600' },
  oPrice: { fontSize: 16, fontWeight: '900', color: Colors.primaryLight },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 20 },
});
