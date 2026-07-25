import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { MessageSquare, X, Send, Bot, User, ArrowRight } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

const BOT_RESPONSES = [
  { keywords: ['hi', 'hello', 'hey'], reply: "Hello! How can I help you today with SK Technology services?" },
  { keywords: ['order', 'track', 'progress'], reply: "You can track your order progress in the 'Orders' section of your profile. Or provide your Order ID here." },
  { keywords: ['address', 'location', 'where'], reply: "We are located in the heart of the city. For specific store locations, please check the 'Contact Us' page." },
  { keywords: ['contact', 'support', 'help'], reply: "You can reach our support team at support@sktechnology.services or call us at our helpline." },
  { keywords: ['warranty', 'claim'], reply: "To claim a warranty, please go to the 'Warranty' section and click 'Claim Free Service'." },
  { keywords: ['price', 'cost', 'quote'], reply: "For pricing details, please request a consultation or check our product catalog." },
];

export default function CustomerChatbot({ visible, onClose, navigation }: { visible: boolean, onClose: () => void, navigation: any }) {
  const [messages, setMessages] = useState<{ id: string, text: string, isBot: boolean, action?: string }[]>([
    { id: '1', text: "Hi there! 👋 I'm SK Assistant. How can I help you today?", isBot: true }
  ]);
  const [inputText, setInputText] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 8
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const userMsg = { id: Date.now().toString(), text: inputText.trim(), isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Simulate bot thinking
    setTimeout(() => {
      let replyText = "I'm sorry, I didn't quite catch that. Would you like to speak to a human representative?";
      let action = undefined;

      const lowerText = userMsg.text.toLowerCase();
      
      for (const response of BOT_RESPONSES) {
        if (response.keywords.some(kw => lowerText.includes(kw))) {
          replyText = response.reply;
          if (response.keywords.includes('order')) action = 'Orders';
          if (response.keywords.includes('warranty')) action = 'Warranty';
          break;
        }
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), text: replyText, isBot: true, action }]);
    }, 1000);
  };

  const handleAction = (action: string) => {
    onClose();
    navigation.navigate(action);
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalBg}>
        <Animated.View style={[
          s.chatContainer,
          { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }] }
        ]}>
          <View style={s.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={s.botIconBg}><Bot color="#fff" size={20} /></View>
              <View>
                <Text style={s.headerTitle}>SK Assistant</Text>
                <Text style={s.headerSub}>Online</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X color={Colors.fgMuted} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={s.msgList}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map(msg => (
              <View key={msg.id} style={[s.msgWrapper, msg.isBot ? s.msgWrapperBot : s.msgWrapperUser]}>
                {msg.isBot && <View style={s.msgAvatarBot}><Bot color="#fff" size={14} /></View>}
                <View style={[s.msgBubble, msg.isBot ? s.msgBubbleBot : s.msgBubbleUser]}>
                  <Text style={[s.msgText, msg.isBot ? s.msgTextBot : s.msgTextUser]}>{msg.text}</Text>
                  {msg.action && (
                    <TouchableOpacity style={s.actionBtn} onPress={() => handleAction(msg.action!)}>
                      <Text style={s.actionBtnTxt}>Go to {msg.action}</Text>
                      <ArrowRight color={Colors.primary} size={14} />
                    </TouchableOpacity>
                  )}
                </View>
                {!msg.isBot && <View style={s.msgAvatarUser}><User color="#fff" size={14} /></View>}
              </View>
            ))}
          </ScrollView>

          <View style={s.inputContainer}>
            <TextInput
              style={s.input}
              placeholder="Type your message..."
              placeholderTextColor={Colors.fgDim}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity style={[s.sendBtn, !inputText.trim() && { opacity: 0.5 }]} onPress={handleSend} disabled={!inputText.trim()}>
              <Send color="#fff" size={18} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  chatContainer: { height: '80%', backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border },
  botIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.fgPrimary },
  headerSub: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  closeBtn: { padding: 4 },
  msgList: { padding: 20, gap: 16, paddingBottom: 40 },
  msgWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
  msgWrapperBot: { alignSelf: 'flex-start' },
  msgWrapperUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  msgAvatarBot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  msgAvatarUser: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.fgMuted, alignItems: 'center', justifyContent: 'center' },
  msgBubble: { padding: 14, borderRadius: 18 },
  msgBubbleBot: { backgroundColor: Colors.bgCard, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  msgBubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextBot: { color: Colors.fgPrimary },
  msgTextUser: { color: '#fff' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 10, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: Colors.primaryFaint, borderRadius: 12, gap: 6 },
  actionBtnTxt: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center', gap: 12 },
  input: { flex: 1, backgroundColor: Colors.bgSurface, height: 48, borderRadius: 24, paddingHorizontal: 20, fontSize: 14, color: Colors.fgPrimary, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
});
