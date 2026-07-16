"use client";
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Package, Clock, CheckCircle, AlertCircle, Edit, X } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { format } from 'date-fns';

export default function ProductWarrantyPage() {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWarranties();
  }, []);

  const fetchWarranties = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/product-warranty');
      setWarranties(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (warranty = null) => {
    if (warranty) {
      setFormData(warranty);
      setIsEditing(true);
    } else {
      setFormData({
        customerName: '', customerMobile: '', installationAddress: '',
        supplierName: '', productCategory: '', productName: '',
        issueDescription: '', status: 'Created'
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        await fetchWithAuth(`/product-warranty/${formData._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await fetchWithAuth('/product-warranty', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      closeModal();
      fetchWarranties();
    } catch (err) {
      alert("Failed to save warranty");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg-body text-fg-primary pb-24 lg:pb-0">
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600/10 rounded-2xl">
              <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Product Warranty</h1>
              <p className="text-fg-muted font-medium text-xs md:text-sm">Manage hardware replacements</p>
            </div>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors w-full md:w-auto justify-center">
            <Plus className="h-5 w-5" />
            New Warranty Claim
          </button>
        </header>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           <div className="bg-bg-surface border border-border-base rounded-2xl p-4 md:p-6">
             <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
               <div className="p-2 md:p-3 bg-purple-500/10 rounded-xl text-purple-500"><Package className="h-4 w-4 md:h-6 md:w-6"/></div>
               <h3 className="font-bold text-fg-muted text-xs md:text-sm uppercase tracking-widest hidden sm:block">Claims</h3>
             </div>
             <p className="text-2xl md:text-4xl font-black">{warranties.length}</p>
             <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest sm:hidden mt-1">Claims</p>
           </div>
           <div className="bg-bg-surface border border-border-base rounded-2xl p-4 md:p-6">
             <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
               <div className="p-2 md:p-3 bg-orange-500/10 rounded-xl text-orange-500"><Clock className="h-4 w-4 md:h-6 md:w-6"/></div>
               <h3 className="font-bold text-fg-muted text-xs md:text-sm uppercase tracking-widest hidden sm:block">Pending</h3>
             </div>
             <p className="text-2xl md:text-4xl font-black">{warranties.filter(w => w.status === 'Created' || w.status === 'Supplier Reviewing').length}</p>
             <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest sm:hidden mt-1">Pending</p>
           </div>
           <div className="bg-bg-surface border border-border-base rounded-2xl p-4 md:p-6 hidden sm:block">
             <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
               <div className="p-2 md:p-3 bg-blue-500/10 rounded-xl text-blue-500"><AlertCircle className="h-4 w-4 md:h-6 md:w-6"/></div>
               <h3 className="font-bold text-fg-muted text-xs md:text-sm uppercase tracking-widest">Follow-up</h3>
             </div>
             <p className="text-2xl md:text-4xl font-black">0</p>
           </div>
           <div className="bg-bg-surface border border-border-base rounded-2xl p-4 md:p-6 hidden sm:block">
             <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
               <div className="p-2 md:p-3 bg-green-500/10 rounded-xl text-green-500"><CheckCircle className="h-4 w-4 md:h-6 md:w-6"/></div>
               <h3 className="font-bold text-fg-muted text-xs md:text-sm uppercase tracking-widest">Resolved</h3>
             </div>
             <p className="text-2xl md:text-4xl font-black">{warranties.filter(w => w.status === 'Resolved' || w.status === 'Closed').length}</p>
           </div>
        </div>

        {/* Warranty Data Table - Mobile Cards */}
        <div className="space-y-4 md:hidden">
          {loading ? (
            <p className="text-center p-8 text-fg-muted font-bold">Loading claims...</p>
          ) : warranties.length === 0 ? (
            <div className="p-8 text-center bg-bg-surface border border-border-base rounded-2xl">
               <p className="text-fg-muted font-bold">No product warranty claims found.</p>
            </div>
          ) : (
            warranties.map((item) => (
              <div key={item._id} className="bg-bg-surface border border-border-base rounded-2xl p-4 space-y-3 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-fg-primary">{item.customerName}</p>
                    <p className="text-xs font-bold text-fg-muted">{item.customerMobile}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {item.status}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-bold text-fg-secondary">{item.productName}</p>
                  <p className="text-[10px] font-mono text-fg-muted mt-1">SN: {item.serialNumber || 'N/A'}</p>
                </div>
                <div className="flex justify-end pt-3 border-t border-border-base">
                  <button onClick={() => openModal(item)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors font-bold text-xs flex items-center gap-2">
                    <Edit className="h-4 w-4" /> Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Warranty Data Table - Desktop */}
        <div className="hidden md:block bg-bg-surface border border-border-base rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border-base flex justify-between items-center bg-bg-muted/30">
            <h2 className="text-lg font-bold">Active Claims</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-bg-muted/50 border-b border-border-base text-xs uppercase tracking-widest text-fg-muted">
                  <th className="p-4 font-black">Date</th>
                  <th className="p-4 font-black">Customer</th>
                  <th className="p-4 font-black">Product</th>
                  <th className="p-4 font-black">Supplier</th>
                  <th className="p-4 font-black">Status</th>
                  <th className="p-4 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-fg-muted">Loading claims...</td></tr>
                ) : warranties.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-fg-muted">No product warranty claims found.</td></tr>
                ) : (
                  warranties.map((item) => (
                    <tr key={item._id} className="border-b border-border-base/50 hover:bg-bg-muted/20">
                      <td className="p-4 font-medium text-sm">{format(new Date(item.createdAt), 'dd MMM yyyy')}</td>
                      <td className="p-4">
                         <p className="font-bold">{item.customerName}</p>
                         <p className="text-xs text-fg-muted">{item.customerMobile}</p>
                      </td>
                      <td className="p-4">
                         <p className="font-bold">{item.productName}</p>
                         <p className="text-xs text-fg-muted font-mono">{item.serialNumber || 'No SN'}</p>
                      </td>
                      <td className="p-4 text-sm font-medium">{item.supplierName}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-500">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                         <button onClick={() => openModal(item)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors inline-block">
                           <Edit className="h-4 w-4" />
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-surface border border-border-base rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 md:p-6 border-b border-border-base flex justify-between items-center bg-bg-muted/30 shrink-0">
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">{isEditing ? 'Edit Warranty Claim' : 'New Warranty Claim'}</h2>
              <button onClick={closeModal} className="p-2 text-fg-muted hover:text-red-500 bg-bg-surface rounded-full transition-colors"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="overflow-y-auto p-4 md:p-6 flex-1 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Customer Name</label>
                  <input required name="customerName" value={formData.customerName || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Mobile Number</label>
                  <input required name="customerMobile" value={formData.customerMobile || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1 md:space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Installation Address</label>
                  <input required name="installationAddress" value={formData.installationAddress || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Supplier Name</label>
                  <input required name="supplierName" value={formData.supplierName || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Product Category</label>
                  <input required name="productCategory" value={formData.productCategory || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Product Name</label>
                  <input required name="productName" value={formData.productName || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Serial Number</label>
                  <input name="serialNumber" value={formData.serialNumber || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Status</label>
                  <select name="status" value={formData.status || 'Created'} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none cursor-pointer">
                    <option value="Created">Created</option>
                    <option value="Submitted to Supplier">Submitted to Supplier</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="space-y-1 md:space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Issue Description</label>
                  <textarea required name="issueDescription" rows={3} value={formData.issueDescription || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none resize-none" />
                </div>
              </div>
              <div className="pt-4 border-t border-border-base flex justify-end gap-3 shrink-0 mt-6">
                <button type="button" onClick={closeModal} className="px-6 py-3 rounded-xl font-bold text-fg-muted hover:bg-bg-muted transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm">
                  {saving ? 'Saving...' : (isEditing ? 'Update Claim' : 'Create Claim')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
