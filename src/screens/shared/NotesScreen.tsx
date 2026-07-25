import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { Plus, ArrowLeft, X, Edit, Trash2 } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';

export default function NotesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [form, setForm] = useState({ content: '', priority: 'Medium' });

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/notes');
      setNotes(res || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openForm = (note?: any) => {
    if (note) {
      setEditingNote(note);
      setForm({ content: note.content || '', priority: note.priority || 'Medium' });
    } else {
      setEditingNote(null);
      setForm({ content: '', priority: 'Medium' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.content) {
      Alert.alert('Error', 'Content is required');
      return;
    }
    try {
      setLoading(true);
      if (editingNote) {
        await fetchWithAuth(`/notes/${editingNote._id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await fetchWithAuth('/notes', { method: 'POST', body: JSON.stringify(form) });
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
          await fetchWithAuth(`/notes/${id}`, { method: 'DELETE' });
          load();
        } catch (e: any) { Alert.alert('Error', e.message); setLoading(false); }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={s.card}>
      <Text style={s.content}>{item.content}</Text>
      <View style={s.meta}>
        <Text style={s.author}>{item.author?.name || 'Unknown'}</Text>
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
          <Text style={s.title}>Notes</Text>
        </View>
      </View>

      <FlatList 
        data={notes}
        keyExtractor={i => i._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 12 }}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={s.empty}>No notes found</Text>}
      />

      <TouchableOpacity style={s.fab} onPress={() => openForm()}>
        <Plus color="#fff" size={24} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <View style={s.mHdr}>
              <Text style={s.mTitle}>{editingNote ? 'Edit Note' : 'Add Note'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity>
            </View>
            <TextInput 
              style={[s.input, { height: 100, textAlignVertical: 'top' }]} 
              placeholder="Write your note here..." 
              placeholderTextColor={Colors.fgDim} 
              value={form.content} 
              onChangeText={t => setForm({...form, content: t})} 
              multiline 
            />
            <Button title={editingNote ? "Save Changes" : "Create Note"} onPress={handleSave} loading={loading} style={{ marginTop: 10 }} />
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
  card: { backgroundColor: Colors.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  content: { fontSize: 16, color: Colors.fgPrimary, marginBottom: 12 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  author: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  date: { fontSize: 12, color: Colors.fgMuted },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  actionBtn: { padding: 4 },
  empty: { textAlign: 'center', color: Colors.fgDim, marginTop: 40 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 8, zIndex: 100 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  mTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.fgPrimary },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, color: Colors.fgPrimary, fontSize: 15 },
});
