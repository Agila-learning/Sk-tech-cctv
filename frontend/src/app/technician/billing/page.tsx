"use client";
import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Trash2, Send, Search, CheckCircle2, AlertCircle, 
  IndianRupee, Percent, User, Phone, MapPin, Calculator, RefreshCw, Mail
} from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const TechnicianBilling = () => {
  const [loading, setLoading] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'searching' | 'existing' | 'new'>('idle');
  
  const [productsList, setProductsList] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  
  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');
  
  const [gstPercentage, setGstPercentage] = useState('18');
  const [notes, setNotes] = useState('Thank you for your business with SK Technology.');
  const [warrantyPeriod, setWarrantyPeriod] = useState('12 Months Warranty');
  const [location, setLocation] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const d = await fetchWithAuth('/products');
        setProductsList(d?.products || d || []);
      } catch (e: any) { console.error("Failed to fetch products", e); }
    };
    loadProducts();
  }, []);

  // Customer Auto-Lookup
  useEffect(() => {
    if (customerPhone.length >= 10) {
      const checkCustomer = async () => {
        setLookupStatus('searching');
        try {
          const res = await fetchWithAuth(`/admin/customer-lookup?phone=${encodeURIComponent(customerPhone)}`);
          if (res && res._id) {
            setCustomerName(res.name || '');
            setCustomerAddress(res.address || '');
            setCustomerEmail(res.email || '');
            setLookupStatus('existing');
          } else {
            setLookupStatus('new');
          }
        } catch (e: any) {
          setLookupStatus('new');
        }
      };
      const timer = setTimeout(checkCustomer, 500);
      return () => clearTimeout(timer);
    } else {
      setLookupStatus('idle');
    }
  }, [customerPhone]);

  const addCatalogProduct = () => {
    const p = productsList.find(x => x._id === selectedProductId);
    if (!p) return;
    const existing = cart.find(item => item.id === p._id);
    if (existing) {
      setCart(cart.map(item => item.id === p._id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { id: p._id, name: p.name, price: Number(p.price || 0), quantity: 1 }]);
    }
    setSelectedProductId('');
  };

  const addCustomProduct = () => {
    if (!customName || !customPrice) {
      setMsg({ type: 'error', text: 'Please enter product name and price' });
      return;
    }
    const id = 'custom_' + Date.now();
    setCart([...cart, { id, name: customName, price: Number(customPrice), quantity: Number(customQty) || 1 }]);
    setCustomName(''); setCustomPrice(''); setCustomQty('1');
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const gstRate = Number(gstPercentage) || 0;
  const gstAmount = (subtotal * gstRate) / 100;
  const grandTotal = subtotal + gstAmount;

  const handleGenerateBill = async () => {
    if (cart.length === 0) {
      setMsg({ type: 'error', text: 'Please add at least one product or service to generate document' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        manualCustomer: { name: customerName, phone: customerPhone, email: customerEmail, address: customerAddress },
        items: cart.map(item => ({ description: item.name, quantity: item.quantity, unitPrice: item.price, total: item.price * item.quantity })),
        amount: subtotal,
        taxRate: gstRate,
        total: grandTotal,
        description: notes,
        warranty: warrantyPeriod,
        location: location
      };
      await fetchWithAuth('/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setMsg({ type: 'success', text: 'Invoice generated and saved to system successfully!' });
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to save invoice to system' });
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = (type: 'quotation' | 'invoice') => {
    if (!customerPhone) {
      setMsg({ type: 'error', text: 'Please enter customer phone number to share via WhatsApp' });
      return;
    }
    if (cart.length === 0) {
      setMsg({ type: 'error', text: 'Please add at least one product or service to generate document' });
      return;
    }

    const title = type === 'quotation' ? 'ðŸ“‹ SK TECHNOLOGY - SAMPLE QUOTATION' : 'ðŸ§¾ SK TECHNOLOGY - TAX INVOICE';
    let text = `${title}\n\n`;
    text += `ðŸ‘¤ *Customer*: ${customerName || 'Valued Customer'}\n`;
    text += `ðŸ“ž *Phone*: ${customerPhone}\n`;
    if (customerAddress) text += `ðŸ  *Address*: ${customerAddress}\n`;
    text += `ðŸ“… *Date*: ${new Date().toLocaleDateString()}\n\n`;
    text += `*--- ITEM BREAKDOWN ---*\n`;
    
    cart.forEach(item => {
      text += `â–ªï¸ *${item.name}*\n   ${item.quantity} x â‚¹${item.price.toLocaleString()} = â‚¹${(item.price * item.quantity).toLocaleString()}\n`;
    });

    text += `\n*------------------------*\n`;
    text += `ðŸ’° *Subtotal*: â‚¹${subtotal.toLocaleString()}\n`;
    text += `ðŸ“Š *GST (${gstRate}%)*: â‚¹${gstAmount.toLocaleString()}\n`;
    text += `ðŸ† *GRAND TOTAL*: â‚¹${grandTotal.toLocaleString()}\n`;
    text += `*------------------------*\n\n`;
    text += `ðŸ›¡ï¸ *Warranty*: ${warrantyPeriod}\n`;
    if (location) text += `ðŸ“ *Site Location*: ${location}\n`;
    text += `ðŸ“Œ *Notes*: ${notes}\n\n`;
    text += `ðŸŒ *Provided by SK Technology*. For any inquiries, feel free to reply to this message!`;

    const encoded = encodeURIComponent(text);
    let cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    setMsg({ type: 'success', text: `${type === 'quotation' ? 'Quotation' : 'Invoice'} shared successfully via WhatsApp!` });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const handleShareEmail = (type: 'quotation' | 'invoice') => {
    if (!customerEmail) {
      setMsg({ type: 'error', text: 'Please enter customer email address to share via Email' });
      return;
    }
    if (cart.length === 0) {
      setMsg({ type: 'error', text: 'Please add at least one product or service to generate document' });
      return;
    }

    const title = type === 'quotation' ? 'SK TECHNOLOGY - SAMPLE QUOTATION' : 'SK TECHNOLOGY - TAX INVOICE';
    let text = `${title}\n\n`;
    text += `Customer: ${customerName || 'Valued Customer'}\n`;
    text += `Phone: ${customerPhone}\n`;
    if (customerAddress) text += `Address: ${customerAddress}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n\n`;
    text += `--- ITEM BREAKDOWN ---\n`;
    
    cart.forEach(item => {
      text += `â–ªï¸ ${item.name}\n   ${item.quantity} x â‚¹${item.price.toLocaleString()} = â‚¹${(item.price * item.quantity).toLocaleString()}\n`;
    });

    text += `\n------------------------\n`;
    text += `Subtotal: â‚¹${subtotal.toLocaleString()}\n`;
    text += `GST (${gstRate}%): â‚¹${gstAmount.toLocaleString()}\n`;
    text += `GRAND TOTAL: â‚¹${grandTotal.toLocaleString()}\n`;
    text += `------------------------\n\n`;
    text += `Warranty: ${warrantyPeriod}\n`;
    if (location) text += `Site Location: ${location}\n`;
    text += `Notes: ${notes}\n\n`;
    text += `Provided by SK Technology. For any inquiries, feel free to reply to this message!`;

    const encodedSubject = encodeURIComponent(title);
    const encodedBody = encodeURIComponent(text);

    window.open(`mailto:${customerEmail}?subject=${encodedSubject}&body=${encodedBody}`, '_blank');
    setMsg({ type: 'success', text: `${type === 'quotation' ? 'Quotation' : 'Invoice'} shared successfully via Email!` });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-black text-fg-primary tracking-tighter uppercase leading-none">Manual Billing & <span className="text-blue-500 italic">Quotation</span></h1>
            <p className="text-fg-muted text-lg font-medium">Create sample quotations and instant manual bills with direct WhatsApp and Email sharing.</p>
          </div>
          <button 
            onClick={() => { setCart([]); setCustomerPhone(''); setCustomerName(''); setCustomerAddress(''); setCustomerEmail(''); setLookupStatus('idle'); }}
            className="flex items-center space-x-3 px-6 py-3 bg-bg-muted border border-border-base text-fg-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-bg-surface transition-all shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset Form</span>
          </button>
        </div>

        {msg.text && (
          <div className={`p-6 rounded-3xl border flex items-center gap-4 text-white ${msg.type === 'success' ? 'bg-green-600 border-green-500' : 'bg-red-600 border-red-500'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="h-6 w-6 shrink-0" /> : <AlertCircle className="h-6 w-6 shrink-0" />}
            <p className="font-black text-xs uppercase tracking-widest">{msg.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Side */}
          <div className="lg:col-span-7 space-y-8">
            {/* Customer Details */}
            <div className="glass-card bg-bg-muted/40 border border-border-base rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 blur-[80px] pointer-events-none" />
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-blue-600/10 rounded-xl">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="font-black text-sm text-fg-primary uppercase tracking-widest">Customer Intel</h3>
                </div>
                {lookupStatus === 'searching' && <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest animate-pulse">Searching...</span>}
                {lookupStatus === 'existing' && <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-[10px] font-black uppercase tracking-widest">âœ“ Existing Customer</span>}
                {lookupStatus === 'new' && <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest">+ New Customer</span>}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-4 mr-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Phone Number (Required for WhatsApp & Calling)</label>
                    {customerPhone.trim().length >= 10 && (
                      <a 
                        href={`tel:${customerPhone.replace(/\D/g, '')}`}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 hover:bg-green-500 hover:text-white text-green-400 border border-green-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                      >
                        <Phone className="h-3 w-3" /> Call Customer
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
                    <input 
                      type="text"
                      placeholder="Enter 10-digit mobile number"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full bg-bg-surface border border-border-base rounded-2xl pl-12 pr-5 py-4 font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Customer Name</label>
                  <input 
                    type="text"
                    placeholder="Enter full name"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-bg-surface border border-border-base rounded-2xl px-5 py-4 font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Customer Email</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
                    <input 
                      type="email"
                      placeholder="Enter email address"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      className="w-full bg-bg-surface border border-border-base rounded-2xl pl-12 pr-5 py-4 font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Installation Site / Address</label>
                  <textarea 
                    rows={2}
                    placeholder="Enter physical site address"
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    className="w-full bg-bg-surface border border-border-base rounded-2xl px-5 py-4 font-bold text-fg-primary outline-none focus:border-blue-600 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Inventory Selection */}
            <div className="glass-card bg-bg-muted/40 border border-border-base rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center space-x-3 pb-4 border-b border-border-subtle">
                <div className="p-2.5 bg-blue-600/10 rounded-xl">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-black text-sm text-fg-primary uppercase tracking-widest">Inventory & Items</h3>
              </div>

              {/* Catalog Select */}
              <div className="flex flex-col sm:flex-row gap-4">
                <select 
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="flex-1 bg-bg-surface border border-border-base rounded-2xl px-5 py-4 font-bold text-fg-primary outline-none focus:border-blue-600 transition-all cursor-pointer"
                >
                  <option value="">Select product from master catalog...</option>
                  {productsList.map(p => (
                    <option key={p._id} value={p._id}>{p.name} - â‚¹{p.price?.toLocaleString()} ({p.stock} in stock)</option>
                  ))}
                </select>
                <button 
                  onClick={addCatalogProduct}
                  disabled={!selectedProductId}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              {/* Custom Item */}
              <div className="p-6 bg-bg-surface border border-border-base rounded-2xl space-y-4">
                <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Add Custom Item / Service Charge</p>
                <input 
                  type="text"
                  placeholder="Custom Item Name (e.g., Extended Cabling, Wiring labor)"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 font-bold text-fg-primary outline-none focus:border-blue-600"
                />
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[120px]">
                    <input 
                      type="number"
                      placeholder="Unit Price (â‚¹)"
                      value={customPrice}
                      onChange={e => setCustomPrice(e.target.value)}
                      className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 font-bold text-fg-primary outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="w-28 sm:w-32">
                    <input 
                      type="number"
                      placeholder="Qty"
                      value={customQty}
                      onChange={e => setCustomQty(e.target.value)}
                      className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 font-bold text-fg-primary outline-none focus:border-blue-600 text-center"
                    />
                  </div>
                  <button 
                    onClick={addCustomProduct}
                    className="px-6 py-3 bg-bg-muted hover:bg-blue-600 hover:text-white border border-border-base rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4" /> Add Custom
                  </button>
                </div>
              </div>
            </div>

            {/* GST Customization & Notes */}
            <div className="glass-card bg-bg-muted/40 border border-border-base rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center space-x-3 pb-4 border-b border-border-subtle">
                <div className="p-2.5 bg-blue-600/10 rounded-xl">
                  <Percent className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-black text-sm text-fg-primary uppercase tracking-widest">Tax & Customization</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Applicable GST Percentage (%)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[0, 5, 12, 18, 28].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setGstPercentage(rate.toString())}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          gstPercentage === rate.toString()
                            ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20'
                            : 'bg-bg-surface text-fg-muted border-border-base hover:text-fg-primary hover:bg-bg-muted'
                        }`}
                      >
                        {rate}% GST
                      </button>
                    ))}
                  </div>
                  <input 
                    type="number"
                    placeholder="Custom GST %"
                    value={gstPercentage}
                    onChange={e => setGstPercentage(e.target.value)}
                    className="w-full bg-bg-surface border border-border-base rounded-2xl px-5 py-4 font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Quotation / Invoice Notes</label>
                  <textarea 
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-bg-surface border border-border-base rounded-2xl px-5 py-4 font-bold text-fg-primary outline-none focus:border-blue-600 transition-all resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Product / Service Warranty Period</label>
                  <input 
                    type="text"
                    placeholder="e.g. 12 Months Warranty"
                    value={warrantyPeriod}
                    onChange={e => setWarrantyPeriod(e.target.value)}
                    className="w-full bg-bg-surface border border-border-base rounded-2xl px-5 py-4 font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Exact Location / GPS Landmark</label>
                  <input 
                    type="text"
                    placeholder="e.g. Server Room A / Lat: 13.0827, Lng: 80.2707"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-bg-surface border border-border-base rounded-2xl px-5 py-4 font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cart & Sharing Side */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-bg-muted/40 border border-border-base rounded-3xl p-8 space-y-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] pointer-events-none" />
              
              <div className="flex items-center space-x-3 pb-4 border-b border-border-subtle">
                <div className="p-2.5 bg-blue-600/10 rounded-xl">
                  <Calculator className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-black text-sm text-fg-primary uppercase tracking-widest">Live Document Preview</h3>
              </div>

              {/* Items List */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-hide">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-fg-dim font-bold text-xs uppercase tracking-widest border border-dashed border-border-base rounded-2xl">
                    No items added to billing document yet.
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="p-4 bg-bg-surface border border-border-base rounded-2xl flex items-center justify-between gap-4">
                      <div>
                        <p className="font-black text-sm text-fg-primary uppercase tracking-tight">{item.name}</p>
                        <p className="text-xs text-fg-muted font-bold mt-0.5">{item.quantity} Ã— â‚¹{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-sm text-fg-primary">â‚¹{(item.price * item.quantity).toLocaleString()}</span>
                        <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Summary Calculations */}
              <div className="p-6 bg-bg-surface border border-border-base rounded-2xl space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-fg-muted">
                  <span>Subtotal Amount</span>
                  <span>â‚¹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-fg-muted">
                  <span>GST Tax ({gstRate}%)</span>
                  <span>â‚¹{gstAmount.toLocaleString()}</span>
                </div>
                <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-lg font-black text-fg-primary">
                  <span>Grand Total</span>
                  <span className="text-blue-500">â‚¹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="space-y-4">
                <button 
                  onClick={handleGenerateBill}
                  disabled={loading}
                  className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-98 mb-6 disabled:opacity-50"
                >
                  <FileText className="h-5 w-5" />
                  <span>{loading ? 'Saving...' : 'Save & Generate Official Invoice'}</span>
                </button>

                <button 
                  onClick={() => handleShareWhatsApp('quotation')}
                  className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-green-600/20 transition-all flex items-center justify-center gap-3 active:scale-98"
                >
                  <Send className="h-4 w-4" />
                  <span>Share Sample Quotation (WhatsApp)</span>
                </button>
                <button 
                  onClick={() => handleShareWhatsApp('invoice')}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-98"
                >
                  <Send className="h-4 w-4" />
                  <span>Share Final Invoice (WhatsApp)</span>
                </button>
                <button 
                  onClick={() => handleShareEmail('quotation')}
                  className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-purple-600/20 transition-all flex items-center justify-center gap-3 active:scale-98"
                >
                  <Mail className="h-4 w-4" />
                  <span>Share Sample Quotation (Email)</span>
                </button>
                <button 
                  onClick={() => handleShareEmail('invoice')}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-98"
                >
                  <Mail className="h-4 w-4" />
                  <span>Share Final Invoice (Email)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TechnicianBillingPage = () => {
  return (
    <ProtectedRoute allowedRoles={['technician']}>
      <TechnicianBilling />
    </ProtectedRoute>
  );
};

export default TechnicianBillingPage;
