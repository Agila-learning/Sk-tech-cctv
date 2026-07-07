"use client";
import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';

// Utility function to convert Base64 URL-safe string to Uint8Array
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const useWebPush = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const subscribeToWebPush = async () => {
    if (!isSupported) {
      console.warn("Web Push is not supported in this browser.");
      return false;
    }

    try {
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission !== 'granted') {
        console.warn("Notification permission was denied.");
        return false;
      }

      // Register Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Fetch VAPID public key from backend
      const res = await fetchWithAuth('/notifications/vapid-public-key');
      const { publicKey } = res as any;

      if (!publicKey) {
        throw new Error('VAPID public key not found');
      }

      const convertedVapidKey = urlBase64ToUint8Array(publicKey);

      // Subscribe to PushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // Send subscription to backend
      await fetchWithAuth('/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription)
      });

      console.log('Web Push Subscription successful.');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to Web Push:', error);
      return false;
    }
  };

  return { isSupported, permission, subscribeToWebPush };
};
