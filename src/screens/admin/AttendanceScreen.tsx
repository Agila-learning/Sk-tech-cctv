import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { Activity, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, subDays, addDays } from 'date-fns';

export default function AdminAttendanceScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const load = async () => {
    try { 
      setLoading(true); 
      const dateStr = format(date, 'yyyy-MM-dd');
      const d = await fetchWithAuth(`/attendance?startDate=${dateStr}&endDate=${dateStr}`); 
      setData(d || []); 
    }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  
  useEffect(() => { load(); }, [date]);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>Staff Attendance</Text>
      </View>

      <View style={s.filterRow}>
        <TouchableOpacity style={s.arrBtn} onPress={() => setDate(subDays(date, 1))}><ChevronLeft color={Colors.fgPrimary} size={20} /></TouchableOpacity>
        <TouchableOpacity style={s.dateBtn} onPress={() => setShowPicker(true)}>
          <CalendarIcon color={Colors.primary} size={18} />
          <Text style={s.dateBtnT}>{format(date, 'dd MMM yyyy')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.arrBtn} onPress={() => setDate(addDays(date, 1))}><ChevronRight color={Colors.fgPrimary} size={20} /></TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />
      )}

      <FlatList data={data} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.ic}><Activity color={Colors.success} size={20} /></View>
            <View style={s.info}>
              <Text style={s.cName} numberOfLines={1}>{item.user?.name || 'Staff'}</Text>
              <Text style={s.cSub}>{new Date(item.date).toLocaleDateString()} • {item.hoursWorked ? `${item.hoursWorked} hrs` : (item.checkIn?.time ? new Date(item.checkIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '')}</Text>
            </View>
            <View style={s.statusBadge}>
              <Text style={s.status}>{item.status?.replace('_', ' ') || 'Present'}</Text>
            </View>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No attendance records for {format(date, 'MMM dd')}</Text>} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, gap: 10, borderWidth: 1, borderColor: Colors.border, flex: 1, marginHorizontal: 12, justifyContent: 'center' },
  dateBtnT: { fontSize: 15, fontWeight: '800', color: Colors.fgPrimary },
  arrBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4, marginRight: 8 },
  cName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600' },
  statusBadge: { backgroundColor: Colors.successFaint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  status: { fontSize: 11, fontWeight: '900', color: Colors.success, textTransform: 'uppercase' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 }
});
