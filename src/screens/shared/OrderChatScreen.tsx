import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar, Alert, Image, LayoutAnimation, UIManager } from 'react-native';
import { Send, User as UserIcon, ArrowLeft, Image as ImageIcon, MapPin, Lock } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Button, Badge } from '../../components/ui';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { fetchWithAuth, uploadFile } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function OrderChatScreen({ route, navigation }: any) {
  const { orderId, orderStatus = 'in_progress', customerName = 'Customer' } = route.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const { socket } = useSocket();

  const loadMessages = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      // Try order-specific chat endpoint or fallback to general chat and filter by orderId
      const data = await fetchWithAuth(`/chat?orderId=${orderId}`).catch(async () => {
        const all = await fetchWithAuth('/chat').catch(() => []);
        return (all || []).filter((m: any) => m.orderId === orderId || m.order?._id === orderId);
      });
      setMessages(data || []);

      // Fetch latest order status with role-aware fallback to avoid 403/404 errors
      let resolvedStatus = orderStatus;
      try {
        if (user?.role === 'admin') {
          const allOrders = await fetchWithAuth('/orders/all').catch(() => []);
          const allBookings = await fetchWithAuth('/bookings/admin/all').catch(() => []);
          const found = [...(allOrders || []), ...(allBookings || [])].find((item: any) => item._id === orderId);
          if (found) resolvedStatus = found.status || orderStatus;
        } else if (user?.role === 'technician') {
          const tasks = await fetchWithAuth('/technician/my-tasks').catch(() => []);
          const found = (tasks || []).find((t: any) => t.order?._id === orderId || t._id === orderId);
          if (found) {
            resolvedStatus = found.order?.status || found.status || orderStatus;
          } else {
            const order = await fetchWithAuth(`/orders/${orderId}`).catch(() => null);
            if (order) resolvedStatus = order.status || orderStatus;
          }
        } else {
          // Customer role: check my-orders and my-bookings directly to prevent 403 Forbidden on admin routes
          const myOrders = await fetchWithAuth('/orders/my-orders').catch(() => []);
          const myBookings = await fetchWithAuth('/bookings/my-bookings').catch(() => []);
          const found = [...(myOrders || []), ...(myBookings || [])].find((item: any) => item._id === orderId);
          if (found) {
            resolvedStatus = found.status || orderStatus;
          } else {
            const order = await fetchWithAuth(`/orders/${orderId}`).catch(() => null);
            if (order) resolvedStatus = order.status || orderStatus;
          }
        }
      } catch (err) {
        resolvedStatus = orderStatus;
      }

      if (['completed', 'delivered', 'cancelled'].includes(resolvedStatus)) {
        setIsCompleted(true);
      } else {
        setIsCompleted(false);
      }
    } catch (e) {
      console.error('Failed to load order chat:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [orderId]);

  useEffect(() => {
    if (socket && orderId) {
      const orderEvent = `message_order:${orderId}`;
      const generalEvent = `message`;
      
      const handleNewMsg = () => loadMessages();
      const handleDelMsg = (msgId: string) => setMessages(prev => prev.filter(m => m._id !== msgId));

      socket.on(orderEvent, handleNewMsg);
      socket.on(generalEvent, handleNewMsg);
      socket.on('order_updated', handleNewMsg);
      socket.on('message_deleted', handleDelMsg);
      
      return () => {
        socket.off(orderEvent, handleNewMsg);
        socket.off(generalEvent, handleNewMsg);
        socket.off('order_updated', handleNewMsg);
        socket.off('message_deleted', handleDelMsg);
      };
    }
  }, [socket, orderId]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
    });
    if (!result.canceled) {
      try {
        setLoading(true);
        const res = await uploadFile('/upload', result.assets[0].uri, 'images');
        
        const imageUrl = res.imageUrl || (res.imageUrls && res.imageUrls[0]) || res.url;
        const payload = { 
          orderId, 
          receiverRole: user?.role === 'customer' ? 'technician' : 'customer', 
          content: 'Image Attachment', 
          attachments: [imageUrl] 
        };
        await fetchWithAuth('/chat', { method: 'POST', body: JSON.stringify(payload) });
        if (socket) {
          socket.emit('message', { orderId, receiverRole: payload.receiverRole, content: 'Image Attachment', sender: user, attachments: [imageUrl] });
          socket.emit('new_notification', { title: `New Image (Order #${orderId.slice(-6)})`, message: `${user?.name || user?.role || 'User'} sent an image`, role: payload.receiverRole, orderId, type: 'order_chat', broadcastAll: true });
          socket.emit('new_notification', { title: `New Image (Order #${orderId.slice(-6)})`, message: `${user?.name || user?.role || 'User'} sent an image`, role: 'admin', orderId, type: 'order_chat', broadcastAll: true });
        }
        loadMessages();
      } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
    }
  };

  const shareLocation = async () => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to share it.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      const mapsUrl = `https://www.google.com/maps?q=${loc.coords.latitude},${loc.coords.longitude}`;
      
      const payload = { 
        orderId, 
        receiverRole: user?.role === 'customer' ? 'technician' : 'customer', 
        content: `📍 Location Shared: ${mapsUrl}` 
      };
      await fetchWithAuth('/chat', { method: 'POST', body: JSON.stringify(payload) });
      if (socket) {
        socket.emit('message', { orderId, receiverRole: payload.receiverRole, content: payload.content, sender: user });
        socket.emit('new_notification', { title: `Location Shared (Order #${orderId.slice(-6)})`, message: `${user?.name || user?.role || 'User'} shared location`, role: payload.receiverRole, orderId, type: 'order_chat', broadcastAll: true });
        socket.emit('new_notification', { title: `Location Shared (Order #${orderId.slice(-6)})`, message: `${user?.name || user?.role || 'User'} shared location`, role: 'admin', orderId, type: 'order_chat', broadcastAll: true });
      }
      loadMessages();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permission denied');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch (err) { console.error(err); }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    try {
      setLoading(true);
      setIsRecording(false);
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri) {
        const res = await uploadFile('/upload', uri, 'images', 'audio/m4a');
        const audioUrl = res.imageUrl || (res.imageUrls && res.imageUrls[0]) || res.url;
        const payload = { 
          orderId, 
          receiverRole: user?.role === 'customer' ? 'technician' : 'customer', 
          content: 'Voice Message', 
          attachments: [audioUrl] 
        };
        await fetchWithAuth('/chat', { method: 'POST', body: JSON.stringify(payload) });
        if (socket) {
          socket.emit('message', { orderId, receiverRole: payload.receiverRole, content: 'Voice Message', sender: user, attachments: [audioUrl] });
        }
        loadMessages();
      }
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const deleteMessage = async (id: string) => {
    try {
      await fetchWithAuth(`/chat/${id}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(m => m._id !== id));
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const sendMessage = async () => {
    if (!input.trim() || !orderId) return;
    try {
      const payload = { 
        orderId, 
        receiverRole: user?.role === 'customer' ? 'technician' : 'customer', 
        content: input 
      };
      const msgText = input;
      setInput('');
      await fetchWithAuth('/chat', { method: 'POST', body: JSON.stringify(payload) });
      if (socket) {
        socket.emit('message', {
          orderId,
          receiverRole: user?.role === 'customer' ? 'technician' : 'customer',
          content: msgText,
          sender: user
        });
        socket.emit('new_notification', {
          title: `New Message (Order #${orderId.slice(-6)})`,
          message: `${user?.name || user?.role || 'User'}: ${msgText}`,
          role: user?.role === 'customer' ? 'technician' : 'customer',
          orderId,
          type: 'order_chat',
          broadcastAll: true
        });
        socket.emit('new_notification', {
          title: `New Message (Order #${orderId.slice(-6)})`,
          message: `${user?.name || user?.role || 'User'}: ${msgText}`,
          role: 'admin',
          orderId,
          type: 'order_chat',
          broadcastAll: true
        });
      }
      loadMessages();
    } catch (e) { console.error(e); }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender?._id === user?._id || item.sender === user?._id;
    const senderName = item.sender?.name || (item.sender?.role ? item.sender.role.toUpperCase() : 'USER');
    const senderRole = item.sender?.role || 'user';
    const hasImage = item.attachments && item.attachments.length > 0;
    const hasAudio = item.attachments && item.attachments.some((a: string) => a.endsWith('.m4a') || a.endsWith('.mp3') || a.endsWith('.wav'));
    const isImage = hasImage && !hasAudio;
    const API_BASE = 'https://sk-tech-cctv.onrender.com';
    return (
      <TouchableOpacity 
        style={[s.msgWrapper, isMe ? s.msgRight : s.msgLeft]} 
        onLongPress={() => {
          if (isMe || user?.role === 'admin') {
            Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteMessage(item._id) }
            ]);
          }
        }}
      >
        {!isMe && <View style={[s.avatar, senderRole === 'admin' ? {backgroundColor: Colors.danger} : senderRole === 'technician' ? {backgroundColor: Colors.warning} : {backgroundColor: Colors.primary}]}><UserIcon color="#fff" size={12} /></View>}
        <View style={[s.msgBubble, isMe ? s.bubbleRight : s.bubbleLeft]}>
          {!isMe && <Text style={{fontSize: 10, color: Colors.fgMuted, marginBottom: 2, fontWeight: '700', textTransform: 'uppercase'}}>{senderName} ({senderRole})</Text>}
          {isImage && (
            <Image source={{ uri: item.attachments[0].startsWith('http') ? item.attachments[0] : `${API_BASE}${item.attachments[0]}` }} style={{ width: 150, height: 150, borderRadius: 8, marginBottom: 4 }} resizeMode="cover" />
          )}
          {hasAudio && (
            <Text style={[s.msgText, isMe ? s.textRight : s.textLeft]}>🎵 Audio Message</Text>
          )}
          <Text style={[s.msgText, isMe ? s.textRight : s.textLeft]}>{item.content}</Text>
          <Text style={[s.msgTime, isMe ? s.timeRight : s.timeLeft]}>
            {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}><ArrowLeft color={Colors.fgPrimary} size={20} /></TouchableOpacity>
        <View>
          <Text style={s.title}>Order #{orderId?.slice(-6)} Chat</Text>
          <Text style={s.subTitle}>{user?.role === 'customer' ? 'Support & Technician Chat' : `Customer: ${customerName}`}</Text>
        </View>
      </View>
      
      <FlatList
        data={messages}
        keyExtractor={(m, idx) => m._id || idx.toString()}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={s.emptyT}>No messages yet for this order. Start the conversation!</Text>}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {isCompleted ? (
          <View style={s.lockedContainer}>
            <Lock color={Colors.danger} size={18} style={{ marginRight: 8 }} />
            <Text style={s.lockedText}>Chat is closed. Order has been completed/delivered.</Text>
          </View>
        ) : (
          <View style={s.inputContainer}>
            <TouchableOpacity style={s.attachBtn} onPress={pickImage}>
              <ImageIcon color={Colors.fgMuted} size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={s.attachBtn} onPress={shareLocation}>
              <MapPin color={Colors.fgMuted} size={20} />
            </TouchableOpacity>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder={user?.role === 'customer' ? "Type a message to support/technician..." : "Type a message to customer..."}
              placeholderTextColor={Colors.fgMuted}
              multiline
            />
            {input.trim() ? (
              <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
                <Send color="#fff" size={18} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[s.sendBtn, isRecording && { backgroundColor: Colors.danger }]} 
                onPressIn={startRecording} 
                onPressOut={stopRecording}
              >
                <Text style={{color: '#fff', fontSize: 20}}>🎙️</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: 18, fontWeight: '900', color: Colors.fgPrimary },
  subTitle: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700' },
  msgWrapper: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', width: '100%' },
  msgRight: { justifyContent: 'flex-end' },
  msgLeft: { justifyContent: 'flex-start' },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  msgBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  bubbleRight: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleLeft: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, lineHeight: 20 },
  textRight: { color: '#fff', fontWeight: '500' },
  textLeft: { color: Colors.fgPrimary },
  msgTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  timeRight: { color: 'rgba(255,255,255,0.7)' },
  timeLeft: { color: Colors.fgMuted },
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  input: { flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 24, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, fontSize: 14, color: Colors.fgPrimary, maxHeight: 100 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  attachBtn: { padding: 8, marginRight: 4 },
  emptyT: { textAlign: 'center', color: Colors.fgMuted, marginTop: 40, fontSize: 14 },
  lockedContainer: { flexDirection: 'row', padding: 16, backgroundColor: Colors.bgSurface, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center', justifyContent: 'center', paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  lockedText: { color: Colors.danger, fontSize: 14, fontWeight: '800' },
});
