import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, TextInput } from 'react-native';
import { Receipt, Plus } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Button, Badge } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import * as ImagePicker from 'expo-image-picker';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Travel', receiptUrl: '' });

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/expenses'); setExpenses(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const attachReceipt = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (res.canceled) return;
    try {
      Alert.alert('Uploading', 'Attaching receipt...');
      const fd = new FormData();
      fd.append('images', { uri: res.assets[0].uri, type: 'image/jpeg', name: 'receipt.jpg' } as any);
      const ur = await fetch('https://sk-tech-cctv.onrender.com/api/upload', { method: 'POST', body: fd, headers: { 'Content-Type': 'multipart/form-data' } });
      const { imageUrl } = await ur.json();
      setForm(prev => ({ ...prev, receiptUrl: imageUrl }));
      Alert.alert('Success', 'Receipt attached!');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const submitExpense = async () => {
    if (!form.description || !form.amount) return Alert.alert('Required', 'Description and Amount are required.');
    try {
      setLoading(true);
      await fetchWithAuth('/expenses', { method: 'POST', body: JSON.stringify({ description: form.description, amount: Number(form.amount), receipt: form.receiptUrl, category: form.category }) });
      setModalVisible(false);
      setForm({ description: '', amount: '', category: 'Travel', receiptUrl: '' });
      load();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Expenses</Text><TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}><Plus color="#fff" size={20} /></TouchableOpacity></View>
      <FlatList data={expenses} keyExtractor={e => e._id}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}><View style={s.ic}><Receipt color={Colors.primaryLight} size={20} /></View>
              <View style={{ flex: 1 }}><Text style={s.desc}>{item.description}</Text><Text style={s.cat}>{item.category}</Text></View>
              <Badge label={item.status} color={item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'amber'} />
            </View>
            <View style={s.row2}><Text style={s.date}>{new Date(item.date).toLocaleDateString()}</Text><Text style={s.amt}>₹{item.amount}</Text></View>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No expenses logged</Text>} />

      {modalVisible && (
        <View style={StyleSheet.absoluteFill}>
          <View style={s.modalBg} />
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>New Expense</Text>
            <TextInput style={s.input} placeholder="Amount (₹)" keyboardType="numeric" placeholderTextColor={Colors.fgMuted} value={form.amount} onChangeText={t => setForm({...form, amount: t})} />
            <TextInput style={s.input} placeholder="Description (e.g. Bus Ticket)" placeholderTextColor={Colors.fgMuted} value={form.description} onChangeText={t => setForm({...form, description: t})} />
            <TextInput style={s.input} placeholder="Category (e.g. Travel, Food)" placeholderTextColor={Colors.fgMuted} value={form.category} onChangeText={t => setForm({...form, category: t})} />
            <Button title={form.receiptUrl ? "Receipt Attached ✓" : "Attach Receipt (Optional)"} variant="secondary" onPress={attachReceipt} />
            <View style={s.modalActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <Button title="Submit" onPress={submitExpense} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  desc: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cat: { fontSize: 10, color: Colors.fgMuted, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  row2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  date: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600' },
  amt: { fontSize: 18, fontWeight: '900', color: Colors.primaryLight },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  modalBg: { ...(StyleSheet.absoluteFill as any), backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgSurface, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 16 },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.fgPrimary, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 }
});
