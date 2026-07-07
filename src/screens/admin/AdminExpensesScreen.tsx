import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, FlatList, RefreshControl, TouchableOpacity, Alert, TextInput, Linking } from 'react-native';
import { CheckCircle, XCircle, FileText, Download } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth, API_URL } from '../../api/client';
import { Badge } from '../../components/ui';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from '../../utils/storage';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions, LayoutAnimation, Image, UIManager, Platform } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AdminExpensesScreen() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { 
      setLoading(true); 
      const d = await fetchWithAuth('/expenses'); 
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setExpenses(d || []); 
    }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await fetchWithAuth(`/expenses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'rejected' }) });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const token = await require('../../api/client').getAuthToken();
      const url = `${API_URL}/expenses/export?format=${format}&token=${token}`;
      Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'Could not open export link');
    }
  };

  const fmt = (d: string) => { try { return new Date(d).toLocaleDateString(); } catch { return 'N/A'; } };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>Field Expenses</Text>
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
      
      {expenses.length > 0 && (
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <PieChart
            data={[
              { name: 'Pending', count: expenses.filter(e => e.status === 'pending').length, color: Colors.warning, legendFontColor: Colors.fgMuted, legendFontSize: 12 },
              { name: 'Approved', count: expenses.filter(e => e.status === 'approved').length, color: Colors.success, legendFontColor: Colors.fgMuted, legendFontSize: 12 },
              { name: 'Rejected', count: expenses.filter(e => e.status === 'rejected').length, color: Colors.danger, legendFontColor: Colors.fgMuted, legendFontSize: 12 }
            ].filter(d => d.count > 0)}
            width={Dimensions.get('window').width - 40}
            height={120}
            chartConfig={{ color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})` }}
            accessor={"count"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
            absolute
          />
        </View>
      )}

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <TextInput
          style={s.searchInput}
          placeholder="Search Expenses..."
          placeholderTextColor={Colors.fgMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList data={expenses.filter(e => (e.description||'').toLowerCase().includes(search.toLowerCase()) || (e.type||'').toLowerCase().includes(search.toLowerCase()))} keyExtractor={e => e._id} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <View style={s.ic}><FileText color={Colors.primaryLight} size={18} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.tech}>{item.user?.name || item.technicianName || item.staffName || 'Unknown Technician'}</Text>
                <Text style={s.date}>{fmt(item.createdAt)}</Text>
              </View>
              <Badge label={item.status} color={item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'amber'} />
            </View>
            <View style={s.row}>
              <Text style={s.amt}>₹{item.amount}</Text>
              <Text style={s.type}>{item.type}</Text>
            </View>
            <Text style={s.desc}>{item.description}</Text>
            
            {(item.billImage || (item.attachments && item.attachments.length > 0)) && (() => {
              const imgUrl = item.billImage 
                ? (item.billImage.startsWith('http') ? item.billImage : `${API_URL}${item.billImage}`)
                : (item.attachments[0].startsWith('http') ? item.attachments[0] : `${API_URL}${item.attachments[0]}`);
              return (
                <TouchableOpacity style={s.imgBox} onPress={() => import('react-native').then(({ Linking }) => Linking.openURL(imgUrl).catch(() => Alert.alert('Error', 'Cannot open document')))}>
                  <Image source={{ uri: imgUrl }} style={s.receiptImg} resizeMode="cover" />
                  <View style={s.imgOverlay}><Text style={s.imgT}>Tap to View Receipt</Text></View>
                </TouchableOpacity>
              );
            })()}
            {item.status === 'pending' && (
              <View style={s.actions}>
                <TouchableOpacity style={s.btn} onPress={() => handleAction(item._id, 'approve')}><CheckCircle color={Colors.success} size={16} /><Text style={s.btnT}>Approve</Text></TouchableOpacity>
                <TouchableOpacity style={[s.btn, { borderColor: Colors.danger + '40' }]} onPress={() => handleAction(item._id, 'reject')}><XCircle color={Colors.danger} size={16} /><Text style={[s.btnT, { color: Colors.danger }]}>Reject</Text></TouchableOpacity>
              </View>
            )}
          </View>
        )} ListEmptyComponent={<Text style={s.emptyT}>No expenses found</Text>} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  count: { fontSize: 14, color: Colors.fgMuted, marginTop: 4, fontWeight: '600' },
  searchInput: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 44, color: Colors.fgPrimary, fontSize: 14 },
  card: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ic: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tech: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  date: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600' },
  amt: { fontSize: 18, fontWeight: '900', color: Colors.primaryLight },
  type: { fontSize: 12, fontWeight: '700', color: Colors.fgSecondary, textTransform: 'uppercase' },
  desc: { fontSize: 13, color: Colors.fgDim, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.success + '40', backgroundColor: Colors.bgSurface },
  btnT: { fontSize: 12, fontWeight: '800', color: Colors.success, textTransform: 'uppercase' },
  emptyT: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  imgBox: { width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', marginTop: 12 },
  receiptImg: { width: '100%', height: '100%' },
  imgOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, alignItems: 'center' },
  imgT: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }
});
