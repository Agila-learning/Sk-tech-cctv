import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Home, Package, ShoppingBag, ShoppingCart, User, FileText, LifeBuoy, LogOut, Heart } from 'lucide-react-native';
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
import ServiceRequestsScreen from '../screens/customer/ServiceRequestsScreen';

import { View, Text, StyleSheet } from 'react-native';
const s = StyleSheet.create({ center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }, text: { color: Colors.fgMuted, fontSize: 16 } });

const Drawer = createDrawerNavigator();
const LogoutComponent = () => null;

export default function CustomerDrawer() {
  const { logout } = useAuth();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.background, elevation: 0, shadowOpacity: 0 },
        headerTintColor: Colors.fgPrimary,
        headerTitleStyle: { fontWeight: '900' },
        drawerStyle: { backgroundColor: Colors.bgSurface, width: 280 },
        drawerActiveBackgroundColor: Colors.primaryFaint,
        drawerActiveTintColor: Colors.primaryLight,
        drawerInactiveTintColor: Colors.fgMuted,
        drawerLabelStyle: { fontSize: 14, fontWeight: '800' },
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} options={{ drawerIcon: ({ color }) => <Home color={color} size={20} /> }} />
      <Drawer.Screen name="Products" component={ProductListScreen} options={{ drawerIcon: ({ color }) => <Package color={color} size={20} /> }} />
      <Drawer.Screen name="Orders" component={OrdersScreen} options={{ drawerIcon: ({ color }) => <ShoppingBag color={color} size={20} /> }} />
      <Drawer.Screen name="My Bookings" component={ServiceRequestsScreen} options={{ drawerIcon: ({ color }) => <FileText color={color} size={20} /> }} />
      <Drawer.Screen name="Cart" component={CartScreen} options={{ drawerIcon: ({ color }) => <ShoppingCart color={color} size={20} /> }} />
      <Drawer.Screen name="Invoices" component={InvoicesScreen} options={{ drawerIcon: ({ color }) => <FileText color={color} size={22} /> }} />
      <Drawer.Screen name="Wishlist" component={WishlistScreen} options={{ drawerIcon: ({ color }) => <Heart color={color} size={22} /> }} />
      <Drawer.Screen name="Help & Support" component={TicketsScreen} options={{ drawerIcon: ({ color }) => <LifeBuoy color={color} size={22} /> }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ drawerIcon: ({ color }) => <User color={color} size={20} /> }} />
      <Drawer.Screen name="Logout" component={LogoutComponent} listeners={{ focus: () => { logout(); } }} options={{ drawerIcon: ({ color }) => <LogOut color={Colors.danger} size={20} />, drawerLabelStyle: { color: Colors.danger, fontSize: 14, fontWeight: '900' } }} />
    </Drawer.Navigator>
  );
}
