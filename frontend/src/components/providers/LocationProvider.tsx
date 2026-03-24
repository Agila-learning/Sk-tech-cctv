"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface LocationContextType {
  location: { lat: number; lng: number } | null;
  address: string | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
            localStorage.setItem('sk_location_granted', 'true');
          } else {
            setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (err) {
          console.error("Geocoding Error:", err);
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    const hasPermissionBefore = localStorage.getItem('sk_location_granted');
    if (hasPermissionBefore === 'true') {
      requestLocation();
    }
  }, []);

  return (
    <LocationContext.Provider value={{ location, address, loading, error, requestLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
