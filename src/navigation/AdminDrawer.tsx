import React, { useState, useRef, useEffect } from 'react';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { LayoutDashboard, Clock, ShoppingBag, Users, Package, ClipboardList, Activity, Calendar, Hammer, UserCheck, IndianRupee, CreditCard, Layers, Map, Star, BarChart2, LogOut, Folder, UserPlus, Bell, LifeBuoy, MessageCircle, Megaphone, Menu, ChevronRight, User, MapPin, Settings, FileText, LogIn, AlignLeft, AlignRight, Moon, ShieldCheck, Briefcase, QrCode } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../api/client';

import AdminDashScreen from '../screens/admin/DashboardScreen';
import AdminExpensesScreen from '../screens/admin/AdminExpensesScreen';
import AdminOrdersScreen from '../screens/admin/OrdersScreen';
import TechniciansScreen from '../screens/admin/TechniciansScreen';
import AdminProductsScreen from '../screens/admin/ProductsScreen';
import AdminTasksScreen from '../screens/admin/TasksScreen';
import AdminAttendanceScreen from '../screens/admin/AdminAttendanceScreen';
import QuotationsScreen from '../screens/admin/QuotationsScreen';
import AdminLeaveScreen from '../screens/admin/AdminLeaveScreen';
import ServiceRequestsScreen from '../screens/admin/WarrantyClaimsScreen';
import AvailabilityScreen from '../screens/admin/AvailabilityScreen';
import BillingScreen from '../screens/admin/BillingScreen';
import SalaryScreen from '../screens/admin/SalaryScreen';
import MarketingScreen from '../screens/admin/MarketingScreen';
import TrackingScreen from '../screens/admin/TrackingScreen';
import ReviewsScreen from '../screens/admin/ReviewsScreen';
import CustomersScreen from '../screens/admin/CustomersScreen';
import CategoriesScreen from '../screens/admin/CategoriesScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import AdminTicketsScreen from '../screens/admin/AdminTicketsScreen';
import AdminChatListScreen from '../screens/admin/AdminChatListScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import AnnouncementsScreen from '../screens/admin/AnnouncementsScreen';
import ManualBillingScreen from '../screens/admin/ManualBillingScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import WarrantyScreen from '../screens/shared/WarrantyScreen';
import ProductWarrantyScreen from '../screens/shared/ProductWarrantyScreen';
import CustomerContactScreen from '../screens/shared/CustomerContactScreen';
import NotesScreen from '../screens/shared/NotesScreen';
import OrderChatScreen from '../screens/shared/OrderChatScreen';
import RevenueScreen from '../screens/admin/RevenueScreen';
import QRCodeCenterScreen from '../screens/admin/QRCodeCenterScreen';
import QRCodeFormScreen from '../screens/admin/QRCodeFormScreen';
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

const AdminHeaderProfile = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();

  return (
    <View style={{ zIndex: 9999, marginRight: 16 }}>
      {!isAuthenticated ? (
        <TouchableOpacity style={s.topAuthBtn} onPress={() => navigation.navigate('Login')}>
          <LogIn color={Colors.primaryLight} size={20} />
          <Text style={s.topAuthBtnT}>Login</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.bellBtn} onPress={() => navigation.navigate('Notifications')}>
          <Bell color={Colors.fgPrimary} size={20} />
          <View style={s.badgeDot} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const CustomDrawerContent = (props: any) => {
  const { isCollapsed, setIsCollapsed, isDesktop, navigation, state } = props;
  const { user, logout } = useAuth();
  const [badges, setBadges] = useState({ unreadChats: 0, pendingOrders: 0, openTickets: 0 });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const data = await fetchWithAuth('/admin/badges');
        if (data) setBadges(data);
      } catch (e) { console.error('Error fetching badges', e); }
    };
    fetchBadges();
    // Live backend data sync every 1 hour (3600000 ms)
    const interval = setInterval(fetchBadges, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

    const routes = [
    { name: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { name: 'Orders', label: 'Orders', icon: ShoppingBag, badge: badges.pendingOrders },
    { name: 'Warranty', label: 'Service Warranty', icon: ShieldCheck },
    { name: 'ProductWarranty', label: 'Product Warranty', icon: ShieldCheck },
    { name: 'Customers', label: 'Customers', icon: UserPlus },
    { name: 'CustomerContact', label: 'Customer Contact', icon: Users },
    { name: 'Notes', label: 'Notes', icon: FileText },
    { name: 'Technicians', label: 'Technicians', icon: Users },
    { name: 'Categories', label: 'Categories', icon: Folder },
    { name: 'Products', label: 'Products', icon: Package },
    { name: 'Tasks', label: 'Tasks', icon: ClipboardList },
    { name: 'Tracking', label: 'Tracking', icon: Map },
    { name: 'Revenue', label: 'Revenue', icon: BarChart2 },
    { name: 'QRCodes', label: 'QR Codes', icon: QrCode },
    { name: 'Announcements', label: 'Announcements', icon: Megaphone },
    { name: 'Expenses', label: 'Expenses', icon: Clock },
    { name: 'Attendance', label: 'Attendance', icon: Activity },
    { name: 'Quotations', label: 'Quotations', icon: ClipboardList },
    { name: 'Leaves', label: 'Leaves', icon: Calendar },
    { name: 'Service Requests', label: 'Service Requests', icon: Hammer },
    { name: 'Support Tickets', label: 'Support Tickets', icon: LifeBuoy, badge: badges.openTickets },
    { name: 'Support Chat', label: 'Support Chat', icon: MessageCircle, badge: badges.unreadChats },
    { name: 'Availability', label: 'Availability', icon: UserCheck },
    { name: 'Billing', label: 'Billing', icon: IndianRupee },
    { name: 'Salary', label: 'Salary', icon: CreditCard },
    { name: 'Marketing', label: 'Marketing', icon: Layers },
    { name: 'Reviews', label: 'Reviews', icon: Star },
    { name: 'Notifications', label: 'Notifications', icon: Bell },
  ];

  const handlePress = (route: any) => {
    if (route.name === 'Attendance') {
      import('react-native').then(({ Linking }) => {
        navigation.navigate('AdminAttendance');
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
                navigation.toggleDrawer();
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
                <Text style={s.brandSub}>Admin Hub</Text>
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
                badgeCount={route.badge}
                isCollapsed={isCollapsed}
                isDesktop={isDesktop}
                onPress={() => handlePress(route)}
              />
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* Bottom Profile Section */}
      <View style={[s.bottomProfileWrapper, isCollapsed && isDesktop && s.bottomProfileCollapsed]}>
        {!isCollapsed || !isDesktop ? (
          <TouchableOpacity style={s.bottomProfileBtn} onPress={() => navigation.navigate('Profile')}>
            <View style={s.bottomAvatar}>
              <Text style={s.bottomAvatarT}>{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.bottomName} numberOfLines={1}>{user?.name || 'Admin'}</Text>
              <Text style={s.bottomRole}>Administrator</Text>
            </View>
            <TouchableOpacity onPress={() => logout()} style={s.bottomLogoutBtn}>
              <LogOut color={Colors.danger} size={20} />
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.bottomAvatarCollapsed} onPress={() => navigation.navigate('Profile')}>
            <Text style={s.bottomAvatarT}>{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function AdminDrawer() {
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <Drawer.Navigator
      id="AdminDrawer"
      drawerContent={props => <CustomDrawerContent {...props} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isDesktop={isDesktop} />}
      screenOptions={({ navigation, route }) => ({
        headerShown: true,
        headerTransparent: false,
        header: () => <PremiumHeader title={route.name === 'AdminDashboard' ? 'Admin Portal' : route.name} headerRight={<AdminHeaderProfile navigation={navigation} />} />,
        drawerType: isDesktop ? 'permanent' : 'front',
        drawerStyle: { backgroundColor: Colors.bgSurface, width: isDesktop ? (isCollapsed ? 80 : 280) : 280 },
        overlayColor: 'rgba(0,0,0,0.5)',
      })}
    >
      <Drawer.Screen name="Dashboard" component={AdminDashScreen} />
      <Drawer.Screen name="Orders" component={AdminOrdersScreen} />
      <Drawer.Screen name="Manual Billing" component={ManualBillingScreen} />
      <Drawer.Screen name="Warranty" component={WarrantyScreen} />
      <Drawer.Screen name="ProductWarranty" component={ProductWarrantyScreen} />
      <Drawer.Screen name="CustomerContact" component={CustomerContactScreen} />
      <Drawer.Screen name="Notes" component={NotesScreen} />
      <Drawer.Screen name="OrderChat" component={OrderChatScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Customers" component={CustomersScreen} />
      <Drawer.Screen name="Technicians" component={TechniciansScreen} />
      <Drawer.Screen name="Categories" component={CategoriesScreen} />
      <Drawer.Screen name="Products" component={AdminProductsScreen} />
      <Drawer.Screen name="Tasks" component={AdminTasksScreen} />
      <Drawer.Screen name="Tracking" component={TrackingScreen} />
      <Drawer.Screen name="Announcements" component={AnnouncementsScreen} />
      <Drawer.Screen name="QRCodes" component={QRCodeCenterScreen} />
      <Drawer.Screen name="QRCodeForm" component={QRCodeFormScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      
      <Drawer.Screen name="Revenue" component={RevenueScreen} />
      <Drawer.Screen name="Expenses" component={AdminExpensesScreen} />
      <Drawer.Screen name="Attendance" component={AdminAttendanceScreen} />
      <Drawer.Screen name="Quotations" component={QuotationsScreen} />
      <Drawer.Screen name="Leaves" component={AdminLeaveScreen} />
      <Drawer.Screen name="Service Requests" component={ServiceRequestsScreen} />
      <Drawer.Screen name="Support Tickets" component={AdminTicketsScreen} />
      <Drawer.Screen name="Support Chat" component={AdminChatListScreen} />
      <Drawer.Screen name="ChatScreen" component={ChatScreen} />
      <Drawer.Screen name="OrderChatScreen" component={OrderChatScreen} />
      <Drawer.Screen name="Availability" component={AvailabilityScreen} />
      <Drawer.Screen name="Billing" component={BillingScreen} />
      <Drawer.Screen name="Salary" component={SalaryScreen} />
      <Drawer.Screen name="Marketing" component={MarketingScreen} />
      <Drawer.Screen name="Reviews" component={ReviewsScreen} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
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
  sectionTitle: { fontSize: 11, fontWeight: '900', color: Colors.fgDim, marginTop: 16, marginBottom: 8, paddingHorizontal: 20, letterSpacing: 1, textTransform: 'uppercase' },
  tooltip: { position: 'absolute', left: 76, backgroundColor: Colors.fgPrimary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, zIndex: 1000, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  tooltipText: { color: Colors.bgCard, fontSize: 13, fontWeight: '800' },
  topDropdownPanel: { position: 'absolute', top: 48, right: 0, width: 240, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, padding: 16, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, zIndex: 99999 },
  headerAvatarContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  headerAvatarName: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary },
  topAuthBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryFaint, borderWidth: 1, borderColor: Colors.primary, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  topAuthBtnT: { fontSize: 13, fontWeight: '800', color: Colors.primaryLight },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 15, fontWeight: '900', color: Colors.primaryLight },
  dpItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  dpItemT: { fontSize: 14, fontWeight: '700', color: Colors.fgPrimary },
  profileInfoCard: { backgroundColor: Colors.bgSurface, padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  profileInfoLabel: { fontSize: 11, color: Colors.fgMuted, fontWeight: '700', textTransform: 'uppercase' },
  profileInfoValue: { fontSize: 15, color: Colors.fgPrimary, fontWeight: '900', marginTop: 2 },
  themeToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 4 },
  activeIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  badgeDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger },
  badgeBubble: { backgroundColor: Colors.danger, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginLeft: 'auto' },
  badgeBubbleText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  badgeBubbleSmall: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.danger, borderWidth: 2, borderColor: Colors.bgSurface },
  bottomProfileWrapper: { borderTopWidth: 1, borderTopColor: Colors.border, padding: 16, backgroundColor: Colors.bgSurface },
  bottomProfileCollapsed: { alignItems: 'center', paddingHorizontal: 0 },
  bottomProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bottomAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  bottomAvatarCollapsed: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  bottomAvatarT: { fontSize: 16, fontWeight: '900', color: Colors.primaryLight },
  bottomName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  bottomRole: { fontSize: 11, fontWeight: '700', color: Colors.fgMuted },
  bottomLogoutBtn: { padding: 8, backgroundColor: Colors.danger + '15', borderRadius: 12 },
});
