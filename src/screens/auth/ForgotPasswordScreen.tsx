import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Button } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your registered email address.');
    
    try {
      setLoading(true);
      await fetchWithAuth('/auth/forgot-password', { 
        method: 'POST', 
        body: JSON.stringify({ email }) 
      });
      setIsSent(true);
      Alert.alert('Success', 'A 6-digit verification code has been sent to your email address.', [
        { text: 'Enter Code', onPress: () => navigation.navigate('ResetPassword', { email }) }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || e.message || 'Failed to request password reset');
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
            <Text style={s.title}>Reset Password</Text>
            <Text style={s.subtitle}>
              {isSent 
                ? "We've sent a secure reset link to your email. Please check your inbox."
                : "Enter your registered email address and we will send you instructions to reset your password."}
            </Text>
          </View>

          {!isSent ? (
            <View style={s.form}>
              <View style={s.inputWrapper}>
                <Mail color={Colors.fgMuted} size={20} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Email Address"
                  placeholderTextColor={Colors.fgDim}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <Button
                title={loading ? "Verifying..." : "Send Reset Link"}
                onPress={handleReset}
                size="lg"
                disabled={loading}
                style={{ marginTop: 10 }}
              />
            </View>
          ) : (
            <View style={s.form}>
              <Button
                title="Return to Login"
                onPress={() => navigation.goBack()}
                size="lg"
                variant="secondary"
              />
            </View>
          )}
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
