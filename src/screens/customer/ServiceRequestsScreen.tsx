import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { Hammer, X, FileText, User, MapPin, Calendar, Clock, MessageSquare } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';

export default function ServiceRequestsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    try { 
      setLoading(true); 
      let d = null;
      try {
        d = await fetchWithAuth('/bookings/my-bookings');
      } catch(err) {
        d = await fetchWithAuth('/orders/my-orders');
      }
      setData(d || []); 
    } catch (e: any) { 
      console.error(e); 
      Alert.alert('Error', e.message || 'Failed to fetch service requests');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return Colors.success || '#10b981';
      case 'in_progress': return Colors.info || '#3b82f6';
      case 'cancelled': return Colors.danger || '#ef4444';
      default: return Colors.primary || '#f59e0b';
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>My Bookings</Text>
        <Text style={s.subTitle}>Track your service requests and technician responses</Text>
      </View>
      <FlatList 
        data={data} 
        keyExtractor={(i, idx) => i._id || idx.toString()} 
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => setSelected(item)}>
            <View style={s.ic}><Hammer color={Colors.primaryLight} size={22} /></View>
            <View style={s.info}>
              <Text style={s.cName}>{item.serviceType || 'CCTV Service Request'}</Text>
              <Text style={s.cDate}>{formatDate(item.createdAt || item.bookingDate)}</Text>
            </View>
            <View style={[s.statusBadge, { borderColor: getStatusColor(item.status) }]}>
              <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>
                {item.status || 'Pending'}
              </Text>
            </View>
          </TouchableOpacity>
        )} 
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyContainer}>
              <FileText color={Colors.fgMuted} size={48} style={{ marginBottom: 16 }} />
              <Text style={s.empty}>No service requests found</Text>
              <Text style={s.emptySub}>Book a new service from the Book Service menu</Text>
            </View>
          ) : null
        } 
      />

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.mHdr}>
              <Text style={s.mT}>Booking Details</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <X color={Colors.fgPrimary} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 40 }}>
              <View style={s.detailRow}>
                <Hammer color={Colors.fgMuted} size={20} />
                <View style={s.detailTextContainer}>
                  <Text style={s.dLabel}>Service Type</Text>
                  <Text style={s.dVal}>{selected?.serviceType || 'CCTV Service Request'}</Text>
                </View>
              </View>

              <View style={s.detailRow}>
                <Calendar color={Colors.fgMuted} size={20} />
                <View style={s.detailTextContainer}>
                  <Text style={s.dLabel}>Booking Date</Text>
                  <Text style={s.dVal}>{formatDate(selected?.createdAt || selected?.bookingDate)}</Text>
                </View>
              </View>

              <View style={s.detailRow}>
                <User color={Colors.fgMuted} size={20} />
                <View style={s.detailTextContainer}>
                  <Text style={s.dLabel}>Customer Details</Text>
                  <Text style={s.dVal}>{selected?.customerName || selected?.customer?.name || 'N/A'} ({selected?.contactNumber || selected?.customer?.phone || 'No contact'})</Text>
                </View>
              </View>

              <View style={s.detailRow}>
                <MapPin color={Colors.fgMuted} size={20} />
                <View style={s.detailTextContainer}>
                  <Text style={s.dLabel}>Service Address</Text>
                  <Text style={s.dVal}>{selected?.deliveryAddress || selected?.location?.address || selected?.address || 'No address provided'}</Text>
                </View>
              </View>

              <View style={s.statusSection}>
                <Text style={s.dLabel}>Status</Text>
                <View style={[s.statusBadgeLarge, { backgroundColor: getStatusColor(selected?.status) + '20', borderColor: getStatusColor(selected?.status) }]}>
                  <Text style={[s.statusTextLarge, { color: getStatusColor(selected?.status) }]}>{selected?.status || 'Pending'}</Text>
                </View>
              </View>

              {/* Admin / Technician Responses & Notes */}
              <View style={s.responseCard}>
                <View style={s.responseHeader}>
                  <MessageSquare color={Colors.primaryLight} size={18} />
                  <Text style={s.responseTitle}>Responses & Tracking</Text>
                </View>
                
                <View style={s.responseItem}>
                  <Text style={s.rLabel}>Technician Response:</Text>
                  <Text style={[s.rVal, !(selected?.technicianResponse || selected?.workProofs?.completion?.remarks) && s.rNone]}>
                    {selected?.technicianResponse || selected?.workProofs?.completion?.remarks || 'No response from technician yet.'}
                  </Text>
                </View>

                <View style={s.responseItem}>
                  <Text style={s.rLabel}>Admin Response:</Text>
                  <Text style={[s.rVal, !(selected?.adminResponse || selected?.adminNotes || selected?.trackingTimeline?.[selected.trackingTimeline.length - 1]?.remarks) && s.rNone]}>
                    {selected?.adminResponse || selected?.adminNotes || selected?.trackingTimeline?.[selected.trackingTimeline.length - 1]?.remarks || 'No response from admin yet.'}
                  </Text>
                </View>

                <View style={s.responseItem}>
                  <Text style={s.rLabel}>Workflow Notes:</Text>
                  <Text style={[s.rVal, !selected?.notes && s.rNone]}>
                    {selected?.notes || 'No workflow notes added.'}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                <Button 
                  title="Chat with Tech/Admin" 
                  onPress={() => {
                    setSelected(null);
                    navigation.navigate('OrderChat', { orderId: selected._id, orderStatus: selected.status, customerName: selected.customerName || selected.customer?.name || user?.name });
                  }} 
                />
              </View>
              </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary, letterSpacing: -0.5 },
  subTitle: { fontSize: 14, color: Colors.fgMuted, fontWeight: '600', marginTop: 4 },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 18, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 },
  ic: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary },
  cDate: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, backgroundColor: Colors.bgSurface },
  statusText: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  empty: { textAlign: 'center', color: Colors.fgPrimary, fontSize: 18, fontWeight: '800' },
  emptySub: { textAlign: 'center', color: Colors.fgMuted, fontSize: 14, fontWeight: '600', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, maxHeight: '90%' },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mT: { fontSize: 22, fontWeight: '900', color: Colors.fgPrimary },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detailTextContainer: { flex: 1 },
  dLabel: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dVal: { fontSize: 15, color: Colors.fgPrimary, fontWeight: '700', marginTop: 2 },
  statusSection: { marginTop: 4 },
  statusBadgeLarge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, marginTop: 6 },
  statusTextLarge: { fontSize: 14, fontWeight: '900', textTransform: 'capitalize' },
  responseCard: { backgroundColor: Colors.bgSurface, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 20, gap: 14, marginTop: 8 },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 12 },
  responseTitle: { fontSize: 16, fontWeight: '900', color: Colors.primaryLight },
  responseItem: { gap: 4 },
  rLabel: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary },
  rVal: { fontSize: 14, fontWeight: '600', color: Colors.fgMuted, lineHeight: 20 },
  rNone: { fontStyle: 'italic', color: Colors.fgDim }
});
