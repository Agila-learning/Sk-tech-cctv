import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Modal, Alert, Image, Linking, Platform, ActivityIndicator } from 'react-native';
import { ArrowLeft, MapPin, Download, Check, X, Camera, ShieldCheck } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { Badge, Button } from '../../components/ui';
import MapComponent from '../../components/MapComponent';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function OrderDetailsScreen({ route, navigation }: any) {
  const { orderId } = route.params || {};
  const [order, setOrder] = useState<any>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const [ord, wf] = await Promise.all([
        fetchWithAuth(`/orders/${orderId}`),
        fetchWithAuth(`/orders/workflow/${orderId}`).catch(() => null)
      ]);
      setOrder(ord);
      setWorkflow(wf);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [orderId]);

  const fmt = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return 'N/A'; } };

  const handleApproval = async (action: 'approve' | 'rework', notes?: string) => {
    try {
      setLoading(true);
      await fetchWithAuth(`/admin/orders/${orderId}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ action, notes })
      });
      Alert.alert('Success', `Order ${action}d successfully`);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); setLoading(false); }
  };

  const handleDailyReportApproval = async (dayNumber: number, action: 'approve' | 'rework', notes?: string) => {
    try {
      setLoading(true);
      await fetchWithAuth(`/admin/orders/${orderId}/daily-report/${dayNumber}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ action, notes })
      });
      Alert.alert('Success', `Day ${dayNumber} Report ${action}d successfully`);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); setLoading(false); }
  };

  const downloadPhoto = async (url: string) => {
    try {
      const fullUrl = url.startsWith('http') ? url : `https://sk-tech-cctv.onrender.com${url}`;
      if (Platform.OS === 'web') {
        window.open(fullUrl, '_blank');
        return;
      }
      setDownloading(true);
      const filename = fullUrl.split('/').pop() || 'photo.jpg';
      const fileUri = `${(FileSystem as any).documentDirectory}${filename}`;
      const { uri } = await (FileSystem as any).downloadAsync(fullUrl, fileUri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', `File downloaded to ${uri}`);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to download photo');
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !order) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, color: Colors.fgMuted, fontWeight: '700' }}>Loading Order Stack Flow...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center', padding: 20 }]}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 12 }}>Order Not Found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  // Get first available GPS location to show on the main map
  const latestReportWithLocation = order.dailyReports?.slice().reverse().find((r: any) => r.location?.lat);
  const mapLat = latestReportWithLocation?.location?.lat || workflow?.stages?.started?.photo?.coordinates?.lat || workflow?.stages?.completed?.photo?.coordinates?.lat;
  const mapLng = latestReportWithLocation?.location?.lng || workflow?.stages?.started?.photo?.coordinates?.lng || workflow?.stages?.completed?.photo?.coordinates?.lng;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={s.hdr}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color={Colors.fgPrimary} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={s.hdrTitle}>Order Stack Flow</Text>
          <Text style={s.hdrSub}>#{order._id?.slice(-6)} • {order.orderType?.toUpperCase() || 'ONLINE'}</Text>
        </View>
        <Badge label={order.status?.toUpperCase()} color={order.status === 'completed' ? 'green' : order.status === 'pending_approval' ? 'amber' : 'blue'} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 20 }}>
        
        {/* Customer & Order Card */}
        <View style={s.card}>
          <Text style={s.sectionLbl}>Customer & Service Details</Text>
          <Text style={s.cName}>{order.customerName || order.customer?.name || 'Customer Official'}</Text>
          <Text style={s.cPhone}>{order.contactNumber || order.customer?.phone || '+91 98765 43210'}</Text>
          <Text style={s.serviceType}>{order.serviceType || 'CCTV Installation / Maintenance'}</Text>
          
          {order.cameraDetails ? (
            <View style={s.metaBox}>
              <Text style={s.metaLbl}>Equipment / Cameras:</Text>
              <Text style={s.metaVal}>{order.cameraDetails}</Text>
            </View>
          ) : null}

          {order.deliveryAddress ? (
            <TouchableOpacity style={s.mapLinkBox} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
              <MapPin color={Colors.primary} size={16} />
              <Text style={s.mapLinkT}>{order.deliveryAddress}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Live Google Map Tracking View */}
        {mapLat && mapLng ? (
          <View style={s.card}>
            <Text style={s.sectionLbl}>Exact Location Tracking (Google Maps)</Text>
            {Platform.OS !== 'web' ? (
              <View style={{ height: 220, borderRadius: 16, overflow: 'hidden', marginVertical: 12 }}>
                <MapComponent 
                  style={{ flex: 1 }} 
                  initialRegion={{
                    latitude: mapLat,
                    longitude: mapLng,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  markers={[
                    { coordinate: { latitude: mapLat, longitude: mapLng }, title: "Technician Live Location", description: latestReportWithLocation?.location?.address || "Recorded GPS Fix", pinColor: "green" }
                  ]}
                />
              </View>
            ) : null}
            <TouchableOpacity style={s.googleMapsBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${mapLat},${mapLng}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
              <MapPin color="#fff" size={18} />
              <Text style={s.googleMapsBtnT}>Open in Google Maps App</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Multi-Day Workflow Timeline */}
        <View style={s.card}>
          <Text style={s.sectionLbl}>Multi-Day Workflow Timeline</Text>
          
          <View style={s.timelineContainer}>
            {/* Order Created */}
            <View style={s.timelineItem}>
              <View style={[s.timelineDot, { backgroundColor: Colors.success }]} />
              <View style={s.timelineContent}>
                <Text style={s.timelineTitle}>Order Created</Text>
                <Text style={s.timelineSub}>{fmt(order.createdAt)}</Text>
              </View>
            </View>

            {/* Technician Assigned */}
            <View style={s.timelineItem}>
              <View style={[s.timelineDot, { backgroundColor: order.technician ? Colors.success : Colors.warning }]} />
              <View style={s.timelineContent}>
                <Text style={s.timelineTitle}>Technician Assigned</Text>
                <Text style={s.timelineSub}>{order.technician?.name || workflow?.technician?.name || 'Pending Assignment'}</Text>
              </View>
            </View>

            {/* Daily Reports Timeline */}
            {order.dailyReports?.map((rep: any, idx: number) => (
              <View key={idx} style={s.timelineItem}>
                <View style={[s.timelineDot, { backgroundColor: rep.status === 'Approved' ? Colors.success : Colors.primary }]} />
                <View style={s.timelineContent}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={s.timelineTitle}>Day {rep.dayNumber} Report: {rep.status}</Text>
                    <Badge label={`${rep.progressPercent || 'N/A'} Progress`} color="purple" />
                  </View>
                  <Text style={s.repWork}>Work: {rep.workDescription}</Text>
                  {rep.issuesRemarks ? <Text style={s.repIssues}>Remarks: {rep.issuesRemarks}</Text> : null}
                  {rep.location?.address ? <Text style={s.repLoc}>Location: {rep.location.address}</Text> : null}

                  {/* Day Wise Photos */}
                  {rep.photos?.length > 0 && (
                    <View style={{ marginVertical: 12 }}>
                      <Text style={{ fontSize: 12, color: Colors.fgMuted, fontWeight: '700', marginBottom: 8 }}>Click photo to view & download:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {rep.photos.map((url: string, pIdx: number) => (
                          <TouchableOpacity key={pIdx} onPress={() => setSelectedImage(url)}>
                            <Image source={{ uri: url.startsWith('http') ? url : `https://sk-tech-cctv.onrender.com${url}` }} style={s.photoThumb} />
                            <View style={s.dlBadge}><Download color="#fff" size={12} /></View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Approval Actions */}
                  {rep.status !== 'Approved' && (
                    <View style={s.actionRow}>
                      <TouchableOpacity style={[s.actionBtn, { backgroundColor: Colors.success + '20', borderColor: Colors.success }]} onPress={() => handleDailyReportApproval(rep.dayNumber, 'approve')}>
                        <Text style={[s.actionBtnT, { color: Colors.success }]}>Approve Day {rep.dayNumber}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.actionBtn, { backgroundColor: Colors.danger + '20', borderColor: Colors.danger }]} onPress={() => {
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
                        <Text style={[s.actionBtnT, { color: Colors.danger }]}>Reject / Rework</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* Legacy Workflow Photos */}
            {workflow?.stages?.started?.photo?.url || workflow?.stages?.completed?.photo?.url ? (
              <View style={s.timelineItem}>
                <View style={[s.timelineDot, { backgroundColor: Colors.info }]} />
                <View style={s.timelineContent}>
                  <Text style={s.timelineTitle}>Legacy Workflow Evidence</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
                    {workflow.stages?.started?.photo?.url && (
                      <TouchableOpacity onPress={() => setSelectedImage(workflow.stages.started.photo.url)}>
                        <Text style={{ fontSize: 11, color: Colors.info, fontWeight: 'bold', marginBottom: 4 }}>Start Photo</Text>
                        <Image source={{ uri: workflow.stages.started.photo.url.startsWith('http') ? workflow.stages.started.photo.url : `https://sk-tech-cctv.onrender.com${workflow.stages.started.photo.url}` }} style={s.photoThumbLarge} />
                        <View style={s.dlBadge}><Download color="#fff" size={12} /></View>
                      </TouchableOpacity>
                    )}
                    {workflow.stages?.completed?.photo?.url && (
                      <TouchableOpacity onPress={() => setSelectedImage(workflow.stages.completed.photo.url)}>
                        <Text style={{ fontSize: 11, color: Colors.success, fontWeight: 'bold', marginBottom: 4 }}>Completion Photo</Text>
                        <Image source={{ uri: workflow.stages.completed.photo.url.startsWith('http') ? workflow.stages.completed.photo.url : `https://sk-tech-cctv.onrender.com${workflow.stages.completed.photo.url}` }} style={s.photoThumbLarge} />
                        <View style={s.dlBadge}><Download color="#fff" size={12} /></View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ) : null}

            {/* Final Order Status */}
            <View style={[s.timelineItem, { borderLeftWidth: 0 }]}>
              <View style={[s.timelineDot, { backgroundColor: order.status === 'completed' ? Colors.success : Colors.fgMuted }]} />
              <View style={s.timelineContent}>
                <Text style={s.timelineTitle}>{order.status === 'completed' ? 'Order Completed ✅' : 'Final Verification Pending'}</Text>
                <Text style={s.timelineSub}>{order.status === 'completed' ? 'Admin successfully verified and closed this order.' : 'Pending final approval from admin dashboard.'}</Text>
              </View>
            </View>
          </View>

          {/* Final Approval Buttons */}
          {order.status === 'pending_approval' && (
            <View style={{ marginTop: 24, gap: 12 }}>
              <Button title="Approve Final Work (Complete)" onPress={() => handleApproval('approve')} variant="success" />
              <Button title="Reject & Send for Rework" onPress={() => {
                if (Platform.OS === 'web') {
                  const notes = window.prompt('Enter reason for rework:');
                  if (notes) handleApproval('rework', notes);
                } else {
                  Alert.prompt('Rework Required', 'Enter reason for rework:', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Send for Rework', onPress: (notes: any) => handleApproval('rework', notes) }
                  ]);
                }
              }} variant="danger" />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Full Screen Photo Viewer & Download Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <View style={s.modalOverlay}>
          <View style={s.viewerHdr}>
            <TouchableOpacity style={s.closeBtn} onPress={() => setSelectedImage(null)}>
              <X color="#fff" size={26} />
            </TouchableOpacity>
            <TouchableOpacity style={s.downloadActionBtn} onPress={() => selectedImage && downloadPhoto(selectedImage)}>
              {downloading ? <ActivityIndicator size="small" color="#fff" /> : <Download color="#fff" size={20} />}
              <Text style={s.downloadActionT}>Download</Text>
            </TouchableOpacity>
          </View>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage.startsWith('http') ? selectedImage : `https://sk-tech-cctv.onrender.com${selectedImage}` }} 
              style={s.fullImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgSurface },
  backBtn: { padding: 8, marginRight: 4, backgroundColor: Colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  hdrTitle: { fontSize: 22, fontWeight: '900', color: Colors.fgPrimary },
  hdrSub: { fontSize: 12, color: Colors.primaryLight, fontWeight: '700', marginTop: 2 },
  card: { backgroundColor: Colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, padding: 24 },
  sectionLbl: { fontSize: 12, fontWeight: '900', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 },
  cName: { fontSize: 24, fontWeight: '900', color: Colors.fgPrimary },
  cPhone: { fontSize: 15, fontWeight: '700', color: Colors.primaryLight, marginTop: 4 },
  serviceType: { fontSize: 16, fontWeight: '800', color: Colors.fgSecondary, marginTop: 8 },
  metaBox: { marginTop: 16, backgroundColor: Colors.bgSurface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  metaLbl: { fontSize: 11, color: Colors.fgMuted, fontWeight: '800', textTransform: 'uppercase' },
  metaVal: { fontSize: 14, color: Colors.fgPrimary, fontWeight: '900', marginTop: 4 },
  mapLinkBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryFaint, padding: 12, borderRadius: 14, marginTop: 16 },
  mapLinkT: { fontSize: 13, color: Colors.primary, fontWeight: '800', marginLeft: 10, flex: 1 },
  googleMapsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 16, marginTop: 8, elevation: 4 },
  googleMapsBtnT: { fontSize: 15, fontWeight: '900', color: '#fff' },
  timelineContainer: { marginTop: 12 },
  timelineItem: { paddingLeft: 24, borderLeftWidth: 2, borderLeftColor: Colors.border, paddingBottom: 24, position: 'relative' },
  timelineDot: { position: 'absolute', left: -7, top: 0, width: 12, height: 12, borderRadius: 6 },
  timelineContent: { marginTop: -4 },
  timelineTitle: { fontSize: 16, fontWeight: '900', color: Colors.fgPrimary },
  timelineSub: { fontSize: 13, color: Colors.fgMuted, fontWeight: '600', marginTop: 2 },
  repWork: { fontSize: 14, color: Colors.fgPrimary, fontWeight: '700', marginTop: 6 },
  repIssues: { fontSize: 13, color: Colors.warning, fontWeight: '700', marginTop: 4 },
  repLoc: { fontSize: 12, color: Colors.fgMuted, marginTop: 4 },
  photoThumb: { width: 100, height: 100, borderRadius: 16, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  photoThumbLarge: { width: 130, height: 130, borderRadius: 16, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  dlBadge: { position: 'absolute', bottom: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionBtnT: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  viewerHdr: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 1000 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  downloadActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20 },
  downloadActionT: { color: '#fff', fontSize: 15, fontWeight: '900' },
  fullImage: { width: '100%', height: '80%' }
});
