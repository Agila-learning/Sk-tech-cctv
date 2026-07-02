import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Modal, TextInput, Alert, Platform } from 'react-native';
import { Calendar, User, CheckCircle, XCircle, FileText, MessageCircle } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge, Button } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import { useFocusEffect } from '@react-navigation/native';

export default function AdminLeaveScreen({ navigation }: any) {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/technician/leave-requests/all');
      setLeaves(data || []);
    } catch (e: any) {
      console.error('Error loading leaves:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeaves(); }, []);
  useFocusEffect(useCallback(() => { loadLeaves(); }, []));

  const handleStatusUpdate = async (status: 'Approved' | 'Rejected') => {
    try {
      setUpdating(true);
      await fetchWithAuth(`/technician/leave-request/${selectedLeave._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: status.toLowerCase(), adminRemarks })
      });
      Alert.alert('Success', `Leave request ${status.toLowerCase()} successfully!`);
      setSelectedLeave(null);
      setAdminRemarks('');
      loadLeaves();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update leave request');
    } finally {
      setUpdating(false);
    }
  };

  const fmt = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return 'N/A'; } };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>Leave Review Portal</Text>
        <Text style={s.sub}>Review & approve technician leave requests</Text>
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
                <User color={Colors.primaryLight} size={20} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.techName}>{item.technician?.name || 'Technician'}</Text>
                <Text style={s.dates}>{fmt(item.startDate)}  ➔  {fmt(item.endDate)}</Text>
              </View>
              <Badge 
                label={item.status} 
                color={item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'amber'} 
              />
            </View>

            <View style={s.reasonBox}>
              <Text style={s.reasonLabel}>Reason for Leave:</Text>
              <Text style={s.reasonText}>{item.reason}</Text>
            </View>

            {item.adminRemarks ? (
              <View style={s.remarksBox}>
                <Text style={s.remarksLabel}>Admin Remarks:</Text>
                <Text style={s.remarksText}>{item.adminRemarks}</Text>
              </View>
            ) : null}

            <View style={s.actionRow}>
              <Text style={s.reqDate}>Submitted: {fmt(item.createdAt)}</Text>
              {item.status === 'pending' ? (
                <TouchableOpacity style={s.reviewBtn} onPress={() => { setSelectedLeave(item); setAdminRemarks(''); }}>
                  <Text style={s.reviewBtnT}>Review Request</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <FileText color={Colors.fgDim} size={48} />
            <Text style={s.emptyT}>No leave requests submitted yet.</Text>
          </View>
        }
      />

      {/* Leave Approval Modal */}
      <Modal visible={!!selectedLeave} transparent animationType="slide" onRequestClose={() => setSelectedLeave(null)}>
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>Review Leave Request</Text>
            <Text style={s.modalTechName}>{selectedLeave?.technician?.name}</Text>
            <Text style={s.modalDates}>{selectedLeave ? `${fmt(selectedLeave.startDate)}  ➔  ${fmt(selectedLeave.endDate)}` : ''}</Text>

            <Text style={s.lbl}>Admin Remarks / Notes (Optional)</Text>
            <TextInput
              style={s.inputMulti}
              placeholder="e.g. Approved, please ensure pending tasks are handed over"
              placeholderTextColor={Colors.fgMuted}
              multiline
              value={adminRemarks}
              onChangeText={setAdminRemarks}
            />

            <View style={s.btnRow}>
              <View style={{ flex: 1 }}>
                <Button title="Reject" onPress={() => handleStatusUpdate('Rejected')} variant="danger" fullWidth loading={updating} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Approve" onPress={() => handleStatusUpdate('Approved')} variant="success" fullWidth loading={updating} />
              </View>
            </View>

            <TouchableOpacity style={s.cancelBtn} onPress={() => setSelectedLeave(null)}>
              <Text style={s.cancelBtnT}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.fgPrimary },
  sub: { fontSize: 13, color: Colors.fgMuted, marginTop: 2 },
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ic: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  techName: { fontSize: 16, fontWeight: '900', color: Colors.fgPrimary },
  dates: { fontSize: 13, color: Colors.primaryLight, fontWeight: '800', marginTop: 4 },
  reasonBox: { marginTop: 12, backgroundColor: Colors.bgSurface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  reasonLabel: { fontSize: 11, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase' },
  reasonText: { fontSize: 13, color: Colors.fgPrimary, fontWeight: '600', marginTop: 2 },
  remarksBox: { marginTop: 12, backgroundColor: Colors.primary + '15', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.primary + '40' },
  remarksLabel: { fontSize: 11, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase' },
  remarksText: { fontSize: 13, color: Colors.fgPrimary, fontWeight: '700', marginTop: 2 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  reqDate: { fontSize: 11, color: Colors.fgDim },
  reviewBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  reviewBtnT: { color: '#fff', fontSize: 12, fontWeight: '900' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16 },
  emptyT: { fontSize: 16, color: Colors.fgMuted, fontWeight: '700' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 420 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: Colors.fgPrimary, textAlign: 'center' },
  modalTechName: { fontSize: 18, fontWeight: '900', color: Colors.primaryLight, textAlign: 'center', marginTop: 8 },
  modalDates: { fontSize: 14, color: Colors.fgMuted, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  lbl: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary, marginBottom: 8 },
  inputMulti: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, fontSize: 15, color: Colors.fgPrimary, minHeight: 100, textAlignVertical: 'top', marginBottom: 24 },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { marginTop: 24, alignItems: 'center', paddingVertical: 12 },
  cancelBtnT: { color: Colors.fgMuted, fontSize: 14, fontWeight: '800' }
});
