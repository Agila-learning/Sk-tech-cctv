"use client";
import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/utils/api';

const GPS_REPORT_INTERVAL_MS = 60 * 1000; // Throttle to 1 ping per minute

export default function LocationTracker() {
  const { user, isAuthenticated } = useAuth();
  const lastReportTimeRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Only track if user is authenticated and is a technician
    // (Also we could check if they are "on_shift" if we had that in global state, 
    // but for now tracking while authenticated as tech is sufficient for workflows)
    if (!isAuthenticated || user?.role !== 'technician') {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        
        // Throttle updates to avoid spamming the backend
        if (now - lastReportTimeRef.current < GPS_REPORT_INTERVAL_MS) {
          return;
        }
        
        lastReportTimeRef.current = now;
        
        try {
          await fetchWithAuth('/technician/gps', {
            method: 'PATCH',
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              status: 'active'
            })
          });
          // Update successful
        } catch (error) {
          console.error('Failed to report GPS automatically:', error);
        }
      },
      (error) => {
        console.error('GPS auto-tracking error:', error);
        // Optional: report 'denied' or 'weak' status to backend if needed
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000, 
        timeout: 27000
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [user, isAuthenticated]);

  // This is a headless component, it doesn't render anything.
  return null;
}
