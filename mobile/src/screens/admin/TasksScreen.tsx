import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, Modal, TextInput, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import { ClipboardList, Plus, Trash2, Edit2, X, Phone, MessageCircle } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { Button } from '../../components/ui';

export default function AdminTasksScreen({ navigation }: any) {
  const [data, setData] = useState<any[]>([]);
  const [techs, setTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');
  const [assignee, setAssignee] = useState<string | null>(null);

  const load = async () => {
    try { 
      setLoading(true); 
      const [d, t] = await Promise.all([fetchWithAuth('/internal/tasks'), fetchWithAuth('/admin/technicians')]); 
      setData(d || []); 
      setTechs(t || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle(''); setDescription(''); setPriority('medium'); setStatus('pending'); setAssignee(null); setEditingId(null);
  };

  const openAdd = () => { resetForm(); setModalVisible(true); };

  const openEdit = (task: any) => {
    setEditingId(task._id);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setStatus(task.status);
    setAssignee(task.assignee?._id || null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title) return Alert.alert('Error', 'Title is required');
    try {
      setLoading(true);
      const payload = { title, description, priority, status, assignee };
      if (editingId) {
        await fetchWithAuth(`/internal/tasks/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await fetchWithAuth('/internal/tasks', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModalVisible(false);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await fetchWithAuth(`/internal/tasks/${id}`, { method: 'DELETE' }); load(); }
          catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>Tasks</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}><Plus color="#fff" size={20} /></TouchableOpacity>
      </View>
      <FlatList data={data} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <View style={s.ic}><ClipboardList color={Colors.primary} size={20} /></View>
              <View style={s.info}>
                <Text style={s.cName} numberOfLines={1}>{item.title || 'Task'}</Text>
                <Text style={s.cSub}>Priority: {item.priority || 'medium'}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: item.status === 'completed' ? Colors.success + '20' : Colors.warning + '20' }]}>
                <Text style={[s.badgeT, { color: item.status === 'completed' ? Colors.success : Colors.warning }]}>{item.status}</Text>
              </View>
            </View>
            {item.assignee && (
              <Text style={s.assigneeTxt}>Assigned to: {item.assignee.name}</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button 
                title="Call Customer" 
                onPress={() => {
                  const ph = item.order?.customer?.phone || item.order?.customerPhone || item.customerPhone || '9999999999';
                  Linking.openURL(`tel:${ph.replace(/\D/g, '')}`);
                }} 
                icon={<Phone color="#fff" size={14} />} 
                style={{ flex: 1, height: 38 }} 
              />
              <Button 
                title="Order Chat" 
                onPress={() => navigation.navigate('Chat', { orderId: item.order?._id || item._id })} 
                icon={<MessageCircle color="#fff" size={14} />} 
                variant="secondary" 
                style={{ flex: 1, height: 38 }} 
              />
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={s.aBtn} onPress={() => openEdit(item)}><Edit2 color={Colors.primary} size={16} /></TouchableOpacity>
              <TouchableOpacity style={[s.aBtn, { backgroundColor: Colors.danger + '15' }]} onPress={() => handleDelete(item._id)}><Trash2 color={Colors.danger} size={16} /></TouchableOpacity>
            </View>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No tasks found</Text>} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.mHdr}><Text style={s.mT}>{editingId ? 'Edit Task' : 'Add Task'}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><X color={Colors.fgPrimary} size={24} /></TouchableOpacity></View>
            <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              
              <TextInput style={s.input} placeholder="Task Title" placeholderTextColor={Colors.fgDim} value={title} onChangeText={setTitle} />
              <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Description" placeholderTextColor={Colors.fgDim} value={description} onChangeText={setDescription} multiline />
              
              <Text style={s.label}>Priority</Text>
              <View style={s.pickerRow}>
                {['low', 'medium', 'high', 'critical'].map(p => (
                  <TouchableOpacity key={p} style={[s.pBtn, priority === p && s.pBtnAct]} onPress={() => setPriority(p)}>
                    <Text style={[s.pBtnT, priority === p && s.pBtnTAct]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Status</Text>
              <View style={s.pickerRow}>
                {['pending', 'in_progress', 'completed', 'blocked'].map(st => (
                  <TouchableOpacity key={st} style={[s.pBtn, status === st && s.pBtnAct]} onPress={() => setStatus(st)}>
                    <Text style={[s.pBtnT, status === st && s.pBtnTAct]}>{st.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Assign Technician</Text>
              <View style={s.techGrid}>
                {techs.map(t => (
                  <TouchableOpacity key={t._id} style={[s.tBtn, assignee === t._id && s.pBtnAct]} onPress={() => setAssignee(assignee === t._id ? null : t._id)}>
                    <Text style={[s.tBtnT, assignee === t._id && s.pBtnTAct]} numberOfLines={1}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button title={editingId ? 'Update Task' : 'Save Task'} onPress={handleSave} loading={loading} style={{ marginTop: 20 }} />
              <View style={{ height: 40 }} />
            </ScrollView>
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
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 12, color: Colors.fgMuted, fontWeight: '800', textTransform: 'uppercase' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeT: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  assigneeTxt: { fontSize: 12, color: Colors.primaryLight, fontWeight: '700', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  aBtn: { flex: 1, height: 36, borderRadius: 10, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%' },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mT: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 16, height: 54, color: Colors.fgPrimary, fontSize: 15, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  label: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary, marginTop: 4 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  pBtnAct: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pBtnT: { fontSize: 13, fontWeight: '700', color: Colors.fgMuted, textTransform: 'capitalize' },
  pBtnTAct: { color: '#fff' },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tBtn: { width: '48%', paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  tBtnT: { fontSize: 13, fontWeight: '700', color: Colors.fgPrimary },
});
