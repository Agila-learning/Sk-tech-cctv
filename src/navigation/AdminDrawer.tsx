import React, { useState } from 'react';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { LayoutDashboard, Clock, ShoppingBag, Users, Package, ClipboardList, Activity, Calendar, Hammer, UserCheck, IndianRupee, CreditCard, Layers, Map, Star, BarChart2, LogOut, Folder, UserPlus, Bell, LifeBuoy, MessageCircle, Megaphone, Menu, ChevronRight, User, MapPin, Settings, FileText, LogIn, AlignLeft, AlignRight, Moon, ShieldCheck } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

import AdminDashScreen from '../screens/admin/DashboardScreen';
import AdminExpensesScreen from '../screens/admin/AdminExpensesScreen';
import AdminOrdersScreen from '../screens/admin/OrdersScreen';
import TechniciansScreen from '../screens/admin/TechniciansScreen';
import AdminProductsScreen from '../screens/admin/ProductsScreen';
import AdminTasksScreen from '../screens/admin/TasksScreen';
import AdminAttendanceScreen from '../screens/admin/AttendanceScreen';
import AdminLeaveScreen from '../screens/admin/AdminLeaveScreen';
import ServiceRequestsScreen from '../screens/admin/ServiceRequestsScreen';
import AvailabilityScreen from '../screens/admin/AvailabilityScreen';
import BillingScreen from '../screens/admin/BillingScreen';
import SalaryScreen from '../screens/admin/SalaryScreen';
import MarketingScreen from '../screens/admin/MarketingScreen';
import TrackingScreen from '../screens/admin/TrackingScreen';
import ReviewsScreen from '../screens/admin/ReviewsScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import CustomersScreen from '../screens/admin/CustomersScreen';
import CategoriesScreen from '../screens/admin/CategoriesScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import AdminTicketsScreen from '../screens/admin/AdminTicketsScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import AnnouncementsScreen from '../screens/admin/AnnouncementsScreen';
import ManualBillingScreen from '../screens/admin/ManualBillingScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import WarrantyScreen from '../screens/shared/WarrantyScreen';
import OrderChatScreen from '../screens/shared/OrderChatScreen';
import { View, Text, StyleSheet, Image, TouchableOpacity, useWindowDimensions, LayoutAnimation, Platform, Pressable, Animated } from 'react-native';

const Drawer = createDrawerNavigator();
const LogoutComponent = () => null;

const CustomDrawerItem = ({ label, icon: Icon, onPress, isActive, isCollapsed, isDesktop }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[
        s.itemContainer,
        isActive && s.itemActive,
        isCollapsed && isDesktop && s.itemCollapsedContainer
      ]}
    >
      <View style={[s.iconWrapper, isHovered && isCollapsed && isDesktop && { transform: [{ translateX: 4 }] }]}>
        <Icon color={isActive ? Colors.primaryLight : Colors.fgMuted} size={22} />
      </View>
      {(!isCollapsed || !isDesktop) && (
        <Text style={[s.itemLabel, isActive && s.itemLabelActive]}>{label}</Text>
      )}
      {isCollapsed && isDesktop && isHovered && (
        <View style={s.tooltip}>
          <Text style={s.tooltipText}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
};

const AdminHeaderProfile = ({ navigation }: any) => {
  const { isAuthenticated, logout, user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <View style={{ zIndex: 9999, marginRight: 16 }}>
      {!isAuthenticated ? (
        <TouchableOpacity style={s.topAuthBtn} onPress={() => navigation.navigate('Login')}>
          <LogIn color={Colors.primaryLight} size={20} />
          <Text style={s.topAuthBtnT}>Login</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity style={s.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Bell color={Colors.fgPrimary} size={20} />
            <View style={s.badgeDot} />
          </TouchableOpacity>
          <View>
            <TouchableOpacity style={s.headerAvatarContainer} onPress={() => setShowProfileMenu(!showProfileMenu)}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarInitial}>{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</Text>
              </View>
              <Text style={s.headerAvatarName}>{user?.name || 'Admin'}</Text>
              <ChevronRight color={Colors.fgMuted} size={16} style={{ transform: [{ rotate: showProfileMenu ? '90deg' : '0deg' }] }} />
            </TouchableOpacity>

            {showProfileMenu && (
            <View style={s.topDropdownPanel}>
              <View style={s.profileInfoCard}>
                <Text style={s.profileInfoLabel}>Name</Text>
                <Text style={s.profileInfoValue}>{user?.name || 'Admin Official'}</Text>
                <Text style={[s.profileInfoLabel, { marginTop: 10 }]}>Phone Number</Text>
                <Text style={s.profileInfoValue}>{user?.phone || '+91 96009 75483'}</Text>
              </View>

              <TouchableOpacity style={s.dpItem} onPress={() => { navigation.navigate('Profile'); setShowProfileMenu(false); }}>
                <User color={Colors.primaryLight} size={18} /><Text style={s.dpItemT}>Edit Profile</Text>
              </TouchableOpacity>

              <View style={s.themeToggleRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Moon color={Colors.primaryLight} size={18} />
                  <Text style={s.dpItemT}>Dark Theme</Text>
                </View>
                <View style={s.activeIndicator} />
              </View>

              <TouchableOpacity style={[s.dpItem, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 4 }]} onPress={() => { logout(); setShowProfileMenu(false); }}>
                <LogOut color={Colors.danger} size={18} /><Text style={[s.dpItemT, { color: Colors.danger }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      )}
    </View>
  );
};

const CustomDrawerContent = (props: any) => {
  const { isCollapsed, setIsCollapsed, isDesktop, navigation, state } = props;

    const routes = [
    { name: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { name: 'Orders', label: 'Orders', icon: ShoppingBag },
    { name: 'Manual Billing', label: 'Manual Billing', icon: IndianRupee },
    { name: 'Warranty', label: 'Warranty Management', icon: ShieldCheck },
    { name: 'Customers', label: 'Customers', icon: UserPlus },
    { name: 'Technicians', label: 'Technicians', icon: Users },
    { name: 'Categories', label: 'Categories', icon: Folder },
    { name: 'Products', label: 'Products', icon: Package },
    { name: 'Tasks', label: 'Tasks', icon: ClipboardList },
    { name: 'Tracking', label: 'Tracking', icon: Map },
    { name: 'Announcements', label: 'Announcements', icon: Megaphone },
    { name: 'Expenses', label: 'Expenses', icon: Clock },
    { name: 'Attendance', label: 'Attendance', icon: Activity },
    { name: 'Leaves', label: 'Leaves', icon: Calendar },
    { name: 'Service Requests', label: 'Service Requests', icon: Hammer },
    { name: 'Support Tickets', label: 'Support Tickets', icon: LifeBuoy },
    { name: 'Support Chat', label: 'Support Chat', icon: MessageCircle },
    { name: 'Availability', label: 'Availability', icon: UserCheck },
    { name: 'Billing', label: 'Billing', icon: IndianRupee },
    { name: 'Salary', label: 'Salary', icon: CreditCard },
    { name: 'Marketing', label: 'Marketing', icon: Layers },
    { name: 'Reviews', label: 'Reviews', icon: Star },
    { name: 'Reports', label: 'Reports', icon: BarChart2 },
    { name: 'Notifications', label: 'Notifications', icon: Bell },
  ];

  const handlePress = (route: any) => {
    navigation.navigate(route.name);
    if (!isDesktop) {
      navigation.closeDrawer();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgSurface }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
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
                isCollapsed={isCollapsed}
                isDesktop={isDesktop}
                onPress={() => handlePress(route)}
              />
            );
          })}
        </View>
      </DrawerContentScrollView>
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
      drawerContent={props => <CustomDrawerContent {...props} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isDesktop={isDesktop} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: Colors.background, elevation: 0, shadowOpacity: 0, overflow: 'visible' },
        headerTintColor: Colors.fgPrimary,
        headerTitleStyle: { fontWeight: '900' },
        headerRightContainerStyle: { overflow: 'visible', zIndex: 1000 },
        headerRight: () => <AdminHeaderProfile navigation={navigation} />,
        drawerType: isDesktop ? 'permanent' : 'front',
        drawerStyle: { backgroundColor: Colors.bgSurface, width: isDesktop ? (isCollapsed ? 80 : 280) : 280 },
        overlayColor: 'rgba(0,0,0,0.5)',
      })}
    >
      <Drawer.Screen name="Dashboard" component={AdminDashScreen} />
      <Drawer.Screen name="Orders" component={AdminOrdersScreen} />
      <Drawer.Screen name="Manual Billing" component={ManualBillingScreen} />
      <Drawer.Screen name="Warranty" component={WarrantyScreen} />
      <Drawer.Screen name="OrderChat" component={OrderChatScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Customers" component={CustomersScreen} />
      <Drawer.Screen name="Technicians" component={TechniciansScreen} />
      <Drawer.Screen name="Categories" component={CategoriesScreen} />
      <Drawer.Screen name="Products" component={AdminProductsScreen} />
      <Drawer.Screen name="Tasks" component={AdminTasksScreen} />
      <Drawer.Screen name="Tracking" component={TrackingScreen} />
      <Drawer.Screen name="Announcements" component={AnnouncementsScreen} />
      
      <Drawer.Screen name="Expenses" component={AdminExpensesScreen} />
      <Drawer.Screen name="Attendance" component={AdminAttendanceScreen} />
      <Drawer.Screen name="Leaves" component={AdminLeaveScreen} />
      <Drawer.Screen name="Service Requests" component={ServiceRequestsScreen} />
      <Drawer.Screen name="Support Tickets" component={AdminTicketsScreen} />
      <Drawer.Screen name="Support Chat" component={ChatScreen} />
      <Drawer.Screen name="Availability" component={AvailabilityScreen} />
      <Drawer.Screen name="Billing" component={BillingScreen} />
      <Drawer.Screen name="Salary" component={SalaryScreen} />
      <Drawer.Screen name="Marketing" component={MarketingScreen} />
      <Drawer.Screen name="Reviews" component={ReviewsScreen} />
      <Drawer.Screen name="Reports" component={ReportsScreen} />
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
  itemActive: { backgroundColor: Colors.primary, elevation: 4, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  iconWrapper: { alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 15, fontWeight: '800', color: Colors.fgMuted },
  itemLabelActive: { color: Colors.primaryLight },
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
});
