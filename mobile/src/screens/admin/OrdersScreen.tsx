import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Modal, Alert } from 'react-native';
import { Package, Download, Trash2, Edit2 } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { handleExport } from '../../utils/exportHelper';

const SC: Record<string, string> = { pending: Colors.warning, confirmed: Colors.primary, processing: Colors.info, assigned: Colors.purple, shipped: Colors.purple, delivered: Colors.success, completed: Colors.success, cancelled: Colors.danger };

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]); 
  const [techs, setTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<any>(null);

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

  const handleStatusUpdate = async (status: string) => {
    try {
      await fetchWithAuth(`/orders/${statusModal._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setStatusModal(null);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Order', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await fetchWithAuth(`/orders/${id}`, { method: 'DELETE' });
          load();
        } catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <View>
          <Text style={s.title}>All Orders</Text>
          <Text style={s.count}>{orders.length} total</Text>
        </View>
        <TouchableOpacity style={s.exportBtn} onPress={() => handleExport('/admin/export?type=orders&format=excel', 'orders_report.xlsx')}>
          <Download color={Colors.primary} size={20} />
        </TouchableOpacity>
      </View>
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
            
            <View style={s.actionsRow}>
              {(item.status === 'pending' || item.status === 'confirmed') && (
                <TouchableOpacity style={s.assignBtn} onPress={() => setAssignModal(item._id)}>
                  <Text style={s.assignBtnT}>Assign</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.aBtn} onPress={() => setStatusModal(item)}>
                <Edit2 color={Colors.primary} size={14} /><Text style={s.aBtnT}>Status</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.aBtn, { borderColor: Colors.danger + '40' }]} onPress={() => handleDelete(item._id)}>
                <Trash2 color={Colors.danger} size={14} /><Text style={[s.aBtnT, { color: Colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No orders</Text>} />

      {/* Assignment Modal - ONLY show available techs */}
      <Modal visible={!!assignModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Assign Technician</Text>
            <FlatList data={techs.filter(t => t.status === 'available')} keyExtractor={t => t._id} style={{ maxHeight: 300 }} renderItem={({ item }) => (
              <TouchableOpacity style={s.techRow} onPress={() => handleAssign(assignModal!, item._id)}>
                <Text style={s.techName}>{item.name}</Text>
                <Text style={s.techStatus}>{item.status}</Text>
              </TouchableOpacity>
            )} ListEmptyComponent={<Text style={s.empty}>No technicians currently available.</Text>} />
            <TouchableOpacity style={s.cancelBtn} onPress={() => setAssignModal(null)}><Text style={s.cancelT}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal visible={!!statusModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Update Status</Text>
            {['pending', 'confirmed', 'processing', 'completed', 'cancelled'].map(st => (
              <TouchableOpacity key={st} style={s.techRow} onPress={() => handleStatusUpdate(st)}>
                <Text style={[s.techName, { textTransform: 'capitalize', color: SC[st] || Colors.fgPrimary }]}>{st}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.cancelBtn} onPress={() => setStatusModal(null)}><Text style={s.cancelT}>Cancel</Text></TouchableOpacity>
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
  exportBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
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
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  assignBtn: { flex: 1, backgroundColor: Colors.primaryFaint, paddingVertical: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary + '40' },
  assignBtnT: { color: Colors.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  aBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  aBtnT: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 16 },
  techRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  techName: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary },
  techStatus: { fontSize: 12, color: Colors.success, fontWeight: '700', textTransform: 'capitalize' },
  cancelBtn: { marginTop: 24, alignItems: 'center', paddingVertical: 14 },
  cancelT: { color: Colors.danger, fontSize: 14, fontWeight: '800' },
});
