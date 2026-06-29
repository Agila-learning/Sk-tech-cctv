import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, TextInput, TouchableOpacity, Linking, Modal, Platform, Alert } from 'react-native';
import { Map, Search } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import MapComponent from '../../components/MapComponent';

export default function TrackingScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mapModal, setMapModal] = useState<any>(null);
  const { socket } = useSocket();

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/admin/tracking/live'); setData(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (socket) {
      socket.on('gps_update', (update: any) => {
        setData(prev => {
          const exists = prev.find(i => i.technician?._id === update.technicianId);
          if (exists) {
            return prev.map(i => i.technician?._id === update.technicianId ? { ...i, ...update, locationName: 'Lat: ' + update.lat.toFixed(4) + ' Lng: ' + update.lng.toFixed(4) } : i);
          }
          return [{ technician: { _id: update.technicianId, name: 'Tech #' + update.technicianId.slice(-4) }, locationName: 'Lat: ' + update.lat.toFixed(4) + ' Lng: ' + update.lng.toFixed(4) }, ...prev];
        });
      });
      return () => { socket.off('gps_update'); };
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
          <TouchableOpacity style={s.card} onPress={() => {
            const llat = item.location?.lat || item.lat;
            const llng = item.location?.lng || item.lng;
            if (llat && llng) {
              setMapModal({ ...item, lat: llat, lng: llng });
            } else {
              alert(`Exact location not captured yet for ${item.technician?.name || 'this technician'}. They are currently marked as In Transit.`);
            }
          }}>
            <View style={s.ic}><Map color={Colors.info} size={20} /></View>
            <View style={s.info}>
              <Text style={s.cName}>{item.technician?.name || 'Technician'}</Text>
              <Text style={s.cSub}>
                {item.locationName || (item.location ? `Lat: ${item.location.lat?.toFixed(4)} Lng: ${item.location.lng?.toFixed(4)}` : (item.lat ? `Lat: ${item.lat.toFixed(4)} Lng: ${item.lng.toFixed(4)}` : 'In Transit'))}
                {item.order?._id ? ` • #${item.order._id.slice(-6)}` : ''}
              </Text>
              {(item.location || item.lat) && <Text style={{ fontSize: 11, color: Colors.primaryLight, marginTop: 4, fontWeight: '700' }}>📍 Tap to open Map</Text>}
            </View>
            <Badge label="Live" color="green" />
          </TouchableOpacity>
        )} ListEmptyComponent={<Text style={s.empty}>No active trackers</Text>} />

      <Modal visible={!!mapModal} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={s.modalTitle}>Technician Location</Text>
              <TouchableOpacity onPress={() => setMapModal(null)}><Text style={{ color: Colors.danger, fontWeight: '800' }}>Close</Text></TouchableOpacity>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.fgPrimary, marginBottom: 16 }}>{mapModal?.technician?.name || 'Technician'}</Text>
            
            <View style={{ height: 300, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
              <MapComponent
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: mapModal?.lat || 0,
                  longitude: mapModal?.lng || 0,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                markers={[
                  {
                    coordinate: { latitude: mapModal?.lat || 0, longitude: mapModal?.lng || 0 },
                    title: mapModal?.technician?.name || "Technician",
                    description: "Current Live Location",
                    pinColor: "blue",
                    heading: mapModal?.location?.heading || 0
                  }
                ]}
                routeCoordinates={mapModal?.locationHistory?.map((h: any) => ({ latitude: h.lat, longitude: h.lng })) || []}
              />
            </View>
            <TouchableOpacity style={{ backgroundColor: Colors.infoFaint, padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${mapModal?.lat},${mapModal?.lng}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
              <Map color={Colors.info} size={16} style={{ marginRight: 8 }} />
              <Text style={{ color: Colors.info, fontWeight: '800' }}>Open in Google Maps</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: Colors.fgPrimary, fontSize: 14 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
});
