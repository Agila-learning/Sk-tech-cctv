import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar, Modal, TextInput } from 'react-native';
import { Colors } from '../../theme/colors';
import { ShieldCheck, MapPin, User, ChevronRight, CheckCircle2, Clock } from 'lucide-react-native';
import { fetchWithAuth } from '../../api/client';
import { Button } from '../../components/ui';

export default function WarrantyClaimsScreen({ navigation }: any) {
  const [data, setData] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [modalType, setModalType] = useState<'' | 'verify' | 'assign' | 'parts'>('');
  
  // Verify state
  const [verifyType, setVerifyType] = useState('Free Warranty Service');
  const [verifyRemarks, setVerifyRemarks] = useState('');

  // Assign state
  const [selectedTech, setSelectedTech] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [res, techRes] = await Promise.all([
        fetchWithAuth('/service-requests'),
        fetchWithAuth('/technician')
      ]);
      setData(res || []);
      setTechnicians(techRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async () => {
    try {
      setLoading(true);
      await fetchWithAuth(`/service-requests/${selectedReq._id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifiedType: verifyType, remarks: verifyRemarks })
      });
      setModalType('');
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTech) return;
    try {
      setLoading(true);
      await fetchWithAuth(`/service-requests/${selectedReq._id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: selectedTech })
      });
      setModalType('');
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const approvePart = async (partName: string) => {
    try {
      setLoading(true);
      await fetchWithAuth(`/service-requests/${selectedReq._id}/spare-parts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partName, status: 'Approved' })
      });
      load();
      // Keep modal open to approve others if needed
      setSelectedReq((prev: any) => ({
        ...prev,
        spareParts: prev.spareParts.map((p: any) => p.partName === partName ? { ...p, status: 'Approved' } : p)
      }));
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>Service Requests</Text>
        <Text style={s.sub}>Warranty, AMC & Repairs</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={i => i._id}
        contentContainerStyle={{ padding: 20, gap: 14 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => { setSelectedReq(item); setModalType(item.status === 'Submitted' ? 'verify' : item.status === 'Warranty Verified' || item.status === 'AMC Verified' || item.status === 'Paid Service Required' ? 'assign' : item.status === 'Waiting Spare Parts' ? 'parts' : ''); }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={s.typeText}>{item.serviceType}</Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.primary }}>{item.status}</Text>
            </View>
            <Text style={s.prodName}>{item.installedProduct}</Text>
            <View style={s.row}>
              <User color={Colors.fgMuted} size={14} />
              <Text style={s.rowT}>{item.customer?.name || 'Customer'}</Text>
            </View>
            <View style={[s.row, { marginTop: 4 }]}>
              <MapPin color={Colors.fgMuted} size={14} />
              <Text style={s.rowT}>{item.installationAddress}</Text>
            </View>

            {/* Quick Actions overlay */}
            <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
              {item.status === 'Submitted' && <Text style={{ color: Colors.warning, fontWeight: '800' }}>Tap to Verify</Text>}
              {(item.status === 'Warranty Verified' || item.status === 'AMC Verified') && <Text style={{ color: Colors.primary, fontWeight: '800' }}>Tap to Assign Tech</Text>}
              {item.status === 'Waiting Spare Parts' && <Text style={{ color: Colors.danger, fontWeight: '800' }}>Spare Parts Approval Pending!</Text>}
              {item.status !== 'Submitted' && item.status !== 'Warranty Verified' && item.status !== 'AMC Verified' && item.status !== 'Waiting Spare Parts' && (
                <Text style={{ color: Colors.success, fontWeight: '800' }}>View Details</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Verify Modal */}
      <Modal visible={modalType === 'verify'} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.secTitle}>Verify Request</Text>
            <Text style={{ color: Colors.fgMuted, marginTop: 10 }}>Customer Requested: {selectedReq?.serviceType}</Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
              {['Free Warranty Service', 'Free AMC Visit', 'Paid Service', 'Rejected'].map(t => (
                <TouchableOpacity key={t} style={[s.typeCard, verifyType === t && s.typeCardActive]} onPress={() => setVerifyType(t)}>
                  <Text style={[s.typeTextS, verifyType === t && { color: '#fff' }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={[s.input, { height: 80 }]} placeholder="Remarks" value={verifyRemarks} onChangeText={setVerifyRemarks} multiline />
            
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Button title="Cancel" onPress={() => setModalType('')} variant="outline" style={{ flex: 1 }} />
              <Button title="Verify" onPress={handleVerify} style={{ flex: 1 }} loading={loading} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Modal */}
      <Modal visible={modalType === 'assign'} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.secTitle}>Assign Technician</Text>
            <View style={{ marginTop: 16, maxHeight: 200 }}>
              <FlatList
                data={technicians}
                keyExtractor={i => i._id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[s.techCard, selectedTech === item._id && s.techCardActive]} onPress={() => setSelectedTech(item._id)}>
                    <Text style={[s.techT, selectedTech === item._id && { color: '#fff' }]}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Button title="Cancel" onPress={() => setModalType('')} variant="outline" style={{ flex: 1 }} />
              <Button title="Assign" onPress={handleAssign} style={{ flex: 1 }} loading={loading} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Spare Parts Modal */}
      <Modal visible={modalType === 'parts'} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.secTitle}>Spare Parts Approval</Text>
            {selectedReq?.spareParts?.map((p: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: 12, backgroundColor: Colors.bgSurface, borderRadius: 12 }}>
                <View>
                  <Text style={{ color: Colors.fgPrimary, fontWeight: '800' }}>{p.quantity}x {p.partName}</Text>
                  <Text style={{ color: p.status === 'Approved' ? Colors.success : Colors.warning, fontSize: 12, marginTop: 4 }}>{p.status}</Text>
                </View>
                {p.status === 'Requested' && (
                  <Button title="Approve" onPress={() => approvePart(p.partName)} size="sm" />
                )}
              </View>
            ))}
            <Button title="Done" onPress={() => { setModalType(''); load(); }} style={{ marginTop: 20 }} />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { padding: 20, paddingTop: 56, backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 24, fontWeight: '900', color: Colors.fgPrimary },
  sub: { fontSize: 14, color: Colors.fgMuted, marginTop: 4 },
  
  card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, elevation: 2 },
  typeText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  prodName: { fontSize: 18, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowT: { fontSize: 14, color: Colors.fgMuted },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.bgCard, padding: 20, borderRadius: 20 },
  secTitle: { fontSize: 18, fontWeight: '900', color: Colors.fgPrimary },
  
  typeCard: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  typeCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeTextS: { fontSize: 13, fontWeight: '700', color: Colors.fgMuted },
  
  techCard: { padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  techCardActive: { backgroundColor: Colors.primary, borderRadius: 8 },
  techT: { fontSize: 15, fontWeight: '700', color: Colors.fgPrimary },
  
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginTop: 12, color: Colors.fgPrimary }
});
