import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, CheckSquare, Clock, User } from 'lucide-react-native';
import { Colors, Radius } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';

import TechDashScreen from '../screens/technician/DashboardScreen';
import TasksScreen from '../screens/technician/TasksScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import { Linking } from 'react-native';
import FloatingQRButton from '../components/technician/FloatingQRButton';

const Tab = createBottomTabNavigator();

export default function TechnicianTabs() {
  const navigation = useNavigation<any>();
  return (
    <>
      <Tab.Navigator
        id="TechnicianTabs"
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
      <Tab.Screen name="Dashboard" component={TechDashScreen} options={{ tabBarIcon: ({ color }: { color: string }) => <LayoutDashboard color={color} size={22} /> }} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ tabBarIcon: ({ color }: { color: string }) => <CheckSquare color={color} size={22} /> }} />
      <Tab.Screen 
        name="Attendance" 
        component={TechDashScreen} // Dummy component
        options={{ tabBarIcon: ({ color }: { color: string }) => <Clock color={color} size={22} /> }} 
        listeners={{
          tabPress: (e: any) => {
            e.preventDefault();
            navigation.navigate('Attendance');
          }
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }: { color: string }) => <User color={color} size={22} /> }} />
    </Tab.Navigator>
    <FloatingQRButton />
    </>
  );
}
