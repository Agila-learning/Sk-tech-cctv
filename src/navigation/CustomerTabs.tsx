import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, ShoppingBag, User, ShoppingCart } from 'lucide-react-native';
import { Colors, Radius } from '../theme/colors';

import HomeScreen from '../screens/customer/HomeScreen';
import ProductListScreen from '../screens/customer/ProductListScreen';
import OrdersScreen from '../screens/customer/OrdersScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import CartScreen from '../screens/customer/CartScreen';

const Tab = createBottomTabNavigator();

export default function CustomerTabs() {
  return (
    <Tab.Navigator
      id="CustomerTabs"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
          height: 66,
          paddingBottom: 10,
          paddingTop: 10,
          position: 'absolute',
          bottom: 24,
          left: 24,
          right: 24,
          borderRadius: 33,
          elevation: 10,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.fgMuted,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => <Home color={color} size={focused ? 26 : 22} /> }} />
      <Tab.Screen name="Products" component={ProductListScreen} options={{ tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => <Search color={color} size={focused ? 26 : 22} /> }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => <ShoppingCart color={color} size={focused ? 26 : 22} /> }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => <ShoppingBag color={color} size={focused ? 26 : 22} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => <User color={color} size={focused ? 26 : 22} /> }} />
    </Tab.Navigator>
  );
}
