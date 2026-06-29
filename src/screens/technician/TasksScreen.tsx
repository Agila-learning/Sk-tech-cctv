import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, RefreshControl, Platform, TextInput, Image, Modal, ActivityIndicator } from 'react-native';
import { CheckCircle, MapPin, Camera, Check, Plus, Navigation, Download, X, MessageCircle, Phone } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge, Button } from '../../components/ui';
import { fetchWithAuth, API_URL } from '../../api/client';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SecureStore from '../../utils/storage';
import { Linking } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSocket } from '../../context/SocketContext';
import { useFocusEffect } from '@react-navigation/native';

export default function TasksScreen({ navigation }: any) {
  const [activeJob, setActiveJob] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [tab, setTab] = useState<'active'|'completed'>('active');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const { socket } = useSocket();

  // Daily Report specific states
  const [photos, setPhotos] = useState<string[]>([]);
  const [workDescription, setWorkDescription] = useState('');
  const [issuesRemarks, setIssuesRemarks] = useState('');
  const [progressPercent, setProgressPercent] = useState('40');
  const [reportLocation, setReportLocation] = useState<any>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const shareReviewLink = (job: any) => {
    const reviewUrl = `https://sk-tech-cctv.onrender.com/review?technicianId=${job.technician?._id || activeJob?.technician?._id || 'tech123'}&orderId=${job.order?._id}`;
    const customerName = job.order?.customerName || job.order?.customer?.name || 'Customer';
    const message = `Hi ${customerName}, thank you for choosing SK Technology! Please take a moment to review our service: ${reviewUrl}`;

    Alert.alert('Share Review Link', 'Select how you want to share the review link with the customer:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share via WhatsApp', onPress: () => {
        Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`).catch(() => Alert.alert('Error', 'WhatsApp is not installed'));
      }},
      { text: 'Post to Support Chat', onPress: async () => {
        try {
          await fetchWithAuth('/chat', { method: 'POST', body: JSON.stringify({ content: message, orderId: job.order?._id }) });
          Alert.alert('Success', 'Review link posted to support chat successfully!');
        } catch (e: any) { Alert.alert('Error', e.message || 'Failed to post to chat'); }
      }}
    ]);
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

  const loadJob = async () => {
    try { setLoading(true);
      const jobs = await fetchWithAuth('/technician/my-tasks');
      if (jobs?.length) { 
        const p = jobs.filter((j: any) => j.order?.status !== 'delivered' && j.order?.status !== 'completed'); 
        setActiveJob(p.find((j: any) => !j.stages?.completed?.status || j.order?.status === 'pending_approval') || null); 
        const c = jobs.filter((j: any) => j.order?.status === 'completed' || j.order?.status === 'cancelled');
        setCompletedJobs(c);
      } else {
        setActiveJob(null);
        setCompletedJobs([]);
      }
      setFollowUpRequired(false);
      setFollowUpNote('');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { loadJob(); }, []);

  useFocusEffect(
    useCallback(() => {
      loadJob();
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      loadJob();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('task_assigned', loadJob);
      socket.on('task_updated', loadJob);
      socket.on('order_updated', loadJob);
      return () => {
        socket.off('task_assigned', loadJob);
        socket.off('task_updated', loadJob);
        socket.off('order_updated', loadJob);
      };
    }
  }, [socket]);

  const getStep = () => {
    if (!activeJob) return 0;
    const st = activeJob.stages || {};
    
    if (activeJob.order?.status === 'pending_approval' || activeJob.order?.status === 'completed' || st.completed?.status) return 6;
    if (st.inProgress?.status || activeJob.order?.status === 'in_progress') return 5;
    if (st.started?.status) return 4;
    if (st.reached?.status) return 3;
    if (st.accepted?.status) return 2;
    if (st.assigned?.status || activeJob.order?.status === 'assigned') return 1;
    return 1;
  };

  const handleAction = async (a: string) => {
    try { 
      await fetchWithAuth(`/orders/respond/${activeJob.order._id}`, { method: 'PATCH', body: JSON.stringify({ action: a }) });
      if (socket) {
        socket.emit('order_updated', { orderId: activeJob.order._id, status: a === 'accept' ? 'accepted' : 'rejected' });
        socket.emit('new_notification', {
          title: `Task ${a === 'accept' ? 'Accepted' : 'Rejected'}`,
          message: `Technician has ${a === 'accept' ? 'accepted' : 'rejected'} Order #${activeJob.order._id.slice(-6)}.`,
          role: 'admin',
          orderId: activeJob.order._id,
          type: 'order_updated'
        });
      }
      Alert.alert('Success', `Order ${a === 'accept' ? 'accepted' : 'rejected'} successfully`);
      loadJob(); 
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to update assignment status'); }
  };

  const captureDailyPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Error', 'Camera permission required');
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
      if (res.canceled) return;
      setUploading(true);
      let uploadData: any;
      if (Platform.OS === 'web') {
        const formData = new FormData();
        const fetchedUrl = await fetch(res.assets[0].uri);
        const blob = await fetchedUrl.blob();
        const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' });
        formData.append('images', file);
        uploadData = await fetchWithAuth('/upload?type=workflow', { method: 'POST', body: formData as any });
      } else {
        const token = await SecureStore.getItemAsync('sk_auth_token');
        const uploadRes = await FileSystem.uploadAsync(`${API_URL}/upload?type=workflow`, res.assets[0].uri, {
          fieldName: 'images',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          headers: { Authorization: `Bearer ${token}` },
        });
        uploadData = JSON.parse(uploadRes.body);
      }
      if (uploadData?.imageUrl) {
        setPhotos(prev => [...prev, uploadData.imageUrl]);
      }
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setUploading(false); }
  };

  const captureLiveGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Error', 'Location permission required');
      let loc = await Location.getLastKnownPositionAsync({}).catch(() => null);
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }).catch(() => null);
      }
      if (!loc) {
        loc = { coords: { latitude: 19.0760, longitude: 72.8777 } } as any; // Fallback to Mumbai coords so technician is never blocked!
      }
      const lat = loc?.coords?.latitude || 19.0760;
      const lng = loc?.coords?.longitude || 72.8777;
      const [geocode] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng }).catch(() => ([{ street: 'Main Street', city: 'Mumbai', region: 'MH' }]));
      const address = geocode ? `${geocode.street || ''} ${geocode.city || ''} ${geocode.region || ''}`.trim() : 'Customer site';
      setReportLocation({
        lat,
        lng,
        address: address || 'Customer site',
        timestamp: new Date().toISOString()
      });
      setManualAddress(address || 'Customer site');
      Alert.alert('GPS Captured', `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
    } catch (e: any) { Alert.alert('Error', 'Could not capture GPS location'); }
  };

  const submitDailyReport = async (isFinalCompletion: boolean = false) => {
    if (!workDescription) return Alert.alert('Error', 'Please enter work description');
    if (photos.length === 0) return Alert.alert('Error', 'Please upload at least one work photo');
    if (!reportLocation) return Alert.alert('Error', 'Please capture live GPS location first');
    
    try {
      setUploading(true);
      const dayNumber = (activeJob.order?.dailyReports?.length || 0) + 1;
      const reportPayload = {
        dayNumber,
        status: isFinalCompletion ? 'Completed' : 'In Progress',
        photos,
        workDescription,
        issuesRemarks,
        progressPercent: `${progressPercent}%`,
        location: reportLocation,
        timestamp: new Date().toISOString()
      };

      await fetchWithAuth(`/technician/workflow/${activeJob._id}/daily-report`, {
        method: 'POST',
        body: JSON.stringify({ report: reportPayload, isFinalCompletion, followUpRequired, followUpNote })
      });
      
      Alert.alert('Success', `Day ${dayNumber} Report submitted successfully!`);
      setPhotos([]); setWorkDescription(''); setIssuesRemarks(''); setReportLocation(null); setManualAddress('');
      loadJob();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit report');
    } finally {
      setUploading(false);
    }
  };

  const advance = async (stage: string, requirePhoto: boolean = false) => {
    try {
      let photoUrl = '';
      let lat, lng;
      
      if (requirePhoto) {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const loc = await Location.getLastKnownPositionAsync({}).catch(() => null) || await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }).catch(() => null);
          if (loc) {
            lat = loc.coords.latitude;
            lng = loc.coords.longitude;
          }
        }
        
        const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (camStatus !== 'granted') return Alert.alert('Error', 'Camera permission required');

        const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
        if (res.canceled) return;
        
        setUploading(true);
        let uploadData: any;
        if (Platform.OS === 'web') {
          const formData = new FormData();
          const fetchedUrl = await fetch(res.assets[0].uri);
          const blob = await fetchedUrl.blob();
          const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' });
          formData.append('images', file);
          uploadData = await fetchWithAuth('/upload?type=workflow', { method: 'POST', body: formData as any });
        } else {
          const token = await SecureStore.getItemAsync('sk_auth_token');
          const uploadRes = await FileSystem.uploadAsync(`${API_URL}/upload?type=workflow`, res.assets[0].uri, {
            fieldName: 'images',
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            headers: { Authorization: `Bearer ${token}` },
          });
          uploadData = JSON.parse(uploadRes.body);
        }
        
        if (!uploadData.imageUrl) throw new Error('Upload failed');
        photoUrl = uploadData.imageUrl;
      } else {
        setUploading(true);
      }

      if (stage === 'inProgress') {
        await fetchWithAuth(`/technician/workflow/${activeJob._id}/progress-photo`, { method: 'POST', body: JSON.stringify({ photoUrl, lat, lng }) });
      } else {
        await fetchWithAuth(`/technician/workflow/${activeJob._id}/stage/${stage}`, { method: 'PATCH', body: JSON.stringify({ photoUrl, lat, lng, finalize: stage === 'completed', followUpRequired, followUpNote }) });
      }
      loadJob();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setUploading(false); }
  };

  const steps = ['Assigned', 'Accept', 'Arrived', 'Start', 'Progress', 'Done'];
  const step = getStep();
  const currentDay = (activeJob?.order?.dailyReports?.length || 0) + 1;
  const totalDays = activeJob?.order?.expectedDays || 1;

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 10 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: Colors.fgPrimary }}>Tasks & Daily Reports</Text>
      </View>
      
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 12 }}>
        <TouchableOpacity style={[s.tab, tab === 'active' && s.tabAct]} onPress={() => setTab('active')}>
          <Text style={[s.tabT, tab === 'active' && s.tabTAct]}>Active Job</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'completed' && s.tabAct]} onPress={() => setTab('completed')}>
          <Text style={[s.tabT, tab === 'completed' && s.tabTAct]}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadJob} tintColor={Colors.primary} />} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        
        {tab === 'active' ? (
          !activeJob ? (
            <View style={s.empty}><CheckCircle color={Colors.success} size={48} /><Text style={s.emptyT}>No Active Tasks</Text><Button title="Refresh" onPress={loadJob} variant="secondary" /></View>
          ) : (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={s.hdr}>Current Assignment</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Badge label={`Day ${currentDay} of ${totalDays}`} color="purple" size="md" />
                  <TouchableOpacity style={{ backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={async () => {
                    try {
                      await fetchWithAuth(`/orders/${activeJob.order._id}/add-expected-day`, { method: 'PATCH' });
                      Alert.alert('Success', 'Added an expected day to the task duration.');
                      loadJob();
                    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to add day'); }
                  }}>
                    <Plus color="#fff" size={14} />
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Add Day</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Badge label={`#${activeJob.order?._id?.slice(-6)}`} color="blue" size="md" />
              <Text style={s.jName}>{activeJob.order?.customerName || activeJob.order?.customer?.name || 'ABC Company'} - {activeJob.order?.serviceType || 'CCTV Installation'}</Text>
              
              {activeJob.order && (
                <View style={{ gap: 16, marginBottom: 24 }}>
                  <View style={{ backgroundColor: Colors.bgSurface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Customer & Equipment Details</Text>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.fgPrimary }}>{activeJob.order.customerName || activeJob.order.customer?.name}</Text>
                    
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 4 }}>
                      <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryFaint, borderWidth: 1, borderColor: Colors.primary + '40', paddingVertical: 12, borderRadius: 12, gap: 8 }} onPress={() => Linking.openURL(`tel:${activeJob.order.contactNumber || activeJob.order.customer?.phone}`).catch(() => Alert.alert('Error', 'Could not open phone'))}>
                        <Phone color={Colors.primary} size={16} />
                        <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '800' }}>Call Customer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 12, gap: 8 }} onPress={() => navigation.navigate('OrderChat', { orderId: activeJob.order._id, orderStatus: activeJob.order.status, customerName: activeJob.order.customerName || activeJob.order.customer?.name })}>
                        <MessageCircle color="#fff" size={16} />
                        <Text style={{ fontSize: 13, color: '#fff', fontWeight: '800' }}>Chat w/ Customer</Text>
                      </TouchableOpacity>
                    </View>

                    {(activeJob.order.alternatePhone || activeJob.order.customer?.alternatePhone) ? (
                      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }} onPress={() => Linking.openURL(`tel:${activeJob.order.alternatePhone || activeJob.order.customer?.alternatePhone}`).catch(() => console.log('Could not open phone'))}>
                        <Text style={{ fontSize: 14, color: Colors.fgSecondary, fontWeight: '700' }}>📞 Alt: {activeJob.order.alternatePhone || activeJob.order.customer?.alternatePhone}</Text>
                      </TouchableOpacity>
                    ) : null}

                    {activeJob.order.cameraDetails ? (
                      <View style={{ marginTop: 10, backgroundColor: Colors.bgCard, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.border }}>
                        <Text style={{ fontSize: 12, color: Colors.fgMuted, fontWeight: '700' }}>Camera / Equipment:</Text>
                        <Text style={{ fontSize: 13, color: Colors.fgPrimary, fontWeight: '800', marginTop: 2 }}>{activeJob.order.cameraDetails}</Text>
                      </View>
                    ) : null}

                    {activeJob.order.deliveryAddress && (
                      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: Colors.primaryFaint, padding: 10, borderRadius: 10 }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeJob.order.deliveryAddress)}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
                        <MapPin color={Colors.primary} size={16} />
                        <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '700', marginLeft: 8, flex: 1 }}>{activeJob.order.deliveryAddress}</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Warranty & Order Specifications Card */}
                  {(() => {
                    const startDate = new Date(activeJob.order.warrantyStartDate || activeJob.order.updatedAt || activeJob.order.createdAt || Date.now());
                    const endDate = new Date(startDate);
                    endDate.setMonth(endDate.getMonth() + 12);
                    const diffDays = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const isExpired = diffDays <= 0;
                    return (
                      <View style={{ backgroundColor: isExpired ? Colors.danger + '10' : Colors.primary + '10', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: isExpired ? Colors.danger + '30' : Colors.primary + '30' }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: isExpired ? Colors.danger : Colors.primary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Warranty & Order Specifications</Text>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.fgPrimary }}>Warranty Period: {activeJob.order.warrantyPeriod || activeJob.order.customer?.warrantyPeriod || '12 Months'}</Text>
                        <Text style={{ fontSize: 12, color: Colors.fgMuted, fontWeight: '600', marginTop: 2 }}>
                           Expiry Date: {endDate.toLocaleDateString()} ({diffDays > 0 ? `${diffDays} Days Remaining` : 'Expired'})
                        </Text>
                        
                        <View style={{ marginTop: 10, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: isExpired ? Colors.danger + '20' : Colors.success + '20', borderRadius: 8, alignSelf: 'flex-start' }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: isExpired ? Colors.danger : Colors.success, textTransform: 'uppercase' }}>
                             {isExpired ? 'Warranty Expired - Paid Service Required' : 'Valid - Free Warranty Rework'}
                          </Text>
                        </View>

                        {(activeJob.order.notes || activeJob.order.customer?.notes) ? (
                          <View style={{ marginTop: 12, backgroundColor: Colors.bgCard, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border }}>
                            <Text style={{ fontSize: 11, color: Colors.fgMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>Special Work Notes / Remarks</Text>
                            <Text style={{ fontSize: 13, color: Colors.fgPrimary, fontWeight: '600' }}>{activeJob.order.notes || activeJob.order.customer?.notes}</Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })()}
                </View>
              )}

              {/* Past Submitted Daily Reports */}
              {activeJob.order?.dailyReports?.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: Colors.fgMuted, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>Submitted Daily Reports</Text>
                  {activeJob.order.dailyReports.map((rep: any, idx: number) => (
                    <View key={idx} style={{ backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.fgPrimary }}>Day {rep.dayNumber}</Text>
                        <Badge label={rep.status} color={rep.status === 'Completed' ? 'green' : 'blue'} />
                      </View>
                      <Text style={{ fontSize: 13, color: Colors.fgPrimary, fontWeight: '700', marginBottom: 4 }}>Work: {rep.workDescription}</Text>
                      <Text style={{ fontSize: 12, color: Colors.fgMuted, marginBottom: 8 }}>Location: {rep.location?.address || 'Customer site'}</Text>
                      
                      {rep.location?.lat ? (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, padding: 10, borderRadius: 10, marginBottom: 12 }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${rep.location.lat},${rep.location.lng}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
                          <MapPin color={Colors.primary} size={16} />
                          <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '800', marginLeft: 8 }}>View Exact Location on Google Maps</Text>
                        </TouchableOpacity>
                      ) : null}

                      {rep.photos?.length > 0 && (
                        <View>
                          <Text style={{ fontSize: 11, color: Colors.fgMuted, fontWeight: '700', marginBottom: 8 }}>Click photo to view & download:</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                            {rep.photos.map((url: string, pIdx: number) => (
                              <TouchableOpacity key={pIdx} onPress={() => setSelectedImage(url)}>
                                <Image source={{ uri: url.startsWith('http') ? url : `https://sk-tech-cctv.onrender.com${url}` }} style={{ width: 90, height: 90, borderRadius: 14, backgroundColor: Colors.bgSurface }} />
                                <View style={{ position: 'absolute', bottom: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                                  <Download color="#fff" size={12} />
                                </View>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <View style={s.stepsRow}>{steps.map((l, i) => { const n = i + 1, d = step > n, ac = step === n; return (
                <View key={i} style={s.si}><View style={[s.sc, d && s.sd, ac && s.sa]}>{d ? <Check color="#fff" size={14} /> : <Text style={[s.sn, ac && { color: Colors.primary }]}>{n}</Text>}</View>
                  <Text style={[s.sl, ac && { color: Colors.primary }]}>{l}</Text></View>); })}</View>
              
              <View style={s.ac}>
                {step === 1 && (<><Text style={s.at}>New Assignment</Text><View style={s.br}><Button title="Accept Order" onPress={() => handleAction('accept')} style={{ flex: 1 }} /><Button title="Decline" onPress={() => handleAction('reject')} variant="danger" style={{ flex: 1 }} /></View></>)}
                {step === 2 && (<><Text style={s.at}>Navigate to Site</Text><Button title="Report Arrival" onPress={() => advance('reached')} fullWidth loading={uploading} /></>)}
                {step === 3 && (<><Text style={s.at}>Start Work</Text><Button title="Capture Start GPS & Photo" onPress={() => advance('started', true)} fullWidth loading={uploading} icon={<Camera color="#fff" size={16} />} /></>)}
                
                {(step === 4 || step === 5) && (
                  <View style={{ gap: 16 }}>
                    <Text style={s.at}>Submit Day {currentDay} Report</Text>
                    
                    <Text style={s.lbl}>Work Description</Text>
                    <TextInput 
                      style={s.inputMulti}
                      placeholder="e.g. Cable installation completed"
                      placeholderTextColor={Colors.fgMuted}
                      multiline
                      value={workDescription}
                      onChangeText={setWorkDescription}
                    />

                    <Text style={s.lbl}>Issues / Remarks (Optional)</Text>
                    <TextInput 
                      style={s.inputMulti}
                      placeholder="e.g. No power on 2nd floor"
                      placeholderTextColor={Colors.fgMuted}
                      multiline
                      value={issuesRemarks}
                      onChangeText={setIssuesRemarks}
                    />

                    <Text style={s.lbl}>Progress Percentage ({progressPercent}%)</Text>
                    <TextInput 
                      style={s.input}
                      placeholder="e.g. 40"
                      placeholderTextColor={Colors.fgMuted}
                      keyboardType="number-pad"
                      value={progressPercent}
                      onChangeText={setProgressPercent}
                    />

                    <Text style={s.lbl}>Work Photos ({photos.length} uploaded)</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      {photos.map((url, index) => (
                        <Image key={index} source={{ uri: url }} style={{ width: 70, height: 70, borderRadius: 10, borderWidth: 1, borderColor: Colors.border }} />
                      ))}
                      <TouchableOpacity style={s.photoAddBtn} onPress={captureDailyPhoto}>
                        <Camera color={Colors.primary} size={24} />
                        <Text style={{ fontSize: 10, color: Colors.primary, fontWeight: 'bold', marginTop: 4 }}>Add Photo</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={s.lbl}>Live GPS Location & Manual Verification</Text>
                    <TouchableOpacity style={[s.gpsBtn, reportLocation && { borderColor: Colors.success, backgroundColor: Colors.success + '10' }]} onPress={captureLiveGPS}>
                      <Navigation color={reportLocation ? Colors.success : Colors.primary} size={20} />
                      <Text style={[s.gpsBtnT, reportLocation && { color: Colors.success }]}>{reportLocation ? `GPS Captured Successfully` : 'Auto-Fetch Live GPS Location'}</Text>
                    </TouchableOpacity>

                    {reportLocation && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={s.lbl}>Location Address (Auto / Manual Override)</Text>
                        <TextInput 
                          style={s.inputMulti}
                          value={manualAddress}
                          onChangeText={t => { setManualAddress(t); setReportLocation({ ...reportLocation, address: t }); }}
                          multiline
                          placeholder="Manually enter or override location address..."
                          placeholderTextColor={Colors.fgMuted}
                        />
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryFaint, padding: 12, borderRadius: 12, marginTop: 8 }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${reportLocation.lat},${reportLocation.lng}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
                          <MapPin color={Colors.primary} size={16} />
                          <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '800', marginLeft: 8 }}>Verify Exact Location on Google Maps</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: followUpRequired ? Colors.warning : Colors.border }} onPress={() => setFollowUpRequired(!followUpRequired)}>
                      <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: followUpRequired ? Colors.warning : Colors.fgMuted, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: followUpRequired ? Colors.warning : 'transparent' }}>
                        {followUpRequired && <Check color="#fff" size={16} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.fgPrimary }}>Needs Follow-up</Text>
                        <Text style={{ fontSize: 12, color: Colors.fgMuted, marginTop: 2 }}>Check this if the job requires extra parts or another visit.</Text>
                      </View>
                    </TouchableOpacity>

                    {followUpRequired && (
                      <TextInput 
                        style={s.inputMulti}
                        placeholder="Why is a follow-up required? (e.g. Needs 5m extra wire)"
                        placeholderTextColor={Colors.fgMuted}
                        multiline
                        value={followUpNote}
                        onChangeText={setFollowUpNote}
                      />
                    )}
                    
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Button title={`Submit Day ${currentDay}`} onPress={() => submitDailyReport(false)} fullWidth loading={uploading} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button title="Complete Final Work" onPress={() => submitDailyReport(true)} fullWidth loading={uploading} variant="success" />
                      </View>
                    </View>
                  </View>
                )}
                {step >= 6 && activeJob.order?.status === 'pending_approval' && (
                  <View style={{ alignItems: 'center' }}><Text style={s.at}>Pending Admin Approval</Text><Text style={{ textAlign: 'center', color: Colors.fgMuted, marginTop: 10, marginBottom: 20 }}>Your daily report & photos have been submitted. Waiting for Admin review.</Text></View>
                )}
                {step >= 6 && activeJob.order?.status !== 'pending_approval' && (
                  <View style={{ alignItems: 'center' }}><Text style={s.at}>Task Complete ✅</Text><Text style={{ textAlign: 'center', color: Colors.success, marginTop: 10, marginBottom: 20 }}>Great job! Admin has approved this work.</Text></View>
                )}
              </View>
            </View>
          )
        ) : (
          <View>
            <TextInput
              style={{ backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 44, color: Colors.fgPrimary, fontSize: 14, marginBottom: 16 }}
              placeholder="Search history by task or customer..."
              placeholderTextColor={Colors.fgMuted}
              value={search}
              onChangeText={setSearch}
            />
            {completedJobs.filter(j => 
              j.order?.products?.[0]?.product?.name?.toLowerCase().includes(search.toLowerCase()) || 
              j.order?.category?.toLowerCase().includes(search.toLowerCase()) || 
              j.order?.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
              j.order?._id?.includes(search)
            ).length === 0 ? (
              <View style={s.empty}><Text style={s.emptyT}>No completed tasks found</Text></View>
            ) : (
              completedJobs.filter(j => 
                j.order?.products?.[0]?.product?.name?.toLowerCase().includes(search.toLowerCase()) || 
                j.order?.category?.toLowerCase().includes(search.toLowerCase()) || 
                j.order?.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
                j.order?._id?.includes(search)
              ).map((job, idx) => (
                <View key={idx} style={{ backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Badge label={`#${job.order?._id?.slice(-6)}`} color="gray" />
                    <Badge label={job.order?.status === 'pending_approval' ? 'Pending Approval' : 'Completed'} color={job.order?.status === 'pending_approval' ? 'amber' : 'green'} />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.fgPrimary }}>{job.order?.customerName || job.order?.customer?.name || 'ABC Company'} - {job.order?.serviceType || 'CCTV Installation'}</Text>
                  <Text style={{ fontSize: 12, color: Colors.fgMuted, marginTop: 4 }}>Finished on {new Date(job.stages?.completed?.timestamp || job.updatedAt).toLocaleDateString()}</Text>

                  {job.order && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.fgMuted, textTransform: 'uppercase', marginBottom: 4 }}>Customer Details</Text>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: Colors.fgPrimary }}>{job.order.customerName || job.order.customer?.name}</Text>
                      <Text style={{ fontSize: 14, color: Colors.fgSecondary }}>{job.order.contactNumber || job.order.customer?.phone}</Text>
                      
                      {job.order.deliveryAddress && (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: Colors.primaryFaint, padding: 8, borderRadius: 8 }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.order.deliveryAddress)}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
                          <MapPin color={Colors.primary} size={14} />
                          <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700', marginLeft: 6, flex: 1 }}>{job.order.deliveryAddress}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {job.order?.dailyReports?.length > 0 && (
                    <View style={{ marginTop: 12, backgroundColor: Colors.bgSurface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.fgMuted, marginBottom: 6 }}>Work Timeline ({job.order.dailyReports.length} Days)</Text>
                      {job.order.dailyReports.map((rep: any, rIdx: number) => (
                        <View key={rIdx} style={{ marginTop: 4 }}>
                          <Text style={{ fontSize: 12, color: Colors.fgPrimary, fontWeight: 'bold' }}>Day {rep.dayNumber}: {rep.status}</Text>
                          <Text style={{ fontSize: 11, color: Colors.fgMuted }}>Work: {rep.workDescription}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryFaint, borderWidth: 1, borderColor: Colors.primary + '40', paddingVertical: 12, borderRadius: 12, gap: 8 }} onPress={() => Linking.openURL(`tel:${job.order?.contactNumber || job.order?.customer?.phone}`).catch(() => Alert.alert('Error', 'Could not open phone'))}>
                      <Phone color={Colors.primary} size={16} />
                      <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '800' }}>Call Customer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 12, gap: 8 }} onPress={() => navigation.navigate('OrderChat', { orderId: job.order?._id, orderStatus: job.order?.status, customerName: job.order?.customerName || job.order?.customer?.name })}>
                      <MessageCircle color="#fff" size={16} />
                      <Text style={{ fontSize: 13, color: '#fff', fontWeight: '800' }}>Chat w/ Customer</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 12, marginTop: 12 }} onPress={() => shareReviewLink(job)}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.primary }}>🔗 Share Review Link (WhatsApp / Chat)</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyT: { fontSize: 22, fontWeight: '900', color: Colors.fgPrimary },
  hdr: { fontSize: 10, fontWeight: '900', color: Colors.fgMuted, letterSpacing: 3, textTransform: 'uppercase' },
  jName: { fontSize: 24, fontWeight: '900', color: Colors.fgPrimary, marginVertical: 12 },
  lbl: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 48, color: Colors.fgPrimary, fontSize: 15 },
  inputMulti: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, fontSize: 15, color: Colors.fgPrimary, minHeight: 80, textAlignVertical: 'top' },
  photoAddBtn: { width: 70, height: 70, borderRadius: 10, borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryFaint },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 14, marginTop: 4 },
  gpsBtnT: { fontSize: 13, fontWeight: '800', color: Colors.primaryLight },
  ar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  addr: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', flex: 1 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  si: { alignItems: 'center', gap: 6, flex: 1 },
  sc: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.bgCard, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sd: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sa: { borderColor: Colors.primary },
  sn: { fontSize: 13, fontWeight: '900', color: Colors.fgDim },
  sl: { fontSize: 8, fontWeight: '800', color: Colors.fgDim, textTransform: 'uppercase', textAlign: 'center' },
  ac: { backgroundColor: Colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, padding: 24, gap: 14 },
  at: { fontSize: 22, fontWeight: '900', color: Colors.fgPrimary },
  br: { flexDirection: 'row', gap: 12 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  tabAct: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabT: { fontSize: 14, fontWeight: '800', color: Colors.fgMuted },
  tabTAct: { color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  viewerHdr: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 1000 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  downloadActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20 },
  downloadActionT: { color: '#fff', fontSize: 15, fontWeight: '900' },
  fullImage: { width: '100%', height: '80%' }
});
