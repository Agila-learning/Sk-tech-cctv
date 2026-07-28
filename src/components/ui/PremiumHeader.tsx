import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Bell, Menu, ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerNavigationProp } from '@react-navigation/drawer';

interface PremiumHeaderProps {
  title: string;
  onBackPress?: () => void;
  showBack?: boolean;
  headerRight?: React.ReactNode;
}

export default function PremiumHeader({
  title,
  showBack = false,
  headerRight,
}: PremiumHeaderProps) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: Math.max(insets.top + 10, 20) }]}>
      <View style={s.headerBox}>
        {showBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.btn}>
            <ChevronLeft color={Colors.fgPrimary} size={24} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.dispatch({ type: 'TOGGLE_DRAWER' })} style={s.btn}>
            <Menu color={Colors.fgPrimary} size={24} />
          </TouchableOpacity>
        )}
        
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        
        {headerRight || (
          <View style={{ width: 40 }} />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 100,
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgSurface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: Colors.fgPrimary,
    letterSpacing: 0.5,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  }
});
