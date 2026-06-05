import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, TextInput } from 'react-native';
import { Map, Search } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import { useSocket } from '../../context/SocketContext';

export default function TrackingScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { socket } = useSocket();

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/admin/tracking/live'); setData(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (socket) {
      socket.on('tech_location_update', (update: any) => {
        setData(prev => {
          const exists = prev.find(i => i.technician?._id === update.technicianId);
          if (exists) {
            return prev.map(i => i.technician?._id === update.technicianId ? { ...i, ...update, locationName: 'Lat: ' + update.lat.toFixed(4) + ' Lng: ' + update.lng.toFixed(4) } : i);
          }
          return [{ technician: { _id: update.technicianId, name: 'Tech #' + update.technicianId.slice(-4) }, locationName: 'Lat: ' + update.lat.toFixed(4) + ' Lng: ' + update.lng.toFixed(4) }, ...prev];
        });
      });
      return () => { socket.off('tech_location_update'); };
    }
  }, [socket]);

  const filteredData = data.filter(d => 
    (d.technician?.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (d.order?._id || '').toLowerCase().includes(search.toLowerCase()) ||
    (d._id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>Live Tracking</Text>
        <View style={s.searchBox}>
          <Search color={Colors.fgMuted} size={18} />
          <TextInput style={s.searchInput} placeholder="Search Tech or Order ID..." placeholderTextColor={Colors.fgMuted} value={search} onChangeText={setSearch} />
        </View>
      </View>
      <FlatList data={filteredData} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.ic}><Map color={Colors.info} size={20} /></View>
            <View style={s.info}>
              <Text style={s.cName}>{item.technician?.name || 'Technician'}</Text>
              <Text style={s.cSub}>{item.locationName || 'In Transit'} {item.order?._id ? `• #${item.order._id.slice(-6)}` : ''}</Text>
            </View>
            <Badge label="Live" color="green" />
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No active trackers</Text>} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, marginTop: 12 },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: Colors.fgPrimary, fontSize: 14 }
});
