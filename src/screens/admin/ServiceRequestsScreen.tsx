import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, TouchableOpacity, Modal, Alert } from 'react-native';
import { Hammer, X, Trash2, Edit2 } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';

export default function ServiceRequestsScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    try { 
      setLoading(true); 
      let d = null;
      try {
        d = await fetchWithAuth('/bookings/admin/all');
      } catch(err) {
        d = await fetchWithAuth('/orders/all');
        d = (d || []).filter((o: any) => o.serviceType || o.orderType === 'offline' || o.status === 'pending');
      }
      setData(d || []); 
    }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await fetchWithAuth(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setSelected(null);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Request', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await fetchWithAuth(`/bookings/${id}`, { method: 'DELETE' }); setSelected(null); load(); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Service Requests</Text></View>
      <FlatList data={data} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => setSelected(item)}>
            <View style={s.ic}><Hammer color={Colors.info} size={20} /></View>
            <View style={s.info}>
              <Text style={s.cName}>{item.serviceType || 'Service'}</Text>
              <Text style={s.cSub}>{item.customerName || 'Customer'} • {item.status || 'Pending'}</Text>
            </View>
          </TouchableOpacity>
        )} ListEmptyComponent={<Text style={s.empty}>No service requests</Text>} />

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.mHdr}>
              <Text style={s.mT}>Request Details</Text>
              <TouchableOpacity onPress={() => setSelected(null)}><X color={Colors.fgPrimary} size={24} /></TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={s.dLabel}>Service</Text><Text style={s.dVal}>{selected?.serviceType}</Text>
              <Text style={s.dLabel}>Customer</Text><Text style={s.dVal}>{selected?.customerName}</Text>
              <Text style={s.dLabel}>Contact</Text><Text style={s.dVal}>{selected?.contactNumber}</Text>
              <Text style={s.dLabel}>Address</Text><Text style={s.dVal}>{selected?.address}</Text>
              <Text style={s.dLabel}>Status</Text><Text style={s.dVal}>{selected?.status}</Text>
              
              <Text style={[s.dLabel, { marginTop: 20, marginBottom: 10 }]}>Update Status</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={s.sBtn} onPress={() => handleStatusUpdate(selected._id, 'in_progress')}><Text style={s.sBtnT}>In Progress</Text></TouchableOpacity>
                <TouchableOpacity style={s.sBtn} onPress={() => handleStatusUpdate(selected._id, 'completed')}><Text style={s.sBtnT}>Completed</Text></TouchableOpacity>
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
  sBtn: { flex: 1, backgroundColor: Colors.primaryFaint, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary+'40' },
  sBtnT: { color: Colors.primary, fontWeight: '800' },
  dltBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, padding: 14, backgroundColor: Colors.danger+'15', borderRadius: 12 },
  dltBtnT: { color: Colors.danger, fontWeight: '800' }
});
