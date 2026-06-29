import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { User, Mail, Lock, Phone, MapPin, ArrowRight, Shield } from 'lucide-react-native';
import { Colors, Radius } from '../../theme/colors';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.phone) { setError('Fill all required fields'); return; }
    setLoading(true); setError('');
    try { 
      await register(form); 
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }, 100);
    } catch (e: any) { setError(e.message || 'Registration failed'); } finally { setLoading(false); }
  };

  const fields = [
    { key: 'name', placeholder: 'Full Name', icon: <User color={Colors.fgMuted} size={18} />, type: 'default' },
    { key: 'email', placeholder: 'Email Address', icon: <Mail color={Colors.fgMuted} size={18} />, type: 'email-address' },
    { key: 'password', placeholder: 'Password', icon: <Lock color={Colors.fgMuted} size={18} />, type: 'default', secure: true },
    { key: 'phone', placeholder: 'Phone Number', icon: <Phone color={Colors.fgMuted} size={18} />, type: 'phone-pad' },
    { key: 'address', placeholder: 'Address (Optional)', icon: <MapPin color={Colors.fgMuted} size={18} />, type: 'default' },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.brand}><View style={s.logoWrap}><Image source={require('../../../assets/logo.png')} style={s.logoImg} resizeMode="contain" /></View></View>
          <Text style={s.title}>Create <Text style={{ color: Colors.fgMuted }}>Account</Text></Text>
          <Text style={s.sub}>Join SK Technology security network</Text>
          {error ? <View style={s.err}><Text style={s.errT}>{error}</Text></View> : null}
          <View style={s.form}>
            {fields.map(f => (
              <View key={f.key} style={s.iw}>
                <View style={s.iIcon}>{f.icon}</View>
                <TextInput style={s.inp} placeholder={f.placeholder} placeholderTextColor={Colors.fgDim}
                  value={(form as any)[f.key]} onChangeText={t => setForm({ ...form, [f.key]: t })}
                  keyboardType={f.type as any} secureTextEntry={f.secure} autoCapitalize={f.key === 'email' ? 'none' : 'words'} />
              </View>
            ))}
            <Button title="Register" onPress={handleRegister} loading={loading} size="lg" fullWidth icon={!loading ? <ArrowRight color="#fff" size={16} /> : undefined} />
          </View>
          <View style={s.foot}><Text style={s.fT}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.fL}> Sign In</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  brand: { alignItems: 'center', marginBottom: 32 },
  logoWrap: { width: 80, height: 80, borderRadius: 20, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: Colors.borderBlue, padding: 10 },
  logoImg: { width: '100%', height: '100%' },
  title: { fontSize: 36, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 6 },
  sub: { fontSize: 14, color: Colors.fgMuted, fontWeight: '600', marginBottom: 24 },
  err: { backgroundColor: Colors.dangerFaint, borderWidth: 1, borderColor: Colors.dangerBorder, borderRadius: 12, padding: 12, marginBottom: 16 },
  errT: { fontSize: 10, fontWeight: '800', color: Colors.danger, textTransform: 'uppercase', letterSpacing: 1 },
  form: { gap: 14, marginBottom: 24 },
  iw: { position: 'relative', justifyContent: 'center' },
  iIcon: { position: 'absolute', left: 18, zIndex: 2 },
  inp: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingVertical: 16, paddingLeft: 50, paddingRight: 20, fontSize: 14, fontWeight: '700', color: Colors.fgPrimary },
  foot: { flexDirection: 'row', justifyContent: 'center' },
  fT: { fontSize: 10, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1 },
  fL: { fontSize: 10, fontWeight: '800', color: Colors.primaryLight, textTransform: 'uppercase', letterSpacing: 1 },
});
