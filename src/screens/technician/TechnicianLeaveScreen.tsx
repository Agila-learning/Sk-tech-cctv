import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Modal, TextInput, Alert, Platform } from 'react-native';
import { Calendar, Clock, Plus, CheckCircle, XCircle, FileText } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge, Button } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';

export default function TechnicianLeaveScreen({ navigation }: any) {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/technician/my-leave-requests');
      setLeaves(data || []);
    } catch (e: any) {
      console.error('Error loading leaves:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeaves(); }, []);
  useFocusEffect(useCallback(() => { loadLeaves(); }, []));

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason) {
      return Alert.alert('Error', 'Please fill in all fields (Start Date, End Date, Reason).');
    }

    try {
      setSubmitting(true);
      await fetchWithAuth('/technician/leave-request', {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate, reason })
      });
      Alert.alert('Success', 'Leave request submitted successfully!');
      setModalVisible(false);
      setStartDate(''); setEndDate(''); setReason('');
      loadLeaves();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return 'N/A'; } };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Leave Management</Text>
          <Text style={s.sub}>Request & track your leave status</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Plus color="#fff" size={20} />
          <Text style={s.addBtnT}>Request Leave</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={leaves} 
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadLeaves} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <View style={s.ic}>
                <Calendar color={Colors.primaryLight} size={20} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.dates}>{fmt(item.startDate)}  ➔  {fmt(item.endDate)}</Text>
                <Text style={s.reason}>Reason: {item.reason}</Text>
              </View>
              <Badge 
                label={item.status} 
                color={item.status === 'Approved' ? 'green' : item.status === 'Rejected' ? 'red' : 'amber'} 
              />
            </View>

            {item.adminRemarks ? (
              <View style={s.remarksBox}>
                <Text style={s.remarksLabel}>Admin Remarks:</Text>
                <Text style={s.remarksText}>{item.adminRemarks}</Text>
              </View>
            ) : null}

            <Text style={s.reqDate}>Submitted on {fmt(item.createdAt)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <FileText color={Colors.fgDim} size={48} />
            <Text style={s.emptyT}>No leave requests submitted yet.</Text>
          </View>
        }
      />

      {/* Leave Request Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>New Leave Request</Text>
            
            <Text style={s.lbl}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. 2026-07-15"
              placeholderTextColor={Colors.fgMuted}
              value={startDate}
              onChangeText={setStartDate}
            />

            <Text style={s.lbl}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. 2026-07-18"
              placeholderTextColor={Colors.fgMuted}
              value={endDate}
              onChangeText={setEndDate}
            />

            <Text style={s.lbl}>Reason for Leave</Text>
            <TextInput
              style={s.inputMulti}
              placeholder="e.g. Medical reasons / Family function"
              placeholderTextColor={Colors.fgMuted}
              multiline
              value={reason}
              onChangeText={setReason}
            />

            <View style={s.btnRow}>
              <View style={{ flex: 1 }}>
                <Button title="Cancel" onPress={() => setModalVisible(false)} variant="secondary" fullWidth />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Submit Request" onPress={handleSubmit} fullWidth loading={submitting} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.fgPrimary },
  sub: { fontSize: 13, color: Colors.fgMuted, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
  addBtnT: { color: '#fff', fontSize: 13, fontWeight: '900' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ic: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  dates: { fontSize: 15, fontWeight: '800', color: Colors.fgPrimary },
  reason: { fontSize: 13, color: Colors.fgMuted, marginTop: 4 },
  remarksBox: { marginTop: 12, backgroundColor: Colors.bgSurface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  remarksLabel: { fontSize: 11, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase' },
  remarksText: { fontSize: 13, color: Colors.fgPrimary, fontWeight: '600', marginTop: 2 },
  reqDate: { fontSize: 11, color: Colors.fgDim, marginTop: 12, textAlign: 'right' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16 },
  emptyT: { fontSize: 16, color: Colors.fgMuted, fontWeight: '700' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 420 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 20, textAlign: 'center' },
  lbl: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 48, color: Colors.fgPrimary, fontSize: 15 },
  inputMulti: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, fontSize: 15, color: Colors.fgPrimary, minHeight: 100, textAlignVertical: 'top', marginBottom: 24 },
  btnRow: { flexDirection: 'row', gap: 12 }
});
