import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, TouchableOpacity, Platform, Alert, TextInput, Linking } from 'react-native';
import { Activity, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth, API_URL } from '../../api/client';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, subDays, addDays, startOfMonth, endOfMonth } from 'date-fns';
import * as SecureStore from '../../utils/storage';

export default function AdminAttendanceScreen() {
  const [data, setData] = useState<any[]>([]);
  const [monthData, setMonthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [selectedTech, setSelectedTech] = useState<any>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    try { 
      setLoading(true); 
      const start = format(startOfMonth(date), 'yyyy-MM-dd');
      const end = format(endOfMonth(date), 'yyyy-MM-dd');
      
      const mData = await fetchWithAuth(`/attendance?startDate=${start}&endDate=${end}`); 
      setMonthData(mData || []);
      
      const dateStr = format(date, 'yyyy-MM-dd');
      setData((mData || []).filter((d: any) => d.date?.split('T')[0] === dateStr));
    }
    catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [date]);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const presentCount = monthData.filter(d => d.status === 'present').length;
  const absentCount = monthData.filter(d => d.status === 'absent').length;
  const leaveCount = monthData.filter(d => d.status === 'on_leave').length;

  // Day-wise counts for the selected date
  const dayPresentCount = data.filter(d => d.status === 'present').length;
  const dayAbsentCount = data.filter(d => d.status === 'absent').length;
  const dayLeaveCount = data.filter(d => d.status === 'on_leave').length;
  const dayTotal = data.length;

  const filteredData = data.filter(d => 
    (d.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.status || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>Attendance</Text>
      </View>

      <FlatList 
        data={filteredData} 
        keyExtractor={(i, idx) => i._id || idx.toString()} 
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        ListHeaderComponent={(
          <>
            {/* Date Navigator */}
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

            {/* Monthly Summary */}
            <Text style={s.sectionLabel}>This Month Overview</Text>
            <View style={s.metricsRow}>
              <View style={s.mCard}><Text style={s.mV}>{presentCount}</Text><Text style={s.mL}>Present</Text></View>
              <View style={s.mCard}><Text style={[s.mV, {color: Colors.danger}]}>{absentCount}</Text><Text style={s.mL}>Absent</Text></View>
              <View style={s.mCard}><Text style={[s.mV, {color: Colors.warning}]}>{leaveCount}</Text><Text style={s.mL}>Leaves</Text></View>
            </View>

            {/* Day-wise Summary */}
            <Text style={s.sectionLabel}>Day View — {format(date, 'dd MMM yyyy')} ({dayTotal} Technicians)</Text>
            <View style={[s.metricsRow, { marginBottom: 16 }]}>
              <View style={[s.mCard, { borderColor: Colors.success + '40', backgroundColor: Colors.success + '10' }]}>
                <Text style={[s.mV, { fontSize: 26 }]}>{dayPresentCount}</Text>
                <Text style={[s.mL, { color: Colors.success }]}>Present</Text>
              </View>
              <View style={[s.mCard, { borderColor: Colors.danger + '40', backgroundColor: Colors.danger + '10' }]}>
                <Text style={[s.mV, { color: Colors.danger, fontSize: 26 }]}>{dayAbsentCount}</Text>
                <Text style={[s.mL, { color: Colors.danger }]}>Absent</Text>
              </View>
              <View style={[s.mCard, { borderColor: Colors.warning + '40', backgroundColor: Colors.warning + '10' }]}>
                <Text style={[s.mV, { color: Colors.warning, fontSize: 26 }]}>{dayLeaveCount}</Text>
                <Text style={[s.mL, { color: Colors.warning }]}>Leave</Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, marginBottom: 4 }}>
              <Search color={Colors.fgMuted} size={18} />
              <TextInput style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: Colors.fgPrimary, fontSize: 14 }} placeholder="Search staff name or status..." placeholderTextColor={Colors.fgMuted} value={search} onChangeText={setSearch} />
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => setSelectedTech(item.user)}>
            <View style={s.ic}><Activity color={item.status === 'present' ? Colors.success : Colors.danger} size={20} /></View>
            <View style={s.info}>
              <Text style={s.cName} numberOfLines={1}>{item.user?.name || 'Unknown Technician'}</Text>
              <Text style={s.cSub}>{new Date(item.date).toLocaleDateString()} • {item.hoursWorked ? `${item.hoursWorked} hrs` : (item.checkIn?.time ? new Date(item.checkIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A')}</Text>
            </View>
            <View style={[s.statusBadge, item.status === 'absent' && {backgroundColor: Colors.danger + '20'}]}>
              <Text style={[s.status, item.status === 'absent' && {color: Colors.danger}]}>{item.status?.replace('_', ' ') || 'Present'}</Text>
            </View>
          </TouchableOpacity>
        )} 
        ListEmptyComponent={<Text style={s.empty}>No attendance records for {format(date, 'MMM dd')}</Text>} 
      />

      {selectedTech && (
        <View style={StyleSheet.absoluteFill}>
          <View style={s.modalBg} />
          <View style={s.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={s.modalTitle}>{selectedTech.name}'s History</Text>
              <TouchableOpacity onPress={() => setSelectedTech(null)}><Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Close</Text></TouchableOpacity>
            </View>
            
            <View style={s.metricsRow}>
              <View style={s.mCard}><Text style={s.mV}>{monthData.filter(d => d.user?._id === selectedTech._id && d.status === 'present').length}</Text><Text style={s.mL}>Present</Text></View>
              <View style={s.mCard}><Text style={[s.mV, {color: Colors.danger}]}>{monthData.filter(d => d.user?._id === selectedTech._id && d.status === 'absent').length}</Text><Text style={s.mL}>Absent</Text></View>
              <View style={s.mCard}><Text style={[s.mV, {color: Colors.warning}]}>{monthData.filter(d => d.user?._id === selectedTech._id && d.status === 'on_leave').length}</Text><Text style={s.mL}>Leaves</Text></View>
            </View>

            <FlatList 
              data={monthData.filter(d => d.user?._id === selectedTech._id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
              keyExtractor={i => i._id}
              contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={[s.card, { padding: 12, borderRadius: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', color: Colors.fgPrimary }}>{new Date(item.date).toLocaleDateString()}</Text>
                    <Text style={{ fontSize: 11, color: Colors.fgMuted }}>{item.hoursWorked ? `${item.hoursWorked} hrs` : 'N/A'}</Text>
                  </View>
                  <View style={[s.statusBadge, item.status === 'absent' && {backgroundColor: Colors.danger + '20'}]}>
                    <Text style={[s.status, item.status === 'absent' && {color: Colors.danger}]}>{item.status?.replace('_', ' ') || 'Present'}</Text>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, gap: 10, borderWidth: 1, borderColor: Colors.border, flex: 1, marginHorizontal: 12, justifyContent: 'center' },
  dateBtnT: { fontSize: 15, fontWeight: '800', color: Colors.fgPrimary },
  arrBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  metricsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  mCard: { flex: 1, backgroundColor: Colors.bgCard, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  mV: { fontSize: 22, fontWeight: '900', color: Colors.success, marginBottom: 4 },
  mL: { fontSize: 11, fontWeight: '700', color: Colors.fgMuted, textTransform: 'uppercase' },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4, marginRight: 8 },
  cName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600' },
  statusBadge: { backgroundColor: Colors.successFaint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  status: { fontSize: 11, fontWeight: '900', color: Colors.success, textTransform: 'uppercase' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  modalBg: { ...(StyleSheet.absoluteFill as any), backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%', backgroundColor: Colors.bgSurface, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary }
});
