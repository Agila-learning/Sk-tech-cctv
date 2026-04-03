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
    alternatePhone: '',
    category: 'installation',
    problemDescription: '',
    deliveryAddress: '',
    locationDetails: {
      landmark: '',
      city: '',
      pincode: '',
    },
    preferredDate: '',
    preferredTiming: 'Morning (9:00 AM - 12:00 PM)',
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Create <span className="text-blue-600 non-italic">Offline Order</span></h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 italic">Professional Service Entry</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-900">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide bg-white">
          {/* Customer & Contact Section */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3">
               <User className="h-4 w-4" /> Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Phone</label>
                  <input
                    required
                    type="tel"
                    placeholder="10-digit number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    value={formData.contactNumber}
                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Alternate Phone</label>
                  <input
                    type="tel"
                    placeholder="Optional"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                    value={formData.alternatePhone}
                    onChange={e => setFormData({ ...formData, alternatePhone: e.target.value })}
                  />
                </div>
            </div>
          </div>

          {/* Service Details Section */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3">
               <Zap className="h-4 w-4" /> Service Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-sm"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="installation" className="text-slate-900 bg-white">CCTV Installation</option>
                    <option value="service" className="text-slate-900 bg-white">Repair & Service</option>
                    <option value="maintenance" className="text-slate-900 bg-white">AMC / Maintenance</option>
                    <option value="consultation" className="text-slate-900 bg-white">Site Inspection</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Scheduled Date</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                    value={formData.preferredDate}
                    onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Time</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                    value={formData.preferredTiming}
                    onChange={e => setFormData({ ...formData, preferredTiming: e.target.value })}
                  >
                    <option className="text-slate-900 bg-white">Morning (9 AM - 12 PM)</option>
                    <option className="text-slate-900 bg-white">Afternoon (1 PM - 4 PM)</option>
                    <option className="text-slate-900 bg-white">Evening (4 PM - 7 PM)</option>
                    <option className="text-slate-900 bg-white">Full Day Assignment</option>
                  </select>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Problem / Requirement Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Clearly state the customer's requirement or reported issue..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none shadow-sm"
                  value={formData.problemDescription}
                  onChange={e => setFormData({ ...formData, problemDescription: e.target.value })}
                />
            </div>
          </div>

          {/* Location & Billing Section */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3">
               <MapPin className="h-4 w-4" /> Site Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Worksite Address</label>
                  <input
                    required
                    placeholder="House No, Building, Area"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                    value={formData.deliveryAddress}
                    onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                    <input
                      required
                      placeholder="e.g. Bangalore"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                      value={formData.locationDetails.city}
                      onChange={e => setFormData({ ...formData, locationDetails: { ...formData.locationDetails, city: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Bill Amount</label>
                    <div className="relative">
                       <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                       <input
                        type="number"
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-6 py-4 text-sm font-black text-blue-600 outline-none focus:border-blue-500 transition-all shadow-sm"
                        value={formData.totalAmount}
                        onChange={e => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode:</label>
              <div className="flex bg-slate-100/50 rounded-xl p-1.5 border border-slate-200">
                {['cod', 'upi', 'card'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: mode })}
                    className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.paymentMethod === mode ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              disabled={loading}
              type="submit"
              className="w-full md:w-auto px-16 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-4 group"
            >
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 group-hover:scale-125 transition-transform" />}
              Finalize & Create Order
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default OfflineOrderModal;
