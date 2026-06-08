import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { LayoutDashboard, ClipboardList, DollarSign, Clock, User, Bell, LogOut, Radio, MessageCircle } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

import DashboardScreen from '../screens/technician/DashboardScreen';
import TasksScreen from '../screens/technician/TasksScreen';
import EarningsScreen from '../screens/technician/EarningsScreen';
import ExpensesScreen from '../screens/technician/ExpensesScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import AnnouncementsScreen from '../screens/technician/AnnouncementsScreen';

const Drawer = createDrawerNavigator();
const LogoutComponent = () => null;

export default function TechnicianDrawer() {
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
      <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ drawerIcon: ({ color }) => <LayoutDashboard color={color} size={20} /> }} />
      <Drawer.Screen name="Tasks" component={TasksScreen} options={{ drawerIcon: ({ color }) => <ClipboardList color={color} size={20} /> }} />
      <Drawer.Screen name="Earnings" component={EarningsScreen} options={{ drawerIcon: ({ color }) => <DollarSign color={color} size={20} /> }} />
      <Drawer.Screen name="Expenses" component={ExpensesScreen} options={{ drawerIcon: ({ color }) => <Clock color={color} size={20} /> }} />
      <Drawer.Screen name="Announcements" component={AnnouncementsScreen} options={{ drawerIcon: ({ color }) => <Radio color={color} size={20} /> }} />
      <Drawer.Screen name="Chat" component={ChatScreen} options={{ drawerIcon: ({ color }) => <MessageCircle color={color} size={20} /> }} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ drawerIcon: ({ color }) => <Bell color={color} size={20} /> }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ drawerIcon: ({ color }) => <User color={color} size={20} /> }} />
      <Drawer.Screen name="Logout" component={LogoutComponent} listeners={{ focus: () => { logout(); } }} options={{ drawerIcon: ({ color }) => <LogOut color={Colors.danger} size={20} />, drawerLabelStyle: { color: Colors.danger, fontSize: 14, fontWeight: '900' } }} />
    </Drawer.Navigator>
  );
}
