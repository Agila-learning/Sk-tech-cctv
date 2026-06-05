import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Bell, ShieldCheck, Trash2 } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { useSocket } from '../../context/SocketContext';

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { socket } = useSocket();

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
          </TouchableOpacity>
        )} 
        ListEmptyComponent={<Text style={s.empty}>No recent notifications</Text>} 
      />
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
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 }
});
