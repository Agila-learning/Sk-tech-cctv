"use client";
import React, { useState } from 'react';
import { X, User, Phone, MapPin, Calendar, Clock, CreditCard, FileText, Zap, RefreshCw, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '@/utils/api';

interface OfflineOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const OfflineOrderModal = ({ isOpen, onClose, onSuccess }: OfflineOrderModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    contactNumber: '',
    serviceType: 'CCTV Installation',
    deliveryAddress: '',
    locationDetails: {
      landmark: '',
      city: '',
      pincode: '',
      gpsLocation: { lat: 0, lng: 0 }
    },
    preferredDate: '',
    paymentMethod: 'cod',
    notes: '',
    totalAmount: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchWithAuth('/orders/admin/offline', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || "Failed to create offline order");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-card w-full max-w-4xl rounded-[3rem] border border-border-base overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-8 border-b border-border-base flex justify-between items-center bg-bg-muted/30">
          <div>
            <h2 className="text-3xl font-black text-fg-primary tracking-tighter uppercase italic">Create <span className="text-blue-500 non-italic">Offline Order</span></h2>
            <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] mt-1">Manual Entry System</p>
          </div>
          <button onClick={onClose} className="p-3 bg-bg-muted rounded-2xl hover:bg-bg-card transition-all">
            <X className="h-6 w-6 text-fg-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
          {/* Customer & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-2">
                <User className="h-3 w-3 text-blue-500" /> Customer Name
              </label>
              <input
                required
                type="text"
                placeholder="Full Name"
                className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all"
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-2">
                <Phone className="h-3 w-3 text-blue-500" /> Contact Number
              </label>
              <input
                required
                type="tel"
                placeholder="Phone Number"
                className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all"
                value={formData.contactNumber}
                onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
              />
            </div>
          </div>

          {/* Service & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-2">
                <FileText className="h-3 w-3 text-blue-500" /> Service Type
              </label>
              <select
                className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                value={formData.serviceType}
                onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
              >
                <option>CCTV Installation</option>
                <option>System Maintenance</option>
                <option>Repair Service</option>
                <option>Consultation</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-2">
                <Calendar className="h-3 w-3 text-blue-500" /> Preferred Date
              </label>
              <input
                type="date"
                className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all"
                value={formData.preferredDate}
                onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-2">
                <IndianRupee className="h-3 w-3 text-blue-500" /> Total Amount
              </label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all font-mono"
                value={formData.totalAmount}
                onChange={e => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          {/* Address Sections */}
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-2">
                <MapPin className="h-3 w-3 text-blue-500" /> Full Address
              </label>
              <textarea
                required
                rows={2}
                placeholder="Street address, apartment, etc."
                className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all resize-none"
                value={formData.deliveryAddress}
                onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Landmark</label>
                <input
                  type="text"
                  placeholder="Near..."
                  className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all"
                  value={formData.locationDetails.landmark}
                  onChange={e => setFormData({ 
                    ...formData, 
                    locationDetails: { ...formData.locationDetails, landmark: e.target.value } 
                  })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">City</label>
                <input
                  required
                  type="text"
                  className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all"
                  value={formData.locationDetails.city}
                  onChange={e => setFormData({ 
                    ...formData, 
                    locationDetails: { ...formData.locationDetails, city: e.target.value } 
                  })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Pincode</label>
                <input
                  required
                  type="text"
                  className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all font-mono"
                  value={formData.locationDetails.pincode}
                  onChange={e => setFormData({ 
                    ...formData, 
                    locationDetails: { ...formData.locationDetails, pincode: e.target.value } 
                  })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-3 w-3 text-blue-500" /> Additional Notes
            </label>
            <textarea
              rows={3}
              placeholder="Issue description or special instructions..."
              className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all resize-none"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-8 border-t border-border-base flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Payment Mode:</label>
              <div className="flex bg-bg-muted rounded-xl p-1 border border-border-base">
                {['cod', 'upi', 'card'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: mode })}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.paymentMethod === mode ? 'bg-blue-600 text-white shadow-lg' : 'text-fg-muted'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              disabled={loading}
              type="submit"
              className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] transition-all shadow-2xl shadow-blue-500/20 flex items-center gap-4"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Create Order
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default OfflineOrderModal;
