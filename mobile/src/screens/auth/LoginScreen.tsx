import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, TextInput, StatusBar, Image,
} from 'react-native';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSizes } from '../../theme/colors';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import CCTVAnimation from '../../components/auth/CCTVAnimation';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAnimation, setShowAnimation] = useState(true);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('Enter email and password'); return; }
    setLoading(true); setError('');
    try { await login(email, password); } 
    catch (e: any) { setError(e.message || 'Login failed'); } 
    finally { setLoading(false); }
  };

  if (showAnimation) {
    return <CCTVAnimation onComplete={() => setShowAnimation(false)} />;
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.glow} />
          <View style={s.brand}>
            <View style={s.logoWrap}><Image source={require('../../../assets/logo.png')} style={s.logoImg} resizeMode="contain" /></View>
            <Text style={s.bName}>SK <Text style={s.bAccent}>TECHNOLOGY</Text></Text>
            <Text style={s.bTag}>NEXT-GEN SURVEILLANCE</Text>
          </View>
          <Text style={s.title}>Sign <Text style={{ color: Colors.fgMuted }}>In</Text></Text>
          <Text style={s.sub}>Access your security dashboard</Text>
          {error ? <View style={s.err}><Lock color={Colors.danger} size={14} /><Text style={s.errT}>{error}</Text></View> : null}
          <View style={s.form}>
            <View style={s.iw}><Mail color={Colors.fgMuted} size={18} style={s.iIcon} />
              <TextInput style={s.inp} placeholder="Email Address" placeholderTextColor={Colors.fgDim} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={s.iw}><Lock color={Colors.fgMuted} size={18} style={s.iIcon} />
              <TextInput style={[s.inp, { paddingRight: 50 }]} placeholder="Password" placeholderTextColor={Colors.fgDim} value={password} onChangeText={setPassword} secureTextEntry={!showPw} />
              <TouchableOpacity style={s.eye} onPress={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff color={Colors.fgMuted} size={18} /> : <Eye color={Colors.fgMuted} size={18} />}
              </TouchableOpacity>
            </View>
            <Button title="Login Now" onPress={handleLogin} loading={loading} size="lg" fullWidth icon={!loading ? <ArrowRight color="#fff" size={16} /> : undefined} />
          </View>
          <View style={s.foot}><Text style={s.fT}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}><Text style={s.fL}> Register</Text></TouchableOpacity>
          </View>
          <View style={s.status}><View style={s.dot} /><View><Text style={s.sL}>NETWORK STATUS</Text><Text style={s.sV}>ONLINE_SECURE</Text></View></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 80, paddingBottom: 40, justifyContent: 'center' },
  glow: { position: 'absolute', top: '20%', left: '30%', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(37,99,235,0.08)' },
  brand: { alignItems: 'center', marginBottom: 40 },
  logoWrap: { width: 100, height: 100, borderRadius: 20, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: Colors.borderBlue, padding: 10 },
  logoImg: { width: '100%', height: '100%' },
  bName: { fontSize: 24, fontWeight: '900', color: Colors.fgPrimary },
  bAccent: { color: Colors.primaryLight, fontStyle: 'italic' },
  bTag: { fontSize: 9, fontWeight: '900', color: Colors.fgMuted, letterSpacing: 4, marginTop: 4 },
  title: { fontSize: 40, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 6 },
  sub: { fontSize: 14, color: Colors.fgMuted, fontWeight: '600', marginBottom: 24 },
  err: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerFaint, borderWidth: 1, borderColor: Colors.dangerBorder, borderRadius: 12, padding: 12, marginBottom: 16, gap: 10 },
  errT: { fontSize: 10, fontWeight: '800', color: Colors.danger, textTransform: 'uppercase', letterSpacing: 1, flex: 1 },
  form: { gap: 16, marginBottom: 28 },
  iw: { position: 'relative', justifyContent: 'center' },
  iIcon: { position: 'absolute', left: 18, zIndex: 2 },
  inp: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingVertical: 18, paddingLeft: 50, paddingRight: 20, fontSize: 14, fontWeight: '700', color: Colors.fgPrimary },
  eye: { position: 'absolute', right: 18, zIndex: 2 },
  foot: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
  fT: { fontSize: 10, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1 },
  fL: { fontSize: 10, fontWeight: '800', color: Colors.primaryLight, textTransform: 'uppercase', letterSpacing: 1 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  sL: { fontSize: 8, fontWeight: '900', color: Colors.primaryLight, letterSpacing: 2 },
  sV: { fontSize: 14, fontWeight: '700', color: Colors.fgPrimary, letterSpacing: 2 },
});
