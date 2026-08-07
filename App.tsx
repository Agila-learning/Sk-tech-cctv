import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { CartProvider } from './src/context/CartContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

if (!isExpoGo) {
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }) => {
  if (error) {
    console.error('[Background Task] Error!', error);
    return;
  }
  if (data) {
    console.log('\n======================================================');
    console.log('✅ [GLOBAL NOTIFICATION VERIFIED] Background Push Received!');
    console.log('   Data:', data);
    console.log('======================================================\n');
    // You can process the notification payload here even if the app is killed
  }
  });
}

if (!isExpoGo) {
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
}

export const navigationRef = createNavigationContainerRef<any>();

export default function App() {
  useEffect(() => {
    if (isExpoGo) {
      console.log('Skipping push notification setup in Expo Go to prevent SDK 53 crash.');
      return;
    }

    // Register the background task
    Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(err => console.log('Task registration failed:', err));

    // ── Android Notification Channels ──────────────────────────────────
    if (Platform.OS === 'android') {
      console.log('[Setup] Registering Android Notification Channels...');
      Notifications.setNotificationChannelAsync('general_alerts', {
        name: 'General Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0D8ABC',
        showBadge: true,
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      Notifications.setNotificationChannelAsync('high_priority_alerts', {
        name: 'High Priority Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#FF0000',
        showBadge: true,
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      console.log('[Setup] Android Channels Registered.');
    }

    // ── Foreground Notification Listener (app is open) ─────────────────
    const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notification Received in Foreground]', notification.request.content);
    });

    // ── Tap Listener (background / killed state) ───────────────────────
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('[Notification Tapped]', data);
      
      if (navigationRef.isReady()) {
        if (data?.type === 'new_order' || data?.type === 'order_update') {
          navigationRef.navigate('Main', { screen: 'Orders' });
        } else if (data?.type === 'task_assigned' || data?.type === 'task_updated') {
          navigationRef.navigate('Main', { screen: 'Tasks' });
        } else if (data?.type === 'warranty' || data?.type === 'warranty_alert') {
          navigationRef.navigate('Main', { screen: 'Warranty' });
        } else if (data?.type === 'order_chat' || data?.type === 'chat_message') {
          navigationRef.navigate('Main', { screen: 'OrderChat', params: { orderId: data?.orderId } });
        } else if (data?.type === 'leave_requested' || data?.type === 'leave_approved') {
          navigationRef.navigate('Main', { screen: 'Leaves' });
        } else if (data?.type === 'billing' || data?.type === 'billing_update' || data?.type === 'engagement') {
          navigationRef.navigate('Notifications');
        } else {
          navigationRef.navigate('Notifications');
        }
      }
    });

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, []);


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
