// ResetPasswordScreen Component
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Lock, Key, ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Button } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const email = route?.params?.email || '';
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!otp.trim()) return Alert.alert('Error', 'Please enter the 6-digit verification code.');
    if (!password || password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters long.');
    if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match.');

    try {
      setLoading(true);
      const res = await fetchWithAuth(`/auth/reset-password/${otp.trim()}`, { 
        method: 'POST', 
        body: JSON.stringify({ password }) 
      });
      Alert.alert('Success', res.message || 'Your password has been successfully reset!', [
        { text: 'Login Now', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || e.message || 'Failed to reset password. Check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft color={Colors.fgPrimary} size={24} />
          </TouchableOpacity>

          <View style={s.header}>
            <View style={s.iconWrap}>
              <ShieldCheck color={Colors.primary} size={40} />
            </View>
            <Text style={s.title}>Enter Verification Code</Text>
            <Text style={s.subtitle}>
              We sent a 6-digit verification code to {email}. Enter the code below along with your new password.
            </Text>
          </View>

          <View style={s.form}>
            <View style={s.inputWrapper}>
              <Key color={Colors.fgMuted} size={20} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="6-Digit Verification Code"
                placeholderTextColor={Colors.fgDim}
                value={otp}
                onChangeText={setOtp}
                autoCapitalize="none"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={s.inputWrapper}>
              <Lock color={Colors.fgMuted} size={20} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="New Password"
                placeholderTextColor={Colors.fgDim}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={s.inputWrapper}>
              <Lock color={Colors.fgMuted} size={20} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Confirm New Password"
                placeholderTextColor={Colors.fgDim}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <Button
              title={loading ? "Resetting Password..." : "Reset Password"}
              onPress={handleResetPassword}
              size="lg"
              disabled={loading}
              style={{ marginTop: 10 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 40, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.fgSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  form: { gap: 16 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: Colors.fgPrimary, fontSize: 16, height: '100%' },
});
