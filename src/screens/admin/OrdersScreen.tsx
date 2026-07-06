import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Modal, Alert, TextInput, Image, Linking, Platform, ScrollView } from 'react-native';
import { Package, Trash2, Edit2, MapPin } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import MapComponent from '../../components/MapComponent';

const SC: Record<string, string> = { pending: Colors.warning, confirmed: Colors.primary, processing: Colors.info, assigned: Colors.purple, shipped: Colors.purple, delivered: Colors.success, completed: Colors.success, cancelled: Colors.danger, pending_approval: Colors.warning, pending_admin_approval: Colors.warning };

export default function AdminOrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]); 
  const [techs, setTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState<any>(null);
  const [statusModal, setStatusModal] = useState<any>(null);
  const [infoModal, setInfoModal] = useState<any>(null);
  const [followUpModal, setFollowUpModal] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'assigned' | 'completed'>('all');
  const { socket } = useSocket();

  const load = async () => { 
    try { 
      setLoading(true); 
      const [d, t] = await Promise.all([fetchWithAuth('/orders/all'), fetchWithAuth('/availability/technicians')]); 
      setOrders(d || []); setTechs(t || []);
    } catch (e) { console.error(e); } finally { setLoading(false); } 
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new_order', load);
      socket.on('order_updated', load);
      return () => {
        socket.off('new_order', load);
        socket.off('order_updated', load);
      };
    }
  }, [socket]);
  const fmt = (d: string) => { try { return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }); } catch { return 'N/A'; } };

  const handleAssign = async (orderId: string, techId: string) => {
    try {
      await fetchWithAuth(`/availability/assign`, {
        method: 'POST',
        body: JSON.stringify({ 
          orderId, 
          technicianId: techId, 
          date: new Date().toISOString(),
          startTime: '09:00',
          endTime: '18:00',
          timeToComplete: 2 
        })
      });
      if (socket) {
        socket.emit('task_assigned', {
          title: `New Order Assigned (Order #${orderId.slice(-6)})`,
          message: `You have been assigned a new service order #${orderId.slice(-6)}. Please open your Tasks to Accept or Reject.`,
          role: 'technician',
          orderId
        });
        socket.emit('new_notification', {
          title: `New Order Assigned (Order #${orderId.slice(-6)})`,
          message: `You have been assigned a new service order #${orderId.slice(-6)}. Please open your Tasks to Accept or Reject.`,
          role: 'technician',
          orderId,
          type: 'task_assigned'
        });
      }
      setAssignModal(null);
      load();
      Alert.alert('Success', 'Order assigned successfully!');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      setLoading(true);
      await fetchWithAuth(`/orders/${statusModal._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setStatusModal(null);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };



  const handleApproval = async (action: 'approve' | 'rework', notes?: string) => {
    try {
      if (action === 'approve') {
        await fetchWithAuth(`/orders/${infoModal.order._id}/approve-completion`, { method: 'PATCH' });
      } else {
        await fetchWithAuth(`/admin/orders/${infoModal.order._id}/approval`, {
          method: 'PATCH',
          body: JSON.stringify({ action, notes })
        });
      }
      setInfoModal(null);
      Alert.alert('Success', `Order ${action}d successfully`);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleDailyReportApproval = async (dayNumber: number, action: 'approve' | 'rework', notes?: string) => {
    try {
      await fetchWithAuth(`/admin/orders/${infoModal.order._id}/daily-report/${dayNumber}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ action, notes })
      });
      setInfoModal(null);
      Alert.alert('Success', `Day ${dayNumber} Report ${action}d successfully`);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleFollowUp = async (note: string) => {
    try {
      await fetchWithAuth(`/admin/orders/${followUpModal._id}/followup`, {
        method: 'PATCH',
        body: JSON.stringify({ required: true, date: new Date().toISOString(), note, status: 'pending' })
      });
      setFollowUpModal(null);
      Alert.alert('Success', 'Follow-up scheduled');
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Order', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await fetchWithAuth(`/orders/${id}`, { method: 'DELETE' });
          load();
        } catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  const handlePaymentStatus = async (id: string, paymentStatus: string) => {
    try {
      setLoading(true);
      await fetchWithAuth(`/orders/${id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus })
      });
      Alert.alert('Success', `Payment marked as ${paymentStatus.toUpperCase()}`);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const cleanSearch = search.trim().replace(/^#/, '').toLowerCase();
  const filteredOrders = orders.filter(o => {
    // 1. Search Filter
    const matchesSearch = (o._id || '').toLowerCase().includes(cleanSearch) || 
      (o.customer?.name || '').toLowerCase().includes(cleanSearch) ||
      (o.technician?.name || '').toLowerCase().includes(cleanSearch) ||
      (o.customerName || '').toLowerCase().includes(cleanSearch);
      
    if (!matchesSearch) return false;
    
    // 2. Tab Filter
    if (filterTab === 'all') return true;
    if (filterTab === 'pending') return ['pending', 'pending_admin_approval'].includes(o.status);
    if (filterTab === 'assigned') return ['assigned', 'processing', 'in_progress'].includes(o.status);
    if (filterTab === 'completed') return ['completed', 'delivered'].includes(o.status);
    return true;
  });

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={s.title}>All Orders</Text>
          <Text style={s.count}>{orders.length} total</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <TextInput
          style={s.searchInput}
          placeholder="Search by Order ID, Customer, or Tech..."
          placeholderTextColor={Colors.fgMuted}
          value={search}
          onChangeText={setSearch}
        />
        
        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
          {['all', 'pending', 'assigned', 'completed'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setFilterTab(tab as any)}
              style={[
                s.filterTab, 
                filterTab === tab ? { backgroundColor: Colors.primary } : { backgroundColor: Colors.bgSurface }
              ]}
            >
              <Text style={[s.filterTabT, filterTab === tab && { color: Colors.fgPrimary, fontWeight: 'bold' }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList data={filteredOrders} keyExtractor={o => o._id} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            {/* Top row */}
            <View style={s.cardTop}>
              <View style={s.ic}><Package color={Colors.primaryLight} size={18} /></View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.id}>#{item._id?.slice(-6)}</Text>
                  <View style={[s.badge, { paddingVertical: 2, paddingHorizontal: 6, backgroundColor: item.orderType === 'offline' ? Colors.purple + '20' : Colors.info + '20' }]}>
                    <Text style={[s.badgeT, { fontSize: 8, color: item.orderType === 'offline' ? Colors.purple : Colors.info }]}>{item.orderType || 'online'}</Text>
                  </View>
                </View>
                <Text style={s.cust}>{item.customer?.name || item.customerName || 'Customer'}</Text>
                {item.technician?.name && (
                  <Text style={{ fontSize: 11, color: Colors.success, marginTop: 2 }}>Tech: {item.technician.name}</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={[s.badge, { backgroundColor: (SC[item.status] || Colors.fgMuted) + '20' }]}><Text style={[s.badgeT, { color: SC[item.status] || Colors.fgMuted }]}>{item.status}</Text></View>
                {item.followUp?.required && item.followUp?.status === 'pending' && (
                  <View style={[s.badge, { backgroundColor: Colors.warning + '20' }]}><Text style={[s.badgeT, { color: Colors.warning }]}>Follow-up</Text></View>
                )}
              </View>
            </View>

            {/* Mid row: clean key-value rows */}
            <View style={s.cardMid}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Booked Date:</Text>
                <Text style={s.infoVal}>{fmt(item.createdAt)}</Text>
              </View>
              {item.appointmentDate && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Appointment:</Text>
                  <Text style={s.infoVal}>{fmt(item.appointmentDate)}</Text>
                </View>
              )}
              
              {/* Call Customer Button */}
              {(item.customer?.phone || item.contactNumber || item.alternatePhone) && (
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
                  onPress={() => Linking.openURL(`tel:${item.customer?.phone || item.contactNumber || item.alternatePhone}`)}
                >
                  <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: 'bold' }}>📞 Call Customer</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom Row */}
            <View style={s.cardBottom}>
              <Text style={s.itemCount}>
                {item.products?.reduce((acc: number, curr: any) => acc + (curr.quantity || 1), 0) || 0} items
              </Text>
              <Text style={s.price}>₹{item.totalAmount?.toLocaleString()}</Text>
            </View>
            
            <View style={s.actionsRow}>
              {(['pending', 'confirmed', 'assigned'].includes(item.status)) && (
                <TouchableOpacity style={s.assignBtn} onPress={() => setAssignModal(item)}>
                  <Text style={s.assignBtnT}>{item.status === 'assigned' ? 'Reassign' : 'Assign'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.aBtn} onPress={() => setStatusModal(item)}>
                <Edit2 color={Colors.primary} size={14} /><Text style={s.aBtnT}>Status</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.aBtn, { borderColor: item.paymentStatus === 'paid' ? Colors.success : Colors.primaryLight }]} onPress={() => {
                const nextStatus = item.paymentStatus === 'paid' ? 'pending' : 'paid';
                if (Platform.OS === 'web') {
                  if (window.confirm(`Mark payment as ${nextStatus.toUpperCase()}?`)) {
                    handlePaymentStatus(item._id, nextStatus);
                  }
                } else {
                  Alert.alert('Payment Status', `Update Payment Status to ${nextStatus.toUpperCase()}?`, [
                    { text: `Mark ${nextStatus.toUpperCase()}`, onPress: () => handlePaymentStatus(item._id, nextStatus) },
                    { text: 'Cancel', style: 'cancel' }
                  ]);
                }
              }}>
                <Text style={[s.aBtnT, { color: item.paymentStatus === 'paid' ? Colors.success : Colors.primaryLight }]}>
                  {item.paymentStatus === 'paid' ? 'PAID' : 'PAYMENT'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.aBtn} onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}>
                <Text style={s.aBtnT}>Info</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.aBtn, { borderColor: Colors.warning + '40' }]} onPress={() => setFollowUpModal(item)}>
                <Text style={[s.aBtnT, { color: Colors.warning }]}>Follow-up</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.aBtn, { borderColor: Colors.danger + '40' }]} onPress={() => handleDelete(item._id)}>
                <Trash2 color={Colors.danger} size={14} />
              </TouchableOpacity>
            </View>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No orders</Text>} />

      {/* Assignment Modal - ONLY show available techs */}
      <Modal visible={!!assignModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { height: '80%' }]}>
            <Text style={s.modalTitle}>Assign Technician</Text>
            
            {assignModal?.locationDetails && Platform.OS !== 'web' ? (
              <View style={{ height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <MapComponent 
                  style={{ flex: 1 }} 
                  initialRegion={{
                    latitude: assignModal.locationDetails.lat,
                    longitude: assignModal.locationDetails.lng,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  markers={[
                    { coordinate: { latitude: assignModal.locationDetails.lat, longitude: assignModal.locationDetails.lng }, title: "Customer Location", pinColor: "red" },
                    ...techs.filter(t => t.status === 'available' && t.location?.lat).map(t => ({
                      key: t._id,
                      coordinate: { latitude: t.location.lat, longitude: t.location.lng },
                      title: t.name,
                      description: "Available Technician",
                      pinColor: "green"
                    }))
                  ]}
                />
              </View>
            ) : assignModal?.locationDetails ? (
              <TouchableOpacity style={{ backgroundColor: Colors.infoFaint, padding: 12, borderRadius: 8, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${assignModal.locationDetails.lat},${assignModal.locationDetails.lng}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
                <MapPin color={Colors.info} size={16} style={{ marginRight: 8 }} />
                <Text style={{ color: Colors.info, fontWeight: '700' }}>View Customer Location on Maps</Text>
              </TouchableOpacity>
            ) : null}

            <FlatList data={techs.filter(t => t.status === 'available')} keyExtractor={t => t._id} style={{ flex: 1 }} renderItem={({ item }) => (
              <TouchableOpacity style={s.techRow} onPress={() => handleAssign(assignModal._id, item._id)}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: Colors.primary, fontWeight: 'bold' }}>{item.name.charAt(0)}</Text></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.techName}>{item.name}</Text>
                  <Text style={[s.techStatus, { color: Colors.success }]}>Available</Text>
                </View>
              </TouchableOpacity>
            )} ListEmptyComponent={<Text style={s.empty}>No technicians currently available.</Text>} />
            <TouchableOpacity style={s.cancelBtn} onPress={() => setAssignModal(null)}><Text style={s.cancelT}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Info/Photos Modal */}
      <Modal visible={!!infoModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { height: '80%' }]}>
            <Text style={s.modalTitle}>Order Details & Media</Text>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
              {infoModal?.order && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.primaryLight, marginBottom: 8 }}>Order Timeline & Status</Text>
                  
                  {/* Timeline Items */}
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.success }} />
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: Colors.fgPrimary }}>Order Created ({fmt(infoModal.order.createdAt)})</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: infoModal.order.technician ? Colors.success : Colors.warning }} />
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: Colors.fgPrimary }}>
                        Technician Assigned: {infoModal.order.technician?.name || infoModal.workflow?.technician?.name || 'Pending Assignment'}
                      </Text>
                    </View>

                    {/* Daily Reports Timeline */}
                    {infoModal.order.dailyReports?.map((rep: any, idx: number) => (
                      <View key={idx} style={{ marginLeft: 6, paddingLeft: 16, borderLeftWidth: 2, borderLeftColor: Colors.primary, marginVertical: 4 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text style={{ fontSize: 15, fontWeight: '900', color: Colors.fgPrimary }}>Day {rep.dayNumber} Report: {rep.status}</Text>
                          <Text style={{ fontSize: 11, color: Colors.primaryLight, fontWeight: 'bold' }}>{rep.progressPercent || 'N/A'} Progress</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: Colors.fgPrimary, marginBottom: 4 }}>Work: {rep.workDescription}</Text>
                        {rep.issuesRemarks ? <Text style={{ fontSize: 12, color: Colors.warning, marginBottom: 4 }}>Remarks: {rep.issuesRemarks}</Text> : null}
                        
                        {/* GPS Location */}
                        {rep.location && (
                          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, padding: 8, borderRadius: 8, marginBottom: 8 }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${rep.location.lat},${rep.location.lng}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
                            <MapPin color={Colors.primary} size={14} />
                            <Text style={{ fontSize: 11, color: Colors.primary, fontWeight: '700', marginLeft: 6 }}>GPS: {rep.location.address || `${rep.location.lat}, ${rep.location.lng}`}</Text>
                          </TouchableOpacity>
                        )}

                        {/* Photos */}
                        {rep.photos?.length > 0 && (
                          <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 12, color: Colors.fgMuted, fontWeight: '700', marginBottom: 6 }}>Uploaded Photos ({rep.photos.length}):</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                              {rep.photos.map((url: string, pIdx: number) => (
                                <Image key={pIdx} source={{ uri: url.startsWith('http') ? url : `https://sk-tech-cctv.onrender.com${url}` }} style={{ width: 90, height: 90, borderRadius: 10, backgroundColor: Colors.bgSurface }} />
                              ))}
                            </ScrollView>
                          </View>
                        )}

                        {/* Approval Actions */}
                        {rep.status !== 'Approved' && (
                          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                            <TouchableOpacity style={[s.assignBtn, { backgroundColor: Colors.success + '20', borderColor: Colors.success }]} onPress={() => handleDailyReportApproval(rep.dayNumber, 'approve')}>
                              <Text style={[s.assignBtnT, { color: Colors.success }]}>Approve Day {rep.dayNumber}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.assignBtn, { backgroundColor: Colors.danger + '20', borderColor: Colors.danger }]} onPress={() => {
                              if (Platform.OS === 'web') {
                                const reason = window.prompt('Enter reason for rework / rejection:');
                                if (reason) handleDailyReportApproval(rep.dayNumber, 'rework', reason);
                              } else {
                                Alert.prompt(`Reject Day ${rep.dayNumber}`, 'Enter reason for rework:', [
                                  { text: 'Cancel', style: 'cancel' },
                                  { text: 'Send for Rework', onPress: (notes: any) => handleDailyReportApproval(rep.dayNumber, 'rework', notes) }
                                ]);
                              }
                            }}>
                              <Text style={[s.assignBtnT, { color: Colors.danger }]}>Reject / Rework</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))}

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: infoModal.order.status === 'completed' ? Colors.success : Colors.fgMuted }} />
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: infoModal.order.status === 'completed' ? Colors.success : Colors.fgMuted }}>Final Completion</Text>
                    </View>
                  </View>
                </View>
              )}

              {infoModal?.workflow ? (
                <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16 }}>
                  <Text style={s.techName}>Technician: {infoModal.workflow.technician?.name}</Text>
                  <Text style={{ marginTop: 16, fontWeight: 'bold', color: Colors.fgPrimary }}>Legacy Workflow Photos:</Text>
                    <View style={{ flex: 1, backgroundColor: Colors.bgCard, padding: 16, borderRadius: 16, marginTop: 12 }}>
                      {infoModal.workflow.stages?.started?.photo?.url && (
                        <View style={{ marginBottom: 20 }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.info, marginBottom: 8 }}>Start Task Verification</Text>
                          <Image source={{ uri: infoModal.workflow.stages.started.photo.url?.startsWith('http') ? infoModal.workflow.stages.started.photo.url : `https://sk-tech-cctv.onrender.com${infoModal.workflow.stages.started.photo.url}` }} style={{ width: '100%', height: 150, borderRadius: 12, backgroundColor: Colors.bgSurface }} />
                          {infoModal.workflow.stages?.started?.photo?.coordinates && (
                            <TouchableOpacity style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.info + '15', padding: 8, borderRadius: 8 }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${infoModal.workflow.stages.started.photo.coordinates.lat},${infoModal.workflow.stages.started.photo.coordinates.lng}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
                              <MapPin color={Colors.info} size={14} />
                              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.info, marginLeft: 8 }}>View Start Location on Map</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.fgPrimary, marginBottom: 8 }}>In-Progress Photos</Text>
                      <FlatList
                        data={infoModal.workflow.stages?.inProgress?.photos || []}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12 }}
                        renderItem={({ item: p }) => (
                           <View>
                             <Image source={{ uri: p.url?.startsWith('http') ? p.url : `https://sk-tech-cctv.onrender.com${p.url}` }} style={{ width: 100, height: 100, borderRadius: 12, backgroundColor: Colors.bgSurface }} />
                             <Text style={{ fontSize: 10, color: Colors.fgMuted, marginTop: 4 }}>{new Date(p.timestamp).toLocaleTimeString()}</Text>
                           </View>
                        )}
                        ListEmptyComponent={<Text style={s.empty}>No progress photos.</Text>}
                      />

                      {infoModal.workflow.stages?.completed?.photo?.url && (
                        <View style={{ marginTop: 20 }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.success, marginBottom: 8 }}>Completion Evidence</Text>
                          <Image source={{ uri: infoModal.workflow.stages.completed.photo.url?.startsWith('http') ? infoModal.workflow.stages.completed.photo.url : `https://sk-tech-cctv.onrender.com${infoModal.workflow.stages.completed.photo.url}` }} style={{ width: '100%', height: 150, borderRadius: 12, backgroundColor: Colors.bgSurface }} />
                        </View>
                      )}

                      {infoModal.workflow.stages?.completed?.photo?.coordinates && (
                        <TouchableOpacity style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryFaint, padding: 12, borderRadius: 8 }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${infoModal.workflow.stages.completed.photo.coordinates.lat},${infoModal.workflow.stages.completed.photo.coordinates.lng}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
                          <MapPin color={Colors.primary} size={16} />
                          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.primary, marginLeft: 8 }}>View Completion Location on Map</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  
                  {(infoModal.order?.status === 'pending_approval' || infoModal.order?.status === 'pending_admin_approval') && (
                    <View style={{ marginTop: 24, gap: 12 }}>
                      <TouchableOpacity style={[s.assignBtn, { backgroundColor: Colors.success, borderColor: Colors.success }]} onPress={() => handleApproval('approve')}>
                        <Text style={[s.assignBtnT, { color: '#fff' }]}>Approve Work (Complete)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.assignBtn, { backgroundColor: Colors.danger, borderColor: Colors.danger }]} onPress={() => {
                        if (Platform.OS === 'web') {
                          const notes = window.prompt('Enter reason for rework:');
                          if (notes) handleApproval('rework', notes);
                        } else {
                          Alert.prompt('Rework Required', 'Enter reason for rework:', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Send for Rework', onPress: (notes: any) => handleApproval('rework', notes) }
                          ]);
                        }
                      }}>
                        <Text style={[s.assignBtnT, { color: '#fff' }]}>Reject & Send for Rework</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={s.empty}>No legacy workflow data available.</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setInfoModal(null)}><Text style={s.cancelT}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Follow-up Modal */}
      <Modal visible={!!followUpModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { height: 350 }]}>
            <Text style={s.modalTitle}>Schedule Follow-up</Text>
            <Text style={s.id}>For Order #{followUpModal?._id?.slice(-6)}</Text>
            <TextInput
              style={[s.searchInput, { marginTop: 20, height: 100, textAlignVertical: 'top' }]}
              placeholder="Follow-up notes or reason..."
              placeholderTextColor={Colors.fgMuted}
              multiline
              onChangeText={(txt) => setFollowUpModal({ ...followUpModal, _note: txt })}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setFollowUpModal(null)}><Text style={s.cancelT}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.assignBtn, { flex: 1, backgroundColor: Colors.warning, borderColor: Colors.warning }]} onPress={() => handleFollowUp(followUpModal?._note || 'Follow-up required')}>
                <Text style={[s.assignBtnT, { color: '#fff' }]}>Save Follow-up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal visible={!!statusModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Update Status</Text>
            {['pending', 'confirmed', 'processing', 'completed', 'cancelled'].map(st => (
              <TouchableOpacity key={st} style={s.techRow} onPress={() => handleStatusUpdate(st)}>
                <Text style={[s.techName, { textTransform: 'capitalize', color: SC[st] || Colors.fgPrimary }]}>{st}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.cancelBtn} onPress={() => setStatusModal(null)}><Text style={s.cancelT}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  count: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700' },
  searchInput: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, color: Colors.fgPrimary, fontSize: 14 },
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardMid: { padding: 16, backgroundColor: Colors.bgSurface, gap: 6 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  infoLabel: { fontSize: 12, color: Colors.fgMuted, flex: 1 },
  infoVal: { fontSize: 13, color: Colors.fgPrimary, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCount: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ic: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  id: { fontSize: 16, fontWeight: '900', color: Colors.fgPrimary },
  cust: { fontSize: 14, color: Colors.fgMuted, marginTop: 4, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeT: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  price: { fontSize: 16, fontWeight: '900', color: Colors.primaryLight },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  assignBtn: { flexBasis: '48%', flexGrow: 1, backgroundColor: Colors.primaryFaint, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary + '40' },
  assignBtnT: { color: Colors.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  aBtn: { flexBasis: '30%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  aBtnT: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 16 },
  techRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  techName: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary },
  techStatus: { fontSize: 12, color: Colors.success, fontWeight: '700', textTransform: 'capitalize' },
  cancelBtn: { marginTop: 24, alignItems: 'center', paddingVertical: 14 },
  cancelT: { color: Colors.danger, fontSize: 14, fontWeight: '800' },
});
