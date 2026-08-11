import React, { useState, useRef, useEffect } from 'react';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { LayoutDashboard, ClipboardList, DollarSign, Clock, User, Bell, LogOut, Radio, MessageCircle, Calendar, Menu, ChevronRight, MapPin, Settings, ShoppingBag, FileText, LogIn, AlignLeft, AlignRight, ShieldCheck, QrCode } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

import DashboardScreen from '../screens/technician/DashboardScreen';
import TasksScreen from '../screens/technician/TasksScreen';
import EarningsScreen from '../screens/technician/EarningsScreen';
import ExpensesScreen from '../screens/technician/ExpensesScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import AttendanceScreen from '../screens/technician/AttendanceScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import AnnouncementsScreen from '../screens/technician/AnnouncementsScreen';
import TechnicianLeaveScreen from '../screens/technician/TechnicianLeaveScreen';
import ManualBillingScreen from '../screens/technician/ManualBillingScreen';
import ServiceTicketsScreen from '../screens/technician/ServiceTicketsScreen';
import WarrantyScreen from '../screens/shared/WarrantyScreen';
import OrderChatScreen from '../screens/shared/OrderChatScreen';
import TechnicianQRCodeCenterScreen from '../screens/technician/TechnicianQRCodeCenterScreen';
import ProductWarrantyScreen from '../screens/shared/ProductWarrantyScreen';
import CustomerContactScreen from '../screens/shared/CustomerContactScreen';
import NotesScreen from '../screens/shared/NotesScreen';
import PremiumHeader from '../components/ui/PremiumHeader';

import { View, Text, StyleSheet, Image, TouchableOpacity, useWindowDimensions, LayoutAnimation, Platform, Pressable, Animated } from 'react-native';

const Drawer = createDrawerNavigator();
const LogoutComponent = () => null;

const CustomDrawerItem = ({ label, icon: Icon, onPress, isActive, isCollapsed, isDesktop, badgeCount }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const hoverAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(hoverAnim, {
      toValue: isActive || isHovered ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isActive, isHovered]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };
  
  const handleHoverIn = () => {
    setIsHovered(true);
    Animated.spring(scaleAnim, { toValue: 1.12, friction: 5, tension: 40, useNativeDriver: true }).start();
  };

  const handleHoverOut = () => {
    setIsHovered(false);
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
  };

  const bgInterpolate = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(37, 99, 235, 0)', 'rgba(37, 99, 235, 0.15)']
  });

  const textTranslateX = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6]
  });

  const iconRotate = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '3deg']
  });

  const pillScaleY = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      style={[ s.itemContainer, isCollapsed && isDesktop && s.itemCollapsedContainer ]}
    >
      {/* Animated Background */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgInterpolate, borderRadius: 14 }]} />

      {/* Left Active Indicator Pill */}
      <Animated.View style={[ s.activePill, { transform: [{ scaleY: pillScaleY }], opacity: hoverAnim } ]} />

      <Animated.View style={[
        s.iconWrapper, 
        { transform: [{ scale: scaleAnim as any }, { rotate: iconRotate }, isHovered && isCollapsed && isDesktop ? { translateX: 4 } : { translateX: 0 }] }
      ]}>
        <Icon color={isActive || isHovered ? Colors.primaryLight : Colors.fgMuted} size={22} fill={isActive ? Colors.primaryLight : 'none'} />
        {(isActive || isHovered) && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.primaryLight, opacity: 0.2, borderRadius: 12, filter: 'blur(8px)' } as any]} />
        )}
      </Animated.View>

      {(!isCollapsed || !isDesktop) && (
        <Animated.View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', transform: [{ translateX: textTranslateX }] }}>
          <Text style={[s.itemLabel, (isActive || isHovered) && s.itemLabelActive, isHovered && { letterSpacing: 0.3 }]}>{label}</Text>
          {badgeCount > 0 && (
            <View style={s.badgeBubble}>
              <Text style={s.badgeBubbleText}>{badgeCount}</Text>
            </View>
          )}
        </Animated.View>
      )}

      {isCollapsed && isDesktop && badgeCount > 0 && (
        <View style={s.badgeBubbleSmall} />
      )}
      
      {isCollapsed && isDesktop && isHovered && (
        <Animated.View style={s.tooltip}>
          <Text style={s.tooltipText}>{label}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
};

const TechnicianHeaderActions = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return (
    <View style={{ zIndex: 9999, marginRight: 16 }}>
      <TouchableOpacity style={s.bellBtn} onPress={() => navigation.navigate('Notifications')}>
        <Bell color={Colors.fgPrimary} size={20} />
        <View style={s.badgeDot} />
      </TouchableOpacity>
    </View>
  );
};

const CustomDrawerContent = (props: any) => {
  const { isCollapsed, setIsCollapsed, isDesktop, navigation, state } = props;

  const routes = [
    { name: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { name: 'Tasks', label: 'Tasks', icon: ClipboardList },
    { name: 'CustomerContact', label: 'Customer Contact', icon: User },
    { name: 'Warranty', label: 'Service Warranty', icon: ShieldCheck },
    { name: 'ProductWarranty', label: 'Product Warranty', icon: ShieldCheck },
    { name: 'QRCodes', label: 'QR Code Center', icon: QrCode },
    { name: 'Notes', label: 'Notes', icon: FileText },
    { name: 'Attendance', label: 'Attendance', icon: Clock },
    { name: 'Expenses', label: 'Expenses', icon: DollarSign },
    { name: 'Notifications', label: 'Notifications', icon: Bell },
    { name: 'Chat', label: 'Chat', icon: MessageCircle },
    { name: 'Manual Billing', label: 'Billing/Quotation', icon: FileText },
    { name: 'Leave Requests', label: 'Leave Request', icon: Calendar },
    { name: 'Earnings', label: 'Earnings', icon: DollarSign },
    { name: 'Announcements', label: 'Announcement', icon: Radio },
    { name: 'Profile', label: 'Profile', icon: User },
  ];

  const handlePress = (route: any) => {
    if (route.name === 'Attendance') {
      import('react-native').then(({ Linking }) => {
        navigation.navigate('Attendance');
      });
      return;
    }
    navigation.navigate(route.name);
    if (!isDesktop) {
      navigation.closeDrawer();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgSurface }}>
      <DrawerContentScrollView {...props}>
        {/* Header & Toggle Button */}
        <View style={[s.headerBox, isCollapsed && isDesktop && s.headerBoxCollapsed]}>
          <TouchableOpacity
            style={s.toggleBtn}
            onPress={() => {
              if (isDesktop) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsCollapsed(!isCollapsed);
              } else {
                navigation.closeDrawer();
              }
            }}
          >
            {isCollapsed ? <AlignRight color={Colors.fgPrimary} size={24} /> : <AlignLeft color={Colors.fgPrimary} size={24} />}
          </TouchableOpacity>
          
          {(!isCollapsed || !isDesktop) && (
            <View style={s.brandRow}>
              <Image source={require('../../assets/logo.png')} style={s.brandLogo} />
              <View style={{ flex: 1 }}>
                <Text style={s.brandTitle}>SK TECHNOLOGY</Text>
                <Text style={s.brandSub}>Technician Portal</Text>
              </View>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={s.menuList}>
          {routes.map((route, index) => {
            const currentRouteName = state.routeNames[state.index];
            const isActive = currentRouteName === route.name;
            return (
              <CustomDrawerItem
                key={route.name}
                label={route.label}
                icon={route.icon}
                isActive={isActive}
                isCollapsed={isCollapsed}
                isDesktop={isDesktop}
                onPress={() => handlePress(route)}
              />
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* Bottom Profile Section */}
      <BottomProfileCard navigation={navigation} isCollapsed={isCollapsed} isDesktop={isDesktop} />
    </View>
  );
};

const BottomProfileCard = ({ navigation, isCollapsed, isDesktop }: any) => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (isCollapsed && isDesktop) {
    return (
      <View style={s.bottomProfileCollapsed}>
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
          <View style={s.avatarCircleSmall}>
            <Text style={s.avatarInitialSmall}>{user?.name ? user.name.charAt(0).toUpperCase() : 'T'}</Text>
          </View>
          <View style={[s.statusDot, { right: -2, bottom: -2 }]} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.bottomProfileContainer}>
      {showMenu && (
        <Animated.View style={s.bottomProfileMenu}>
          <TouchableOpacity style={s.dpItem} onPress={() => { navigation.navigate('Profile'); setShowMenu(false); }}>
            <User color={Colors.fgPrimary} size={18} /><Text style={s.dpItemT}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.dpItem} onPress={() => { navigation.navigate('Settings'); setShowMenu(false); }}>
            <Settings color={Colors.fgPrimary} size={18} /><Text style={s.dpItemT}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.dpItem, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 4 }]} onPress={() => { logout(); setShowMenu(false); }}>
            <LogOut color={Colors.danger} size={18} /><Text style={[s.dpItemT, { color: Colors.danger }]}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      <TouchableOpacity 
        style={s.bottomProfileCard} 
        activeOpacity={0.8}
        onPress={() => setShowMenu(!showMenu)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
          <View>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitial}>{user?.name ? user.name.charAt(0).toUpperCase() : 'T'}</Text>
            </View>
            <View style={s.statusDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName} numberOfLines={1}>{user?.name || 'Technician'}</Text>
            <Text style={s.profileRole}>Technician</Text>
          </View>
        </View>
        <ChevronRight color={Colors.fgMuted} size={18} style={{ transform: [{ rotate: showMenu ? '-90deg' : '0deg' }] }} />
      </TouchableOpacity>
    </View>
  );
};

export default function TechnicianDrawer() {
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const drawerContent = React.useCallback(
    (props: any) => <CustomDrawerContent {...props} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isDesktop={isDesktop} />,
    [isCollapsed, isDesktop]
  );

  return (
    <Drawer.Navigator
      id="TechnicianDrawer"
      drawerContent={drawerContent}
      screenOptions={({ navigation, route }) => ({
        headerShown: true,
        headerTransparent: false,
        header: () => <PremiumHeader title={route.name === 'Dashboard' ? 'Technician Portal' : route.name} headerRight={<TechnicianHeaderActions navigation={navigation} />} />,
        drawerType: isDesktop ? 'permanent' : 'front',
        drawerStyle: { backgroundColor: Colors.bgSurface, width: isDesktop ? (isCollapsed ? 80 : 280) : 280 },
        overlayColor: 'rgba(0,0,0,0.5)',
      })}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Tasks" component={TasksScreen} />
      <Drawer.Screen name="CustomerContact" component={CustomerContactScreen} />
      <Drawer.Screen name="Warranty" component={WarrantyScreen} />
      <Drawer.Screen name="ProductWarranty" component={ProductWarrantyScreen} />
      <Drawer.Screen name="QRCodes" component={TechnicianQRCodeCenterScreen} />
      <Drawer.Screen name="Notes" component={NotesScreen} />
      <Drawer.Screen name="Attendance" component={AttendanceScreen} />
      <Drawer.Screen name="Expenses" component={ExpensesScreen} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
      <Drawer.Screen name="Chat" component={ChatScreen} />
      <Drawer.Screen name="Manual Billing" component={ManualBillingScreen} />
      <Drawer.Screen name="Leave Requests" component={TechnicianLeaveScreen} />
      <Drawer.Screen name="Earnings" component={EarningsScreen} />
      <Drawer.Screen name="Announcements" component={AnnouncementsScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Logout" component={LogoutComponent} listeners={{ focus: () => { logout(); } }} />
    </Drawer.Navigator>
  );
}


const s = StyleSheet.create({
  headerBox: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgSurface },
  headerBoxCollapsed: { alignItems: 'center', paddingHorizontal: 0 },
  toggleBtn: { padding: 8, marginBottom: 16, alignSelf: 'flex-start' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  brandLogo: { width: 44, height: 44, borderRadius: 12, resizeMode: 'contain', backgroundColor: Colors.primaryFaint },
  brandTitle: { fontSize: 18, fontWeight: '900', color: Colors.primaryLight, letterSpacing: -0.5 },
  brandSub: { fontSize: 11, color: Colors.fgMuted, fontWeight: '700' },
  menuList: { paddingHorizontal: 12, paddingVertical: 16, gap: 8 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, gap: 14 },
  itemCollapsedContainer: { justifyContent: 'center', paddingHorizontal: 0 },
  itemActive: {},
  iconWrapper: { alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 14, fontWeight: '700', color: Colors.fgSecondary },
  itemLabelActive: { color: Colors.primaryLight, fontWeight: '800' },
  activePill: { position: 'absolute', left: 0, top: '15%', height: '70%', width: 4, borderRadius: 999, backgroundColor: Colors.primaryLight, shadowColor: Colors.primaryLight, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
  tooltip: { position: 'absolute', left: 76, backgroundColor: Colors.fgPrimary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, zIndex: 1000, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  tooltipText: { color: Colors.bgCard, fontSize: 13, fontWeight: '800' },
  badgeBubble: { backgroundColor: Colors.danger, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginLeft: 'auto' },
  badgeBubbleText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  badgeBubbleSmall: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.danger, borderWidth: 2, borderColor: Colors.bgSurface },
  topDropdownPanel: { position: 'absolute', top: 48, right: 0, width: 240, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, padding: 16, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, zIndex: 99999 },
  headerAvatarContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  headerAvatarName: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary },
  topAuthBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryFaint, borderWidth: 1, borderColor: Colors.primary, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  topAuthBtnT: { fontSize: 13, fontWeight: '800', color: Colors.primaryLight },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 15, fontWeight: '900', color: Colors.primaryLight },
  dpItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  dpItemT: { fontSize: 14, fontWeight: '700', color: Colors.fgPrimary },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  badgeDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger },
  bottomProfileContainer: { padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'transparent' },
  bottomProfileCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', overflow: 'hidden' },
  profileName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  profileRole: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600' },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  bottomProfileMenu: { backgroundColor: Colors.bgSurface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  bottomProfileCollapsed: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border },
  avatarCircleSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitialSmall: { fontSize: 14, fontWeight: '900', color: Colors.primaryLight }
});
