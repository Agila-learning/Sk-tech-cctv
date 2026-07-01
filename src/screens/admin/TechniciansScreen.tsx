import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl } from 'react-native';
import { User, Plus, Edit2, Trash2, X, BarChart2 } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { BarChart, ProgressChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { fetchWithAuth } from '../../api/client';
import { Button } from '../../components/ui';
import { Alert, Modal, TextInput, TouchableOpacity } from 'react-native';
import { useSocket } from '../../context/SocketContext';

export default function TechniciansScreen() {
  const [techs, setTechs] = useState<any[]>([]); 
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTech, setEditingTech] = useState<any>(null);
  const [performanceTech, setPerformanceTech] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  
  const screenWidth = Dimensions.get('window').width;
  const { socket } = useSocket();

  const load = async () => { try { setLoading(true); const d = await fetchWithAuth('/admin/technicians'); setTechs(d || []); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (socket) {
      socket.on('tech_status_updated', load);
      return () => {
        socket.off('tech_status_updated', load);
      };
    }
  }, [socket]);

  const openForm = (tech?: any) => {
    if (tech) { setEditingTech(tech); setForm({ name: tech.name, email: tech.email, phone: tech.phone || '', password: '' }); }
    else { setEditingTech(null); setForm({ name: '', email: '', phone: '', password: '' }); }
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (editingTech) {
        await fetchWithAuth(`/admin/technicians/${editingTech._id}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await fetchWithAuth(`/admin/technicians`, { method: 'POST', body: JSON.stringify(form) });
      }
      setModalVisible(false);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await fetchWithAuth(`/admin/technicians/${id}`, { method: 'DELETE' });
          load();
        } catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <View>
          <Text style={s.title}>Technicians</Text>
          <Text style={s.count}>{techs.length} active</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => openForm()}><Plus color="#fff" size={20} /></TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <TextInput
          style={s.searchInput}
          placeholder="Search technicians..."
          placeholderTextColor={Colors.fgMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      
      <FlatList data={techs.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase()) || t.phone?.includes(search))} keyExtractor={t => t._id} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <View style={s.av}><User color={Colors.primaryLight} size={20} /></View>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                <Text style={s.email} numberOfLines={1}>{item.email}</Text>
              </View>
              <View style={[s.dot, { backgroundColor: item.isOnline ? Colors.success : Colors.fgDim }]} />
            </View>
            <View style={[s.row, { marginTop: 8 }]}>
              <Text style={s.info} numberOfLines={1}>{item.phone || 'No phone'}</Text>
              <View style={[s.badge, { backgroundColor: item.availabilityStatus === 'Available' ? Colors.successFaint : Colors.dangerFaint }]}>
                <Text style={[s.badgeT, { color: item.availabilityStatus === 'Available' ? Colors.success : Colors.danger }]}>{item.availabilityStatus || 'Offline'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 12 }}>
              <View style={{ alignItems: 'center', flex: 1 }}><Text style={{fontSize: 14, fontWeight: 'bold', color: Colors.fgPrimary}}>{item.completedOrdersCount || 0}</Text><Text style={{fontSize: 10, color: Colors.fgMuted, textTransform: 'uppercase', marginTop: 2}}>Orders</Text></View>
              <View style={{ alignItems: 'center', flex: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border }}><Text style={{fontSize: 14, fontWeight: 'bold', color: Colors.fgPrimary}}>{item.rating ? item.rating.toFixed(1) : '5.0'} ⭐</Text><Text style={{fontSize: 10, color: Colors.fgMuted, textTransform: 'uppercase', marginTop: 2}}>Rating</Text></View>
              <View style={{ alignItems: 'center', flex: 1 }}><Text style={{fontSize: 14, fontWeight: 'bold', color: Colors.fgPrimary}}>{item.reviewCount || 0}</Text><Text style={{fontSize: 10, color: Colors.fgMuted, textTransform: 'uppercase', marginTop: 2}}>Reviews</Text></View>
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={s.actBtn} onPress={() => setPerformanceTech(item)}><BarChart2 color={Colors.info} size={14} /><Text style={[s.actBtnT, { color: Colors.info }]}>Analytics</Text></TouchableOpacity>
              <TouchableOpacity style={s.actBtn} onPress={() => openForm(item)}><Edit2 color={Colors.primary} size={14} /><Text style={s.actBtnT}>Edit</Text></TouchableOpacity>
              <TouchableOpacity style={s.actBtn} onPress={() => handleDelete(item._id)}><Trash2 color={Colors.danger} size={14} /><Text style={[s.actBtnT, { color: Colors.danger }]}>Remove</Text></TouchableOpacity>
            </View>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No technicians found</Text>} />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <View style={s.mHdr}><Text style={s.mTitle}>{editingTech ? 'Edit Tech' : 'Add Tech'}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity></View>
            
            <TextInput style={s.input} placeholder="Full Name" placeholderTextColor={Colors.fgDim} value={form.name} onChangeText={t => setForm({...form, name: t})} />
            <TextInput style={s.input} placeholder="Email" placeholderTextColor={Colors.fgDim} value={form.email} onChangeText={t => setForm({...form, email: t})} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={s.input} placeholder="Phone" placeholderTextColor={Colors.fgDim} value={form.phone} onChangeText={t => setForm({...form, phone: t})} keyboardType="phone-pad" />
            {!editingTech && <TextInput style={s.input} placeholder="Password" placeholderTextColor={Colors.fgDim} value={form.password} onChangeText={t => setForm({...form, password: t})} secureTextEntry />}
            
            <Button title="Save Technician" onPress={handleSave} loading={loading} style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>

      {/* Performance Analytics Modal */}
      <Modal visible={!!performanceTech} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <View style={s.mHdr}>
              <Text style={s.mTitle}>Performance Analytics</Text>
              <TouchableOpacity onPress={() => setPerformanceTech(null)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.fgPrimary }}>{performanceTech?.name}</Text>
              <Text style={{ fontSize: 12, color: Colors.fgMuted }}>SLA Compliance & Resolution Time</Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <BarChart 
                data={{
                  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                  datasets: [{ data: [3, 5, 2, 8, 4] }]
                }}
                width={screenWidth - 88}
                height={200}
                chartConfig={{
                  backgroundGradientFrom: Colors.bgCard,
                  backgroundGradientTo: Colors.bgCard,
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  labelColor: (opacity = 1) => Colors.fgMuted,
                  decimalPlaces: 0,
                }}
                style={{ borderRadius: 16, marginVertical: 8 }}
                yAxisLabel=""
                yAxisSuffix=""
              />
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <View style={{ backgroundColor: Colors.bgSurface, padding: 16, borderRadius: 16, flex: 1, marginRight: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.success }}>94%</Text>
                <Text style={{ fontSize: 10, color: Colors.fgMuted, textTransform: 'uppercase', marginTop: 4 }}>SLA Met</Text>
              </View>
              <View style={{ backgroundColor: Colors.bgSurface, padding: 16, borderRadius: 16, flex: 1, marginLeft: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.warning }}>1.2h</Text>
                <Text style={{ fontSize: 10, color: Colors.fgMuted, textTransform: 'uppercase', marginTop: 4 }}>Avg Resolution</Text>
              </View>
            </View>
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
  dot: { width: 10, height: 10, borderRadius: 5 },
  info: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeT: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  actBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  actBtnT: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 50, color: Colors.fgPrimary },
  searchInput: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 44, color: Colors.fgPrimary, fontSize: 14 }
});
