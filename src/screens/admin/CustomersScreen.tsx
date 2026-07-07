import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, Modal, TextInput, TouchableOpacity, Alert, Linking } from 'react-native';
import { User, Edit2, Trash2, X, Plus, Activity, Download, Search, Phone } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth, API_URL } from '../../api/client';
import { Button } from '../../components/ui';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', alternatePhone: '', notes: '', warrantyPeriod: '12 Months' });
  const [search, setSearch] = useState('');
  const [detailsModal, setDetailsModal] = useState<any>(null);

  const [historyModal, setHistoryModal] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const openHistory = async (cust: any) => {
    setHistoryModal(cust);
    setHistoryData([]);
    try {
      let data: any[] = [];
      try {
        data = await fetchWithAuth(`/admin/customers/${cust._id}/orders`);
      } catch {
        // Fallback: fetch all orders and filter by customer ID, phone, or name
        const all = await fetchWithAuth('/orders/all').catch(() => []);
        data = (all || []).filter((o: any) =>
          o.customer?._id === cust._id ||
          o.customer === cust._id ||
          o.contactNumber === cust.phone ||
          (o.customerName || '').toLowerCase() === (cust.name || '').toLowerCase()
        );
      }
      setHistoryData(data || []);
    } catch (e) { console.error(e); }
  };

  const load = async () => {
    try { setLoading(true); const res = await fetchWithAuth('/admin/users?role=customer'); setCustomers(res || []); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const token = await require('../../api/client').getAuthToken();
      const url = `${API_URL}/admin/export?type=customers&format=${format}&token=${token}`;
      Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'Could not open export link');
    }
  };

  useEffect(() => { load(); }, []);

  const openForm = (cust?: any) => {
    if (cust) { 
      setEditingCustomer(cust); 
      setForm({ 
        name: cust.name, 
        email: cust.email, 
        phone: cust.phone || '', 
        address: cust.address || '',
        alternatePhone: cust.alternatePhone || '',
        notes: cust.notes || '',
        warrantyPeriod: cust.warrantyPeriod || '12 Months'
      }); 
    } else {
      setEditingCustomer(null);
      setForm({ name: '', email: '', phone: '', address: '', alternatePhone: '', notes: '', warrantyPeriod: '12 Months' });
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

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'This customer does not have a valid phone number registered.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Error', 'Could not open phone dialer'));
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => handleExport('excel')} style={{ backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Download size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleExport('pdf')} style={{ backgroundColor: Colors.danger, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Download size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>PDF</Text>
            </TouchableOpacity>
          </View>
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
              <TouchableOpacity style={[s.actBtn, { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary + '30' }]} onPress={() => handleCall(item.phone)}>
                <Phone color={Colors.primary} size={14} />
                <Text style={s.actBtnT}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actBtn} onPress={() => setDetailsModal(item)}>
                <User color={Colors.primary} size={14} />
                <Text style={s.actBtnT}>Details</Text>
              </TouchableOpacity>
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
            <TextInput style={s.input} placeholder="Alternate Phone" placeholderTextColor={Colors.fgDim} value={form.alternatePhone} onChangeText={t => setForm({...form, alternatePhone: t})} keyboardType="phone-pad" />
            <TextInput style={s.input} placeholder="Warranty Period (e.g. 12 Months)" placeholderTextColor={Colors.fgDim} value={form.warrantyPeriod} onChangeText={t => setForm({...form, warrantyPeriod: t})} />
            <TextInput style={s.input} placeholder="Address" placeholderTextColor={Colors.fgDim} value={form.address} onChangeText={t => setForm({...form, address: t})} />
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Special Notes / Remarks" placeholderTextColor={Colors.fgDim} value={form.notes} onChangeText={t => setForm({...form, notes: t})} multiline />
            
            <Button title={editingCustomer ? "Save Changes" : "Create Customer"} onPress={handleSave} loading={loading} style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>

      <Modal visible={!!detailsModal} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={[s.modalContainer, { height: '85%' }]}>
            <View style={s.mHdr}>
              <Text style={s.mTitle}>Customer Master Profile</Text>
              <TouchableOpacity onPress={() => setDetailsModal(null)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity>
            </View>
            <FlatList data={[detailsModal]} keyExtractor={i => i?._id || '1'} contentContainerStyle={{ gap: 16, paddingBottom: 20 }} renderItem={({ item: cust }) => cust ? (
              <View style={{ gap: 16 }}>
                <View style={{ padding: 16, backgroundColor: Colors.bgSurface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', marginBottom: 12 }}>Contact Identity</Text>
                  <Text style={{ fontSize: 11, color: Colors.fgMuted, fontWeight: '700', marginTop: 4 }}>FULL NAME</Text>
                  <Text style={{ fontSize: 16, color: Colors.fgPrimary, fontWeight: '800' }}>{cust.name}</Text>
                  <Text style={{ fontSize: 11, color: Colors.fgMuted, fontWeight: '700', marginTop: 8 }}>EMAIL</Text>
                  <Text style={{ fontSize: 14, color: Colors.fgPrimary, fontWeight: '700' }}>{cust.email}</Text>
                  <Text style={{ fontSize: 11, color: Colors.fgMuted, fontWeight: '700', marginTop: 8 }}>PRIMARY MOBILE</Text>
                  <Text style={{ fontSize: 14, color: Colors.fgPrimary, fontWeight: '700' }}>{cust.phone || 'N/A'}</Text>
                  <Text style={{ fontSize: 11, color: Colors.fgMuted, fontWeight: '700', marginTop: 8 }}>ALTERNATE MOBILE</Text>
                  <Text style={{ fontSize: 14, color: Colors.fgPrimary, fontWeight: '700' }}>{cust.alternatePhone || 'N/A'}</Text>
                </View>

                <View style={{ padding: 16, backgroundColor: Colors.bgSurface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', marginBottom: 12 }}>Site & Location Specifications</Text>
                  <Text style={{ fontSize: 11, color: Colors.fgMuted, fontWeight: '700' }}>PHYSICAL ADDRESS</Text>
                  <Text style={{ fontSize: 14, color: Colors.fgPrimary, fontWeight: '700', marginTop: 2 }}>{cust.address || 'No address specified'}</Text>
                  
                  <Text style={{ fontSize: 11, color: Colors.fgMuted, fontWeight: '700', marginTop: 12 }}>LIVE GPS LOCATION</Text>
                  {cust.locationDetails?.lat ? (
                    <View style={{ marginTop: 6, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: Colors.primary, borderRadius: 12, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>GPS Coordinates Recorded: {cust.locationDetails.lat.toFixed(4)}, {cust.locationDetails.lng.toFixed(4)}</Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 13, color: Colors.warning, fontWeight: '700', marginTop: 2 }}>No Live GPS Coordinates Recorded</Text>
                  )}

                  <Text style={{ fontSize: 11, color: Colors.fgMuted, fontWeight: '700', marginTop: 12 }}>SPECIAL NOTES / REMARKS</Text>
                  <View style={{ padding: 12, backgroundColor: Colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginTop: 4 }}>
                    <Text style={{ fontSize: 13, color: Colors.fgPrimary, fontWeight: '600' }}>{cust.notes || 'No manual notes added.'}</Text>
                  </View>
                </View>

                <View style={{ padding: 16, backgroundColor: Colors.primary + '10', borderRadius: 16, borderWidth: 1, borderColor: Colors.primary + '30' }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', marginBottom: 12 }}>Product Warranty System (12 Months)</Text>
                  <Text style={{ fontSize: 15, color: Colors.fgPrimary, fontWeight: '800' }}>Warranty Period: {cust.warrantyPeriod || '12 Months'}</Text>
                  <Text style={{ fontSize: 12, color: Colors.fgMuted, fontWeight: '600', marginTop: 4 }}>Expires on: {cust.warrantyEndDate ? new Date(cust.warrantyEndDate).toLocaleDateString() : 'Upon job completion'}</Text>
                  <View style={{ marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: cust.warrantyStatus?.includes('Expired') ? Colors.danger + '20' : Colors.success + '20', borderRadius: 12, alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: cust.warrantyStatus?.includes('Expired') ? Colors.danger : Colors.success, textTransform: 'uppercase' }}>{cust.warrantyStatus || 'Valid - Free Warranty Rework'}</Text>
                  </View>
                </View>
              </View>
            ) : null} />
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
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  av: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { fontSize: 15, fontWeight: '800', color: Colors.fgPrimary },
  email: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600', marginTop: 2 },
  info: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', flex: 1 },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  actBtn: { width: '31%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  actBtnT: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, zIndex: 1000 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  mTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 50, color: Colors.fgPrimary },
});
