"use client";

import React, { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '@/context/AuthContext';
import { Map, X } from 'lucide-react';

const AppTour = () => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      steps: [
        {
          element: '#tour-home',
          popover: {
            title: 'Welcome to SK Technology!',
            description: 'Experience our brand new intuitive interface for CCTV and smart security systems.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#tour-products',
          popover: {
            title: 'Browse our Catalog',
            description: 'Explore our latest security products, cameras, and accessories right here.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#tour-support',
          popover: {
            title: 'Need Help?',
            description: 'Contact us for installation services or raise a warranty claim directly from the support center.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#tour-cart',
          popover: {
            title: 'Shopping Cart',
            description: 'All your items are saved here. You can request installation for products before checkout.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#tour-profile',
          popover: {
            title: 'Customer Dashboard',
            description: 'Access your profile to track orders, manage warranties, and chat directly with technicians.',
            side: "bottom", align: 'start'
          }
        }
      ]
    });

    driverObj.drive();
    localStorage.setItem('sk_tech_tour_seen', 'true');
  };

  useEffect(() => {
    if (mounted) {
      // Auto-start for first-time visitors
      const hasSeen = localStorage.getItem('sk_tech_tour_seen');
      if (!hasSeen) {
        // Small delay to allow layout to settle
        setTimeout(() => {
          startTour();
        }, 1500);
      }
    }
  }, [mounted]);

  if (!mounted) return null;

  return (
    <button 
      onClick={startTour}
      className="p-2 transition-colors relative text-slate-500 dark:text-slate-300 hover:text-blue-500 group"
      title="Take a Tour"
    >
      <Map className="h-4 w-4" />
    </button>
  );
};

export default AppTour;
