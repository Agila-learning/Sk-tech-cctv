import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, Modal, TextInput, Platform, RefreshControl } from 'react-native';
import { Megaphone, Plus, Trash2, X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Button, Badge } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', role: 'all', isPinned: false });

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/internal/announcements');
      setAnnouncements(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.message) return Alert.alert('Error', 'Title and message required');
    try {
      setSubmitting(true);
      await fetchWithAuth('/internal/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          content: form.message,
          targetAudience: form.role,
          isPinned: form.isPinned
        })
      });
      setModalVisible(false);
      setForm({ title: '', message: '', role: 'all', isPinned: false });
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this announcement?')) {
        try {
          await fetchWithAuth(`/internal/announcements/${id}`, { method: 'DELETE' });
          setAnnouncements(prev => prev.filter(a => a._id !== id));
        } catch (e: any) { alert(e.message); }
      }
    } else {
      Alert.alert('Delete', 'Are you sure?', [
        { text: 'Cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await fetchWithAuth(`/internal/announcements/${id}`, { method: 'DELETE' });
            setAnnouncements(prev => prev.filter(a => a._id !== id));
          } catch (e: any) { Alert.alert('Error', e.message); }
        }}
      ]);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>Announcements</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Plus color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <FlatList 
        data={announcements} 
        keyExtractor={i => i._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <View style={s.ic}><Megaphone color={Colors.primary} size={20} /></View>
              <View style={s.info}>
                <Text style={s.cName}>{item.title}</Text>
                <Badge label={item.targetAudience === 'all' ? 'Everyone' : item.targetAudience} color={item.targetAudience === 'all' ? 'purple' : 'blue'} />
              </View>
              <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ padding: 8 }}>
                <Trash2 color={Colors.danger} size={16} />
              </TouchableOpacity>
            </View>
            <Text style={s.cSub}>{item.content}</Text>
            <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        )} 
        ListEmptyComponent={<Text style={s.empty}>No announcements published</Text>} 
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <View style={s.mHdr}>
              <Text style={s.mTitle}>New Announcement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={Colors.fgMuted} size={24} />
              </TouchableOpacity>
            </View>
            
            <TextInput style={s.input} placeholder="Title" placeholderTextColor={Colors.fgDim} value={form.title} onChangeText={t => setForm({...form, title: t})} />
            <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Message" placeholderTextColor={Colors.fgDim} multiline value={form.message} onChangeText={t => setForm({...form, message: t})} />
            
            <Text style={{color: Colors.fgMuted, marginBottom: 8}}>Target Role:</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['all', 'technician', 'customer'].map(r => (
                <TouchableOpacity key={r} style={[s.roleBtn, form.role === r && s.roleBtnAct]} onPress={() => setForm({...form, role: r})}>
                  <Text style={[s.roleT, form.role === r && {color: '#fff'}]}>{r.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title={submitting ? 'Publishing...' : 'Publish'} onPress={handleCreate} loading={submitting} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 14, color: Colors.fgMuted, fontWeight: '500', lineHeight: 20 },
  date: { fontSize: 11, color: Colors.fgDim, marginTop: 12, textAlign: 'right' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  mTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.fgPrimary, marginBottom: 16 },
  roleBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, alignItems: 'center' },
  roleBtnAct: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleT: { color: Colors.fgPrimary, fontWeight: '700', fontSize: 12 }
});
