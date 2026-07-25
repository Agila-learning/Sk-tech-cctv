import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Modal, TextInput } from 'react-native';
import { Colors } from '../../theme/colors';
import { ChevronLeft, MapPin, CheckCircle, Navigation, PenTool, Upload, Package } from 'lucide-react-native';
import { fetchWithAuth } from '../../api/client';
import { Button } from '../../components/ui';
import * as ImagePicker from 'expo-image-picker';

export default function TechServiceDetailScreen({ route, navigation }: any) {
  const { request } = route.params;
  const [data, setData] = useState(request);
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<'' | 'parts' | 'complete'>('');
  
  // State for Parts
  const [partName, setPartName] = useState('');
  const [partQty, setPartQty] = useState('1');

  // State for Complete
  const [remarks, setRemarks] = useState('');
  
  const updateStatus = async (status: string) => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/service-requests/${data._id}/timeline`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setData(res);
      Alert.alert('Success', `Status updated to ${status}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const requestPart = async () => {
    if (!partName) return Alert.alert('Error', 'Enter part name');
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/service-requests/${data._id}/spare-parts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partName, quantity: parseInt(partQty), status: 'Requested' })
      });
      setData(res);
      setModalType('');
      Alert.alert('Success', 'Part requested.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async () => {
    if (!remarks) return Alert.alert('Error', 'Enter remarks');
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('technicianRemarks', remarks);
      formData.append('customerSignature', 'signed'); // Dummy signature for now

      const res = await fetchWithAuth(`/service-requests/${data._id}/complete`, {
        method: 'PATCH',
        body: formData
      },);
      setData(res);
      setModalType('');
      Alert.alert('Success', 'Service Completed!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionButtons = () => {
    switch (data.status) {
      case 'Technician Assigned':
        return <Button title="Accept Job" onPress={() => updateStatus('Technician Accepted')} loading={loading} />;
      case 'Technician Accepted':
        return <Button title="Start Navigation (On the Way)" onPress={() => updateStatus('On the Way')} loading={loading} />;
      case 'On the Way':
        return <Button title="Reached Site" onPress={() => updateStatus('Reached Site')} loading={loading} />;
      case 'Reached Site':
        return <Button title="Start Inspection" onPress={() => updateStatus('Inspection Started')} loading={loading} />;
      case 'Inspection Started':
        return (
          <View style={{ gap: 10 }}>
            <Button title="Need Spare Parts?" onPress={() => setModalType('parts')} variant="secondary" />
            <Button title="Complete Inspection & Start Repair" onPress={() => updateStatus('Repair Started')} />
          </View>
        );
      case 'Waiting Spare Parts':
        return <Text style={{ color: Colors.warning, fontWeight: '700', textAlign: 'center' }}>Waiting for Admin to approve spare parts.</Text>;
      case 'Spare Parts Received':
        return <Button title="Start Repair" onPress={() => updateStatus('Repair Started')} loading={loading} />;
      case 'Repair Started':
        return <Button title="Finish & Sign-off" onPress={() => setModalType('complete')} loading={loading} />;
      case 'Service Completed':
        return <Text style={{ color: Colors.success, fontWeight: '700', textAlign: 'center' }}>Job Completed successfully.</Text>;
      default:
        return null;
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={Colors.fgPrimary} size={24} />
        </TouchableOpacity>
        <Text style={s.title}>Service Ticket</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={s.card}>
          <Text style={s.typeText}>{data.serviceType}</Text>
          <Text style={s.prodName}>{data.installedProduct}</Text>
          <View style={s.row}>
            <MapPin color={Colors.fgMuted} size={14} />
            <Text style={s.rowT}>{data.installationAddress}</Text>
          </View>
          <View style={[s.row, { marginTop: 10 }]}>
            <Text style={{ fontWeight: 'bold', color: Colors.fgPrimary }}>Status: </Text>
            <Text style={{ color: Colors.primary }}>{data.status}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.secTitle}>Issue Details</Text>
          <Text style={{ color: Colors.fgPrimary, fontWeight: '700', marginTop: 8 }}>{data.issueCategory}</Text>
          <Text style={{ color: Colors.fgMuted, marginTop: 4 }}>{data.issueDescription}</Text>
        </View>

        {data.spareParts && data.spareParts.length > 0 && (
          <View style={s.card}>
            <Text style={s.secTitle}>Spare Parts Requested</Text>
            {data.spareParts.map((p: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, padding: 8, backgroundColor: Colors.bgSurface, borderRadius: 8 }}>
                <Text style={{ color: Colors.fgPrimary }}>{p.quantity}x {p.partName}</Text>
                <Text style={{ color: p.status === 'Approved' ? Colors.success : Colors.warning, fontWeight: 'bold' }}>{p.status}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          {getActionButtons()}
        </View>
      </ScrollView>

      {/* Parts Modal */}
      <Modal visible={modalType === 'parts'} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.secTitle}>Request Spare Part</Text>
            <TextInput style={s.input} placeholder="Part Name" value={partName} onChangeText={setPartName} />
            <TextInput style={s.input} placeholder="Quantity" value={partQty} onChangeText={setPartQty} keyboardType="numeric" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Button title="Cancel" onPress={() => setModalType('')} variant="secondary" style={{ flex: 1 }} />
              <Button title="Request" onPress={requestPart} style={{ flex: 1 }} loading={loading} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Complete Modal */}
      <Modal visible={modalType === 'complete'} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.secTitle}>Complete Job</Text>
            <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Technician Remarks (What was fixed?)" value={remarks} onChangeText={setRemarks} multiline />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Button title="Cancel" onPress={() => setModalType('')} variant="secondary" style={{ flex: 1 }} />
              <Button title="Submit Report" onPress={markComplete} style={{ flex: 1 }} loading={loading} />
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: 20, fontWeight: '800', color: Colors.fgPrimary },
  
  card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  typeText: { fontSize: 13, fontWeight: '800', color: Colors.primaryLight, marginBottom: 8 },
  prodName: { fontSize: 18, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowT: { fontSize: 14, color: Colors.fgMuted },
  secTitle: { fontSize: 16, fontWeight: '900', color: Colors.fgPrimary },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.bgCard, padding: 20, borderRadius: 20 },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginTop: 12, color: Colors.fgPrimary }
});
