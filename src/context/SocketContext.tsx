import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL } from '../api/client';
import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  triggerNotification: (title: string, message: string, data?: any) => void;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false, triggerNotification: () => {} });

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const triggerNotification = (title: string, message: string, data: any = {}) => {
    if (Platform.OS !== 'web') {
      // Explicitly trigger native device vibration
      Vibration.vibrate([0, 500, 200, 500]);
      
      Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: message,
          sound: true,
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: data,
          channelId: 'sk_high_priority',
        },
        trigger: null,
      }).catch(err => console.log('Notification error:', err));
    }
  };

  useEffect(() => {
    // Request permissions for notifications
    Notifications.requestPermissionsAsync();
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        showBadge: true,
      });
      Notifications.setNotificationChannelAsync('sk_high_priority', {
        name: 'High Priority Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#0D8ABC',
        showBadge: true,
      });
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('join', { userId: user._id, role: user.role });
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('new_notification', (data: any) => {
        if (data && data.message) {
          triggerNotification(data.title || 'SK Tech', data.message, { type: data.type });
        }
      });
      
      newSocket.on('notification', (data: any) => {
        if (data && data.message) {
          triggerNotification(data.title || 'SK Tech Update', data.message, { type: data.type });
        }
      });

      newSocket.on('task_assigned', (data: any) => {
        triggerNotification('New Task Assigned', data?.message || 'You have been assigned a new task by the admin.', { type: 'task_assigned', ...data });
      });

      newSocket.on('task_updated', (data: any) => {
        triggerNotification('Task Update', data?.message || 'An update has been made to your assigned task.', { type: 'task_updated', ...data });
      });

      newSocket.on('new_order', (data: any) => {
        triggerNotification('New Booking Received', data?.message || 'A new service booking has been placed.', { type: 'new_order', ...data });
      });

      newSocket.on('order_updated', (data: any) => {
        triggerNotification('Booking Status Updated', data?.message || 'The status of your service booking has been updated.', { type: 'order_updated', ...data });
      });

      newSocket.on('warranty_alert', (data: any) => {
        triggerNotification('Warranty Status Alert', data?.message || 'Important update regarding your product warranty period.', { type: 'warranty', ...data });
      });

      newSocket.on('message', (data: any) => {
        const senderId = data?.sender?._id || data?.sender;
        if (senderId === user?._id) return; // Ignore own messages
        
        if (data?.orderId) {
          triggerNotification(`Message for Order #${data.orderId.slice(-6)}`, data?.content || 'You received a new message.', { type: 'order_chat', orderId: data.orderId, ...data });
        } else {
          triggerNotification('Support Message', data?.content || data?.message || 'You received a new chat message.', { type: 'chat_message', ...data });
        }
      });

      newSocket.on('tech_status_updated', (data: any) => {
        if (user?.role === 'admin') {
          triggerNotification('Technician Status Update', data?.message || 'A technician updated their working availability status.', { type: 'tech_status', ...data });
        }
      });

      newSocket.on('attendance_updated', (data: any) => {
        triggerNotification('Attendance Update', data?.message || 'Attendance records have been updated.', { type: 'attendance', ...data });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, user?._id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, triggerNotification }}>
      {children}
    </SocketContext.Provider>
  );
};
