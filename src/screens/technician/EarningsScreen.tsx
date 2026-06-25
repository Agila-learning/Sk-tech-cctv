import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { DollarSign, Award, Target, Zap } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { StatCard } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';

export default function EarningsScreen() {
  const [stats, setStats] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { 
      setLoading(true); 
      const [sData, hData] = await Promise.all([
        fetchWithAuth('/technician/stats'),
        fetchWithAuth('/salary/my')
      ]);
      setStats(sData || {}); 
      setHistory(Array.isArray(hData) ? hData : []);
    }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>My Earnings</Text></View>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Text style={s.heroL}>Total Earnings (Weekly)</Text>
          <Text style={s.heroV}>{stats.weeklyEarnings || '₹0'}</Text>
        </View>
        <View style={s.sr}>
          <StatCard icon={<Award color={Colors.warning} size={20} />} label="Bonus" value="₹500" color={Colors.warning} />
          <StatCard icon={<Target color={Colors.primary} size={20} />} label="Incentive" value="₹200" color={Colors.primary} />
        </View>
        <View style={s.sr}>
          <StatCard icon={<Zap color={Colors.info} size={20} />} label="Jobs Done" value={stats.completedJobs || 0} color={Colors.info} />
          <StatCard icon={<DollarSign color={Colors.success} size={20} />} label="Est. Bonus" value="₹500" color={Colors.success} />
        </View>
        <View style={s.sec}><Text style={s.secT}>Payment History</Text>
          {history.map((h, i) => (
            <View key={h._id || i} style={s.card}>
              <View style={s.cLeft}>
                <Text style={s.cTitle}>{h.status === 'paid' ? 'Payout processed' : 'Pending payout'}</Text>
                <Text style={s.cDate}>{h.month || 'Current Cycle'} • {h.cycle || 'Monthly'}</Text>
              </View>
              <Text style={s.cAmt}>+₹{h.netSalary?.toLocaleString() || 0}</Text>
            </View>
          ))}
          {history.length === 0 && (
            <Text style={{ textAlign: 'center', color: Colors.fgDim, marginTop: 20 }}>No payment history available.</Text>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  hero: { marginHorizontal: 20, backgroundColor: Colors.primary, borderRadius: 32, padding: 36, alignItems: 'center', marginBottom: 24, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 15 },
  heroL: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  heroV: { fontSize: 52, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  sr: { flexDirection: 'row', paddingHorizontal: 20, gap: 16, marginBottom: 16 },
  sec: { paddingHorizontal: 20, marginTop: 24 },
  secT: { fontSize: 16, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 16 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  cLeft: { flex: 1 },
  cTitle: { fontSize: 15, fontWeight: '800', color: Colors.fgPrimary },
  cDate: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', marginTop: 6 },
  cAmt: { fontSize: 18, fontWeight: '900', color: Colors.success },
});
