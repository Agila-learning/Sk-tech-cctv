import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Linking, Animated } from 'react-native';
import { PhoneCall, X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function InactivityPopup() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  useEffect(() => {
    // Show popup after 2 minutes (120,000 ms) of app being open
    const timer = setTimeout(() => {
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 12
      }).start();
    }, 120000);

    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true
    }).start(() => setVisible(false));
  };

  const openWhatsApp = () => {
    Linking.openURL('https://api.whatsapp.com/send/?phone=919600975483&text=I need help with SK Technology services!&type=phone_number&app_absent=0')
      .catch(e => console.error(e));
    close();
  };

  if (!visible || user?.role !== 'customer') return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <Animated.View style={[s.card, { transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={s.closeBtn} onPress={close}>
            <X color={Colors.fgMuted} size={20} />
          </TouchableOpacity>
          
          <View style={s.iconWrap}>
            <Image 
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg' }} 
              style={{ width: 40, height: 40 }} 
            />
          </View>
          
          <Text style={s.title}>Still waiting?</Text>
          <Text style={s.subtitle}>Have questions or need immediate assistance? Our experts are just a message away.</Text>
          
          <TouchableOpacity style={s.callBtn} onPress={openWhatsApp} activeOpacity={0.8}>
            <PhoneCall color="#fff" size={18} />
            <Text style={s.callBtnTxt}>Call Our Expert</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: Colors.bgCard, borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10 },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 4, zIndex: 10 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#25D36620', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.fgMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 },
  callBtn: { flexDirection: 'row', backgroundColor: '#25D366', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 20, alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' },
  callBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
