import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Modal, Alert } from 'react-native';
import { Package } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';

const SC: Record<string, string> = { pending: Colors.warning, confirmed: Colors.primary, processing: Colors.info, shipped: Colors.purple, delivered: Colors.success, completed: Colors.success, cancelled: Colors.danger };

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]); 
  const [techs, setTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState<string | null>(null);

  const load = async () => { 
    try { 
      setLoading(true); 
      const [d, t] = await Promise.all([fetchWithAuth('/orders/all'), fetchWithAuth('/availability/technicians')]); 
      setOrders(d || []); setTechs(t || []);
    } catch (e) { console.error(e); } finally { setLoading(false); } 
  };
  useEffect(() => { load(); }, []);
  const fmt = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch { return 'N/A'; } };

  const handleAssign = async (orderId: string, techId: string) => {
    try {
      await fetchWithAuth(`/orders/assign/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ technicianId: techId, dueDate: new Date().toISOString(), timeToComplete: 2 })
      });
      setAssignModal(null);
      load();
      Alert.alert('Success', 'Order assigned successfully!');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>All Orders</Text><Text style={s.count}>{orders.length} total</Text></View>
      <FlatList data={orders} keyExtractor={o => o._id} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <View style={s.ic}><Package color={Colors.primaryLight} size={18} /></View>
              <View style={{ flex: 1 }}><Text style={s.id}>#{item._id?.slice(-6)}</Text><Text style={s.cust}>{item.customer?.name || 'Customer'}</Text></View>
              <View style={[s.badge, { backgroundColor: (SC[item.status] || Colors.fgMuted) + '20' }]}><Text style={[s.badgeT, { color: SC[item.status] || Colors.fgMuted }]}>{item.status}</Text></View>
            </View>
            <View style={s.row}>
              <Text style={s.date}>{fmt(item.createdAt)}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.price}>₹{item.totalAmount?.toLocaleString()}</Text>
                {item.technician?.name && (
                  <Text style={{ fontSize: 10, color: Colors.primaryLight, fontWeight: '800', marginTop: 2, textTransform: 'uppercase' }}>
                    TECH: {item.technician.name}
                  </Text>
                )}
              </View>
            </View>
            {(item.status === 'pending' || item.status === 'confirmed') && (
              <TouchableOpacity style={s.assignBtn} onPress={() => setAssignModal(item._id)}>
                <Text style={s.assignBtnT}>Assign Technician</Text>
              </TouchableOpacity>
            )}
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No orders</Text>} />

      {/* Assignment Modal */}
      <Modal visible={!!assignModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Assign Technician</Text>
            <FlatList data={techs} keyExtractor={t => t._id} style={{ maxHeight: 300 }} renderItem={({ item }) => (
              <TouchableOpacity style={s.techRow} onPress={() => handleAssign(assignModal!, item._id)}>
                <Text style={s.techName}>{item.name}</Text>
                <Text style={s.techStatus}>{item.status}</Text>
              </TouchableOpacity>
            )} />
            <TouchableOpacity style={s.cancelBtn} onPress={() => setAssignModal(null)}><Text style={s.cancelT}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  count: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ic: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  id: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cust: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeT: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  date: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600' },
  price: { fontSize: 16, fontWeight: '900', color: Colors.primaryLight },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  assignBtn: { marginTop: 12, backgroundColor: Colors.primaryFaint, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary + '40' },
  assignBtnT: { color: Colors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 16 },
  techRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  techName: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary },
  techStatus: { fontSize: 12, color: Colors.success, fontWeight: '700', textTransform: 'capitalize' },
  cancelBtn: { marginTop: 24, alignItems: 'center', paddingVertical: 14 },
  cancelT: { color: Colors.danger, fontSize: 14, fontWeight: '800' },
});
