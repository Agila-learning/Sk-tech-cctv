"use client";
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { 
  Plus, Trash2, Printer, Save, FileText, Send, 
  ScanLine, Box, ArrowLeft, Paperclip, Eye, Settings, X
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function ManualInvoiceContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    template: 'standard',
    logo: '',
    terms: '1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.',
    qrCode: ''
  });
  
  // Invoice State
  const [invoice, setInvoice] = useState({
    manualCustomer: { name: '', phone: '', email: '', address: '' },
    gstNumber: '',
    type: 'invoice', // or 'quotation'
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    taxRate: 18,
    discount: 0,
    notes: '',
    terms: '1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.',
  });
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'quotation' || typeParam === 'invoice') {
      setInvoice(prev => ({ ...prev, type: typeParam }));
    }
  }, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const prodData = await fetchWithAuth('/products');
        setProducts(prodData.products || prodData || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadProducts();

    const saved = localStorage.getItem('invoiceSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      setInvoice(prev => ({ ...prev, terms: parsed.terms || prev.terms }));
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('invoiceSettings', JSON.stringify(settings));
    setInvoice(prev => ({ ...prev, terms: settings.terms }));
    setShowSettings(false);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...invoice.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate row total
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (invoice.items.length <= 1) return;
    const newItems = invoice.items.filter((_, i) => i !== index);
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  // Calculations
  const subTotal = invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const taxAmount = (subTotal * invoice.taxRate) / 100;
  const totalAmount = subTotal + taxAmount - invoice.discount;

  const handleSave = async (isDraft = false) => {
    try {
      setLoading(true);
      const payload = {
        ...invoice,
        status: isDraft ? 'Draft' : 'Pending', // Pending payment
        totalAmount,
        subTotal,
        taxAmount
      };

      await fetchWithAuth('/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      alert('Invoice created successfully!');
      router.push('/admin/billing/sales-invoice');
    } catch (err: any) {
      alert(`Failed to save invoice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/billing/sales-invoice" className="p-2 hover:bg-gray-100 dark:hover:bg-bg-surface rounded-full transition">
            <ArrowLeft size={20} className="text-fg-primary" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-fg-primary">Create New Invoice</h2>
            <p className="text-sm text-fg-muted">Generate a professional tax invoice or quotation</p>
          </div>
        </div>
        <div className="flex bg-white dark:bg-bg-surface rounded-lg p-1 border border-border-base shadow-sm">
          <button 
            onClick={() => setInvoice(prev => ({ ...prev, type: 'invoice' }))}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${invoice.type === 'invoice' ? 'bg-blue-600 text-white shadow' : 'text-fg-muted hover:text-fg-primary'}`}
          >
            Invoice
          </button>
          <button 
            onClick={() => setInvoice(prev => ({ ...prev, type: 'quotation' }))}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${invoice.type === 'quotation' ? 'bg-blue-600 text-white shadow' : 'text-fg-muted hover:text-fg-primary'}`}
          >
            Quotation
          </button>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2.5 bg-white dark:bg-bg-surface border border-border-base rounded-lg text-fg-muted hover:text-fg-primary hover:shadow-sm transition"
        >
          <Settings size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details Box */}
          <div className="bg-white dark:bg-bg-surface rounded-2xl border border-border-base shadow-sm p-6">
            <h3 className="text-base font-bold text-fg-primary mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span> 
              Bill To
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1">Customer Name *</label>
                <input 
                  type="text" 
                  value={invoice.manualCustomer.name}
                  onChange={e => setInvoice(p => ({...p, manualCustomer: {...p.manualCustomer, name: e.target.value}}))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bg-base border border-border-base rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1">Phone Number *</label>
                <input 
                  type="text" 
                  value={invoice.manualCustomer.phone}
                  onChange={e => setInvoice(p => ({...p, manualCustomer: {...p.manualCustomer, phone: e.target.value}}))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bg-base border border-border-base rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. +91 9876543210"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-fg-muted mb-1">Billing Address</label>
                <textarea 
                  value={invoice.manualCustomer.address}
                  onChange={e => setInvoice(p => ({...p, manualCustomer: {...p.manualCustomer, address: e.target.value}}))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-bg-base border border-border-base rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                  placeholder="Full billing address..."
                />
              </div>
            </div>
          </div>

          {/* Items Box */}
          <div className="bg-white dark:bg-bg-surface rounded-2xl border border-border-base shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-base flex justify-between items-center">
              <h3 className="text-base font-bold text-fg-primary flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span> 
                Items & Services
              </h3>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition">
                  <ScanLine size={14} /> Scan Barcode
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-bg-base text-fg-muted text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold w-12">#</th>
                    <th className="p-4 font-semibold min-w-[200px]">Item Description</th>
                    <th className="p-4 font-semibold w-24">Qty</th>
                    <th className="p-4 font-semibold w-32">Rate (₹)</th>
                    <th className="p-4 font-semibold w-32">Amount</th>
                    <th className="p-4 font-semibold w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="bg-white dark:bg-bg-surface">
                      <td className="p-4 text-sm text-fg-muted">{idx + 1}</td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          value={item.description}
                          onChange={(e) => {
                            handleItemChange(idx, 'description', e.target.value);
                            const matched = products.find(p => p.name === e.target.value);
                            if (matched) {
                              handleItemChange(idx, 'unitPrice', matched.price || matched.salePrice || 0);
                            }
                          }}
                          list={`products-list-${idx}`}
                          placeholder="Product or service name..."
                          className="w-full px-3 py-2 bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-500 rounded-md text-sm outline-none transition"
                        />
                        <datalist id={`products-list-${idx}`}>
                          {products.map(p => (
                            <option key={p._id} value={p.name} />
                          ))}
                        </datalist>
                      </td>
                      <td className="p-4">
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-500 rounded-md text-sm outline-none transition text-center"
                        />
                      </td>
                      <td className="p-4">
                        <input 
                          type="number" 
                          value={item.unitPrice || ''}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-500 rounded-md text-sm outline-none transition"
                        />
                      </td>
                      <td className="p-4 font-semibold text-fg-primary">
                        ₹{(item.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => removeItem(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-bg-base border-t border-border-base">
              <button 
                onClick={addItem}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                <Plus size={16} /> Add Row
              </button>
            </div>
          </div>
          
          {/* Notes & Terms */}
          <div className="bg-white dark:bg-bg-surface rounded-2xl border border-border-base shadow-sm p-6">
            <h3 className="text-base font-bold text-fg-primary mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 flex items-center justify-center rounded-full text-xs">3</span> 
              Additional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1">Internal Notes (Not printed)</label>
                <textarea 
                  value={invoice.notes}
                  onChange={e => setInvoice(p => ({...p, notes: e.target.value}))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-bg-base border border-border-base rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                  placeholder="Notes for internal team..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1">Terms & Conditions</label>
                <textarea 
                  value={invoice.terms}
                  onChange={e => setInvoice(p => ({...p, terms: e.target.value}))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-bg-base border border-border-base rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-bg-surface rounded-2xl border border-border-base shadow-sm p-6 sticky top-6">
            <h3 className="text-lg font-bold text-fg-primary mb-4 border-b border-border-base pb-3">Payment Summary</h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-fg-muted font-medium">
                <span>Subtotal</span>
                <span className="text-fg-primary">₹{subTotal.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between items-center text-fg-muted font-medium">
                <span>Discount (₹)</span>
                <input 
                  type="number" 
                  value={invoice.discount || ''}
                  onChange={e => setInvoice(p => ({...p, discount: Number(e.target.value)}))}
                  className="w-24 px-2 py-1 bg-gray-50 border border-border-base rounded text-right focus:ring-1 focus:ring-blue-500 outline-none text-fg-primary"
                />
              </div>
              
              <div className="flex justify-between items-center text-fg-muted font-medium">
                <span>GST / Tax Rate (%)</span>
                <select 
                  value={invoice.taxRate}
                  onChange={e => setInvoice(p => ({...p, taxRate: Number(e.target.value)}))}
                  className="w-24 px-2 py-1 bg-gray-50 border border-border-base rounded text-right focus:ring-1 focus:ring-blue-500 outline-none text-fg-primary"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>

              <div className="flex justify-between text-fg-muted font-medium border-b border-border-base pb-4">
                <span>Tax Amount</span>
                <span className="text-fg-primary">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-bold text-fg-primary">Total Amount</span>
                <span className="text-2xl font-black text-blue-600">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button 
                onClick={() => handleSave(false)}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-blue-500/20"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={18} /> Save {invoice.type === 'invoice' ? 'Invoice' : 'Quotation'}</>}
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                   onClick={() => handleSave(true)}
                   disabled={loading}
                   className="py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-bg-base dark:hover:bg-bg-hover text-fg-primary rounded-xl font-semibold flex items-center justify-center gap-2 transition text-sm"
                >
                  <FileText size={16} /> Save Draft
                </button>
                <button className="py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-bg-base dark:hover:bg-bg-hover text-fg-primary rounded-xl font-semibold flex items-center justify-center gap-2 transition text-sm">
                  <Eye size={16} /> Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-bg-surface w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border-base flex items-center justify-between">
              <h3 className="text-xl font-bold text-fg-primary">Invoice Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-fg-muted hover:text-fg-primary">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg-primary mb-1">Default Template</label>
                <select 
                  value={settings.template}
                  onChange={e => setSettings(p => ({ ...p, template: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-bg-base border border-border-base rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="standard">Standard Business</option>
                  <option value="modern">Modern Minimal</option>
                  <option value="bold">Bold & Creative</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-fg-primary mb-1">Company Logo URL (Optional)</label>
                <input 
                  type="text" 
                  value={settings.logo}
                  onChange={e => setSettings(p => ({ ...p, logo: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-bg-base border border-border-base rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fg-primary mb-1">Payment QR Code URL (UPI)</label>
                <input 
                  type="text" 
                  value={settings.qrCode}
                  onChange={e => setSettings(p => ({ ...p, qrCode: e.target.value }))}
                  placeholder="Link to QR image"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-bg-base border border-border-base rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fg-primary mb-1">Default Terms & Conditions</label>
                <textarea 
                  value={settings.terms}
                  onChange={e => setSettings(p => ({ ...p, terms: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-bg-base border border-border-base rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border-base bg-gray-50 dark:bg-bg-base flex justify-end gap-3">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-5 py-2 text-sm font-semibold text-fg-muted hover:text-fg-primary transition"
              >
                Cancel
              </button>
              <button 
                onClick={saveSettings}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ManualInvoice() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-bg-base text-fg-primary">Loading...</div>}>
      <ManualInvoiceContent />
    </Suspense>
  );
}
