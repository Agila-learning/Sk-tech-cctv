import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, RefreshControl, Linking } from 'react-native';
import { BarChart, TrendingUp, Download } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { StatCard, Button } from '../../components/ui';
import { fetchWithAuth, API_URL } from '../../api/client';
import { handleExport } from '../../utils/exportHelper';

export default function ReportsScreen() {
  const [stats, setStats] = useState<any>({});
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { 
      setLoading(true); 
      const [d, t] = await Promise.all([fetchWithAuth('/admin/stats'), fetchWithAuth('/admin/technicians')]); 
      setStats(d?.summary || {}); 
      setTopPerformers((t || []).sort((a: any, b: any) => (b.completedOrdersCount || 0) - (a.completedOrdersCount || 0)).slice(0, 3));
    }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleExportClick = async () => {
    try {
      setLoading(true);
      await handleExport('/admin/export?type=revenue&format=excel', 'Revenue_Report.xlsx');
    } catch (e: any) {
      alert('Export failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Reports</Text>
        <Button title="Export" icon={<Download color="#fff" size={16} />} size="sm" onPress={handleExportClick} />
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <View style={s.cTop}><BarChart color={Colors.primary} size={24} /><Text style={s.cT}>Revenue Overview</Text></View>
          <Text style={s.cV}>₹{(stats.totalRevenue || 0).toLocaleString()}</Text>
          <Text style={s.cSub}>Total revenue generated this month</Text>
        </View>
        <View style={s.sr}>
          <StatCard icon={<TrendingUp color={Colors.success} size={20} />} label="Growth" value="+12.4%" color={Colors.success} />
          <StatCard icon={<TrendingUp color={Colors.warning} size={20} />} label="Avg Order" value="₹12.5k" color={Colors.warning} />
        </View>
        <View style={s.card2}>
          <Text style={s.c2T}>Top Performers</Text>
          {topPerformers.map((tech, i) => (
            <View key={tech._id || i} style={s.pRow}>
              <Text style={s.pNum}>{i + 1}</Text><Text style={s.pName}>{tech.name}</Text>
              <Text style={s.pScore}>{tech.rating || '4.5'} ★</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  card: { marginHorizontal: 20, backgroundColor: Colors.bgSurface, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, padding: 24, marginBottom: 16 },
  cTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cT: { fontSize: 14, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1 },
  cV: { fontSize: 36, fontWeight: '900', color: Colors.fgPrimary },
  cSub: { fontSize: 12, color: Colors.fgDim, fontWeight: '600', marginTop: 8 },
  sr: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  card2: { marginHorizontal: 20, backgroundColor: Colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, padding: 20 },
  c2T: { fontSize: 14, fontWeight: '900', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  pRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pNum: { fontSize: 12, fontWeight: '900', color: Colors.fgDim, width: 24 },
  pName: { flex: 1, fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  pScore: { fontSize: 14, fontWeight: '900', color: Colors.warning },
});
