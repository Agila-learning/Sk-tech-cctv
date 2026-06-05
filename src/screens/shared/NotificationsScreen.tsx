import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, Modal, TextInput } from 'react-native';
import { Bell, ShieldCheck, Trash2, Plus, X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', role: 'technician' });
  const { socket } = useSocket();
  const { user } = useAuth();

  const load = async () => {
    try {
      const d = await fetchWithAuth('/notifications');
      setNotifications(d || []);
    } catch (e) { console.log(e); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new_notification', (newNotif: any) => {
        setNotifications(prev => [newNotif, ...prev]);
      });
      return () => { socket.off('new_notification'); };
    }
  }, [socket]);

  const handleClearAll = () => {
    Alert.alert('Clear All', 'Are you sure you want to clear all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: async () => {
        try {
          await fetchWithAuth('/notifications', { method: 'DELETE' });
          setNotifications([]);
        } catch (e: any) {
          Alert.alert('Error', e.message);
        }
      }}
    ]);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetchWithAuth(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleCreate = async () => {
    try {
      await fetchWithAuth('/notifications', { method: 'POST', body: JSON.stringify(form) });
      setModalVisible(false);
      setForm({ title: '', message: '', role: 'technician' });
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handlePress = (item: any) => {
    if (item.type === 'order_update' || item.type === 'report_review' || item.type === 'technician_update') {
      navigation.navigate('Orders');
    } else if (item.type === 'expense_update' || item.type === 'expense_created') {
      navigation.navigate('Expenses');
    } else {
      // General navigation fallback or do nothing
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <View>
          <Text style={s.title}>Notifications</Text>
          <Text style={s.count}>{notifications.length} unread</Text>
        </View>
        <TouchableOpacity style={s.clearBtn} onPress={handleClearAll}>
          <Trash2 color={Colors.danger} size={20} />
        </TouchableOpacity>
      </View>
      <FlatList 
        data={notifications} 
        keyExtractor={(i, idx) => i._id || idx.toString()} 
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => handlePress(item)}>
            <View style={s.ic}><ShieldCheck color={Colors.primary} size={20} /></View>
            <View style={s.info}>
              <Text style={s.cName}>{item.title || 'Alert'}</Text>
              <Text style={s.cSub}>{item.message || 'You have a new update.'}</Text>
            </View>
            {user?.role === 'admin' && (
              <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ padding: 8 }}>
                <Trash2 color={Colors.danger} size={16} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )} 
        ListEmptyComponent={<Text style={s.empty}>No recent notifications</Text>} 
      />

      {user?.role === 'admin' && (
        <TouchableOpacity style={s.fab} onPress={() => setModalVisible(true)}>
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.mHdr}>
              <Text style={s.mT}>Send Notification</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X color={Colors.fgPrimary} size={24} /></TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={{color: Colors.fgMuted, marginBottom: 8}}>Target Audience:</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {['technician', 'customer', 'all'].map(r => (
                  <TouchableOpacity key={r} style={[s.cycleBtn, form.role === r && s.cycleBtnActive]} onPress={() => setForm({...form, role: r})}>
                    <Text style={[s.cycleBtnT, form.role === r && {color: '#fff'}]}>{r.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={s.input} placeholder="Title" placeholderTextColor={Colors.fgMuted} value={form.title} onChangeText={t => setForm({...form, title: t})} />
              <TextInput style={[s.input, { height: 100 }]} placeholder="Message" placeholderTextColor={Colors.fgMuted} multiline value={form.message} onChangeText={t => setForm({...form, message: t})} />
              
              <Button title="Send Notification" onPress={handleCreate} />
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
  clearBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 30 },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mT: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.fgPrimary, marginBottom: 12 },
  cycleBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, alignItems: 'center' },
  cycleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cycleBtnT: { color: Colors.fgPrimary, fontWeight: '700', fontSize: 12 }
});
