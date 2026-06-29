import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, Modal, TextInput, TouchableOpacity, Alert, Linking } from 'react-native';
import { User, Edit2, Trash2, X, Plus, Phone } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { Button } from '../../components/ui';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

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
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingCustomer) return;
    try {
      setLoading(true);
      await fetchWithAuth(`/admin/customers/${editingCustomer._id}`, { method: 'PATCH', body: JSON.stringify(form) });
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

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <View>
          <Text style={s.title}>Customers</Text>
          <Text style={s.count}>{customers.length} registered</Text>
        </View>
      </View>
      
      <FlatList data={customers} keyExtractor={c => c._id} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
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
              {item.phone ? (
                <TouchableOpacity style={[s.actBtn, { borderColor: Colors.success + '40' }]} onPress={() => Linking.openURL(`tel:${item.phone.replace(/\D/g, '')}`)}><Phone color={Colors.success} size={14} /><Text style={[s.actBtnT, { color: Colors.success }]}>Call</Text></TouchableOpacity>
              ) : null}
              <TouchableOpacity style={s.actBtn} onPress={() => openForm(item)}><Edit2 color={Colors.primary} size={14} /><Text style={s.actBtnT}>Edit</Text></TouchableOpacity>
              <TouchableOpacity style={[s.actBtn, { borderColor: Colors.danger + '40' }]} onPress={() => handleDelete(item._id)}><Trash2 color={Colors.danger} size={14} /><Text style={[s.actBtnT, { color: Colors.danger }]}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No customers found</Text>} />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <View style={s.mHdr}><Text style={s.mTitle}>Edit Customer</Text><TouchableOpacity onPress={() => setModalVisible(false)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity></View>
            
            <TextInput style={s.input} placeholder="Full Name" placeholderTextColor={Colors.fgDim} value={form.name} onChangeText={t => setForm({...form, name: t})} />
            <TextInput style={s.input} placeholder="Email" placeholderTextColor={Colors.fgDim} value={form.email} onChangeText={t => setForm({...form, email: t})} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={s.input} placeholder="Phone" placeholderTextColor={Colors.fgDim} value={form.phone} onChangeText={t => setForm({...form, phone: t})} keyboardType="phone-pad" />
            <TextInput style={s.input} placeholder="Address" placeholderTextColor={Colors.fgDim} value={form.address} onChangeText={t => setForm({...form, address: t})} />
            
            <Button title="Save Changes" onPress={handleSave} loading={loading} style={{ marginTop: 10 }} />
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
  row: { flexDirection: 'row', alignItems: 'center' },
  av: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { fontSize: 15, fontWeight: '800', color: Colors.fgPrimary },
  email: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600', marginTop: 2 },
  info: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', flex: 1 },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  actBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  actBtnT: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 50, color: Colors.fgPrimary },
});
