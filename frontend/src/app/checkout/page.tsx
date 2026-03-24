"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  Smartphone,
  CreditCard as CardIcon,
  Banknote,
  Package,
  ArrowRight,
  Loader2
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/components/providers/LocationProvider';
import { fetchWithAuth } from '@/utils/api';
import { useRouter } from 'next/navigation';

const steps = [
  { id: 1, name: 'Details', icon: User },
  { id: 2, name: 'Schedule', icon: Calendar },
  { id: 3, name: 'Payment', icon: CreditCard }
];

const CheckoutPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { items, totalAmount, clearCart } = useCart();
  const { address: geoAddress } = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Customer Details
  const [details, setDetails] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    state: '',
    zipcode: '',
    email: user?.email || '',
    installationRequired: true
  });

  // Step 2: Scheduling
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('cod');

  useEffect(() => {
    // Role Lockdown: Prevent Admin and Technician from checking out
    if (user && (user.role === 'admin' || user.role === 'technician')) {
      alert("Access Denied: Administrative and Technical accounts cannot initialize purchase protocols. Please use a customer account.");
      router.push('/');
      return;
    }

    if (items.length === 0 && currentStep !== 4) {
      // router.push('/cart'); // Redirect if cart is empty
    }
  }, [items, currentStep, user, router]);

  // Pre-fill address from Geolocation if current address is empty
  useEffect(() => {
    if (geoAddress && !details.address) {
      setDetails(prev => ({ ...prev, address: geoAddress }));
    }
  }, [geoAddress]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate]);

  const fetchSlots = async () => {
    try {
      setFetchingSlots(true);
      const data = await fetchWithAuth(`/slots/available?date=${selectedDate}`);
      setAvailableSlots(data);
    } catch (err) {
      console.error("Failed to fetch slots", err);
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!details.name || !details.phone || !details.address || !details.state || !details.zipcode) {
        setError("Please fill all required fields");
        return;
      }
      
      // Validation for Zipcode (numbers only)
      if (!/^\d+$/.test(details.zipcode)) {
        setError("Zipcode must contain only numbers");
        return;
      }

      // Validation for State (letters only)
      if (!/^[a-zA-Z\s]+$/.test(details.state)) {
        setError("State must contain only letters");
        return;
      }
    }
    if (currentStep === 2) {
      const needsSlot = items.some(item => 
        item.category?.toLowerCase().includes('installation') || 
        item.name?.toLowerCase().includes('installation') ||
        details.installationRequired
      );

      if (!selectedDate) {
        setError("Please select a date to proceed");
        return;
      }

      if (needsSlot && !selectedSlot) {
        setError("Please select an installation slot to proceed");
        return;
      }
    }
    setError("");
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmitOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const orderData = {
        products: items.map(item => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount,
        deliveryAddress: `${details.address}, ${details.state} - ${details.zipcode}`,
        installationRequired: details.installationRequired,
        slot: selectedSlot?._id,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid'
      };

      const result = await fetchWithAuth('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      clearCart();
      router.push(`/checkout/success?id=${result._id}`);
    } catch (err: any) {
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between max-w-2xl mx-auto mb-20 relative">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-bg-muted -translate-y-1/2 z-0" />
      {steps.map((step) => {
        const Icon = step.icon;
        const isActive = currentStep >= step.id;
        const isCurrent = currentStep === step.id;
        
        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
              isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-bg-surface border-border-base text-fg-muted'
            } ${isCurrent ? 'scale-110 ring-4 ring-blue-600/10' : ''}`}>
              <Icon className="h-6 w-6" />
            </div>
            <span className={`mt-4 text-[10px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-fg-primary' : 'text-fg-muted'}`}>
              {step.name}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    value={details.name}
                    onChange={e => setDetails({...details, name: e.target.value})}
                    placeholder="John Doe" 
                    className="w-full bg-bg-muted border border-border-base rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-blue-600 font-bold text-fg-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Phone Number</label>
                <div className="relative group">
                  <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="tel" 
                    value={details.phone}
                    onChange={e => setDetails({...details, phone: e.target.value})}
                    placeholder="+91 98765 43210" 
                    className="w-full bg-bg-muted border border-border-base rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-blue-600 font-bold text-fg-primary"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">State</label>
                <input 
                  type="text" 
                  value={details.state}
                  onChange={e => setDetails({...details, state: e.target.value})}
                  placeholder="Maharashtra" 
                  className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 outline-none focus:border-blue-600 font-bold text-fg-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Zipcode</label>
                <input 
                  type="text" 
                  value={details.zipcode}
                  onChange={e => setDetails({...details, zipcode: e.target.value})}
                  placeholder="400001" 
                  className="w-full bg-bg-muted border border-border-base rounded-2xl px-6 py-5 outline-none focus:border-blue-600 font-bold text-fg-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Street Address</label>
              <div className="relative group">
                <MapPin className="absolute left-6 top-6 h-5 w-5 text-fg-muted group-focus-within:text-blue-500 transition-colors" />
                <textarea 
                  value={details.address}
                  onChange={e => setDetails({...details, address: e.target.value})}
                  placeholder="Building No, Street Name, Area..." 
                  className="w-full bg-bg-muted border border-border-base rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-blue-600 font-bold text-fg-primary h-24"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4 p-6 bg-blue-600/5 rounded-2xl border border-blue-600/10">
              <input 
                type="checkbox" 
                checked={details.installationRequired}
                onChange={e => setDetails({...details, installationRequired: e.target.checked})}
                className="w-5 h-5 rounded-lg border-2 border-blue-600 cursor-pointer"
              />
              <div>
                <p className="text-sm font-black text-fg-primary">Professional Installation Required</p>
                <p className="text-xs text-fg-muted font-medium">Verified technicians will arrive at your sector for deployment.</p>
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Select Deployment Date</label>
              <div className="relative">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted" />
                <input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full bg-bg-muted border border-border-base rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-blue-600 font-bold text-fg-primary appearance-none"
                />
              </div>
            </div>

            {/* Conditional Slot Picker */}
            {(items.some(item => item.category?.toLowerCase().includes('installation') || item.name?.toLowerCase().includes('installation')) || details.installationRequired) && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Available Time Slots</label>
                {fetchingSlots ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                ) : !selectedDate ? (
                  <div className="p-10 text-center bg-bg-muted/50 rounded-2xl border border-dashed border-border-base">
                    <p className="text-fg-muted font-bold">Please select a date to view available slots.</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-10 text-center bg-red-500/5 rounded-2xl border border-dashed border-red-500/20">
                    <p className="text-red-500 font-bold">No slots available for this date. Try another.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot._id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center space-y-2 ${
                          selectedSlot?._id === slot._id 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-bg-muted border-border-base text-fg-primary hover:border-blue-600/30'
                        }`}
                      >
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-black tracking-tight">{slot.startTime} - {slot.endTime}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedSlot?._id === slot._id ? 'text-blue-100' : 'text-fg-muted'}`}>
                          {slot.technician?.name || 'Assigned Agent'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'upi', name: 'UPI (GPay, PhonePe, Paytm)', icon: Smartphone, desc: 'Instant verification via QR or deep link.' },
                { id: 'card', name: 'Credit / Debit Card', icon: CardIcon, desc: 'Secure payment with end-to-end encryption.' },
                { id: 'cod', name: 'Cash On Delivery', icon: Banknote, desc: 'Pay when the installation is complete.' }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`p-8 rounded-3xl border-2 transition-all flex items-center text-left gap-6 group ${
                    paymentMethod === method.id 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/30'
                      : 'bg-bg-muted border-border-base text-fg-primary hover:bg-bg-surface'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                    paymentMethod === method.id ? 'bg-white/20' : 'bg-bg-surface border border-border-base group-hover:bg-blue-600/10 group-hover:text-blue-500'
                  }`}>
                    <method.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-black uppercase tracking-tighter">{method.name}</p>
                    <p className={`text-xs font-medium ${paymentMethod === method.id ? 'text-blue-100' : 'text-fg-muted'}`}>{method.desc}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === method.id ? 'border-white bg-white' : 'border-border-base'
                  }`}>
                    {paymentMethod === method.id && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 pt-48 pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Main Checkout Flow */}
          <div className="lg:col-span-8">
            <div className="mb-12">
              <h1 className="text-5xl font-black text-fg-primary tracking-tighter uppercase mb-4">Secure <span className="text-blue-600 italic">Checkout</span></h1>
              <p className="text-fg-muted font-medium text-lg">Enter your delivery details and schedule installation.</p>
            </div>

            {renderStepIndicator()}

            <div className="glass-card p-12 rounded-[3.5rem] border border-border-base mb-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Package className="h-40 w-40" />
              </div>
              
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-4 bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest rounded-xl text-center">
                  {error}
                </motion.p>
              )}

              <div className="flex items-center justify-between mt-12 pt-12 border-t border-border-base">
                <button 
                  onClick={handleBack} 
                  disabled={currentStep === 1 || loading}
                  className={`flex items-center space-x-2 px-8 py-4 font-black text-xs uppercase tracking-widest rounded-2xl transition-all ${
                    currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-fg-muted hover:text-fg-primary hover:bg-bg-muted'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Return</span>
                </button>
                
                {currentStep < 3 ? (
                  <button 
                    onClick={handleNext}
                    className="flex items-center space-x-3 px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.4rem] transition-all shadow-xl shadow-blue-600/30 active:scale-95"
                  >
                    <span>Next Step</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmitOrder}
                    disabled={loading}
                    className="flex items-center space-x-3 px-16 py-5 bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.4rem] transition-all shadow-xl shadow-green-600/30 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Place Order</span>}
                    {!loading && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cart Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              <div className="glass-card p-10 rounded-[3rem] border border-border-base overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight mb-8">Order <span className="text-blue-500 italic">Summary</span></h3>
                
                <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                  {items.map((item) => (
                    <div key={item.id + item.package} className="flex items-center gap-4 group">
                      <div className="w-16 h-16 bg-bg-muted rounded-2xl overflow-hidden shrink-0 border border-border-base relative">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-fg-primary truncate uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">{item.package} × {item.quantity}</p>
                      </div>
                      <p className="text-sm font-black text-fg-primary">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                  {items.length === 0 && (
                     <div className="text-center py-8">
                       <p className="text-fg-muted font-bold">No assets selected.</p>
                     </div>
                  )}
                </div>

                <div className="space-y-4 pt-8 border-t border-border-base">
                  <div className="flex justify-between text-xs font-bold text-fg-muted uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-green-500 uppercase tracking-widest">
                    <span>Tax & Support</span>
                    <span>included</span>
                  </div>
                  <div className="flex justify-between pt-4">
                    <span className="text-lg font-black text-fg-primary uppercase tracking-tight">Total Value</span>
                    <span className="text-2xl font-black text-blue-600">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-bg-muted/50 rounded-2xl border border-border-base text-center space-y-2">
                    <CheckCircle2 className="h-5 w-5 mx-auto text-blue-500" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-fg-primary">Encrypted Data</p>
                 </div>
                 <div className="p-6 bg-bg-muted/50 rounded-2xl border border-border-base text-center space-y-2">
                    <ArrowRight className="h-5 w-5 mx-auto text-blue-500" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-fg-primary">Fast Delivery</p>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </main>
  );
};

export default CheckoutPage;
