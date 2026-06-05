import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/ui';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import CustomerDrawer from './CustomerDrawer';
import TechnicianDrawer from './TechnicianDrawer';
import AdminDrawer from './AdminDrawer';
import ProductDetailScreen from '../screens/customer/ProductDetailScreen';
import EarningsScreen from '../screens/technician/EarningsScreen';
import ExpensesScreen from '../screens/technician/ExpensesScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Main App Stack based on Role
        <>
          {user?.role === 'admin' && <Stack.Screen name="Main" component={AdminDrawer} />}
          {user?.role === 'technician' && <Stack.Screen name="Main" component={TechnicianDrawer} />}
          {user?.role === 'customer' && <Stack.Screen name="Main" component={CustomerDrawer} />}
          {/* Shared / Stack Screens */}
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="Earnings" component={EarningsScreen} />
          <Stack.Screen name="Expenses" component={ExpensesScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
