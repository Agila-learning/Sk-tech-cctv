import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Modal, TextInput, Alert, RefreshControl, ScrollView } from 'react-native';
import { Plus, ArrowLeft, X, Edit, Trash2, Box, Package } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button, Badge } from '../../components/ui';

export default function ProductWarrantyScreen({ navigation }: any) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || (user?.role as string) === 'sub-admin';
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<any>(null);
  const [form, setForm] = useState({
    customerName: '', customerMobile: '', installationAddress: '',
    supplierName: '', productCategory: '', productName: '',
    issueDescription: ''
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/product-warranty');
      setWarranties(res || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openForm = (w?: any) => {
    if (w) {
      setEditingWarranty(w);
      setForm({ 
        customerName: w.customerName || '', customerMobile: w.customerMobile || '', 
        installationAddress: w.installationAddress || '', supplierName: w.supplierName || '', 
        productCategory: w.productCategory || '', productName: w.productName || '', 
        issueDescription: w.issueDescription || '' 
      });
    } else {
      setEditingWarranty(null);
      setForm({ 
        customerName: '', customerMobile: '', installationAddress: '', 
        supplierName: '', productCategory: '', productName: '', issueDescription: '' 
      });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.customerName || !form.productName) {
      Alert.alert('Error', 'Customer Name and Product Name are required');
      return;
    }
    try {
      setLoading(true);
      if (editingWarranty) {
        await fetchWithAuth(`/product-warranty/${editingWarranty._id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await fetchWithAuth('/product-warranty', { method: 'POST', body: JSON.stringify(form) });
      }
      setModalVisible(false);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setLoading(true);
          await fetchWithAuth(`/product-warranty/${id}`, { method: 'DELETE' });
          load();
        } catch (e: any) { Alert.alert('Error', e.message); setLoading(false); }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cTop}>
        <View style={s.cLeft}>
          <View style={s.iconBg}><Package color={Colors.primary} size={24} /></View>
          <View>
            <Text style={s.cTitle}>{item.productName}</Text>
            <Text style={s.cSub}>{item.customerName}</Text>
          </View>
        </View>
        <Badge label={item.status || 'Created'} color="blue" />
      </View>
      <View style={{ marginTop: 12 }}>
        <Text style={s.cDesc}>{item.issueDescription}</Text>
      </View>
      <View style={s.meta}>
        <Text style={s.metaTxt}>Supplier: {item.supplierName}</Text>
        <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <View style={s.actions}>
        <TouchableOpacity onPress={() => openForm(item)} style={s.actionBtn}>
          <Edit color={Colors.warning} size={16} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={s.actionBtn}>
          <Trash2 color={Colors.danger} size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <ArrowLeft color={Colors.fgPrimary} size={28} />
          </TouchableOpacity>
          <Text style={s.title}>Product Warranties</Text>
        </View>
      </View>

      <FlatList 
        data={warranties}
        keyExtractor={i => i._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 12 }}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={s.empty}>No product warranties found</Text>}
      />

      <TouchableOpacity style={s.fab} onPress={() => openForm()}>
        <Plus color="#fff" size={24} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <View style={s.mHdr}>
              <Text style={s.mTitle}>{editingWarranty ? 'Edit Warranty' : 'New Product Warranty'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
              <TextInput style={s.input} placeholder="Customer Name *" placeholderTextColor={Colors.fgDim} value={form.customerName} onChangeText={t => setForm({...form, customerName: t})} />
              <TextInput style={s.input} placeholder="Customer Mobile *" placeholderTextColor={Colors.fgDim} value={form.customerMobile} onChangeText={t => setForm({...form, customerMobile: t})} keyboardType="phone-pad" />
              <TextInput style={s.input} placeholder="Installation Address" placeholderTextColor={Colors.fgDim} value={form.installationAddress} onChangeText={t => setForm({...form, installationAddress: t})} />
              <TextInput style={s.input} placeholder="Supplier Name" placeholderTextColor={Colors.fgDim} value={form.supplierName} onChangeText={t => setForm({...form, supplierName: t})} />
              <TextInput style={s.input} placeholder="Product Category" placeholderTextColor={Colors.fgDim} value={form.productCategory} onChangeText={t => setForm({...form, productCategory: t})} />
              <TextInput style={s.input} placeholder="Product Name *" placeholderTextColor={Colors.fgDim} value={form.productName} onChangeText={t => setForm({...form, productName: t})} />
              <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Issue Description" placeholderTextColor={Colors.fgDim} value={form.issueDescription} onChangeText={t => setForm({...form, issueDescription: t})} multiline />
              <Button title={editingWarranty ? "Save Changes" : "Submit Warranty"} onPress={handleSave} loading={loading} style={{ marginTop: 10 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  cTitle: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 12, color: Colors.fgMuted, marginTop: 2 },
  cDesc: { fontSize: 14, color: Colors.fgSecondary },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  metaTxt: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  date: { fontSize: 12, color: Colors.fgMuted },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 12 },
  actionBtn: { padding: 4 },
  empty: { textAlign: 'center', color: Colors.fgDim, marginTop: 40 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, zIndex: 100 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  mTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.fgPrimary },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, color: Colors.fgPrimary, fontSize: 15 },
});
