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
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          borderRadius: Radius.xl,
          elevation: 0,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.fgMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color }: { color: string }) => <Home color={color} size={22} /> }} />
      <Tab.Screen name="Products" component={ProductListScreen} options={{ tabBarIcon: ({ color }: { color: string }) => <Search color={color} size={22} /> }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarIcon: ({ color }: { color: string }) => <ShoppingCart color={color} size={22} /> }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarIcon: ({ color }: { color: string }) => <ShoppingBag color={color} size={22} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }: { color: string }) => <User color={color} size={22} /> }} />
    </Tab.Navigator>
  );
}
