import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { Receipt, Plus, MapPin } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Button, Badge } from '../../components/ui';
import { fetchWithAuth, API_URL } from '../../api/client';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from '../../utils/storage';
import * as Location from 'expo-location';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Travel', receiptUrl: '' });
  const [locationData, setLocationData] = useState({ lat: 0, lng: 0, address: '' });
  const [fetchingGps, setFetchingGps] = useState(false);

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/expenses'); setExpenses(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const fetchLocation = async () => {
    try {
      setFetchingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location permissions or enter address manually.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      let addr = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocode && geocode.length > 0) {
          addr = `${geocode[0].street || ''}, ${geocode[0].city || ''}, ${geocode[0].region || ''}`.replace(/^,\s*/, '');
        }
      } catch (e) {}
      setLocationData({ lat, lng, address: addr });
      Alert.alert('Success', 'Location fetched successfully!');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to fetch GPS location. Enter manually.');
    } finally {
      setFetchingGps(false);
    }
  };

  const attachReceipt = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (res.canceled) return;
    try {
      Alert.alert('Uploading', 'Attaching receipt...');
      let imageUrl;
      let uploadRes: any;
      if (Platform.OS === 'web') {
        const formData = new FormData();
        const fetchedUrl = await fetch(res.assets[0].uri);
        const blob = await fetchedUrl.blob();
        const file = new File([blob], 'receipt.jpg', { type: blob.type || 'image/jpeg' });
        formData.append('images', file);
        uploadRes = await fetchWithAuth('/upload', {
          method: 'POST',
          body: formData as any
        });
      } else {
        const token = await SecureStore.getItemAsync('sk_auth_token');
        const fileUploadRes = await FileSystem.uploadAsync(`${API_URL}/upload`, res.assets[0].uri, {
          fieldName: 'images',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          mimeType: 'image/jpeg',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (fileUploadRes.status !== 200 && fileUploadRes.status !== 201) {
          throw new Error(`Upload failed with status ${fileUploadRes.status}: ${fileUploadRes.body}`);
        }
        uploadRes = JSON.parse(fileUploadRes.body);
      }
      imageUrl = uploadRes.imageUrl;
      setForm(prev => ({ ...prev, receiptUrl: imageUrl }));
      Alert.alert('Success', 'Receipt attached!');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const submitExpense = async () => {
    if (!form.description || !form.amount) return Alert.alert('Required', 'Description and Amount are required.');
    try {
      setLoading(true);
      await fetchWithAuth('/expenses', { 
        method: 'POST', 
        body: JSON.stringify({ 
          description: form.description, 
          amount: Number(form.amount), 
          attachments: form.receiptUrl ? [form.receiptUrl] : [], 
          billImage: form.receiptUrl,
          category: form.category,
          location: locationData
        }) 
      });
      setModalVisible(false);
      setForm({ description: '', amount: '', category: 'Travel', receiptUrl: '' });
      setLocationData({ lat: 0, lng: 0, address: '' });
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
            <View style={s.row2}>
              <Text style={s.date}>{new Date(item.date).toLocaleDateString()}</Text>
              <Text style={s.amt}>₹{item.amount}</Text>
            </View>
            <View style={s.locRow}>
              <MapPin color={Colors.fgMuted} size={14} />
              <Text style={s.locText}>{item.location?.address || 'Manually Entered / No GPS'}</Text>
            </View>
            {(item.billImage || (item.attachments && item.attachments.length > 0)) && (
              <View style={s.imgBox}>
                <Image source={{ uri: item.billImage ? (item.billImage.startsWith('http') ? item.billImage : `https://sk-tech-cctv.onrender.com${item.billImage}`) : (item.attachments[0].startsWith('http') ? item.attachments[0] : `https://sk-tech-cctv.onrender.com${item.attachments[0]}`) }} style={s.receiptImg} resizeMode="cover" />
                <View style={s.imgOverlay}><Text style={s.imgT}>Attached Receipt</Text></View>
              </View>
            )}
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No expenses logged</Text>} />

      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={s.modalBg}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>New Expense</Text>
              <TextInput style={s.input} placeholder="Amount (₹)" keyboardType="numeric" placeholderTextColor={Colors.fgMuted} value={form.amount} onChangeText={t => setForm({...form, amount: t})} />
              <TextInput style={s.input} placeholder="Description (e.g. Bus Ticket)" placeholderTextColor={Colors.fgMuted} value={form.description} onChangeText={t => setForm({...form, description: t})} />
              <TextInput style={s.input} placeholder="Category (e.g. Travel, Food)" placeholderTextColor={Colors.fgMuted} value={form.category} onChangeText={t => setForm({...form, category: t})} />
              
              <View style={s.gpsHdr}>
                <Text style={s.gpsT}>Location / Address</Text>
                <TouchableOpacity onPress={fetchLocation} disabled={fetchingGps} style={s.gpsBtn}>
                  {fetchingGps ? <ActivityIndicator size="small" color={Colors.primary} /> : <MapPin color={Colors.primary} size={14} />}
                  <Text style={s.gpsBtnT}>{fetchingGps ? 'Fetching...' : 'Auto Fetch GPS'}</Text>
                </TouchableOpacity>
              </View>
              <TextInput style={s.input} placeholder="Manually enter address or Auto Fetch" placeholderTextColor={Colors.fgMuted} value={locationData.address} onChangeText={t => setLocationData({...locationData, address: t})} />

              <Button title={form.receiptUrl ? "Receipt Attached ✓" : "Attach Receipt (Optional)"} variant="secondary" onPress={attachReceipt} />
              <View style={s.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
                <Button title="Submit" onPress={submitExpense} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  locText: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', flex: 1 },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.bgSurface, padding: 24, borderRadius: 24, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 16 },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.fgPrimary, marginBottom: 12 },
  gpsHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingHorizontal: 4 },
  gpsT: { fontSize: 12, fontWeight: '700', color: Colors.fgMuted, textTransform: 'uppercase' },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gpsBtnT: { fontSize: 12, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  imgBox: { width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', marginTop: 12 },
  receiptImg: { width: '100%', height: '100%' },
  imgOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, alignItems: 'center' },
  imgT: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }
});

