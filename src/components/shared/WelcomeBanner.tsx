import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Activity, Bell, FileText, Wrench } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

interface WelcomeBannerProps {
  userName?: string;
  role: 'admin' | 'technician' | 'customer';
  tasksCount: number;
  queriesCount: number;
  actionLabel: string;
  onAction: () => void;
}

export default function WelcomeBanner({
  userName,
  role,
  tasksCount,
  queriesCount,
  actionLabel,
  onAction,
}: WelcomeBannerProps) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 40, friction: 7 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  let gradient: readonly [string, string] = Colors.gradientBlue;
  let GreetingIcon = Activity;
  if (role === 'admin') {
    gradient = Colors.gradientPurple;
    GreetingIcon = Bell;
  } else if (role === 'technician') {
    gradient = Colors.gradientEmerald;
    GreetingIcon = Wrench;
  }

  return (
    <Animated.View style={[s.container, { transform: [{ scale: scaleAnim as any }], opacity: opacityAnim as any }]}>
      <LinearGradient colors={gradient} style={s.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.content}>
          <View style={s.header}>
            <View>
              <Text style={s.greeting}>Welcome back,</Text>
              <Text style={s.name} numberOfLines={1}>{userName || 'User'}!</Text>
            </View>
            <View style={s.iconBg}>
              <GreetingIcon color="#fff" size={24} />
            </View>
          </View>
          
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{tasksCount}</Text>
              <Text style={s.statLabel}>{role === 'customer' ? 'Active Orders' : 'Tasks'}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.statBox}>
              <Text style={s.statValue}>{queriesCount}</Text>
              <Text style={s.statLabel}>{role === 'admin' ? 'Open Queries' : role === 'customer' ? 'Tickets' : 'Pending'}</Text>
            </View>
          </View>

          <TouchableOpacity style={s.actionBtn} onPress={onAction} activeOpacity={0.8}>
            <Text style={s.actionBtnTxt}>{actionLabel}</Text>
            <ArrowRight color={Colors.primary} size={16} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  gradient: {
    borderRadius: 24,
    padding: 20,
  },
  content: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '900',
    marginTop: 2,
  },
  iconBg: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnTxt: {
    color: Colors.fgPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
});
