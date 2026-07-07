import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { Colors } from '../../theme/colors';
import { ShieldCheck, MapPin, Calendar, Clock, ChevronRight } from 'lucide-react-native';
import { fetchWithAuth } from '../../api/client';
import { Badge } from '../../components/ui';

export default function ServiceTicketsScreen({ navigation }: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/service-requests');
      // Technicians only see assigned tickets from the backend. 
      // Filter out completed if we just want active ones, or show all.
      setData(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Service Completed': case 'Closed': return Colors.success;
      case 'Rejected': return Colors.danger;
      default: return Colors.primary;
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <View style={s.hdr}>
        <Text style={s.title}>Service Tickets</Text>
        <Text style={s.sub}>Warranty & AMC Repairs</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={i => i._id}
        contentContainerStyle={{ padding: 20, gap: 14 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => navigation.navigate('TechServiceDetail', { request: item })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={[s.badge, { backgroundColor: getStatusColor(item.status) + '20', borderColor: getStatusColor(item.status) }]}>
                <Text style={[s.badgeT, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
              <Text style={s.typeText}>{item.serviceType}</Text>
            </View>

            <Text style={s.prodName}>{item.installedProduct}</Text>
            
            <View style={s.row}>
              <MapPin color={Colors.fgMuted} size={14} />
              <Text style={s.rowT} numberOfLines={1}>{item.installationAddress}</Text>
            </View>
            <View style={s.row}>
              <Calendar color={Colors.fgMuted} size={14} />
              <Text style={s.rowT}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { padding: 20, paddingTop: 10 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.fgPrimary },
  sub: { fontSize: 14, color: Colors.fgMuted, marginTop: 4 },
  
  card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, elevation: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeT: { fontSize: 11, fontWeight: '800' },
  typeText: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary },
  
  prodName: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  rowT: { fontSize: 13, color: Colors.fgMuted, flex: 1 }
});
