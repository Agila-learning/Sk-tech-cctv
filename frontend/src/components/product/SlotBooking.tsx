import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, CheckCircle2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/components/providers/LocationProvider';
import { fetchWithAuth } from '@/utils/api';

const SlotBooking = ({ productId, productName }: { productId?: string, productName?: string }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const { user } = useAuth();
  const { location, address: geoAddress, requestLocation, loading: locLoading } = useLocation();

  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setBookingData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  // Implicit address filling from geolocation
  useEffect(() => {
    if (geoAddress && !bookingData.address) {
      setBookingData(prev => ({ ...prev, address: geoAddress }));
    }
  }, [geoAddress, bookingData.address]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) return;
      setSlotsLoading(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const data = await fetchWithAuth(`/slots/available?date=${dateStr}`);
        // Extract unique time slots
        const uniqueSlots = Array.from(new Set(data.map((s: any) => `${s.startTime} - ${s.endTime}`))) as string[];
        setAvailableSlots(uniqueSlots);
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate]);

  const handleBooking = async () => {
    setLoading(true);
    setError("");

    try {
      const payload = {
        productId,
        productName,
        scheduledDate: selectedDate ? new Date(selectedDate.setHours(12, 0, 0, 0)) : null,
        timeSlot: selectedSlot,
        ...bookingData,
        location: location ? {
          type: 'Point',
          coordinates: [location.lng, location.lat]
        } : null
      };

      await fetchWithAuth('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-500/10 border border-green-500/20 p-12 rounded-[3.5rem] text-center space-y-6"
      >
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tight">Booking Confirmed</h3>
        <p className="text-fg-secondary font-medium">Our technical team will contact you to confirm the installation for {productName}.</p>
        <button onClick={() => setSuccess(false)} className="px-10 py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Done</button>
      </motion.div>
    );
  }

  return (
    <div className="bg-card p-10 rounded-[3rem] border border-border shadow-2xl space-y-10">
      <div className="space-y-4">
        <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Schedule <span className="text-blue-600 italic">Installation</span></h3>
        <p className="text-fg-muted font-medium text-sm">Select a convenient time. No login required.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-fg-dim uppercase tracking-[0.2em] ml-2 flex items-center">
            <Calendar className="h-3 w-3 mr-2 text-blue-500" />
            Installation Date
          </label>
          <div className="grid grid-cols-4 gap-3">
             {next7Days.map((date, i) => {
               const isSelected = selectedDate?.toDateString() === date.toDateString();
               return (
                 <button
                   key={i}
                   type="button"
                   onClick={() => setSelectedDate(date)}
                   className={`p-4 rounded-2xl flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105' : 'bg-bg-muted border border-border-base hover:border-blue-600/30 text-fg-primary'}`}
                 >
                   <span className="text-[8px] font-black uppercase opacity-60 mb-1">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                   <span className="text-lg font-black">{date.getDate()}</span>
                 </button>
               );
             })}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-fg-dim uppercase tracking-[0.2em] ml-2 flex items-center">
            <Clock className="h-3 w-3 mr-2 text-blue-500" />
            Time Slot
          </label>
          <div className="space-y-3">
             {slotsLoading ? (
               <div className="flex items-center justify-center py-10">
                 <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
               </div>
             ) : availableSlots.length > 0 ? (
               availableSlots.map((slot, i) => (
                 <button
                   key={i}
                   type="button"
                   onClick={() => setSelectedSlot(slot)}
                   className={`w-full p-4 rounded-2xl flex items-center justify-between px-6 transition-all ${selectedSlot === slot ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-bg-muted border border-border-base hover:border-blue-600/30 text-fg-primary'}`}
                 >
                   <span className="text-xs font-black uppercase tracking-widest">{slot}</span>
                   {selectedSlot === slot && <CheckCircle2 className="h-4 w-4" />}
                 </button>
               ))
             ) : selectedDate ? (
               <div className="py-8 text-center bg-bg-muted/30 rounded-2xl border border-dashed border-border-base">
                  <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Technician schedule pending.<br/>No times available for this date.</p>
               </div>
             ) : (
               <div className="py-8 text-center bg-bg-muted/30 rounded-2xl border border-dashed border-border-base">
                 <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest italic">Please select a date first</p>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6 border-t border-border-base">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input 
            type="text" 
            placeholder="Full Name"
            value={bookingData.name}
            onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
            className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary"
          />
          <input 
            type="tel" 
            placeholder="Phone Number"
            value={bookingData.phone}
            onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
            className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary"
          />
        </div>
        <input 
          type="email" 
          placeholder="Email Address"
          value={bookingData.email}
          onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
          className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary"
        />
        
        <div className="relative">
          <textarea 
            placeholder="Site Address"
            value={bookingData.address}
            onChange={(e) => setBookingData({...bookingData, address: e.target.value})}
            rows={2}
            className="w-full bg-bg-muted border border-border-base rounded-2xl pl-6 pr-14 py-4 focus:border-blue-600 outline-none transition-all font-bold text-sm text-fg-primary resize-none"
          />
          <button 
            type="button"
            onClick={() => {
              if (geoAddress) {
                setBookingData(prev => ({ ...prev, address: geoAddress }));
              } else {
                requestLocation();
              }
            }}
            className="absolute right-4 top-4 p-2 bg-blue-600/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
          >
            <MapPin className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        onClick={handleBooking}
        disabled={loading || !selectedDate || !selectedSlot}
        className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center space-x-3"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        ) : (
          <>
            <span>Book Installation</span>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
};

export default SlotBooking;
