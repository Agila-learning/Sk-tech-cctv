import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, StatusBar, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Colors } from '../../theme/colors';
import { Button, Badge } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import { Calendar, UserMinus, Plus, Clock, Activity } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function LeaveRequestScreen() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/internal/leave');
      setHistory(data || []);
    } catch (e: any) {
      console.log('Error fetching leave history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    if (!reason.trim()) return Alert.alert('Error', 'Please provide a reason for the leave');
    if (endDate < startDate) return Alert.alert('Error', 'End date cannot be before start date');
    
    try {
      setLoading(true);
      await fetchWithAuth('/internal/leave', {
        method: 'POST',
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason,
          status: 'pending'
        })
      });
      Alert.alert('Success', 'Leave request submitted successfully');
      setReason('');
      setShowForm(false);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>Leave Requests</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(!showForm)}>
          {showForm ? <Activity color="#fff" size={20} /> : <Plus color="#fff" size={20} />}
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={s.card}>
          <Text style={s.secTitle}>New Leave Request</Text>
          
          <Text style={s.label}>Start Date</Text>
          <TouchableOpacity style={s.dateBtn} onPress={() => setShowStart(true)}>
            <Calendar color={Colors.primary} size={18} />
            <Text style={s.dateT}>{startDate.toLocaleDateString('en-IN')}</Text>
          </TouchableOpacity>
          {showStart && <DateTimePicker value={startDate} mode="date" minimumDate={new Date()} onChange={(e, d) => { setShowStart(false); if (d) setStartDate(d); }} />}

          <Text style={s.label}>End Date</Text>
          <TouchableOpacity style={s.dateBtn} onPress={() => setShowEnd(true)}>
            <Calendar color={Colors.primary} size={18} />
            <Text style={s.dateT}>{endDate.toLocaleDateString('en-IN')}</Text>
          </TouchableOpacity>
          {showEnd && <DateTimePicker value={endDate} mode="date" minimumDate={startDate} onChange={(e, d) => { setShowEnd(false); if (d) setEndDate(d); }} />}

          <Text style={s.label}>Reason</Text>
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Reason for leave" value={reason} onChangeText={setReason} multiline placeholderTextColor={Colors.fgMuted} />
          
          <Button title="Submit Request" onPress={handleSubmit} loading={loading} style={{ marginTop: 12 }} />
        </View>
      )}

      <Text style={[s.secTitle, { marginHorizontal: 20, marginTop: 10, marginBottom: 10 }]}>Leave History</Text>
      <FlatList 
        data={history} 
        keyExtractor={i => i._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={s.empty}>No leave history found</Text>}
        renderItem={({ item }) => (
          <View style={s.lCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Clock color={Colors.fgMuted} size={16} />
                <Text style={s.lDate}>{new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}</Text>
              </View>
              <Badge label={item.status} color={item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'amber'} />
            </View>
            <Text style={s.lReason}>{item.reason}</Text>
            {item.adminRemarks && (
              <View style={s.remBox}>
                <Text style={s.remT}>Admin: {item.adminRemarks}</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { marginHorizontal: 20, backgroundColor: Colors.bgCard, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  secTitle: { fontSize: 16, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '800', color: Colors.fgMuted, marginTop: 12, marginBottom: 8, textTransform: 'uppercase' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  dateT: { color: Colors.fgPrimary, fontWeight: '600', fontSize: 14 },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.fgPrimary },
  empty: { textAlign: 'center', color: Colors.fgMuted, marginTop: 40, fontWeight: '600' },
  lCard: { backgroundColor: Colors.bgCard, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  lDate: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary },
  lReason: { fontSize: 14, color: Colors.fgSecondary, marginTop: 8 },
  remBox: { backgroundColor: Colors.primaryFaint, padding: 10, borderRadius: 8, marginTop: 10 },
  remT: { fontSize: 12, fontWeight: '700', color: Colors.primary }
});
