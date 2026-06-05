import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl } from 'react-native';
import { UserCheck } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';

export default function AvailabilityScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/availability/technicians'); setData(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Availability</Text></View>
      <FlatList data={data} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <View style={s.ic}><UserCheck color={Colors.primaryLight} size={20} /></View>
              <View style={s.info}>
                <Text style={s.cName}>{item.name || 'Technician'}</Text>
                <Text style={s.cSub}>{item.skills?.length ? item.skills.join(', ') : 'General Technician'}</Text>
              </View>
              <Badge 
                label={item.status || 'available'} 
                color={item.status === 'available' ? 'green' : item.status === 'on_leave' ? 'red' : 'amber'} 
              />
            </View>
            {item.reason && (
              <View style={s.reasonBox}>
                <Text style={s.reasonT}>{item.reason}</Text>
              </View>
            )}
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No availability data</Text>} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4, marginRight: 8 },
  cName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600', textTransform: 'capitalize' },
  reasonBox: { marginTop: 12, padding: 10, backgroundColor: Colors.bgSurface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  reasonT: { fontSize: 11, color: Colors.warning, fontWeight: '700' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 }
});
