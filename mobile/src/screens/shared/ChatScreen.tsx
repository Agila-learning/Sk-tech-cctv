import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { Send, User as UserIcon, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function ChatScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const orderId = route?.params?.orderId;
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const url = orderId ? `/chat?orderId=${orderId}` : '/chat';
      const data = await fetchWithAuth(url);
      setMessages(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // Polling for simplicity since socket context isn't injecting here directly
    return () => clearInterval(interval);
  }, [orderId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    try {
      let receiverRole = user?.role === 'customer' ? 'admin' : user?.role === 'admin' ? 'technician' : 'admin';
      if (orderId && user?.role !== 'customer') {
        receiverRole = 'customer';
      }
      const payload = { receiverRole, orderId, content: input };
      await fetchWithAuth('/chat', { method: 'POST', body: JSON.stringify(payload) });
      setInput('');
      loadMessages();
    } catch (e) { console.error(e); }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender?._id === user?._id || item.sender === user?._id;
    return (
      <View style={[s.msgWrapper, isMe ? s.msgRight : s.msgLeft]}>
        {!isMe && <View style={s.avatar}><UserIcon color="#fff" size={12} /></View>}
        <View style={[s.msgBubble, isMe ? s.bubbleRight : s.bubbleLeft]}>
          <Text style={[s.msgText, isMe ? s.textRight : s.textLeft]}>{item.content}</Text>
          <Text style={[s.msgTime, isMe ? s.timeRight : s.timeLeft]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}><ArrowLeft color={Colors.fgPrimary} size={20} /></TouchableOpacity>
        <Text style={s.title}>Support Chat</Text>
      </View>
      
      <FlatList
        data={[...messages].reverse()}
        keyExtractor={m => m._id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={s.emptyT}>No messages yet. Start a conversation!</Text>}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.inputContainer}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.fgMuted}
            multiline
          />
          <TouchableOpacity style={[s.sendBtn, !input.trim() && { opacity: 0.5 }]} onPress={sendMessage} disabled={!input.trim()}>
            <Send color="#fff" size={18} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  msgWrapper: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
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
  emptyT: { textAlign: 'center', color: Colors.fgMuted, marginTop: 40, fontSize: 14 },
});
