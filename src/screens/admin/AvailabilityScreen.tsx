import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { UserCheck, X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge, Button } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import { useSocket } from '../../context/SocketContext';

export default function AvailabilityScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ status: 'available', reason: '' });
  const { socket } = useSocket();

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/availability/technicians'); setData(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (socket) {
      socket.on('user_status_change', load);
      socket.on('tech_status_updated', load);
      return () => {
        socket.off('user_status_change', load);
        socket.off('tech_status_updated', load);
      };
    }
  }, [socket]);

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      setLoading(true);
      await fetchWithAuth(`/availability/${selected._id}`, { method: 'PUT', body: JSON.stringify(form) });
      setSelected(null);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item: any) => {
    setSelected(item);
    setForm({ status: item.status || 'available', reason: item.reason || '' });
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Availability</Text></View>
      <FlatList data={data} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => openModal(item)}>
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
          </TouchableOpacity>
        )} ListEmptyComponent={<Text style={s.empty}>No availability data</Text>} />

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.mHdr}>
              <Text style={s.mT}>Update Availability</Text>
              <TouchableOpacity onPress={() => setSelected(null)}><X color={Colors.fgPrimary} size={24} /></TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={{color: Colors.fgMuted, marginBottom: 8}}>Status:</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {['available', 'busy', 'on_leave'].map(st => (
                  <TouchableOpacity key={st} style={[s.cycleBtn, form.status === st && s.cycleBtnActive]} onPress={() => setForm({...form, status: st})}>
                    <Text style={[s.cycleBtnT, form.status === st && {color: '#fff'}]}>{st.replace('_', ' ').toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={{color: Colors.fgMuted, marginBottom: 8}}>Reason (Optional):</Text>
              <TextInput style={s.input} placeholder="E.g., Personal work, sick leave" placeholderTextColor={Colors.fgMuted} value={form.reason} onChangeText={t => setForm({...form, reason: t})} />
              
              <View style={s.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setSelected(null)} style={{ flex: 1 }} />
                <Button title="Save" onPress={handleUpdate} style={{ flex: 1 }} />
              </View>
            </View>
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
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4, marginRight: 8 },
  cName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600', textTransform: 'capitalize' },
  reasonBox: { marginTop: 12, padding: 10, backgroundColor: Colors.bgSurface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  reasonT: { fontSize: 11, color: Colors.warning, fontWeight: '700' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 30 },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mT: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  cycleBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, alignItems: 'center' },
  cycleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cycleBtnT: { color: Colors.fgPrimary, fontWeight: '700', fontSize: 12 },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.fgPrimary, marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12 }
});
