import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Package, Users, ShoppingCart, User, BarChart } from 'lucide-react-native';
import { Colors, Radius } from '../theme/colors';

import AdminDashScreen from '../screens/admin/DashboardScreen';
import AdminOrdersScreen from '../screens/admin/OrdersScreen';
import TechniciansScreen from '../screens/admin/TechniciansScreen';
import AdminProductsScreen from '../screens/admin/ProductsScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
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
        tabBarLabelStyle: { fontSize: 9, fontWeight: '800' },
      }}
    >
      <Tab.Screen name="Dashboard" component={AdminDashScreen} options={{ tabBarIcon: ({ color }: { color: string }) => <LayoutDashboard color={color} size={20} /> }} />
      <Tab.Screen name="Orders" component={AdminOrdersScreen} options={{ tabBarIcon: ({ color }: { color: string }) => <ShoppingCart color={color} size={20} /> }} />
      <Tab.Screen name="Techs" component={TechniciansScreen} options={{ tabBarIcon: ({ color }: { color: string }) => <Users color={color} size={20} /> }} />
      <Tab.Screen name="Products" component={AdminProductsScreen} options={{ tabBarIcon: ({ color }: { color: string }) => <Package color={color} size={20} /> }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ tabBarIcon: ({ color }: { color: string }) => <BarChart color={color} size={20} /> }} />
    </Tab.Navigator>
  );
}
