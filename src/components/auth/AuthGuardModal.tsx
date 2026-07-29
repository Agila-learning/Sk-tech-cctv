import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Lock, X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';

interface AuthGuardModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function AuthGuardModal({ visible, onClose, title = "Sign in Required", subtitle = "Please login or create an account to access this feature." }: AuthGuardModalProps) {
  const navigation = useNavigation<any>();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.card}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <X color={Colors.fgMuted} size={20} />
          </TouchableOpacity>
          
          <View style={s.iconWrap}>
            <Lock color={Colors.primary} size={32} />
          </View>
          
          <Text style={s.title}>{title}</Text>
          <Text style={s.subtitle}>{subtitle}</Text>
          
          <View style={s.btnGroup}>
            <TouchableOpacity style={s.primaryBtn} onPress={() => { onClose(); navigation.navigate('Login'); }} activeOpacity={0.8}>
              <Text style={s.primaryBtnTxt}>Login</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={s.secondaryBtn} onPress={() => { onClose(); navigation.navigate('Register'); }} activeOpacity={0.8}>
              <Text style={s.secondaryBtnTxt}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: Colors.bgCard, borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10 },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 4, zIndex: 10 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.fgMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 },
  btnGroup: { width: '100%', gap: 12 },
  primaryBtn: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 20, alignItems: 'center', width: '100%' },
  primaryBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryBtn: { backgroundColor: Colors.bgMuted, paddingVertical: 14, borderRadius: 20, alignItems: 'center', width: '100%' },
  secondaryBtnTxt: { color: Colors.fgPrimary, fontSize: 15, fontWeight: '800' }
});
