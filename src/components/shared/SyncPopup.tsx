import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { RefreshCw, X, ShieldCheck, CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';

export default function SyncPopup() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const scale = React.useRef(new Animated.Value(0.8)).current;

  const showPopup = (msg: string) => {
    setMessage(msg);
    setVisible(true);
    Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  };

  const closePopup = () => {
    Animated.timing(scale, { toValue: 0.8, duration: 150, useNativeDriver: true }).start(() => {
      setVisible(false);
    });
  };

  useEffect(() => {
    const checkDailyLogin = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const lastLogin = await AsyncStorage.getItem('@last_login_date');
        
        if (lastLogin !== today) {
          showPopup('Welcome Back! Backend data synced successfully for today.');
          await AsyncStorage.setItem('@last_login_date', today);
        }
      } catch (e) {
        console.error('Error checking daily login', e);
      }
    };

    checkDailyLogin();

    // 1 hour = 60 * 60 * 1000 = 3600000ms
    const interval = setInterval(() => {
      showPopup('Hourly Sync Complete: Live backend data updated.');
    }, 3600000);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closePopup}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.popupCard, { transform: [{ scale }] }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={closePopup}>
            <X color={Colors.fgMuted} size={20} />
          </TouchableOpacity>
          
          <View style={styles.iconBg}>
            <RefreshCw color={Colors.primary} size={32} />
          </View>
          
          <Text style={styles.title}>System Sync</Text>
          <Text style={styles.desc}>{message}</Text>
          
          <TouchableOpacity style={styles.btn} onPress={closePopup}>
            <CheckCircle color="#fff" size={18} />
            <Text style={styles.btnTxt}>Acknowledge</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 99999,
  },
  popupCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.fgPrimary,
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: Colors.fgMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    gap: 8,
  },
  btnTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  }
});
