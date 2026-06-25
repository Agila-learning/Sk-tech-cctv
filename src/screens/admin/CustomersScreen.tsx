import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { User, Edit2, Trash2, X, Plus, Activity, Download, Search } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { handleExport } from '../../utils/exportHelper';
import { Button } from '../../components/ui';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [search, setSearch] = useState('');

  const [historyModal, setHistoryModal] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const openHistory = async (cust: any) => {
    setHistoryModal(cust);
    try {
      const data = await fetchWithAuth(`/admin/customers/${cust._id}/orders`);
      setHistoryData(data || []);
    } catch (e) { console.error(e); }
  };

  const load = async () => {
    try {
      setLoading(true);
      const d = await fetchWithAuth('/admin/customers');
      setCustomers(d || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openForm = (cust?: any) => {
    if (cust) { 
      setEditingCustomer(cust); 
      setForm({ name: cust.name, email: cust.email, phone: cust.phone || '', address: cust.address || '' }); 
    } else {
      setEditingCustomer(null);
      setForm({ name: '', email: '', phone: '', address: '' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      Alert.alert('Error', 'Name and Email are required');
      return;
    }
    try {
      setLoading(true);
      if (editingCustomer) {
        await fetchWithAuth(`/admin/customers/${editingCustomer._id}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await fetchWithAuth('/admin/customers', { method: 'POST', body: JSON.stringify(form) });
      }
      setModalVisible(false);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Customer', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await fetchWithAuth(`/admin/customers/${id}`, { method: 'DELETE' });
          load();
        } catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  const filteredCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (c.phone || '').includes(search) || 
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Customers</Text>
          <Text style={s.count}>{customers.length} registered</Text>
        </View>
        <TouchableOpacity style={s.exportBtn} onPress={() => handleExport('/admin/export?type=customers&format=excel', 'customers_report.xlsx')}>
          <Download color={Colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12 }}>
          <Search color={Colors.fgMuted} size={18} />
          <TextInput style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: Colors.fgPrimary, fontSize: 14 }} placeholder="Search name, email, or phone..." placeholderTextColor={Colors.fgMuted} value={search} onChangeText={setSearch} />
        </View>
      </View>
      
      <FlatList data={filteredCustomers} keyExtractor={c => c._id} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <View style={s.av}><User color={Colors.primaryLight} size={20} /></View>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                <Text style={s.email} numberOfLines={1}>{item.email}</Text>
              </View>
            </View>
            <View style={[s.row, { marginTop: 8 }]}>
              <Text style={s.info} numberOfLines={1}>{item.phone || 'No phone'}</Text>
              <Text style={[s.info, { flex: 2, textAlign: 'right' }]} numberOfLines={1}>{item.address || 'No address'}</Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={s.actBtn} onPress={() => openHistory(item)}>
                <Activity color={Colors.primary} size={14} />
                <Text style={s.actBtnT}>History</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actBtn} onPress={() => openForm(item)}>
                <Edit2 color={Colors.primary} size={14} />
                <Text style={s.actBtnT}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actBtn, { borderColor: Colors.danger + '40', backgroundColor: Colors.danger + '10' }]} onPress={() => handleDelete(item._id)}>
                <Trash2 color={Colors.danger} size={14} />
                <Text style={[s.actBtnT, { color: Colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No customers found</Text>} />

      <TouchableOpacity style={s.fab} onPress={() => openForm()}>
        <Plus color="#fff" size={24} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <View style={s.mHdr}><Text style={s.mTitle}>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity></View>
            
            <TextInput style={s.input} placeholder="Full Name" placeholderTextColor={Colors.fgDim} value={form.name} onChangeText={t => setForm({...form, name: t})} />
            <TextInput style={s.input} placeholder="Email" placeholderTextColor={Colors.fgDim} value={form.email} onChangeText={t => setForm({...form, email: t})} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={s.input} placeholder="Phone" placeholderTextColor={Colors.fgDim} value={form.phone} onChangeText={t => setForm({...form, phone: t})} keyboardType="phone-pad" />
            <TextInput style={s.input} placeholder="Address" placeholderTextColor={Colors.fgDim} value={form.address} onChangeText={t => setForm({...form, address: t})} />
            
            <Button title={editingCustomer ? "Save Changes" : "Create Customer"} onPress={handleSave} loading={loading} style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>

      <Modal visible={!!historyModal} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={[s.modalContainer, { height: '85%' }]}>
            <View style={s.mHdr}><Text style={s.mTitle}>{historyModal?.name}'s History</Text><TouchableOpacity onPress={() => setHistoryModal(null)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity></View>
            
            <FlatList data={historyData} keyExtractor={o => o._id} 
              contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={{ padding: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: '800', color: Colors.fgPrimary }}>#{item._id.slice(-6)}</Text>
                    <Text style={{ color: Colors.primaryLight, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>{item.status}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: Colors.fgMuted, marginVertical: 4 }}>Date: {new Date(item.createdAt).toLocaleDateString()}</Text>
                  <Text style={{ fontSize: 12, color: Colors.fgPrimary }}>Tech: {item.technician?.name || 'Unassigned'}</Text>
                  {item.feedback?.rating && (
                    <View style={{ marginTop: 8, padding: 8, backgroundColor: Colors.bgSurface, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.warning }}>Rating: {item.feedback.rating}/5</Text>
                      <Text style={{ fontSize: 11, color: Colors.fgMuted, marginTop: 2 }}>"{item.feedback.comment}"</Text>
                    </View>
                  )}
                  {item.followUp?.required && (
                    <View style={{ marginTop: 8, padding: 8, backgroundColor: Colors.danger + '20', borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.danger }}>Follow-up: {item.followUp.status}</Text>
                      <Text style={{ fontSize: 11, color: Colors.danger, marginTop: 2 }}>{item.followUp.note}</Text>
                    </View>
                  )}
                </View>
              )} ListEmptyComponent={<Text style={s.empty}>No order history</Text>} />
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
  exportBtn: { backgroundColor: Colors.primaryFaint, padding: 10, borderRadius: 12 },
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  av: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { fontSize: 15, fontWeight: '800', color: Colors.fgPrimary },
  email: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600', marginTop: 2 },
  info: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', flex: 1 },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  actBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  actBtnT: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, zIndex: 1000 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  mTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 50, color: Colors.fgPrimary },
});
