import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl } from 'react-native';
import { User } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';

export default function TechniciansScreen() {
  const [techs, setTechs] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const load = async () => { try { setLoading(true); const d = await fetchWithAuth('/admin/technicians'); setTechs(d || []); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Technicians</Text><Text style={s.count}>{techs.length} active</Text></View>
      <FlatList data={techs} keyExtractor={t => t._id} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}><View style={s.row}>
            <View style={s.av}><User color={Colors.primaryLight} size={20} /></View>
            <View style={{ flex: 1 }}><Text style={s.name}>{item.name}</Text><Text style={s.email}>{item.email}</Text></View>
            <View style={[s.dot, { backgroundColor: item.isOnline ? Colors.success : Colors.fgDim }]} />
          </View>
            <View style={s.row}><Text style={s.info}>{item.phone || 'No phone'}</Text>
              <View style={[s.badge, { backgroundColor: item.availabilityStatus === 'Available' ? Colors.successFaint : Colors.dangerFaint }]}>
                <Text style={[s.badgeT, { color: item.availabilityStatus === 'Available' ? Colors.success : Colors.danger }]}>{item.availabilityStatus || 'Offline'}</Text>
              </View></View>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No technicians found</Text>} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  count: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  av: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { fontSize: 15, fontWeight: '800', color: Colors.fgPrimary },
  email: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600', marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  info: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeT: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
});
