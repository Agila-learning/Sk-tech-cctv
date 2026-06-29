import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Root level Notification Handler for Background/Killed state display in device notification panel
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const navigationRef = createNavigationContainerRef<any>();

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        showBadge: true,
      });
      Notifications.setNotificationChannelAsync('sk_high_priority', {
        name: 'High Priority Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#0D8ABC',
        sound: 'default',
        showBadge: true,
      });
    }

    // Listener for when user taps on a notification (works from background/killed state)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('[Notification Tapped]', data);
      
      // Navigate to relevant screen if navigation is ready
      if (navigationRef.isReady()) {
        if (data?.type === 'new_order' || data?.type === 'order_update') {
          navigationRef.navigate('Main', { screen: 'Orders' });
        } else if (data?.type === 'task_assigned' || data?.type === 'task_updated') {
          navigationRef.navigate('Main', { screen: 'Tasks' });
        } else if (data?.type === 'warranty' || data?.type === 'warranty_alert') {
          navigationRef.navigate('Main', { screen: 'Warranty' });
        } else if (data?.type === 'order_chat' || data?.type === 'chat_message') {
          navigationRef.navigate('Main', { screen: 'OrderChat', params: { orderId: data?.orderId } });
        } else {
          navigationRef.navigate('Notifications');
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <NavigationContainer ref={navigationRef}>
              <AppNavigator />
            </NavigationContainer>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
