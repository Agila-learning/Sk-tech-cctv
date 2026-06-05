import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, TextInput, StatusBar, Image,
} from 'react-native';
import { Eye, EyeOff, Mail, Lock, CheckCircle2, Circle } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSizes } from '../../theme/colors';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import CCTVAnimation from '../../components/auth/CCTVAnimation';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          
          <View style={s.brand}>
            <View style={s.logoWrap}>
              <Image source={require('../../../assets/logo.png')} style={s.logoImg} resizeMode="contain" />
            </View>
            <Text style={s.bName}>SK Technology</Text>
            <Text style={s.bNameSub}>CCTV SOLUTIONS</Text>
            <Text style={s.bTag}>NEXT-GEN SURVEILLANCE</Text>
          </View>

          <View style={s.header}>
            <Text style={s.title}>Sign In</Text>
            <Text style={s.sub}>Access your security dashboard</Text>
          </View>
          
          {error ? (
            <View style={s.err}>
              <Lock color={Colors.danger} size={14} />
              <Text style={s.errT}>{error}</Text>
            </View>
          ) : null}

          <View style={s.form}>
            <View style={s.iw}>
              <Mail color={Colors.fgDim} size={20} style={s.iIcon} />
              <TextInput 
                style={s.inp} 
                placeholder="Email Address" 
                placeholderTextColor={Colors.fgDim} 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoCapitalize="none" 
              />
            </View>
            
            <View style={s.iw}>
              <Lock color={Colors.fgDim} size={20} style={s.iIcon} />
              <TextInput 
                style={[s.inp, { paddingRight: 50 }]} 
                placeholder="Password" 
                placeholderTextColor={Colors.fgDim} 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={!showPw} 
              />
              <TouchableOpacity style={s.eye} onPress={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff color={Colors.fgDim} size={20} /> : <Eye color={Colors.fgDim} size={20} />}
              </TouchableOpacity>
            </View>

            <View style={s.optionsRow}>
              <TouchableOpacity style={s.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
                {rememberMe ? (
                  <CheckCircle2 color={Colors.fgDim} size={18} />
                ) : (
                  <Circle color={Colors.borderLight} size={18} />
                )}
                <Text style={s.rememberText}>Remember Me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={s.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={s.btnWrap}>
              <Button 
                title="Sign In" 
                onPress={handleLogin} 
                loading={loading} 
                size="lg" 
                fullWidth 
                style={{ borderRadius: 12 }} 
                textStyle={{ textTransform: 'none', fontSize: 16, letterSpacing: 0, fontWeight: '600' }} 
              />
            </View>
          </View>

          <View style={s.foot}>
            <Text style={s.fT}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.fL}>Register</Text>
            </TouchableOpacity>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafafa' },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40, justifyContent: 'center' },
  
  brand: { alignItems: 'center', marginBottom: 50 },
  logoWrap: { width: 110, height: 110, marginBottom: 8, justifyContent: 'center', alignItems: 'center' },
  logoImg: { width: '100%', height: '100%' },
  bName: { fontSize: 20, fontWeight: '800', color: '#092a54', letterSpacing: -0.5 },
  bNameSub: { fontSize: 13, fontWeight: '800', color: '#092a54', letterSpacing: 0.5, marginTop: -2 },
  bTag: { fontSize: 9, fontWeight: '600', color: Colors.fgDim, letterSpacing: 3, marginTop: 12 },
  
  header: { marginBottom: 30, alignItems: 'flex-start' },
  title: { fontSize: 32, fontWeight: '700', color: '#2d3748', marginBottom: 8 },
  sub: { fontSize: 15, color: '#718096', fontWeight: '500' },
  
  err: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerFaint, borderWidth: 1, borderColor: Colors.dangerBorder, borderRadius: Radius.md, padding: 12, marginBottom: 16, gap: 10 },
  errT: { fontSize: 12, fontWeight: '600', color: Colors.danger, flex: 1 },
  
  form: { gap: 16, marginBottom: 40 },
  iw: { position: 'relative', justifyContent: 'center' },
  iIcon: { position: 'absolute', left: 18, zIndex: 2 },
  inp: { 
    backgroundColor: '#ffffff', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 16, 
    paddingVertical: 18, 
    paddingLeft: 52, 
    paddingRight: 20, 
    fontSize: 15, 
    color: Colors.fgPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  eye: { position: 'absolute', right: 18, zIndex: 2, padding: 4 },
  
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 12, paddingHorizontal: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rememberText: { fontSize: 14, color: '#718096', fontWeight: '500' },
  forgotText: { fontSize: 14, color: '#2563eb', fontWeight: '500' },
  
  btnWrap: { marginTop: 8 },
  
  foot: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto' },
  fT: { fontSize: 15, color: '#718096', fontWeight: '500' },
  fL: { fontSize: 15, color: '#2563eb', fontWeight: '500' },
});
