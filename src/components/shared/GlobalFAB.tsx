import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Text, Easing, useWindowDimensions } from 'react-native';
import { Plus, MessageCircle, FileText, X, Navigation, ShieldCheck } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function GlobalFAB() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  if (user?.role !== 'admin' && user?.role !== 'technician') return null;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 6,
      tension: 40,
      useNativeDriver: true
    }).start();
    setIsOpen(!isOpen);
  };

  const handlePress = (route: string) => {
    toggleMenu();
    navigation.navigate(route);
  };

  const adminActions = [
    { label: 'Chat', icon: MessageCircle, route: 'Support Chat' },
    { label: 'QRCodes', icon: Navigation, route: 'QRCodes' },
    { label: 'Warranty', icon: ShieldCheck, route: 'Warranty' },
    { label: 'Contact', icon: FileText, route: 'CustomerContact' }
  ];

  const techActions = [
    { label: 'Chat', icon: MessageCircle, route: 'Chat' },
    { label: 'Tasks', icon: FileText, route: 'Tasks' },
    { label: 'Contact', icon: FileText, route: 'CustomerContact' }
  ];

  const actions = user?.role === 'admin' ? adminActions : techActions;

  return (
    <View style={[styles.container, isDesktop && { right: 40, bottom: 40 }]}>
      {actions.map((action, index) => {
        const translateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -60 * (index + 1)]
        });
        const scale = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1]
        });

        return (
          <Animated.View key={index} style={[styles.actionButtonContainer, { transform: [{ translateY }, { scale }] }]}>
            <Text style={styles.actionLabel}>{action.label}</Text>
            <TouchableOpacity style={styles.actionButton} onPress={() => handlePress(action.route)}>
              <action.icon color="#fff" size={20} />
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      <TouchableOpacity style={styles.fab} onPress={toggleMenu} activeOpacity={0.8}>
        <Animated.View style={{ transform: [{ rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
          <Plus color="#fff" size={28} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 9999
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  },
  actionButtonContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    right: 8,
  },
  actionLabel: {
    backgroundColor: Colors.bgCard,
    color: Colors.fgPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
    fontSize: 12,
    fontWeight: '800',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: 'hidden'
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  }
});
