import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, RefreshControl } from 'react-native';
import { Clock, MapPin, CheckCircle, XCircle } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Button, Badge } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import { useSocket } from '../../context/SocketContext';

export default function AttendanceScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/attendance/my'); setRecords(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (socket) {
      socket.on('attendance_updated', load);
      return () => { socket.off('attendance_updated', load); };
    }
  }, [socket]);

  const fmt = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch { return 'N/A'; } };
  const fmtTime = (d: string) => { try { return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); } catch { return '--:--'; } };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Attendance</Text></View>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />} contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 100 }}>
        {records.map((r, i) => (
          <View key={i} style={s.card}>
            <View style={s.row}>
              <Text style={s.date}>{fmt(r.date)}</Text>
              <Badge label={r.checkOut?.time ? 'Complete' : 'In Shift'} color={r.checkOut?.time ? 'green' : 'amber'} />
            </View>
            <View style={s.row}>
              <View style={s.timeCol}><Text style={s.timeL}>CHECK IN</Text><Text style={s.timeV}>{fmtTime(r.checkIn?.time || r.checkIn)}</Text></View>
              <View style={s.timeCol}><Text style={s.timeL}>CHECK OUT</Text><Text style={s.timeV}>{r.checkOut?.time ? fmtTime(r.checkOut.time) : '--:--'}</Text></View>
              <View style={s.timeCol}><Text style={s.timeL}>HOURS</Text><Text style={s.timeV}>{r.hoursWorked ? `${r.hoursWorked}h` : '...'}</Text></View>
            </View>
          </View>
        ))}
        {records.length === 0 && <Text style={s.empty}>No attendance records</Text>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  card: { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 18, gap: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 16, fontWeight: '900', color: Colors.fgPrimary },
  timeCol: { alignItems: 'center', gap: 4 },
  timeL: { fontSize: 8, fontWeight: '900', color: Colors.fgMuted, letterSpacing: 1.5 },
  timeV: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary, fontVariant: ['tabular-nums'] },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
});
