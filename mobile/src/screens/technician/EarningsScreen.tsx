import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { DollarSign, Award, Target, Zap } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { StatCard } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';

export default function EarningsScreen() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/salary/my'); setStats(d || {}); }
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
          <StatCard icon={<DollarSign color={Colors.success} size={20} />} label="Base Pay" value="₹2,500" color={Colors.success} />
        </View>
        <View style={s.sec}><Text style={s.secT}>Payment History</Text>
          {[1, 2, 3].map(i => (
            <View key={i} style={s.card}>
              <View style={s.cLeft}>
                <Text style={s.cTitle}>Payout processed</Text>
                <Text style={s.cDate}>Week {4 - i} of May 2026</Text>
              </View>
              <Text style={s.cAmt}>+₹3,200</Text>
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
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  hero: { marginHorizontal: 20, backgroundColor: Colors.primary, borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 20, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  heroL: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  heroV: { fontSize: 48, fontWeight: '900', color: '#fff' },
  sr: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  sec: { paddingHorizontal: 20, marginTop: 16 },
  secT: { fontSize: 14, fontWeight: '900', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  cLeft: { flex: 1 },
  cTitle: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cDate: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600', marginTop: 4 },
  cAmt: { fontSize: 16, fontWeight: '900', color: Colors.success },
});
