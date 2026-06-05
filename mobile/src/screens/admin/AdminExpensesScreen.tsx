import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { FileText, CheckCircle, XCircle } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { Badge } from '../../components/ui';

export default function AdminExpensesScreen() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/expenses'); setExpenses(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await fetchWithAuth(`/expenses/${id}/${action}`, { method: 'PATCH', body: JSON.stringify({}) });
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const fmt = (d: string) => { try { return new Date(d).toLocaleDateString(); } catch { return 'N/A'; } };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Field Expenses</Text></View>
      <FlatList data={expenses} keyExtractor={e => e._id} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <View style={s.ic}><FileText color={Colors.primaryLight} size={18} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.tech}>{item.user?.name || 'Technician'}</Text>
                <Text style={s.date}>{fmt(item.createdAt)}</Text>
              </View>
              <Badge label={item.status} color={item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'amber'} />
            </View>
            <View style={s.row}>
              <Text style={s.amt}>₹{item.amount}</Text>
              <Text style={s.type}>{item.type}</Text>
            </View>
            <Text style={s.desc}>{item.description}</Text>
            {item.status === 'pending' && (
              <View style={s.actions}>
                <TouchableOpacity style={s.btn} onPress={() => handleAction(item._id, 'approve')}><CheckCircle color={Colors.success} size={16} /><Text style={s.btnT}>Approve</Text></TouchableOpacity>
                <TouchableOpacity style={[s.btn, { borderColor: Colors.danger + '40' }]} onPress={() => handleAction(item._id, 'reject')}><XCircle color={Colors.danger} size={16} /><Text style={[s.btnT, { color: Colors.danger }]}>Reject</Text></TouchableOpacity>
              </View>
            )}
          </View>
        )} ListEmptyComponent={<Text style={s.emptyT}>No expenses found</Text>} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  card: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ic: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tech: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  date: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600' },
  amt: { fontSize: 18, fontWeight: '900', color: Colors.primaryLight },
  type: { fontSize: 12, fontWeight: '700', color: Colors.fgSecondary, textTransform: 'uppercase' },
  desc: { fontSize: 13, color: Colors.fgDim, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.success + '40', backgroundColor: Colors.bgSurface },
  btnT: { fontSize: 12, fontWeight: '800', color: Colors.success, textTransform: 'uppercase' },
  emptyT: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 }
});
