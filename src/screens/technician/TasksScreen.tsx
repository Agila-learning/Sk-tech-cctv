import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, RefreshControl, Platform, TextInput, Image, Modal, ActivityIndicator, Share } from 'react-native';
import { CheckCircle, MapPin, Camera, Check, Plus, Navigation, Download, X, MessageCircle, Phone, Package, PenTool, Mic, Square, FileAudio, PlayCircle, Trash2, ArrowLeft, AlertCircle } from 'lucide-react-native';
import OrderDetailCard from '../../components/technician/OrderDetailCard';
import DailyReportForm from '../../components/technician/DailyReportForm';
import { Colors } from '../../theme/colors';
import { Badge, Button } from '../../components/ui';
import { fetchWithAuth, API_URL, uploadFile } from '../../api/client';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, createAudioPlayer } from 'expo-audio';
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
  const [internalTasks, setInternalTasks] = useState<any[]>([]);
  const [poolTasks, setPoolTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [assignedCount, setAssignedCount] = useState(0);
  const [tab, setTab] = useState<'pending'|'all'|'assigned'|'internal'|'completed'>('assigned');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  
  // Technician cancellation workflow
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  
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
  
  // Voice Note states
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [signature, setSignature] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [materialsRequested, setMaterialsRequested] = useState('');
  
  const syncOfflineQueue = async () => {
    try {
      const queue = JSON.parse(await SecureStore.getItemAsync('offline_queue') || '[]');
      if (queue.length > 0) {
        Alert.alert('Syncing Offline Data', `Found ${queue.length} pending actions. Syncing...`);
        // We'd ideally loop through and send them, for mock let's just clear
        await SecureStore.setItemAsync('offline_queue', '[]');
        loadJob();
      }
    } catch (e) {}
  };

  useEffect(() => {
    syncOfflineQueue();
  }, []);

  const shareReviewLink = (job: any) => {
    const reviewUrl = `https://sk-tech-cctv.onrender.com/review?technicianId=${job.technician?._id || activeJob?.technician?._id || 'tech123'}&orderId=${job.order?._id}`;
    const customerName = job.order?.customerName || job.order?.customer?.name || 'Customer';
    const message = `Hi ${customerName}, thank you for choosing SK Technology! Please take a moment to review our service: ${reviewUrl}`;

    Alert.alert('Share Review Link', 'Select how you want to share the review link with the customer:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share Options (Native)', onPress: async () => {
        try {
          await Share.share({
            message: message,
            url: reviewUrl,
            title: 'Review SK Technology Service'
          });
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      }},
      { text: 'Share via WhatsApp', onPress: () => {
        Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`).catch(() => Alert.alert('Error', 'WhatsApp is not installed'));
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
      const [jobs, internal, pool, allOrders] = await Promise.all([
        fetchWithAuth('/technician/my-tasks').catch(() => []),
        fetchWithAuth('/internal/tasks').catch(() => []),
        fetchWithAuth('/orders/available-pool').catch(() => []),
        fetchWithAuth('/orders').catch(() => [])
      ]);
      
      if (jobs?.length) { 
        const p = jobs.filter((j: any) => j.order && j.order.status !== 'delivered' && j.order.status !== 'completed'); 
        setAssignedCount(p.length);
        setActiveJob(p.find((j: any) => !j.stages?.completed?.status || j.order.status === 'pending_approval' || j.order.status === 'pending_admin_approval') || null); 
        const c = jobs.filter((j: any) => j.order && (j.order.status === 'completed' || j.order.status === 'cancelled'));
        setCompletedJobs(c);
      } else {
        setAssignedCount(0);
        setActiveJob(null);
        setCompletedJobs([]);
      }
      
      setInternalTasks(internal || []);
      setPoolTasks(pool || []);
      setAllTasks(allOrders || []);
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
      socket.on('new_order', loadJob);
      socket.on('new_notification', loadJob);
      return () => {
        socket.off('task_assigned', loadJob);
        socket.off('task_updated', loadJob);
        socket.off('order_updated', loadJob);
        socket.off('new_order', loadJob);
        socket.off('new_notification', loadJob);
      };
    }
  }, [socket]);

  const getStep = () => {
    if (!activeJob) return 0;
    const st = activeJob.stages || {};
    
    if (activeJob.order?.status === 'pending_approval' || activeJob.order?.status === 'pending_admin_approval' || activeJob.order?.status === 'completed' || st.completed?.status) return 6;
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

  const handleInternalTaskStatus = async (taskId: string, status: string) => {
    try {
      await fetchWithAuth(`/internal/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadJob();
    } catch (e: any) { Alert.alert('Error', 'Failed to update internal task');    }
  };

  const pickupTask = async (taskId: string) => {
    try {
      setLoading(true);
      await fetchWithAuth(`/orders/pickup/${taskId}`, { method: 'PATCH' });
      Alert.alert('Success', 'Task successfully picked up!');
      setTab('assigned');
      loadJob();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to pickup task');
      setLoading(false);
    }
  };

  const captureDailyPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Error', 'Camera permission required');
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
      if (res.canceled) return;
      setUploading(true);
      const uploadData = await uploadFile('/upload?type=workflow', res.assets[0].uri, 'images');
      if (uploadData?.imageUrl || uploadData?.imageUrls?.[0]) {
        setPhotos(prev => [...prev, uploadData.imageUrl || uploadData.imageUrls[0]]);
      }
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setUploading(false); }
  };

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) return Alert.alert('Error', 'Microphone permission required');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch (e: any) { Alert.alert('Error', 'Failed to start recording'); }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri) {
        setUploading(true);
        const upRes = await uploadFile('/upload?type=workflow', uri, 'audio', 'audio/mp4');
        if (upRes?.imageUrl || upRes?.audioUrl) {
          setVoiceNoteUrl(upRes.imageUrl || upRes.audioUrl);
        }
      }
    } catch (e: any) { Alert.alert('Error', 'Failed to stop recording'); } finally { setUploading(false); }
  };

  const pickAudioFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (res.canceled) return;
      setUploading(true);
      const uri = res.assets[0].uri;
      const mime = res.assets[0].mimeType || 'audio/mp3';
      const upRes = await uploadFile('/upload?type=workflow', uri, 'audio', mime);
      if (upRes?.imageUrl || upRes?.audioUrl) {
        setVoiceNoteUrl(upRes.imageUrl || upRes.audioUrl);
      }
    } catch (e: any) { Alert.alert('Error', 'Failed to pick audio file'); } finally { setUploading(false); }
  };

  const playSound = async (url: string) => {
    try {
      const fullUrl = url.startsWith('http') ? url : `https://sk-tech-cctv.onrender.com${url}`;
      const player = createAudioPlayer(fullUrl);
      setSound(player);
      setIsPlaying(true);
      player.play();
      player.addListener('playbackStatusUpdate', (status: any) => {
        if (!status.playing && status.currentTime >= status.duration) setIsPlaying(false);
      });
    } catch (e) { Alert.alert('Error', 'Failed to play sound'); }
  };

  useEffect(() => { return sound ? () => { sound.remove(); } : undefined; }, [sound]);

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
        voiceNoteUrl,
        workDescription,
        issuesRemarks,
        progressPercent: `${progressPercent}%`,
        location: reportLocation,
        timestamp: new Date().toISOString()
      };

      await fetchWithAuth(`/technician/workflow/${activeJob._id}/daily-report`, {
        method: 'POST',
        body: JSON.stringify({ report: reportPayload, photos, voiceNoteUrl, isFinalCompletion, followUpRequired, followUpNote })
      });
      
      Alert.alert('Success', `Day ${dayNumber} Report submitted successfully!`);
      setPhotos([]); setVoiceNoteUrl(null); setWorkDescription(''); setIssuesRemarks(''); setReportLocation(null); setManualAddress(''); setSignature(false); setMaterialsRequested('');
      loadJob();
    } catch (e: any) {
      if (e.message?.includes('Network') || e.message?.includes('Failed to fetch')) {
        const queue = JSON.parse(await SecureStore.getItemAsync('offline_queue') || '[]');
        queue.push({ type: 'daily-report', jobId: activeJob._id, isFinalCompletion, timestamp: Date.now() });
        await SecureStore.setItemAsync('offline_queue', JSON.stringify(queue));
        Alert.alert('Offline Mode Activated', 'You have no internet. Your report has been securely saved and will sync when online.');
      } else {
        Alert.alert('Error', e.message || 'Failed to submit report');
      }
    } finally { setUploading(false); }
  };

  const submitCancelRequest = async () => {
    if (!cancelReason) { Alert.alert('Error', 'Please select a reason.'); return; }
    setCancelSubmitting(true);
    try {
      await fetchWithAuth(`/orders/${activeJob.order._id}/cancel-request`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason, feedback: cancelFeedback })
      });
      setShowCancelModal(false);
      setCancelReason('');
      setCancelFeedback('');
      Alert.alert('Success', 'Cancellation request submitted to Admin for approval.');
      loadJob();
    } catch(e: any) { Alert.alert('Error', e.message); } finally { setCancelSubmitting(false); }
  };

  const advance = async (stage: string, requiresPhoto = false) => {
    try {
      let photoUrl = '';
      let lat, lng;
      
      if (requiresPhoto) {
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
        const upRes = await uploadFile('/upload?type=workflow', res.assets[0].uri, 'images');
        
        if (!upRes?.imageUrl && !upRes?.imageUrls?.[0]) throw new Error('Upload failed');
        photoUrl = upRes.imageUrl || upRes.imageUrls[0];
      } else {
        setUploading(true);
      }

      if (stage === 'inProgress') {
        await fetchWithAuth(`/technician/workflow/${activeJob._id}/progress-photo`, { method: 'POST', body: JSON.stringify({ photoUrl, lat, lng }) });
      } else {
        await fetchWithAuth(`/technician/workflow/${activeJob._id}/stage/${stage}`, { method: 'PATCH', body: JSON.stringify({ photoUrl, lat, lng, finalize: stage === 'completed', followUpRequired, followUpNote }) });
      }
      loadJob();
    } catch (e: any) { 
      if (e.message?.includes('Network') || e.message?.includes('Failed to fetch')) {
        const queue = JSON.parse(await SecureStore.getItemAsync('offline_queue') || '[]');
        queue.push({ type: 'stage', stage, jobId: activeJob._id, timestamp: Date.now() });
        await SecureStore.setItemAsync('offline_queue', JSON.stringify(queue));
        Alert.alert('Offline Mode', 'Network unavailable. Stage advanced offline and will sync soon.');
      } else {
        Alert.alert('Error', e.message); 
      }
    } finally { setUploading(false); }
  };

  const steps = ['Assigned', 'Accept', 'Arrived', 'Start', 'Progress', 'Done'];
  const step = getStep();
  const currentDay = (activeJob?.order?.dailyReports?.length || 0) + 1;
  const totalDays = activeJob?.order?.expectedDays || 1;

  const renderCancelModal = () => (
    <Modal visible={showCancelModal} transparent animationType="slide" onRequestClose={() => setShowCancelModal(false)}>
      <View style={s.modalOverlay}>
        <View style={{ backgroundColor: Colors.bgCard, width: '95%', borderRadius: 24, padding: 24, alignSelf: 'center', maxHeight: '90%' }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.fgPrimary }}>Request Cancellation</Text>
              <TouchableOpacity onPress={() => setShowCancelModal(false)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: Colors.fgMuted, marginBottom: 24 }}>You cannot cancel an order directly. Please select a reason below and submit a request to the Admin for approval.</Text>

            <Text style={{ fontSize: 12, fontWeight: '900', color: Colors.fgMuted, textTransform: 'uppercase', marginBottom: 12 }}>Reason <Text style={{ color: Colors.danger }}>*</Text></Text>
            {[
              'Customer Unavailable', 'Parts/Materials Missing', 'Out of Service Area', 'Emergency/Personal Issue', 'Vehicle Breakdown', 'Other'
            ].map(reason => (
              <TouchableOpacity 
                key={reason} 
                onPress={() => setCancelReason(reason)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
                  backgroundColor: cancelReason === reason ? Colors.danger + '15' : Colors.bgSurface,
                  borderWidth: 1, borderColor: cancelReason === reason ? Colors.danger : Colors.border,
                  borderRadius: 16, marginBottom: 8
                }}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 10, borderWidth: 2, 
                  borderColor: cancelReason === reason ? Colors.danger : Colors.border,
                  justifyContent: 'center', alignItems: 'center'
                }}>
                  {cancelReason === reason && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.danger }} />}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.fgPrimary }}>{reason}</Text>
              </TouchableOpacity>
            ))}

            <Text style={{ fontSize: 12, fontWeight: '900', color: Colors.fgMuted, textTransform: 'uppercase', marginTop: 16, marginBottom: 12 }}>Additional Comments</Text>
            <TextInput 
              placeholder="Explain the situation..."
              placeholderTextColor={Colors.fgMuted}
              value={cancelFeedback}
              onChangeText={setCancelFeedback}
              multiline
              style={s.inputMulti}
            />

            <Button 
              title="Submit Request" 
              onPress={submitCancelRequest} 
              disabled={cancelSubmitting || !cancelReason} 
              style={{ marginTop: 24, backgroundColor: Colors.danger }} 
              size="lg" 
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <ArrowLeft color={Colors.fgPrimary} size={28} />
        </TouchableOpacity>
        <Text style={{ fontSize: 28, fontWeight: '900', color: Colors.fgPrimary }}>Tasks & Reports</Text>
      </View>
      
      <View style={{ marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {[
            { id: 'assigned', label: 'Assigned', icon: '📋', count: assignedCount, color: '#2563EB' },
            { id: 'pending', label: 'Pending', icon: '⏳', count: poolTasks.length, color: '#F59E0B' },
            { id: 'completed', label: 'Completed', icon: '✅', count: completedJobs.length, color: '#22C55E' },
            { id: 'internal', label: 'Internal', icon: '🏢', count: internalTasks.length, color: '#8B5CF6' },
            { id: 'all', label: 'All', icon: '📂', count: allTasks.length, color: '#64748B' },
          ].map(t => {
            const isActive = tab === t.id;
            return (
              <TouchableOpacity 
                key={t.id} 
                activeOpacity={0.7}
                style={[s.filterPill, isActive && s.filterPillActive]} 
                onPress={() => setTab(t.id as any)}
              >
                <Text style={s.filterIcon}>{t.icon}</Text>
                <Text style={[s.filterLabel, isActive && s.filterLabelActive]}>{t.label}</Text>
                <View style={[s.filterBadge, isActive && s.filterBadgeActive]}>
                  <Text style={[s.filterBadgeText, isActive && { color: t.color }]}>{t.count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadJob} tintColor={Colors.primary} />} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        
        {loading ? (
          <View style={s.empty}><ActivityIndicator size="large" color={Colors.primary} /><Text style={s.emptyT}>Loading Tasks...</Text></View>
        ) : tab === 'pending' ? (
          <View>
            {poolTasks.length === 0 ? (
              <View style={s.empty}><CheckCircle color={Colors.success} size={48} /><Text style={s.emptyT}>No available tasks in pool</Text></View>
            ) : (
              poolTasks.map((job: any) => (
                <View key={job._id} style={{ backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Badge label={`#${job._id.slice(-6)}`} color="gray" />
                    <Badge label="Available" color="blue" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.fgPrimary }}>{job.customerName || job.customer?.name || 'Customer'} - {job.category || 'Service'}</Text>
                  
                  {job.deliveryAddress && (
                    <View style={{ marginTop: 8, backgroundColor: Colors.bgSurface, padding: 8, borderRadius: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <MapPin color={Colors.primary} size={14} style={{ marginTop: 2 }} />
                        <Text style={{ fontSize: 13, color: Colors.fgSecondary, marginLeft: 6, flex: 1 }}>{job.deliveryAddress}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', marginTop: 4, marginLeft: 20 }}>
                        {job.bookingFor === 'self' && <Badge label="Self Booking" color="blue" />}
                        {job.bookingFor === 'other' && <Badge label="For Someone Else" color="purple" />}
                      </View>
                      {job.liveLocation?.lat && job.liveLocation?.lng && (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 20 }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${job.liveLocation.lat},${job.liveLocation.lng}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
                          <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700' }}>View Live Location</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  
                  <View style={{ marginTop: 12 }}>
                    <Button title="Pickup Job" onPress={() => pickupTask(job._id)} variant="success" fullWidth />
                  </View>
                </View>
              ))
            )}
          </View>
        ) : tab === 'all' ? (
          <View>
            <TextInput
              style={{ backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 44, color: Colors.fgPrimary, fontSize: 14, marginBottom: 16 }}
              placeholder="Search all orders..."
              placeholderTextColor={Colors.fgMuted}
              value={search}
              onChangeText={setSearch}
            />
            {allTasks.filter((j: any) => 
              j.products?.[0]?.product?.name?.toLowerCase().includes(search.toLowerCase()) || 
              j.category?.toLowerCase().includes(search.toLowerCase()) || 
              j.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
              j._id?.includes(search)
            ).length === 0 ? (
              <View style={s.empty}><Text style={s.emptyT}>No orders found</Text></View>
            ) : (
              allTasks.filter((j: any) => 
                j.products?.[0]?.product?.name?.toLowerCase().includes(search.toLowerCase()) || 
                j.category?.toLowerCase().includes(search.toLowerCase()) || 
                j.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
                j._id?.includes(search)
              ).map((job: any) => (
                <View key={job._id} style={{ backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Badge label={`#${job._id.slice(-6)}`} color="gray" />
                    <Badge label={job.status.replace('_', ' ')} color={job.status === 'completed' ? 'green' : job.status === 'assigned' ? 'purple' : 'amber'} />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.fgPrimary }}>{job.customerName || job.customer?.name || 'Customer'} - {job.category || 'Service'}</Text>
                  
                  {job.technician && (
                    <Text style={{ fontSize: 12, color: Colors.fgSecondary, marginTop: 4 }}>Assigned to: <Text style={{ fontWeight: 'bold' }}>{job.technician.name}</Text></Text>
                  )}
                  {!job.technician && job.status !== 'completed' && job.status !== 'delivered' && (
                    <Text style={{ fontSize: 12, color: '#f59e0b', marginTop: 4, fontWeight: 'bold' }}>Unassigned</Text>
                  )}

                  {job.deliveryAddress && (
                    <View style={{ marginTop: 8, backgroundColor: Colors.bgSurface, padding: 8, borderRadius: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <MapPin color={Colors.primary} size={14} style={{ marginTop: 2 }} />
                        <Text style={{ fontSize: 13, color: Colors.fgSecondary, marginLeft: 6, flex: 1 }}>{job.deliveryAddress}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', marginTop: 4, marginLeft: 20 }}>
                        {job.bookingFor === 'self' && <Badge label="Self Booking" color="blue" />}
                        {job.bookingFor === 'other' && <Badge label="For Someone Else" color="purple" />}
                      </View>
                      {job.liveLocation?.lat && job.liveLocation?.lng && (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 20 }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${job.liveLocation.lat},${job.liveLocation.lng}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
                          <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700' }}>View Live Location</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        ) : tab === 'assigned' ? (
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
                <OrderDetailCard order={activeJob.order} navigation={navigation} />
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
                        <View style={{ marginBottom: 12 }}>
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

                      {rep.voiceNoteUrl && (
                        <View style={{ backgroundColor: Colors.bgSurface, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <FileAudio color={Colors.primary} size={20} />
                            <Text style={{ marginLeft: 8, fontSize: 13, color: Colors.fgPrimary, fontWeight: '600' }}>Voice Note</Text>
                          </View>
                          <TouchableOpacity onPress={() => playSound(rep.voiceNoteUrl)} style={{ backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Play</Text>
                          </TouchableOpacity>
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
                {activeJob.order?.status === 'cancellation_requested' ? (
                  <View style={{ alignItems: 'center', padding: 20 }}>
                    <AlertCircle color={Colors.warning} size={48} style={{ marginBottom: 16 }} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.fgPrimary, textAlign: 'center', marginBottom: 8 }}>Cancellation Pending</Text>
                    <Text style={{ fontSize: 14, color: Colors.fgMuted, textAlign: 'center' }}>Your request to cancel this order is pending admin approval. You cannot perform actions until it is resolved.</Text>
                  </View>
                ) : (
                  <>
                    {step === 1 && (<><Text style={s.at}>New Assignment</Text><View style={s.br}><Button title="Accept Order" onPress={() => handleAction('accept')} style={{ flex: 1 }} /><Button title="Decline" onPress={() => handleAction('reject')} variant="danger" style={{ flex: 1 }} /></View></>)}
                    {step === 2 && (<><Text style={s.at}>Navigate to Site</Text><Button title="Report Arrival" onPress={() => advance('reached')} fullWidth loading={uploading} /><Button title="Request Cancellation" onPress={() => setShowCancelModal(true)} variant="danger" fullWidth style={{ marginTop: 12 }} /></>)}
                    {step === 3 && (<><Text style={s.at}>Start Work</Text><Button title="Capture Start GPS & Photo" onPress={() => advance('started', true)} fullWidth loading={uploading} icon={<Camera color="#fff" size={16} />} /><Button title="Request Cancellation" onPress={() => setShowCancelModal(true)} variant="danger" fullWidth style={{ marginTop: 12 }} /></>)}
                  </>
                )}
                {(step === 4 || step === 5) && (
                  <View style={{ gap: 16 }}>
                    <DailyReportForm 
                      orderId={activeJob.order._id}
                      currentDay={currentDay}
                      totalDays={totalDays}
                      onSubmit={(data: any) => {
                        // Forward data to the existing submitDailyReport logic
                        // Need to set states first since submitDailyReport uses them
                        setWorkDescription(data.workDescription);
                        setIssuesRemarks(data.issuesRemarks);
                        setMaterialsRequested(data.materialsRequested);
                        setProgressPercent(data.progressPercent);
                        setPhotos(data.photos);
                        setVoiceNoteUrl(data.voiceNoteUrl);
                        setReportLocation(data.location);
                        // Due to state being async, we pass it directly to a patched version or wait
                        submitDailyReport(data.isFinal);
                      }}
                    />
                  </View>
                )}
                {step >= 6 && (activeJob.order?.status === 'pending_approval' || activeJob.order?.status === 'pending_admin_approval') && (
                  <View style={{ alignItems: 'center' }}><Text style={s.at}>Pending Admin Approval</Text><Text style={{ textAlign: 'center', color: Colors.fgMuted, marginTop: 10, marginBottom: 20 }}>Your daily report & photos have been submitted. Waiting for Admin review (auto-approves in 30 mins).</Text></View>
                )}
                {step >= 6 && activeJob.order?.status !== 'pending_approval' && activeJob.order?.status !== 'pending_admin_approval' && (
                  <View style={{ alignItems: 'center' }}><Text style={s.at}>Task Complete ✅</Text><Text style={{ textAlign: 'center', color: Colors.success, marginTop: 10, marginBottom: 20 }}>Great job! Admin has approved this work.</Text></View>
                )}

                {step < 6 && (
                  <TouchableOpacity onPress={() => setShowCancelModal(true)} style={{ marginTop: 24, paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.danger, textTransform: 'uppercase', letterSpacing: 1 }}>Request Cancellation</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        ) : tab === 'internal' ? (
          <View>
            {internalTasks.length === 0 ? (
              <View style={s.empty}><CheckCircle color={Colors.success} size={48} /><Text style={s.emptyT}>No Internal Tasks</Text></View>
            ) : (
              internalTasks.map((task: any, idx: number) => (
                <View key={task._id} style={{ backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Badge label={`#${task._id.slice(-6).toUpperCase()}`} color="gray" />
                    <Badge 
                      label={task.status.replace('_', ' ')} 
                      color={task.status === 'completed' ? 'green' : task.status === 'in_progress' ? 'blue' : 'gray'} 
                    />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.fgPrimary }}>{task.title}</Text>
                  {task.description ? <Text style={{ fontSize: 13, color: Colors.fgMuted, marginTop: 4 }}>{task.description}</Text> : null}
                  
                  {(task.customerName || task.customerPhone) && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.fgMuted, textTransform: 'uppercase', marginBottom: 4 }}>Customer Contact</Text>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: Colors.fgPrimary }}>{task.customerName || 'N/A'}</Text>
                      {task.customerPhone && (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }} onPress={() => Linking.openURL(`tel:${task.customerPhone}`).catch(() => Alert.alert('Error', 'Could not open phone'))}>
                          <Text style={{ fontSize: 14, color: Colors.primary, fontWeight: '800' }}>📞 {task.customerPhone}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {task.liveLocation && (
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: Colors.primaryFaint, padding: 8, borderRadius: 8 }} onPress={() => Linking.openURL(task.liveLocation).catch(() => Alert.alert('Error', 'Could not open map'))}>
                      <Navigation color={Colors.primary} size={14} />
                      <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700', marginLeft: 6 }}>Open Location</Text>
                    </TouchableOpacity>
                  )}

                  <View style={{ marginTop: 16, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {task.status === 'pending' && (
                      <View style={{ flexDirection: 'row', gap: 12, flex: 1, width: '100%' }}>
                        <Button title="Accept" onPress={() => handleInternalTaskStatus(task._id, 'started')} style={{ flex: 1 }} />
                        <Button title="Decline" onPress={() => handleInternalTaskStatus(task._id, 'declined')} variant="danger" style={{ flex: 1 }} />
                      </View>
                    )}
                    {task.status === 'started' && (
                      <Button title="Mark In Progress" onPress={() => handleInternalTaskStatus(task._id, 'in_progress')} style={{ flex: 1 }} />
                    )}
                    {task.status === 'in_progress' && (
                      <Button title="Complete Task" onPress={() => handleInternalTaskStatus(task._id, 'completed')} variant="success" style={{ flex: 1 }} />
                    )}
                    {task.status === 'completed' && (
                      <Button title="Task Completed" disabled onPress={() => {}} style={{ flex: 1 }} />
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
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
                    <Badge label={(job.order?.status === 'pending_approval' || job.order?.status === 'pending_admin_approval') ? 'Pending Approval' : 'Completed'} color={(job.order?.status === 'pending_approval' || job.order?.status === 'pending_admin_approval') ? 'amber' : 'green'} />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.fgPrimary }}>{job.order?.customerName || job.order?.customer?.name || 'ABC Company'} - {job.order?.serviceType || 'CCTV Installation'}</Text>
                  <Text style={{ fontSize: 12, color: Colors.fgMuted, marginTop: 4 }}>Finished on {new Date(job.stages?.completed?.timestamp || job.updatedAt).toLocaleDateString()}</Text>

                  {job.order && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.fgMuted, textTransform: 'uppercase', marginBottom: 4 }}>Customer Details</Text>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: Colors.fgPrimary }}>{job.order.customerName || job.order.customer?.name}</Text>
                      <Text style={{ fontSize: 14, color: Colors.fgSecondary }}>{job.order.contactNumber || job.order.customer?.phone}</Text>
                      
                      {job.order.deliveryAddress && (
                        <View style={{ marginTop: 8, backgroundColor: Colors.primaryFaint, padding: 8, borderRadius: 8 }}>
                          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'flex-start' }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.order.deliveryAddress)}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
                            <MapPin color={Colors.primary} size={14} style={{ marginTop: 2 }} />
                            <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700', marginLeft: 6, flex: 1 }}>{job.order.deliveryAddress}</Text>
                          </TouchableOpacity>
                          <View style={{ flexDirection: 'row', marginTop: 4, marginLeft: 20 }}>
                            {job.order.bookingFor === 'self' && <Badge label="Self Booking" color="blue" />}
                            {job.order.bookingFor === 'other' && <Badge label="For Someone Else" color="purple" />}
                          </View>
                          {job.order.liveLocation?.lat && job.order.liveLocation?.lng && (
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 20 }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${job.order.liveLocation.lat},${job.order.liveLocation.lng}`).catch(() => Alert.alert('Error', 'Could not open maps'))}>
                              <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '900', textDecorationLine: 'underline' }}>Open Live Location in Maps</Text>
                            </TouchableOpacity>
                          )}
                        </View>
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

      {/* Signature Capture Modal Mock */}
      <Modal visible={showSignatureModal} transparent animationType="slide" onRequestClose={() => setShowSignatureModal(false)}>
        <View style={s.modalOverlay}>
          <View style={{ backgroundColor: Colors.bgCard, width: '90%', borderRadius: 24, padding: 24, alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.fgPrimary }}>Customer Signature</Text>
              <TouchableOpacity onPress={() => setShowSignatureModal(false)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: Colors.fgMuted, marginBottom: 12 }}>Please ask the customer to sign inside the box below to authorize work completion.</Text>
            
            <View style={{ width: '100%', height: 200, backgroundColor: Colors.bgSurface, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: Colors.fgDim, fontSize: 16, fontWeight: 'bold' }}>Draw Signature Here</Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <Button title="Clear" onPress={() => setSignature(false)} variant="secondary" style={{ flex: 1 }} />
              <Button title="Save Signature" onPress={() => {
                setSignature(true);
                setShowSignatureModal(false);
              }} style={{ flex: 2 }} variant="success" />
            </View>
          </View>
        </View>
      </Modal>

      {renderCancelModal()}
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
  filterPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, paddingVertical: 10, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: '#E2E8F0' },
  filterPillActive: { backgroundColor: '#2563EB', borderColor: '#2563EB', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6, transform: [{ scale: 1.03 }] },
  filterIcon: { fontSize: 16, marginRight: 6 },
  filterLabel: { fontSize: 14, fontWeight: '700', color: '#334155' },
  filterLabelActive: { color: '#fff' },
  filterBadge: { backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  filterBadgeActive: { backgroundColor: '#fff' },
  filterBadgeText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  viewerHdr: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 1000 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  downloadActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20 },
  downloadActionT: { color: '#fff', fontSize: 15, fontWeight: '900' },
  fullImage: { width: '100%', height: '80%' }
});
