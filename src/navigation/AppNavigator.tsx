import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/ui';
import GlobalFAB from '../components/shared/GlobalFAB';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import CustomerDrawer from './CustomerDrawer';
import TechnicianDrawer from './TechnicianDrawer';
import AdminDrawer from './AdminDrawer';
import ProductDetailScreen from '../screens/customer/ProductDetailScreen';
import EarningsScreen from '../screens/technician/EarningsScreen';
import ExpensesScreen from '../screens/technician/ExpensesScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';

import OrderDetailsScreen from '../screens/admin/OrderDetailsScreen';
import CreateServiceRequestScreen from '../screens/customer/CreateServiceRequestScreen';
import ServiceTimelineScreen from '../screens/customer/ServiceTimelineScreen';
import TechServiceDetailScreen from '../screens/technician/TechServiceDetailScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Main App Stack based on Role (Defaults to CustomerDrawer/Catalog if not logged in) */}
        {!isAuthenticated && <Stack.Screen key="guest" name="Main" component={CustomerDrawer} />}
        {isAuthenticated && user?.role === 'admin' && <Stack.Screen key="admin" name="Main" component={AdminDrawer} />}
        {isAuthenticated && user?.role === 'technician' && <Stack.Screen key="technician" name="Main" component={TechnicianDrawer} />}
        {isAuthenticated && user?.role === 'customer' && <Stack.Screen key="customer" name="Main" component={CustomerDrawer} />}
        
        {/* Auth Stack Screens (accessible from anywhere when login is required) */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        {/* Shared / Stack Screens */}
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="BookService" component={require('../screens/customer/BookServiceScreen').default} />
        <Stack.Screen name="Earnings" component={EarningsScreen} />
        <Stack.Screen name="Expenses" component={ExpensesScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailsScreen} />
        <Stack.Screen name="CreateServiceRequest" component={CreateServiceRequestScreen} />
        <Stack.Screen name="ServiceTimeline" component={ServiceTimelineScreen} />
        <Stack.Screen name="TechServiceDetail" component={TechServiceDetailScreen} />
      </Stack.Navigator>
      {isAuthenticated && <GlobalFAB />}
    </>
  );
}
