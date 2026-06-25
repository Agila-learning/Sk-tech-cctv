import React, { useState } from 'react';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { Home, Package, ShoppingBag, ShoppingCart, User, FileText, LifeBuoy, LogOut, Heart, Settings, LogIn, Menu, ChevronRight, Bell, MapPin, AlignLeft, AlignRight } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

import HomeScreen from '../screens/customer/HomeScreen';
import ProductListScreen from '../screens/customer/ProductListScreen';
import OrdersScreen from '../screens/customer/OrdersScreen';
import CartScreen from '../screens/customer/CartScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import InvoicesScreen from '../screens/customer/InvoicesScreen';
import TicketsScreen from '../screens/customer/TicketsScreen';
import WishlistScreen from '../screens/customer/WishlistScreen';
import BookServiceScreen from '../screens/customer/BookServiceScreen';

import { View, Text, StyleSheet, Image, TouchableOpacity, useWindowDimensions, LayoutAnimation, Platform, Pressable, Animated } from 'react-native';

const Drawer = createDrawerNavigator();
const PlaceholderComponent = () => null;

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

const CustomerHeaderProfile = ({ navigation }: any) => {
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
        <View>
          <TouchableOpacity style={s.headerAvatarContainer} onPress={() => setShowProfileMenu(!showProfileMenu)}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitial}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
            </View>
            <Text style={s.headerAvatarName}>{user?.name || 'User'}</Text>
            <ChevronRight color={Colors.fgMuted} size={16} style={{ transform: [{ rotate: showProfileMenu ? '90deg' : '0deg' }] }} />
          </TouchableOpacity>

          {showProfileMenu && (
            <View style={s.topDropdownPanel}>
              <TouchableOpacity style={s.dpItem} onPress={() => { navigation.navigate('Profile'); setShowProfileMenu(false); }}>
                <User color={Colors.fgPrimary} size={18} /><Text style={s.dpItemT}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.dpItem} onPress={() => { navigation.navigate('Orders'); setShowProfileMenu(false); }}>
                <ShoppingBag color={Colors.fgPrimary} size={18} /><Text style={s.dpItemT}>My Bookings/Rides</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.dpItem} onPress={() => { navigation.navigate('Invoices'); setShowProfileMenu(false); }}>
                <FileText color={Colors.fgPrimary} size={18} /><Text style={s.dpItemT}>Payments</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.dpItem} onPress={() => { navigation.navigate('Profile'); setShowProfileMenu(false); }}>
                <MapPin color={Colors.fgPrimary} size={18} /><Text style={s.dpItemT}>Addresses</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.dpItem} onPress={() => { navigation.navigate('Book Service'); setShowProfileMenu(false); }}>
                <Settings color={Colors.fgPrimary} size={18} /><Text style={s.dpItemT}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.dpItem} onPress={() => { navigation.navigate('Notifications'); setShowProfileMenu(false); }}>
                <Bell color={Colors.fgPrimary} size={18} /><Text style={s.dpItemT}>Notifications</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.dpItem, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 4 }]} onPress={() => { logout(); setShowProfileMenu(false); }}>
                <LogOut color={Colors.danger} size={18} /><Text style={[s.dpItemT, { color: Colors.danger }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const CustomDrawerContent = (props: any) => {
  const { isCollapsed, setIsCollapsed, isDesktop, navigation, state } = props;
  const { isAuthenticated } = useAuth();

  const routes = [
    { name: 'Home', label: 'Home', icon: Home, protected: false },
    { name: 'Products', label: 'Products', icon: Package, protected: false },
    { name: 'Cart', label: 'Cart', icon: ShoppingCart, protected: false },
    { name: 'Orders', label: 'Orders', icon: ShoppingBag, protected: true },
    { name: 'Invoices', label: 'Invoices', icon: FileText, protected: true },
    { name: 'Wishlist', label: 'Wishlist', icon: Heart, protected: true },
    { name: 'Help & Support', label: 'Help & Support', icon: LifeBuoy, protected: true },
    { name: 'Book Service', label: 'Book Service', icon: Settings, protected: true },
    { name: 'Profile', label: 'Profile', icon: User, protected: true },
  ];

  const handlePress = (route: any) => {
    if (route.protected && !isAuthenticated) {
      navigation.navigate('Login');
    } else {
      navigation.navigate(route.name);
    }
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
                <Text style={s.brandSub}>Securing Your Future</Text>
              </View>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={s.menuList}>
          {routes.map((route, index) => {
            const isActive = state.index === index;
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

export default function CustomerDrawer() {
  const { logout, isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const requireAuth = ({ navigation }: any) => ({
    focus: () => {
      if (!isAuthenticated) {
        navigation.navigate('Login');
      }
    }
  });

  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isDesktop={isDesktop} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: Colors.background, elevation: 0, shadowOpacity: 0, overflow: 'visible' },
        headerTintColor: Colors.fgPrimary,
        headerTitleStyle: { fontWeight: '900' },
        headerRightContainerStyle: { overflow: 'visible', zIndex: 1000 },
        headerRight: () => <CustomerHeaderProfile navigation={navigation} />,
        drawerType: isDesktop ? 'permanent' : 'front',
        drawerStyle: { backgroundColor: Colors.bgSurface, width: isDesktop ? (isCollapsed ? 80 : 280) : 280 },
        overlayColor: 'rgba(0,0,0,0.5)',
      })}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Products" component={ProductListScreen} />
      <Drawer.Screen name="Cart" component={CartScreen} />
      
      {/* Protected Screens - Intercepted if not logged in */}
      <Drawer.Screen name="Orders" component={OrdersScreen} listeners={requireAuth} />
      <Drawer.Screen name="Invoices" component={InvoicesScreen} listeners={requireAuth} />
      <Drawer.Screen name="Wishlist" component={WishlistScreen} listeners={requireAuth} />
      <Drawer.Screen name="Help & Support" component={TicketsScreen} listeners={requireAuth} />
      <Drawer.Screen name="Book Service" component={BookServiceScreen} listeners={requireAuth} />
      <Drawer.Screen name="Profile" component={ProfileScreen} listeners={requireAuth} />
      
      {isAuthenticated ? (
        <Drawer.Screen name="Logout" component={PlaceholderComponent} listeners={{ focus: () => { logout(); } }} />
      ) : (
        <Drawer.Screen name="Login / Register" component={PlaceholderComponent} listeners={({ navigation }) => ({ focus: () => navigation.navigate('Login') })} />
      )}
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
  dpItemT: { fontSize: 14, fontWeight: '700', color: Colors.fgPrimary }
});
