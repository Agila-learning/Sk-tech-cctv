import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, TextInput, StatusBar, Image, Animated, Easing, useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, Mail, Lock, CheckCircle2, Circle } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../theme/colors';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import CCTVAnimation from '../../components/auth/CCTVAnimation';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }: any) {
  const { height } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAnimation, setShowAnimation] = useState(true);
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const cardTranslateY = useRef(new Animated.Value(80)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showAnimation) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(heroOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(logoScale, { toValue: 1, tension: 20, friction: 5, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(cardTranslateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(formOpacity, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ]).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(logoFloat, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(logoFloat, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
          ])
        ).start();
      });
    }
  }, [showAnimation]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('Enter email and password'); return; }
    setLoading(true); setError('');
    try { 
      await login(email, password); 
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }, 100);
    } 
    catch (e: any) { setError(e.message || 'Login failed'); } 
    finally { setLoading(false); }
  };

  if (showAnimation) {
    return <CCTVAnimation onComplete={() => setShowAnimation(false)} />;
  }

  const heroHeight = height * 0.35;
  const floatAnim = logoFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* FIXED HERO SECTION */}
      <Animated.View style={[s.fixedHero, { height: heroHeight, opacity: heroOpacity, paddingTop: insets.top + 10 }]}>
        <View style={s.bgTopLeft}>
          <LinearGradient colors={['#1e3a8a', '#3b82f6']} style={{ flex: 1, opacity: 0.9 }} />
        </View>
        <View style={s.wave1} />
        <View style={s.wave2} />
        <View style={s.bgDots}>
          <View style={s.dotPattern} />
        </View>

        <Animated.View style={[s.brand, { transform: [{ scale: logoScale }, { translateY: floatAnim }] }]}>
          <View style={s.logoWrap}>
            <Image source={require('../../../assets/logo.png')} style={s.logoImg} resizeMode="contain" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <CheckCircle2 color="#fff" size={10} />
            <Text style={[s.bTag, { color: '#fff' }]}>NEXT-GEN SURVEILLANCE</Text>
            <CheckCircle2 color="#fff" size={10} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Text style={[s.bSubTag, { color: 'rgba(255,255,255,0.7)' }]}>SMARTER</Text>
            <Text style={[s.bSubTag, { color: 'rgba(255,255,255,0.7)' }]}>•</Text>
            <Text style={[s.bSubTag, { color: 'rgba(255,255,255,0.7)' }]}>SAFER</Text>
            <Text style={[s.bSubTag, { color: 'rgba(255,255,255,0.7)' }]}>•</Text>
            <Text style={[s.bSubTag, { color: 'rgba(255,255,255,0.7)' }]}>RELIABLE</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* SCROLLABLE CONTENT */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, marginTop: heroHeight }}>
        <ScrollView 
          contentContainerStyle={s.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[s.loginCard, { transform: [{ translateY: cardTranslateY }], opacity: formOpacity }]}>
            
            <View style={s.header}>
              <Text style={s.title}>Welcome Back</Text>
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
                <Mail color={Colors.primary} size={20} style={s.iIcon} />
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
                <Lock color={Colors.primary} size={20} style={s.iIcon} />
                <TextInput 
                  style={[s.inp, { paddingRight: 50 }]} 
                  placeholder="Password" 
                  placeholderTextColor={Colors.fgDim} 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry={!showPw} 
                />
                <TouchableOpacity style={s.eye} onPress={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff color={Colors.primary} size={20} /> : <Eye color={Colors.primary} size={20} />}
                </TouchableOpacity>
              </View>

              <View style={s.optionsRow}>
                <TouchableOpacity style={s.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
                  <View style={[s.checkbox, rememberMe && s.checkboxChecked]}>
                    {rememberMe && <CheckCircle2 color="#fff" size={14} />}
                  </View>
                  <Text style={s.rememberText}>Remember Me</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={s.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <View style={s.btnWrap}>
                <TouchableOpacity style={s.loginBtn} onPress={handleLogin} disabled={loading}>
                  <LinearGradient colors={['#2563eb', '#1d4ed8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.loginBtnGradient}>
                    <CheckCircle2 color="#fff" size={20} />
                    <Text style={s.loginBtnText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.foot}>
              <Text style={s.fT}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={s.fL}>Register</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  
  // NEW FIXED HERO STYLES
  fixedHero: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0, justifyContent: 'center', alignItems: 'center' },
  bgTopLeft: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  bgDots: { position: 'absolute', top: 40, right: 30, width: 80, height: 80, opacity: 0.15, zIndex: 0 },
  dotPattern: { width: '100%', height: '100%', backgroundColor: '#fff', borderRadius: 40 }, 
  wave1: { position: 'absolute', top: -50, left: -50, width: 250, height: 250, borderRadius: 125, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', zIndex: 0 },
  wave2: { position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: 200, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', zIndex: 0 },

  brand: { alignItems: 'center', zIndex: 1 },
  logoWrap: { 
    width: 240, 
    height: 100, 
    marginBottom: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  logoImg: { 
    width: '100%', 
    height: '100%',
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  bTag: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  bSubTag: { fontSize: 8, fontWeight: '700', letterSpacing: 1 },

  // NEW SCROLLABLE CARD STYLES
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  loginCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -30, // Slight overlap
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 20,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  
  header: { marginBottom: 30, alignItems: 'center', zIndex: 1 },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 6 },
  sub: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  
  err: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerFaint, borderWidth: 1, borderColor: Colors.dangerBorder, borderRadius: Radius.md, padding: 12, marginBottom: 16, gap: 10, zIndex: 1 },
  errT: { fontSize: 12, fontWeight: '600', color: Colors.danger, flex: 1 },
  
  form: { gap: 16, marginBottom: 40, zIndex: 1 },
  iw: { position: 'relative', justifyContent: 'center' },
  iIcon: { position: 'absolute', left: 20, zIndex: 2 },
  inp: { 
    backgroundColor: '#ffffff', 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0', 
    borderRadius: 16, 
    paddingVertical: 18, 
    paddingLeft: 56, 
    paddingRight: 20, 
    fontSize: 15, 
    fontWeight: '500',
    color: '#0f172a',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  eye: { position: 'absolute', right: 18, zIndex: 2, padding: 4 },
  
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 12, paddingHorizontal: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rememberText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  
  btnWrap: { marginTop: 12 },
  loginBtn: { width: '100%', height: 56, borderRadius: 16, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  loginBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  
  foot: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, paddingBottom: 10, backgroundColor: 'transparent', zIndex: 1 },
  fT: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  fL: { fontSize: 14, color: Colors.primary, fontWeight: '800' },
});
