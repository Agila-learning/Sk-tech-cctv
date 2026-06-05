import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { Camera, Eye } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

const { height } = Dimensions.get('window');

export default function CCTVAnimation({ onComplete }: { onComplete: () => void }) {
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    // Scan line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 1500, easing: Easing.linear, useNativeDriver: true })
      ])
    ).start();

    // Fade out and complete
    setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true
      }).start(() => {
        onComplete();
      });
    }, 2500);
  }, []);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height]
  });

  const scalePulse = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3]
  });

  return (
    <Animated.View style={[s.root, { opacity: opacityAnim }]}>
      <View style={s.overlay} />
      
      <Animated.View style={[s.scanLine, { transform: [{ translateY }] }]} />

      <View style={s.center}>
        <View style={s.lensWrap}>
          <Animated.View style={[s.pulseRing, { transform: [{ scale: scalePulse }], opacity: pulseAnim.interpolate({ inputRange: [0,1], outputRange: [0.5, 0] }) }]} />
          <View style={s.lens}>
            <Camera color={Colors.primary} size={64} />
          </View>
          
          <View style={s.hudTop}>
            <Eye color={Colors.primary} size={14} />
            <Text style={s.hudT}>SYSTEM_AUTH_ACTIVE</Text>
          </View>
          
          <View style={s.hudBot}>
            <Text style={s.initT}>INITIALIZING SECURE TERMINAL</Text>
            <View style={s.loaderBar}>
              <Animated.View style={[s.loaderFill, { opacity: pulseAnim }]} />
            </View>
          </View>
        </View>
      </View>

      <View style={[s.corner, s.tl]} />
      <View style={[s.corner, s.tr]} />
      <View style={[s.corner, s.bl]} />
      <View style={[s.corner, s.br]} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center', position: 'absolute', width: '100%', height: '100%', zIndex: 999 },
  overlay: { position: 'absolute', width: '100%', height: '100%', opacity: 0.1 },
  scanLine: { position: 'absolute', top: 0, left: 0, width: '100%', height: 4, backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 10, zIndex: 10 },
  center: { alignItems: 'center', justifyContent: 'center' },
  lensWrap: { width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: 'rgba(59, 130, 246, 0.3)', alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: '100%', height: '100%', borderRadius: 110, borderWidth: 4, borderColor: Colors.primary },
  lens: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  hudTop: { position: 'absolute', top: -30, flexDirection: 'row', alignItems: 'center', gap: 6 },
  hudT: { color: Colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  hudBot: { position: 'absolute', bottom: -50, alignItems: 'center', gap: 8 },
  initT: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  loaderBar: { width: 100, height: 4, backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: 2, overflow: 'hidden' },
  loaderFill: { width: '100%', height: '100%', backgroundColor: Colors.primary },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: 'rgba(59, 130, 246, 0.5)' },
  tl: { top: 40, left: 30, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: 40, right: 30, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: 40, left: 30, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: 40, right: 30, borderBottomWidth: 2, borderRightWidth: 2 },
});
