import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, ScrollView, Modal, KeyboardAvoidingView, Platform, LayoutAnimation, Alert } from 'react-native';
import { MessageSquare, X, Send, Bot, User, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';

const BOT_RESPONSES = [
  { keywords: ['hi', 'hello', 'hey', 'help'], reply: "Hello! 👋 I am SK Tech Assistant, don't risk your question, get help with me." },
  { keywords: ['order', 'track', 'status', 'delivery'], reply: "You can track your order progress in the 'Orders' section.", action: 'Orders' },
  { keywords: ['address', 'location', 'where', 'contact', 'call', 'support', 'phone'], reply: "You can reach our support team or find our location in your Profile settings.", action: 'Profile' },
  { keywords: ['warranty', 'claim', 'broken', 'repair', 'fix'], reply: "To claim a warranty or repair, please go to the 'Warranty' section.", action: 'Warranty' },
  { keywords: ['price', 'cost', 'quote', 'products', 'camera', 'cctv', 'buy'], reply: "For pricing details and all our offerings, please check our product catalog.", action: 'Products' },
  { keywords: ['book', 'technician', 'service', 'installation', 'visit'], reply: "You can easily book a technician or service visit.", action: 'BookService' },
  { keywords: ['cart', 'checkout', 'bag'], reply: "You can view your selected items in the Cart.", action: 'Cart' },
];

const QUICK_REPLIES = ["Track Order", "Book Service", "Claim Warranty", "Talk to Human"];

export default function CustomerChatbot({ visible, onClose, navigation }: { visible: boolean, onClose: () => void, navigation: any }) {
  const [messages, setMessages] = useState<{ id: string, text: string, isBot: boolean, action?: string }[]>([
    { id: '1', text: "Hi there! 👋 I am SK Tech Assistant, don't risk your question, get help with me.", isBot: true }
  ]);
  const [inputText, setInputText] = useState('');
  const [step, setStep] = useState<'chat' | 'lead' | 'success'>('chat');
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', details: '' });
  
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

  const handleSend = (text = inputText) => {
    if (!text.trim()) return;
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const userMsg = { id: Date.now().toString(), text: text.trim(), isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    const lowerText = userMsg.text.toLowerCase();

    if (lowerText.includes('human') || lowerText.includes('call') || lowerText.includes('agent')) {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now().toString(), text: "I can connect you with a human expert right away. Please provide a few details.", isBot: true }]);
        setTimeout(() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setStep('lead');
        }, 1500);
      }, 1000);
      return;
    }

    // Simulate bot thinking
    setTimeout(() => {
      let replyText = "I'm sorry, I didn't quite catch that. Would you like to speak to a human representative?";
      let action = undefined;
      
      for (const response of BOT_RESPONSES) {
        if (response.keywords.some(kw => lowerText.includes(kw))) {
          replyText = response.reply;
          if (response.action) action = response.action;
          break;
        }
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: replyText, isBot: true, action }]);
    }, 1000);
  };

  const submitLead = async () => {
    if (!leadForm.name || !leadForm.phone) return Alert.alert('Required', 'Please provide at least your name and phone number.');
    try {
      await fetchWithAuth('/leads', {
        method: 'POST',
        body: JSON.stringify({
          ...leadForm,
          source: 'Mobile Chatbot',
          interest: 'General Inquiry'
        })
      });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStep('success');
      setTimeout(() => {
        setStep('chat');
        setLeadForm({ name: '', phone: '', email: '', details: '' });
        onClose();
      }, 3000);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to submit details. Please try again.');
    }
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={s.glowingDot} />
                  <Text style={s.headerSub}>Online</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X color={Colors.fgMuted} size={24} />
            </TouchableOpacity>
          </View>

          {step === 'chat' && (
            <>
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

              <View style={s.quickReplies}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
                  {QUICK_REPLIES.map((qr, i) => (
                    <TouchableOpacity key={i} style={s.qrBtn} onPress={() => handleSend(qr)}>
                      <Text style={s.qrBtnTxt}>{qr}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={s.inputContainer}>
                <TextInput
                  style={s.input}
                  placeholder="Type your message..."
                  placeholderTextColor={Colors.fgDim}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSend()}
                />
                <TouchableOpacity style={[s.sendBtn, !inputText.trim() && { opacity: 0.5 }]} onPress={() => handleSend()} disabled={!inputText.trim()}>
                  <Send color="#fff" size={18} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'lead' && (
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.fgPrimary, marginBottom: 8 }}>Contact Details</Text>
              
              <View>
                <Text style={{ fontSize: 13, color: Colors.fgMuted, marginBottom: 6 }}>Full Name *</Text>
                <TextInput style={s.formInput} placeholder="John Doe" value={leadForm.name} onChangeText={t => setLeadForm({...leadForm, name: t})} />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: Colors.fgMuted, marginBottom: 6 }}>Phone Number *</Text>
                <TextInput style={s.formInput} placeholder="+91 9876543210" keyboardType="phone-pad" value={leadForm.phone} onChangeText={t => setLeadForm({...leadForm, phone: t})} />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: Colors.fgMuted, marginBottom: 6 }}>Email Address</Text>
                <TextInput style={s.formInput} placeholder="john@example.com" keyboardType="email-address" value={leadForm.email} onChangeText={t => setLeadForm({...leadForm, email: t})} />
              </View>
              <View>
                <Text style={{ fontSize: 13, color: Colors.fgMuted, marginBottom: 6 }}>Additional Details</Text>
                <TextInput style={[s.formInput, { height: 80 }]} multiline textAlignVertical="top" placeholder="How can we help you?" value={leadForm.details} onChangeText={t => setLeadForm({...leadForm, details: t})} />
              </View>

              <TouchableOpacity style={s.submitLeadBtn} onPress={submitLead}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>Submit Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ alignSelf: 'center', marginTop: 8 }} onPress={() => setStep('chat')}>
                <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '600' }}>Back to Chat</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {step === 'success' && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <CheckCircle2 color={Colors.success} size={64} style={{ marginBottom: 16 }} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.fgPrimary, marginBottom: 8 }}>Received!</Text>
              <Text style={{ fontSize: 15, color: Colors.fgMuted, textAlign: 'center' }}>Our expert will contact you shortly.</Text>
            </View>
          )}
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
  glowingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, shadowColor: Colors.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
  closeBtn: { padding: 4 },
  msgList: { padding: 20, gap: 16, paddingBottom: 40 },
  msgWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '90%' },
  msgWrapperBot: { alignSelf: 'flex-start', paddingRight: 32 },
  msgWrapperUser: { alignSelf: 'flex-end', justifyContent: 'flex-end', paddingLeft: 32 },
  msgAvatarBot: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  msgAvatarUser: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.fgMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  msgBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, flexShrink: 1 },
  msgBubbleBot: { backgroundColor: Colors.bgCard, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  msgBubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4, elevation: 1, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 22 },
  msgTextBot: { color: Colors.fgPrimary },
  msgTextUser: { color: '#fff' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 10, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: Colors.primaryFaint, borderRadius: 12, gap: 6 },
  actionBtnTxt: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  quickReplies: { paddingVertical: 12, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  qrBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.primaryFaint, borderRadius: 16, borderWidth: 1, borderColor: Colors.primary + '30' },
  qrBtnTxt: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center', gap: 12 },
  input: { flex: 1, backgroundColor: Colors.bgSurface, height: 48, borderRadius: 24, paddingHorizontal: 20, fontSize: 14, color: Colors.fgPrimary, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  formInput: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 48, color: Colors.fgPrimary },
  submitLeadBtn: { backgroundColor: Colors.primary, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 12 }
});
