import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, Modal, TextInput, TouchableOpacity, Alert, Linking } from 'react-native';
import { Users, Edit2, Trash2, X, Plus, Search, Phone, MessageCircle, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export default function CustomerContactScreen({ navigation }: any) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [form, setForm] = useState({ customerName: '', mobileNumber: '', email: '', alternateNumber: '', address: '', location: '', customerType: 'Residential', notes: '' });
  const [search, setSearch] = useState('');

  const load = async () => {
    try { setLoading(true); const res = await fetchWithAuth('/customer-contacts'); setContacts(res || []); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openForm = (contact?: any) => {
    if (!isAdmin) {
      Alert.alert('Permission Denied', 'Only admins can add contacts');
      return;
    }
    if (contact) { 
      setEditingContact(contact); 
      setForm({ 
        customerName: contact.customerName || '', 
        email: contact.email || '', 
        mobileNumber: contact.mobileNumber || '', 
        alternateNumber: contact.alternateNumber || '',
        address: contact.address || '',
        location: contact.location || '',
        customerType: contact.customerType || 'Residential',
        notes: contact.notes || ''
      }); 
    } else {
      setEditingContact(null);
      setForm({ customerName: '', mobileNumber: '', email: '', alternateNumber: '', address: '', location: '', customerType: 'Residential', notes: '' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.customerName || !form.mobileNumber) {
      Alert.alert('Error', 'Name and Mobile Number are required');
      return;
    }
    try {
      setLoading(true);
      if (editingContact) {
        await fetchWithAuth(`/customer-contacts/${editingContact._id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await fetchWithAuth('/customer-contacts', { method: 'POST', body: JSON.stringify(form) });
      }
      setModalVisible(false);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      Alert.alert('Permission Denied', 'Only admins can delete contacts');
      return;
    }
    Alert.alert('Delete Contact', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await fetchWithAuth(`/customer-contacts/${id}`, { method: 'DELETE' });
          load();
        } catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'This contact does not have a valid phone number.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Error', 'Could not open phone dialer'));
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'This contact does not have a valid phone number.');
      return;
    }
    Linking.openURL(`whatsapp://send?phone=${phone}`).catch(() => Alert.alert('Error', 'WhatsApp is not installed'));
  };

  const filteredContacts = contacts.filter(c => 
    (c.customerName || '').toLowerCase().includes(search.toLowerCase()) || 
    (c.mobileNumber || '').includes(search) || 
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <ArrowLeft color={Colors.fgPrimary} size={28} />
          </TouchableOpacity>
          <View>
            <Text style={s.title}>Contact Directory</Text>
            <Text style={s.count}>{contacts.length} contacts found</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12 }}>
          <Search color={Colors.fgMuted} size={18} />
          <TextInput style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: Colors.fgPrimary, fontSize: 14 }} placeholder="Search name, phone, location..." placeholderTextColor={Colors.fgMuted} value={search} onChangeText={setSearch} />
        </View>
      </View>
      
      <FlatList data={filteredContacts} keyExtractor={c => c._id} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <View style={s.av}><Users color={Colors.primaryLight} size={20} /></View>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={s.name} numberOfLines={1}>{item.customerName}</Text>
                <Text style={s.email} numberOfLines={1}>{item.email || 'No email'}</Text>
              </View>
            </View>
            <View style={[s.row, { marginTop: 8 }]}>
              <Text style={s.info} numberOfLines={1}>{item.mobileNumber}</Text>
              <Text style={[s.info, { flex: 2, textAlign: 'right' }]} numberOfLines={1}>{item.location || item.address || 'No address'}</Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={[s.actBtn, { backgroundColor: Colors.success + '10', borderColor: Colors.success + '30' }]} onPress={() => handleWhatsApp(item.mobileNumber)}>
                <MessageCircle color={Colors.success} size={14} />
                <Text style={[s.actBtnT, { color: Colors.success }]}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actBtn, { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary + '30' }]} onPress={() => handleCall(item.mobileNumber)}>
                <Phone color={Colors.primary} size={14} />
                <Text style={s.actBtnT}>Call</Text>
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
        )} ListEmptyComponent={<Text style={s.empty}>No contacts found</Text>} />

      <TouchableOpacity style={s.fab} onPress={() => openForm()}>
        <Plus color="#fff" size={24} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <View style={s.mHdr}><Text style={s.mTitle}>{editingContact ? 'Edit Contact' : 'Add New Contact'}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity></View>
            
            <TextInput style={s.input} placeholder="Full Name *" placeholderTextColor={Colors.fgDim} value={form.customerName} onChangeText={t => setForm({...form, customerName: t})} />
            <TextInput style={s.input} placeholder="Mobile Number *" placeholderTextColor={Colors.fgDim} value={form.mobileNumber} onChangeText={t => setForm({...form, mobileNumber: t})} keyboardType="phone-pad" />
            <TextInput style={s.input} placeholder="Email" placeholderTextColor={Colors.fgDim} value={form.email} onChangeText={t => setForm({...form, email: t})} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={s.input} placeholder="Alternate Number" placeholderTextColor={Colors.fgDim} value={form.alternateNumber} onChangeText={t => setForm({...form, alternateNumber: t})} keyboardType="phone-pad" />
            <TextInput style={s.input} placeholder="Location / Area" placeholderTextColor={Colors.fgDim} value={form.location} onChangeText={t => setForm({...form, location: t})} />
            <TextInput style={s.input} placeholder="Address" placeholderTextColor={Colors.fgDim} value={form.address} onChangeText={t => setForm({...form, address: t})} />
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Notes" placeholderTextColor={Colors.fgDim} value={form.notes} onChangeText={t => setForm({...form, notes: t})} multiline />
            
            <Button title={editingContact ? "Save Changes" : "Create Contact"} onPress={handleSave} loading={loading} style={{ marginTop: 10 }} />
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
  actBtn: { flexGrow: 1, minWidth: '22%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 10, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  actBtnT: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, zIndex: 1000 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  mTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 50, color: Colors.fgPrimary },
});
