"use client";
import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Calendar, Clock, CreditCard, FileText, Zap, RefreshCw, IndianRupee, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '@/utils/api';

interface OfflineOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const OfflineOrderModal = ({ isOpen, onClose, onSuccess }: OfflineOrderModalProps) => {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    contactNumber: '',
    alternatePhone: '',
    warrantyPeriod: '12 Months',
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
    totalAmount: 0,
    technicianId: '',
    serviceType: 'CCTV Installation',
    cameraDetails: '',
    totalDays: 1,
    gstPercentage: 18,
    supportingTechnicians: [] as string[]
  });

  const [loading, setLoading] = useState(false);
  const [customerStatus, setCustomerStatus] = useState<'none' | 'existing' | 'new'>('none');
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    if (formData.contactNumber.trim().length === 10) {
      const checkCustomer = async () => {
        setLookupLoading(true);
        try {
          const res = await fetchWithAuth(`/admin/customer-lookup?phone=${formData.contactNumber.trim()}`);
          if (res && res.exists) {
            setCustomerStatus('existing');
            setFormData(prev => ({
              ...prev,
              customerName: prev.customerName || res.customer.name || '',
              deliveryAddress: prev.deliveryAddress || res.lastOrder?.deliveryAddress || res.customer.address || '',
              alternatePhone: prev.alternatePhone || res.lastOrder?.alternatePhone || '',
              warrantyPeriod: prev.warrantyPeriod || res.lastOrder?.warrantyPeriod || res.customer.warrantyPeriod || '12 Months',
              locationDetails: {
                ...prev.locationDetails,
                ...(res.lastOrder?.locationDetails || {})
              }
            }));
          } else {
            setCustomerStatus('new');
          }
        } catch (err: any) {
          console.error("Customer lookup failed:", err);
        } finally {
          setLookupLoading(false);
        }
      };
      checkCustomer();
    } else {
      setCustomerStatus('none');
    }
  }, [formData.contactNumber]);

  useEffect(() => {
    if (formData.preferredDate) {
      const fetchTechs = async () => {
        setLoadingTechs(true);
        try {
          // Robust timing parser: "9:00 AM - 12:00 PM" or "Morning (9:30 AM ...)"
          const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i;
          const timeMatch = formData.preferredTiming.match(timeRegex);
          let start = "09:00", end = "18:00";
          
          if (timeMatch) {
            const to24 = (h: string, m: string, p: string) => {
              let hrs = parseInt(h);
              const lowerP = p.toLowerCase();
              if (lowerP === 'pm' && hrs < 12) hrs += 12;
              if (lowerP === 'am' && hrs === 12) hrs = 0;
              return `${hrs.toString().padStart(2, '0')}:${m}`;
            };
            start = to24(timeMatch[1], timeMatch[2], timeMatch[3]);
            end = to24(timeMatch[4], timeMatch[5], timeMatch[6]);
          }

          const res = await fetchWithAuth(`/availability/technicians?date=${formData.preferredDate}&startTime=${start}&endTime=${end}`);
          setTechnicians(res || []);
        } catch (error: any) {
          console.error("Failed to fetch technicians:", error);
        } finally {
          setLoadingTechs(false);
        }
      };
      fetchTechs();
    }
  }, [formData.preferredDate, formData.preferredTiming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchWithAuth('/orders/admin/offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white text-slate-800 w-full max-w-4xl rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Create <span className="text-blue-600 non-italic">Offline Order</span></h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 italic">Professional Service Entry</p>
          </div>
          <button type="button" onClick={onClose} className="p-3 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 transition-all text-slate-500 hover:text-slate-800">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide bg-white">
          {/* Customer & Contact Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3">
                 <User className="h-4 w-4" /> Customer Information
              </h3>
              {lookupLoading && <span className="text-[10px] font-bold text-fg-muted animate-pulse">Searching Records...</span>}
              {customerStatus === 'existing' && (
                <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 font-black text-[10px] rounded-full uppercase tracking-widest flex items-center gap-2">
                  ✓ Existing Customer
                </span>
              )}
              {customerStatus === 'new' && (
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 font-black text-[10px] rounded-full uppercase tracking-widest flex items-center gap-2">
                  + New Customer
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 focus:bg-bg-surface transition-all shadow-sm placeholder:text-fg-dim/50"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Primary Phone</label>
                  <input
                    required
                    type="tel"
                    placeholder="10-digit number"
                    className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 focus:bg-bg-surface transition-all shadow-sm placeholder:text-fg-dim/50"
                    value={formData.contactNumber}
                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Alternate Phone</label>
                  <input
                    type="tel"
                    placeholder="Optional"
                    className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 focus:bg-bg-surface transition-all shadow-sm placeholder:text-fg-dim/50"
                    value={formData.alternatePhone}
                    onChange={e => setFormData({ ...formData, alternatePhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Warranty Period</label>
                  <input
                    type="text"
                    placeholder="e.g. 12 Months"
                    className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 focus:bg-bg-surface transition-all shadow-sm placeholder:text-fg-dim/50"
                    value={formData.warrantyPeriod}
                    onChange={e => setFormData({ ...formData, warrantyPeriod: e.target.value })}
                  />
                </div>
                <div className="space-y-2 lg:col-span-4">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">GST Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 18"
                    className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 focus:bg-bg-surface transition-all shadow-sm"
                    value={formData.gstPercentage}
                    onChange={e => setFormData({ ...formData, gstPercentage: parseInt(e.target.value) || 0 })}
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
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Category</label>
                  <div className="relative">
                    <select
                      className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-sm"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="installation" className="text-fg-primary bg-bg-surface">CCTV Installation</option>
                      <option value="service" className="text-fg-primary bg-bg-surface">Repair & Service</option>
                      <option value="maintenance" className="text-fg-primary bg-bg-surface">AMC / Maintenance</option>
                      <option value="consultation" className="text-fg-primary bg-bg-surface">Site Inspection</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      <Zap className="h-4 w-4 text-fg-dim" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Scheduled Date</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all shadow-sm"
                    value={formData.preferredDate}
                    onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Preferred Time</label>
                  <div className="relative">
                    <select
                      className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
                      value={formData.preferredTiming}
                      onChange={e => setFormData({ ...formData, preferredTiming: e.target.value })}
                    >
                      <option className="text-fg-primary bg-bg-surface">Morning (9 AM - 12 PM)</option>
                      <option className="text-fg-primary bg-bg-surface">Afternoon (1 PM - 4 PM)</option>
                      <option className="text-fg-primary bg-bg-surface">Evening (4 PM - 7 PM)</option>
                      <option className="text-fg-primary bg-bg-surface">Full Day Assignment</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      <Clock className="h-4 w-4 text-fg-dim" />
                    </div>
                  </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Service Type</label>
                  <input
                    type="text"
                    placeholder="e.g. CCTV Installation / Repair"
                    className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 focus:bg-bg-surface transition-all shadow-sm placeholder:text-fg-dim/50"
                    value={formData.serviceType}
                    onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Camera Details</label>
                  <input
                    type="text"
                    placeholder="e.g. 4x Dome 2MP, 1x 8CH DVR"
                    className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 focus:bg-bg-surface transition-all shadow-sm placeholder:text-fg-dim/50"
                    value={formData.cameraDetails}
                    onChange={e => setFormData({ ...formData, cameraDetails: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Expected Completion Days</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-black text-blue-600 outline-none focus:border-blue-500 focus:bg-bg-surface transition-all shadow-sm"
                    value={formData.totalDays}
                    onChange={e => setFormData({ ...formData, totalDays: parseInt(e.target.value) || 1 })}
                  />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Problem / Requirement Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Clearly state the customer's requirement or reported issue..."
                  className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 focus:bg-bg-surface transition-all resize-none shadow-sm placeholder:text-fg-dim/50"
                  value={formData.problemDescription}
                  onChange={e => setFormData({ ...formData, problemDescription: e.target.value })}
                />
            </div>
          </div>

          {/* Technician Assignment Section */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3">
               <User className="h-4 w-4" /> Technician Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <User className="h-3 w-3" /> Primary Technician
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-white border border-blue-200 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer shadow-sm"
                    value={formData.technicianId}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ 
                        ...formData, 
                        technicianId: val,
                        supportingTechnicians: formData.supportingTechnicians.filter(id => id !== val)
                      });
                    }}
                  >
                    <option value="">Auto-Assign (Based on availability)</option>
                    {technicians.map((tech) => (
                      <option key={tech._id} value={tech._id}>
                        {tech.name} — {tech.status?.toUpperCase().replace('_', ' ') || 'AVAILABLE'} {tech.reason ? `(${tech.reason})` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
                {!formData.preferredDate && (
                  <p className="text-[8px] font-bold text-amber-500 uppercase tracking-widest ml-1">Select a date to see available staff</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <User className="h-3 w-3" /> Supporting Team
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {technicians.filter(t => t._id !== formData.technicianId).map(t => {
                    const isSelected = formData.supportingTechnicians.includes(t._id);
                    return (
                      <button
                        key={t._id}
                        type="button"
                        onClick={() => setFormData(p => ({
                          ...p,
                          supportingTechnicians: isSelected 
                            ? p.supportingTechnicians.filter(id => id !== t._id)
                            : [...p.supportingTechnicians, t._id]
                        }))}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                            : 'bg-white border-blue-100 text-slate-600 hover:border-blue-300'
                        }`}
                      >
                         <span className="font-bold text-xs">{t.name}</span>
                         {isSelected && <CheckCircle className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Hidden for simplicity */}
            </div>
          </div>

          {/* Location & Billing Section */}

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3">
               <MapPin className="h-4 w-4" /> Site Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Full Worksite Address</label>
                  <input
                    required
                    placeholder="House No, Building, Area"
                    className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all shadow-sm placeholder:text-fg-dim/50"
                    value={formData.deliveryAddress}
                    onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">City</label>
                    <input
                      required
                      placeholder="e.g. Bangalore"
                      className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-500 transition-all shadow-sm placeholder:text-fg-dim/50"
                      value={formData.locationDetails.city}
                      onChange={e => setFormData({ ...formData, locationDetails: { ...formData.locationDetails, city: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-1">Total Bill Amount</label>
                    <div className="relative">
                       <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                       <input
                        type="number"
                        placeholder="0.00"
                        className="w-full bg-bg-muted border border-border-base rounded-2xl pl-10 pr-6 py-4 text-sm font-black text-blue-600 outline-none focus:border-blue-500 transition-all shadow-sm"
                        value={formData.totalAmount}
                        onChange={e => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
            </div>
          </div>

          <div className="pt-10 border-t border-border-base flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Payment Mode:</label>
              <div className="flex bg-bg-muted rounded-xl p-1.5 border border-border-base">
                {['cod', 'upi', 'card'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: mode })}
                    className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.paymentMethod === mode ? 'bg-blue-600 text-white shadow-xl' : 'text-fg-dim hover:text-fg-primary'}`}
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
