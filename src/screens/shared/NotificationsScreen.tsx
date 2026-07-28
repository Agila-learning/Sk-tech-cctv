import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, Modal, TextInput } from 'react-native';
import { Bell, ShieldCheck, Trash2, Plus, X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Badge } from '../../components/ui';

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
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
    const t = (item.type || '').toLowerCase();
    const titleMsg = `${item.title || ''} ${item.message || ''}`.toLowerCase();
    
    if (item.orderId) {
      navigation.navigate('OrderDetail', { orderId: item.orderId });
    } else if (t.includes('order') || titleMsg.includes('order')) {
      navigation.navigate(user?.role === 'technician' ? 'Tasks' : 'Orders');
    } else if (t.includes('report') || t.includes('task') || titleMsg.includes('report') || titleMsg.includes('task')) {
      navigation.navigate('Tasks');
    } else if (t.includes('expense') || titleMsg.includes('expense')) {
      navigation.navigate('Expenses');
    } else if (t.includes('leave') || titleMsg.includes('leave') || titleMsg.includes('attendance')) {
      navigation.navigate(user?.role === 'technician' ? 'Attendance' : 'Leaves');
    } else if (t.includes('booking') || titleMsg.includes('booking')) {
      navigation.navigate('Bookings');
    } else if (t.includes('chat') || titleMsg.includes('message') || titleMsg.includes('chat')) {
      navigation.navigate('Support Chat');
    } else if (t.includes('ticket') || titleMsg.includes('support')) {
      navigation.navigate('Support Tickets');
    } else {
      setSelectedNotif(item);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin': return { label: 'ADMIN ALERT', color: 'red' };
      case 'technician': return { label: 'TECH ALERT', color: 'amber' };
      case 'customer': return { label: 'CUSTOMER ALERT', color: 'blue' };
      default: return { label: 'ALERT', color: 'gray' };
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
        keyExtractor={(i, idx) => i._id ? `${i._id}_${idx}` : idx.toString()} 
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const badge = getRoleBadge(item.role);
          return (
            <TouchableOpacity style={s.card} onPress={() => handlePress(item)}>
              <View style={[s.ic, { backgroundColor: badge.color === 'red' ? Colors.danger + '20' : badge.color === 'amber' ? Colors.warning + '20' : badge.color === 'blue' ? Colors.info + '20' : Colors.bgSurface }]}><ShieldCheck color={badge.color === 'red' ? Colors.danger : badge.color === 'amber' ? Colors.warning : badge.color === 'blue' ? Colors.info : Colors.primary} size={20} /></View>
              <View style={s.info}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Badge label={badge.label} color={badge.color as any} />
                    <Text style={s.cName}>{item.title || 'Notification'}</Text>
                  </View>
                </View>
                <Text style={s.cSub}>{item.message || 'You have a new update.'}</Text>
                <Text style={s.timeText}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                </Text>
              </View>
              {user?.role === 'admin' && (
                <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ padding: 8 }}>
                  <Trash2 color={Colors.danger} size={16} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }} 
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

      {/* Full Details Modal for Announcements */}
      <Modal visible={!!selectedNotif} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.mHdr}>
              <Text style={s.mT}>Announcement</Text>
              <TouchableOpacity onPress={() => setSelectedNotif(null)}><X color={Colors.fgPrimary} size={24} /></TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 12 }}>{selectedNotif?.title}</Text>
              <View style={{ backgroundColor: Colors.bgSurface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, minHeight: 150 }}>
                <Text style={{ fontSize: 16, color: Colors.fgPrimary, lineHeight: 24 }}>{selectedNotif?.message}</Text>
              </View>
              <Text style={{ fontSize: 12, color: Colors.fgMuted, marginTop: 16, textAlign: 'right' }}>
                {selectedNotif?.createdAt ? new Date(selectedNotif.createdAt).toLocaleString('en-IN') : ''}
              </Text>
              <Button title="Close" onPress={() => setSelectedNotif(null)} style={{ marginTop: 20 }} />
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
  cSub: { fontSize: 13, color: Colors.fgSecondary, lineHeight: 18 },
  timeText: { fontSize: 11, color: Colors.fgMuted, marginTop: 6, fontWeight: '500' },
  empty: { textAlign: 'center', color: Colors.fgDim, marginTop: 60, fontSize: 15 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: 400 },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mT: { fontSize: 18, fontWeight: 'bold', color: Colors.fgPrimary },
  cycleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  cycleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cycleBtnT: { fontSize: 12, fontWeight: 'bold', color: Colors.fgMuted },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, color: Colors.fgPrimary, marginBottom: 12, fontSize: 15 },
});
