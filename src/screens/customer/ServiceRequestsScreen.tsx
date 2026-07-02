import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, TouchableOpacity, Modal, Alert, ScrollView, Linking } from 'react-native';
import { Hammer, X, FileText, User, MapPin, Calendar, Clock, MessageSquare, Phone, ChevronRight } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button, Badge } from '../../components/ui';

const statusColors: any = {
  pending: 'amber', confirmed: 'blue', assigned: 'blue', accepted: 'blue',
  in_progress: 'blue', completed: 'green', cancelled: 'red', delivered: 'green'
};

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
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + 
             ' • ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': case 'delivered': return Colors.success;
      case 'in_progress': case 'assigned': case 'accepted': case 'confirmed': return Colors.primary;
      case 'cancelled': return Colors.danger;
      default: return Colors.warning;
    }
  };

  const callTechnician = (phone: string) => {
    if (!phone) return Alert.alert('Not Available', 'Technician contact is not available yet.');
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Error', 'Unable to place call.'));
  };

  const getTimelineSteps = (item: any) => {
    return item?.trackingTimeline || [];
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
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              <View style={s.ic}><Hammer color={Colors.primaryLight} size={22} /></View>
              <View style={s.info}>
                <Text style={s.cName}>{item.serviceType || item.products?.[0]?.product?.name || 'CCTV Service Request'}</Text>
                <Text style={s.cDate}>{formatDate(item.createdAt || item.bookingDate)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={[s.statusBadge, { borderColor: getStatusColor(item.status) }]}>
                  <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>
                    {(item.status || 'Pending').replace(/_/g, ' ')}
                  </Text>
                </View>
                <ChevronRight color={Colors.fgMuted} size={14} />
              </View>
            </View>

            {/* Technician info row in card */}
            {item.technician && (
              <View style={s.techRow}>
                <User color={Colors.fgMuted} size={14} />
                <Text style={s.techName}>{item.technician?.name || 'Assigned Technician'}</Text>
                <TouchableOpacity 
                  style={s.callBtnSmall}
                  onPress={(e) => { e.stopPropagation(); callTechnician(item.technician?.phone); }}
                >
                  <Phone color={Colors.success} size={14} />
                  <Text style={s.callBtnSmallT}>Call</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ width: '100%', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
              <Button 
                title="Chat with Tech/Admin" 
                onPress={() => navigation.navigate('OrderChat', { orderId: item._id, orderStatus: item.status, customerName: item.customerName || item.customer?.name || user?.name })} 
                size="sm" 
              />
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

              {/* Service Type */}
              <View style={s.detailRow}>
                <Hammer color={Colors.fgMuted} size={20} />
                <View style={s.detailTextContainer}>
                  <Text style={s.dLabel}>Service Type</Text>
                  <Text style={s.dVal}>{selected?.serviceType || selected?.products?.[0]?.product?.name || 'CCTV Service Request'}</Text>
                </View>
              </View>

              {/* Booking Date */}
              <View style={s.detailRow}>
                <Calendar color={Colors.fgMuted} size={20} />
                <View style={s.detailTextContainer}>
                  <Text style={s.dLabel}>Booking Date</Text>
                  <Text style={s.dVal}>{formatDate(selected?.createdAt || selected?.bookingDate)}</Text>
                </View>
              </View>

              {/* Service Address */}
              <View style={s.detailRow}>
                <MapPin color={Colors.fgMuted} size={20} />
                <View style={s.detailTextContainer}>
                  <Text style={s.dLabel}>Service Address</Text>
                  <Text style={s.dVal}>{selected?.deliveryAddress || selected?.location?.address || selected?.address || 'No address provided'}</Text>
                </View>
              </View>

              {/* Status */}
              <View style={s.statusSection}>
                <Text style={s.dLabel}>Status</Text>
                <View style={[s.statusBadgeLarge, { backgroundColor: getStatusColor(selected?.status) + '20', borderColor: getStatusColor(selected?.status) }]}>
                  <Text style={[s.statusTextLarge, { color: getStatusColor(selected?.status) }]}>{(selected?.status || 'Pending').replace(/_/g, ' ')}</Text>
                </View>
              </View>

              {/* Technician Section — Name + Call button only (no number shown) */}
              {selected?.technician ? (
                <View style={s.techCard}>
                  <View style={s.techCardLeft}>
                    <View style={s.techAvatar}>
                      <Text style={s.techInitial}>{selected.technician?.name?.charAt(0) || 'T'}</Text>
                    </View>
                    <View>
                      <Text style={s.dLabel}>Assigned Technician</Text>
                      <Text style={s.techCardName}>{selected.technician?.name || 'Technician'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={s.callBtn}
                    onPress={() => callTechnician(selected?.technician?.phone)}
                  >
                    <Phone color="#fff" size={18} />
                    <Text style={s.callBtnT}>Call</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[s.techCard, { backgroundColor: Colors.bgSurface }]}>
                  <User color={Colors.fgMuted} size={20} />
                  <Text style={{ color: Colors.fgMuted, fontSize: 14, fontWeight: '600', marginLeft: 8 }}>Technician not yet assigned</Text>
                </View>
              )}

              {/* Scheduled Date */}
              {selected?.scheduledDate && (
                <View style={s.detailRow}>
                  <Clock color={Colors.fgMuted} size={20} />
                  <View style={s.detailTextContainer}>
                    <Text style={s.dLabel}>Scheduled Date</Text>
                    <Text style={s.dVal}>{formatDate(selected.scheduledDate)}{selected.scheduledSlot ? ` • ${selected.scheduledSlot}` : ''}</Text>
                  </View>
                </View>
              )}

              {/* Admin/Technician Responses */}
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

                {selected?.notes && (
                  <View style={s.responseItem}>
                    <Text style={s.rLabel}>Order Notes:</Text>
                    <Text style={s.rVal}>{selected.notes}</Text>
                  </View>
                )}
              </View>

              {/* Tracking Timeline */}
              {getTimelineSteps(selected).length > 0 && (
                <View style={s.responseCard}>
                  <View style={s.responseHeader}>
                    <Clock color={Colors.primaryLight} size={18} />
                    <Text style={s.responseTitle}>Status Timeline</Text>
                  </View>
                  {getTimelineSteps(selected).slice().reverse().map((step: any, idx: number) => (
                    <View key={idx} style={[s.responseItem, { borderLeftWidth: 2, borderLeftColor: Colors.primary + '40', paddingLeft: 12, marginLeft: 4 }]}>
                      <Text style={s.rLabel}>{(step.status || '').replace(/_/g, ' ').toUpperCase()}</Text>
                      <Text style={s.rVal}>{step.remarks || ''}</Text>
                      <Text style={{ fontSize: 11, color: Colors.fgDim, marginTop: 2 }}>{formatDate(step.timestamp)}</Text>
                    </View>
                  ))}
                </View>
              )}

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
  card: { flexDirection: 'column', backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 18, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 },
  ic: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary },
  cDate: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, borderWidth: 1, backgroundColor: Colors.bgSurface },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  techRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  techName: { fontSize: 13, fontWeight: '700', color: Colors.fgSecondary, flex: 1 },
  callBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.success + '15', borderWidth: 1, borderColor: Colors.success + '40', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  callBtnSmallT: { fontSize: 11, fontWeight: '800', color: Colors.success },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  empty: { textAlign: 'center', color: Colors.fgPrimary, fontSize: 18, fontWeight: '800' },
  emptySub: { textAlign: 'center', color: Colors.fgMuted, fontSize: 14, fontWeight: '600', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, maxHeight: '92%' },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mT: { fontSize: 22, fontWeight: '900', color: Colors.fgPrimary },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detailTextContainer: { flex: 1 },
  dLabel: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dVal: { fontSize: 15, color: Colors.fgPrimary, fontWeight: '700', marginTop: 2 },
  statusSection: { marginTop: 4 },
  statusBadgeLarge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, marginTop: 6 },
  statusTextLarge: { fontSize: 14, fontWeight: '900', textTransform: 'capitalize' },
  // Technician card
  techCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12 },
  techCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  techAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  techInitial: { fontSize: 18, fontWeight: '900', color: '#fff' },
  techCardName: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary, marginTop: 2 },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.success, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, elevation: 3, shadowColor: Colors.success, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4 },
  callBtnT: { fontSize: 14, fontWeight: '900', color: '#fff' },
  responseCard: { backgroundColor: Colors.bgSurface, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 20, gap: 14, marginTop: 8 },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 12 },
  responseTitle: { fontSize: 16, fontWeight: '900', color: Colors.primaryLight },
  responseItem: { gap: 4 },
  rLabel: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary },
  rVal: { fontSize: 14, fontWeight: '600', color: Colors.fgMuted, lineHeight: 20 },
  rNone: { fontStyle: 'italic', color: Colors.fgDim },
});
