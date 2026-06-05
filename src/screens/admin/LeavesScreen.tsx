import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, TouchableOpacity, Modal, Alert } from 'react-native';
import { Calendar, X, Trash2, Edit2 } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';

export default function LeavesScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/internal/leave'); setData(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await fetchWithAuth(`/internal/leave/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setSelected(null);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Request', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await fetchWithAuth(`/internal/leave/${id}`, { method: 'DELETE' }); setSelected(null); load(); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Leave Requests</Text></View>
      <FlatList data={data} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => setSelected(item)}>
            <View style={s.ic}><Calendar color={item.status === 'approved' ? Colors.success : item.status === 'rejected' ? Colors.danger : Colors.warning} size={20} /></View>
            <View style={s.info}>
              <Text style={s.cName}>{item.technician?.name || 'Staff'}</Text>
              <Text style={s.cSub}>{item.reason || 'Leave Request'} • {item.status || 'pending'}</Text>
            </View>
          </TouchableOpacity>
        )} ListEmptyComponent={<Text style={s.empty}>No leave requests</Text>} />

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.mHdr}>
              <Text style={s.mT}>Leave Details</Text>
              <TouchableOpacity onPress={() => setSelected(null)}><X color={Colors.fgPrimary} size={24} /></TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={s.dLabel}>Staff Name</Text><Text style={s.dVal}>{selected?.technician?.name || 'Staff'}</Text>
              <Text style={s.dLabel}>Reason</Text><Text style={s.dVal}>{selected?.reason || 'Not provided'}</Text>
              <Text style={s.dLabel}>Dates</Text><Text style={s.dVal}>{selected?.startDate ? new Date(selected.startDate).toLocaleDateString() : 'N/A'} - {selected?.endDate ? new Date(selected.endDate).toLocaleDateString() : 'N/A'}</Text>
              <Text style={s.dLabel}>Status</Text><Text style={s.dVal}>{selected?.status || 'Pending'}</Text>
              
              <Text style={[s.dLabel, { marginTop: 20, marginBottom: 10 }]}>Update Status</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[s.sBtn, { backgroundColor: Colors.success+'15', borderColor: Colors.success+'40' }]} onPress={() => handleStatusUpdate(selected._id, 'approved')}><Text style={[s.sBtnT, { color: Colors.success }]}>Approve</Text></TouchableOpacity>
                <TouchableOpacity style={[s.sBtn, { backgroundColor: Colors.danger+'15', borderColor: Colors.danger+'40' }]} onPress={() => handleStatusUpdate(selected._id, 'rejected')}><Text style={[s.sBtnT, { color: Colors.danger }]}>Reject</Text></TouchableOpacity>
              </View>
              
              <TouchableOpacity style={s.dltBtn} onPress={() => handleDelete(selected._id)}>
                <Trash2 color={Colors.danger} size={16} /><Text style={s.dltBtnT}>Delete Request</Text>
              </TouchableOpacity>
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
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 30 },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mT: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  dLabel: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700', textTransform: 'uppercase', marginTop: 12 },
  dVal: { fontSize: 16, color: Colors.fgPrimary, fontWeight: '600', marginTop: 4 },
  sBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  sBtnT: { fontWeight: '800' },
  dltBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, padding: 14, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12 },
  dltBtnT: { color: Colors.danger, fontWeight: '800' }
});
