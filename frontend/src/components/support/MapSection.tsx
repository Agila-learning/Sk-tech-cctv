"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Clock, ExternalLink, X, Map as MapIcon, Navigation, ShieldCheck, Globe } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  status: string;
  mapQuery: string;
}

const LOCATIONS: Location[] = [
  {
    id: 'bangalore',
    name: 'Bangalore Headquarters',
    city: 'Bangalore',
    address: '404 Tech Corridor, Electronic City, Bangalore, KA 560100',
    phone: '+91 80 4567 8901',
    status: 'Operational 24/7',
    mapQuery: 'Electronic+City+Bangalore'
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad Tech Node',
    city: 'Hyderabad',
    address: 'Level 5, HITEC City, Kondapur, Hyderabad, TS 500081',
    phone: '+91 40 1234 5678',
    status: 'Active Support',
    mapQuery: 'HITEC+City+Hyderabad'
  },
  {
    id: 'chennai',
    name: 'Chennai Strategic Node',
    city: 'Chennai',
    address: 'Suite 12, Naval Tech Park, OMR, Chennai, TN 600113',
    phone: '+91 44 9876 5432',
    status: 'Active Support',
    mapQuery: 'Naval+Tech+Park+Chennai'
  },
  {
    id: 'mumbai',
    name: 'Mumbai Central Hub',
    city: 'Mumbai',
    address: 'Level 42, Sky Tower, Worli, Mumbai, MH 400018',
    phone: '+91 22 5544 3322',
    status: '24/7 Monitoring',
    mapQuery: 'Worli+Mumbai'
  }
];

const MapSection = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location>(LOCATIONS[0]);

  return (
    <section className="mt-40 space-y-16">
      <div className="flex flex-col md:flex-row justify-between items-end gap-12">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-blue-600"
          >
            <Globe className="h-3 w-3 mr-2" />
            National Presence
          </motion.div>
          <h2 className="text-5xl font-black text-fg-primary uppercase tracking-tighter">
            Our Service <span className="text-blue-600 italic">Centers</span>
          </h2>
          <p className="text-fg-secondary font-medium max-w-xl">
            Real-time verification of our physical locations across India for maximum reliability and trust.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[650px]">
        {/* Locations Sidebar */}
        <div className="lg:col-span-4 space-y-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc)}
              className={`w-full text-left p-8 glass-card rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden ${
                selectedLocation.id === loc.id 
                  ? 'border-blue-600/50 bg-blue-600/5 shadow-2xl shadow-blue-600/10 scale-[1.02]' 
                  : 'border-border-base hover:border-blue-600/30'
              }`}
            >
              {selectedLocation.id === loc.id && (
                <div className="absolute top-0 right-0 p-3 bg-blue-600 text-white rounded-bl-2xl">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              )}
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${selectedLocation.id === loc.id ? 'text-blue-600' : 'text-fg-muted'}`}>
                    {loc.city} Hub
                  </span>
                </div>
                <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                  {loc.name}
                </h3>
                <div className="space-y-3">
                   <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-1" />
                      <p className="text-sm font-bold text-fg-secondary leading-relaxed">{loc.address}</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                      <p className="text-sm font-bold text-fg-secondary">{loc.phone}</p>
                   </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Real-time Google Map Iframe */}
        <div className="lg:col-span-8 h-[650px] glass-card rounded-[4rem] border border-border-base relative overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 bg-bg-muted/50 flex items-center justify-center -z-10">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <iframe
            title="Service Location Map"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0, filter: 'grayscale(0.1) contrast(1.1)' }}
            src={`https://maps.google.com/maps?q=${selectedLocation.mapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
            allowFullScreen
            className="w-full h-full relative z-10"
          ></iframe>
          <div className="absolute inset-0 pointer-events-none border-[2rem] border-blue-600/5 z-20"></div>
          
          {/* Google Maps Fallback / Trust Badge Overlay */}
          <div className="absolute bottom-10 left-10 z-30 flex gap-4">
             <div className="px-6 py-4 backdrop-blur-xl bg-bg-surface/80 rounded-2xl border border-blue-600/20 shadow-2xl flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <div className="space-y-0.5">
                   <p className="text-[10px] font-black text-fg-primary uppercase tracking-widest">Live Sync Status</p>
                   <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest">Active Connection Established</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-base);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--primary-blue);
        }
      `}</style>
    </section>
  );
};

export default MapSection;
