import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { Layers, Plus, Trash2 } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { Button } from '../../components/ui';

export default function MarketingScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', discountPercentage: '', code: '' });

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/offers'); setData(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    try {
      await fetchWithAuth('/offers', { method: 'POST', body: JSON.stringify({ ...form, discountPercentage: Number(form.discountPercentage), isActive: true, expiryDate: new Date(Date.now() + 30*24*60*60*1000) }) });
      setModalVisible(false); setForm({ title: '', description: '', discountPercentage: '', code: '' });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetchWithAuth(`/offers/${id}`, { method: 'DELETE' });
      load();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Marketing Hub</Text></View>
      <FlatList data={data} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.ic}><Layers color={Colors.warning} size={20} /></View>
            <View style={s.info}>
              <Text style={s.cName}>{item.title || 'Offer'}</Text>
              <Text style={s.cSub}>{item.description || 'Details'} - {item.discountPercentage}% OFF</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ padding: 8 }}>
              <Trash2 color={Colors.danger} size={18} />
            </TouchableOpacity>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No active offers</Text>} />

      <TouchableOpacity style={s.fab} onPress={() => setModalVisible(true)}>
        <Plus color="#fff" size={24} />
      </TouchableOpacity>

      {modalVisible && (
        <View style={StyleSheet.absoluteFill}>
          <View style={s.modalBg} />
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>New Offer</Text>
            <TextInput style={s.input} placeholder="Title" placeholderTextColor={Colors.fgMuted} value={form.title} onChangeText={t => setForm({...form, title: t})} />
            <TextInput style={s.input} placeholder="Description" placeholderTextColor={Colors.fgMuted} value={form.description} onChangeText={t => setForm({...form, description: t})} />
            <TextInput style={s.input} placeholder="Discount %" placeholderTextColor={Colors.fgMuted} keyboardType="numeric" value={form.discountPercentage} onChangeText={t => setForm({...form, discountPercentage: t})} />
            <TextInput style={s.input} placeholder="Coupon Code (Optional)" placeholderTextColor={Colors.fgMuted} value={form.code} onChangeText={t => setForm({...form, code: t})} />
            <View style={s.modalActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <Button title="Save" onPress={handleAdd} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      )}
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
  cSub: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  modalBg: { ...(StyleSheet.absoluteFill as any), backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgSurface, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 16 },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.fgPrimary, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 }
});
