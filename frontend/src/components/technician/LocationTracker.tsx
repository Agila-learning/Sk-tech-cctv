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

    const reportGPS = async (lat: number, lng: number, status: string = 'active') => {
      try {
        await fetchWithAuth('/technician/gps', {
          method: 'PATCH',
          body: JSON.stringify({ lat, lng, status })
        });
      } catch (e) {
        console.error('GPS Heartbeat Failed:', e);
      }
    };

    const successHandler = (position: GeolocationPosition) => {
      const now = Date.now();
      if (now - lastReportTimeRef.current < GPS_REPORT_INTERVAL_MS) return;
      
      lastReportTimeRef.current = now;
      reportGPS(position.coords.latitude, position.coords.longitude, 'active');
    };

    const errorHandler = (error: GeolocationPositionError) => {
      console.warn(`[GPS] Error (${error.code}): ${error.message}`);
      const now = Date.now();
      if (now - lastReportTimeRef.current < GPS_REPORT_INTERVAL_MS) return;
      
      lastReportTimeRef.current = now;
      let status = 'weak';
      if (error.code === error.PERMISSION_DENIED) status = 'denied';
      
      reportGPS(0, 0, status);
    };

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0, 
      timeout: 10000
    };

    watchIdRef.current = navigator.geolocation.watchPosition(successHandler, errorHandler, options);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [user, isAuthenticated]);

  // This is a headless component, it doesn't render anything.
  return null;
}
