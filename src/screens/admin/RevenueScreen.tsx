import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, Alert, Linking } from 'react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth, getAuthToken } from '../../api/client';
import { Download, IndianRupee, TrendingUp, Briefcase, Award } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function RevenueScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/admin/revenue');
      setData(res);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const token = await getAuthToken();
      const url = `http://localhost:5000/api/admin/export?type=revenue&format=${format}&token=${token}`;
      Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Export Error', 'Could not open export link');
    }
  };

  const statCards = [
    { title: 'Total Revenue', value: data?.totalRevenue || 0, icon: TrendingUp, color: Colors.primary },
    { title: 'Online Orders', value: data?.onlineRevenue || 0, icon: IndianRupee, color: Colors.success },
    { title: 'Offline / Manual Billing', value: data?.offlineRevenue || 0, icon: Briefcase, color: Colors.warning },
    { title: 'Subscriptions', value: data?.subscriptionRevenue || 0, icon: Award, color: Colors.info },
  ];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Revenue Report</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={s.exportBtn} onPress={() => handleExport('excel')}>
            <Download size={16} color="#fff" />
            <Text style={s.exportBtnText}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.exportBtn, { backgroundColor: Colors.danger }]} onPress={() => handleExport('pdf')}>
            <Download size={16} color="#fff" />
            <Text style={s.exportBtnText}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        <View style={s.grid}>
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <View key={idx} style={[s.card, { borderLeftColor: stat.color }]}>
                <View style={[s.iconBox, { backgroundColor: `${stat.color}15` }]}>
                  <Icon size={24} color={stat.color} />
                </View>
                <View>
                  <Text style={s.cardTitle}>{stat.title}</Text>
                  <Text style={s.cardValue}>₹{(stat.value).toLocaleString()}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={s.infoBox}>
          <Text style={s.infoTitle}>About Revenue Tracking</Text>
          <Text style={s.infoDesc}>
            This report aggregates revenue across all completed online orders, offline invoices, and active technician subscriptions. Revenue from pending orders is excluded until marked as Delivered or Completed.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgMain },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.fgPrimary },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  exportBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  content: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 13, color: Colors.fgMuted, marginBottom: 4, fontWeight: '500' },
  cardValue: { fontSize: 20, fontWeight: '700', color: Colors.fgPrimary },
  infoBox: {
    marginTop: 24,
    backgroundColor: '#e0f2fe',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#0369a1', marginBottom: 8 },
  infoDesc: { fontSize: 14, color: '#0c4a6e', lineHeight: 20 },
});
