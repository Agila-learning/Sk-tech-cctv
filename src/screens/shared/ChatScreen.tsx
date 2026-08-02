import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar, Alert, Image } from 'react-native';
import { Send, User as UserIcon, ArrowLeft, Image as ImageIcon, MapPin } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { fetchWithAuth, uploadFile } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function ChatScreen({ navigation, route }: any) {
  const targetUserId = route?.params?.targetUserId;
  const targetTitle = route?.params?.title;
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'admin' | 'technician' | 'customer'>(user?.role === 'admin' ? 'technician' : 'admin');
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const { socket } = useSocket();

  const loadMessages = async () => {
    try {
      setLoading(true);
      const url = targetUserId ? `/chat/conversation/${targetUserId}` : '/chat';
      const data = await fetchWithAuth(url);
      setMessages(data || []);

      if (user?.role === 'technician') {
        const tasks = await fetchWithAuth('/technician/my-tasks').catch(() => []);
        if (tasks?.length) {
          const hasActive = tasks.some((t: any) => t.order?.status !== 'completed' && t.order?.status !== 'delivered' && t.order?.status !== 'cancelled');
          setIsOrderCompleted(!hasActive);
        }
      } else if (user?.role === 'customer') {
        const orders = await fetchWithAuth('/orders/my-orders').catch(() => []);
        if (orders?.length) {
          const hasActive = orders.some((o: any) => o.status !== 'completed' && o.status !== 'delivered' && o.status !== 'cancelled');
          setIsOrderCompleted(!hasActive);
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (socket && user) {
      const roleEvent = `message_role:${user.role}`;
      const userEvent = `message:${user._id}`;
      
      const handleNewMsg = () => loadMessages(); // Reload to get populated sender
      const handleDelMsg = (msgId: string) => setMessages(prev => prev.filter(m => m._id !== msgId));

      socket.on(roleEvent, handleNewMsg);
      socket.on(userEvent, handleNewMsg);
      socket.on('message_deleted', handleDelMsg);
      
      return () => {
        socket.off(roleEvent, handleNewMsg);
        socket.off(userEvent, handleNewMsg);
        socket.off('message_deleted', handleDelMsg);
      };
    }
  }, [socket, user]);

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
        const payload: any = { content: 'Image Attachment', attachments: [imageUrl] };
        if (targetUserId) {
          payload.receiver = targetUserId;
        } else {
          payload.receiverRole = activeTab;
        }
        await fetchWithAuth('/chat', { method: 'POST', body: JSON.stringify(payload) });
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
      
      const payload: any = { content: `📍 Location Shared: ${mapsUrl}` };
      if (targetUserId) {
        payload.receiver = targetUserId;
      } else {
        payload.receiverRole = activeTab;
      }
      await fetchWithAuth('/chat', { method: 'POST', body: JSON.stringify(payload) });
      loadMessages();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') return Alert.alert('Permission denied');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRec);
      setIsRecording(true);
    } catch (err) { console.error(err); }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      setLoading(true);
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        const res = await uploadFile('/upload', uri, 'images', 'audio/m4a');
        const audioUrl = res.imageUrl || (res.imageUrls && res.imageUrls[0]) || res.url;
        const payload: any = { content: 'Voice Message', attachments: [audioUrl] };
        if (targetUserId) payload.receiver = targetUserId;
        else payload.receiverRole = activeTab;
        await fetchWithAuth('/chat', { method: 'POST', body: JSON.stringify(payload) });
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
    if (!input.trim()) return;
    try {
      const payload: any = { content: input };
      if (targetUserId) {
        payload.receiver = targetUserId;
      } else {
        payload.receiverRole = activeTab;
      }
      setInput('');
      await fetchWithAuth('/chat', { method: 'POST', body: JSON.stringify(payload) });
      loadMessages();
    } catch (e) { console.error(e); }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender?._id === user?._id || item.sender === user?._id;
    const senderName = item.sender?.name || 'Unknown';
    const senderRole = item.sender?.role || 'user';
    const hasImage = item.attachments && item.attachments.length > 0;
    const hasAudio = item.attachments && item.attachments.some((a: string) => a.endsWith('.m4a') || a.endsWith('.mp3') || a.endsWith('.wav'));
    const isImage = hasImage && !hasAudio;
    const API_URL = 'https://sk-tech-cctv.onrender.com';

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
        {!isMe && <View style={[s.avatar, senderRole === 'admin' && {backgroundColor: Colors.danger}]}><UserIcon color="#fff" size={12} /></View>}
        <View style={[s.msgBubble, isMe ? s.bubbleRight : s.bubbleLeft]}>
          {!isMe && <Text style={{fontSize: 10, color: Colors.fgMuted, marginBottom: 2, fontWeight: '700', textTransform: 'uppercase'}}>{senderName} ({senderRole})</Text>}
          {isImage && (
            <Image source={{ uri: item.attachments[0].startsWith('http') ? item.attachments[0] : `${API_URL}${item.attachments[0]}` }} style={{ width: 150, height: 150, borderRadius: 8, marginBottom: 4 }} resizeMode="cover" />
          )}
          {hasAudio && (
            <Text style={[s.msgText, isMe ? s.textRight : s.textLeft]}>🎵 Audio Message</Text>
          )}
          <Text style={[s.msgText, isMe ? s.textRight : s.textLeft]}>{item.content}</Text>
          <Text style={[s.msgTime, isMe ? s.timeRight : s.timeLeft]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        <Text style={s.title}>{targetTitle || 'Support Chat'}</Text>
      </View>
      
      {!targetUserId && (
        <View style={s.tabContainer}>
          {['admin', 'technician', 'customer'].filter(role => role !== user?.role).map(role => (
            <TouchableOpacity 
              key={role} 
              style={[s.tab, activeTab === role && s.activeTab]}
              onPress={() => setActiveTab(role as any)}
            >
              <Text style={[s.tabText, activeTab === role && s.activeTabText]}>{role.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      <FlatList
        data={targetUserId ? messages : messages.filter(m => m.sender?.role === activeTab || m.receiverRole === activeTab)}
        keyExtractor={i => i._id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={s.emptyT}>No messages yet. Start a conversation!</Text>}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {isOrderCompleted ? (
          <View style={{ padding: 16, backgroundColor: Colors.bgSurface, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center' }}>
            <Text style={{ color: Colors.warning, fontSize: 13, fontWeight: '800', textAlign: 'center' }}>💬 Chat is disabled as your assigned service order has been completed.</Text>
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
              placeholder="Type a message..."
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
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
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
  emptyT: { textAlign: 'center', color: Colors.fgMuted, marginTop: 40, fontSize: 13 },
  tabContainer: { flexDirection: 'row', backgroundColor: Colors.bgCard, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: Colors.bgSurface },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: Colors.fgMuted },
  activeTabText: { color: '#fff' }
});
