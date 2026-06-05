import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { Bell, ShieldCheck } from 'lucide-react-native';
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

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>Notifications</Text>
        <Text style={s.count}>{notifications.length} unread</Text>
      </View>
      <FlatList 
        data={notifications} 
        keyExtractor={(i, idx) => i._id || idx.toString()} 
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.ic}><ShieldCheck color={Colors.primary} size={20} /></View>
            <View style={s.info}>
              <Text style={s.cName}>{item.title || 'Alert'}</Text>
              <Text style={s.cSub}>{item.message || 'You have a new update.'}</Text>
            </View>
          </View>
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
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 }
});
