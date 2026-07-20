"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { ShieldCheck, Plus, Package, Clock, CheckCircle, AlertCircle, Edit, Trash2, X } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { format } from 'date-fns';

export default function ProductWarrantyPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    } catch (e: any) {
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
    } catch (err: any) {
      alert("Failed to save warranty");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warranty claim?')) return;
    try {
      await fetchWithAuth(`/product-warranty/${id}`, { method: 'DELETE' });
      fetchWarranties();
    } catch (err: any) {
      alert("Failed to delete warranty");
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <div className="flex min-h-screen bg-bg-body text-fg-primary">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="flex-1 lg:ml-80 flex flex-col min-h-screen transition-all duration-300">
          <AdminNavbar />
          
          <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-600/10 rounded-2xl">
                  <ShieldCheck className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight">Product Warranty</h1>
                  <p className="text-fg-muted font-medium text-sm">Manage hardware replacements and supplier claims</p>
                </div>
              </div>
              <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors w-full md:w-auto justify-center">
                <Plus className="h-5 w-5" />
                New Warranty Claim
              </button>
            </header>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
               <div className="bg-bg-surface border border-border-base rounded-2xl p-6">
                 <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500"><Package className="h-6 w-6"/></div>
                   <h3 className="font-bold text-fg-muted">Total Claims</h3>
                 </div>
                 <p className="text-4xl font-black">{warranties.length}</p>
               </div>
               <div className="bg-bg-surface border border-border-base rounded-2xl p-6">
                 <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500"><Clock className="h-6 w-6"/></div>
                   <h3 className="font-bold text-fg-muted">Pending</h3>
                 </div>
                 <p className="text-4xl font-black">{warranties.filter(w => w.status === 'Created' || w.status === 'Supplier Reviewing').length}</p>
               </div>
                <div className="bg-bg-surface border border-border-base rounded-2xl p-6">
                 <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><AlertCircle className="h-6 w-6"/></div>
                   <h3 className="font-bold text-fg-muted">Follow-ups Due</h3>
                 </div>
                 <p className="text-4xl font-black">{warranties.filter(w => w.followUpStatus === 'Pending' || w.followUpStatus === 'In Progress').length}</p>
               </div>
               <div className="bg-bg-surface border border-border-base rounded-2xl p-6">
                 <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 bg-green-500/10 rounded-xl text-green-500"><CheckCircle className="h-6 w-6"/></div>
                   <h3 className="font-bold text-fg-muted">Resolved</h3>
                 </div>
                 <p className="text-4xl font-black">{warranties.filter(w => w.status === 'Resolved' || w.status === 'Closed').length}</p>
               </div>
            </div>

            {/* Warranty Data Table */}
            <div className="bg-bg-surface border border-border-base rounded-2xl overflow-hidden shadow-sm">
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
                          <td className="p-4 text-right space-x-2">
                             <button onClick={() => openModal(item)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors inline-block"><Edit className="h-4 w-4" /></button>
                             <button onClick={() => handleDelete(item._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors inline-block"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-surface border border-border-base rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border-base flex justify-between items-center bg-bg-muted/30 shrink-0">
              <h2 className="text-xl font-black uppercase tracking-tight">{isEditing ? 'Edit Warranty Claim' : 'New Warranty Claim'}</h2>
              <button onClick={closeModal} className="p-2 text-fg-muted hover:text-red-500 bg-bg-surface rounded-full transition-colors"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="overflow-y-auto p-6 flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Customer Name</label>
                  <input required name="customerName" value={formData.customerName || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Mobile Number</label>
                  <input required name="customerMobile" value={formData.customerMobile || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Installation Address</label>
                  <input required name="installationAddress" value={formData.installationAddress || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Supplier Name</label>
                  <input required name="supplierName" value={formData.supplierName || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Product Category</label>
                  <input required name="productCategory" value={formData.productCategory || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Product Name</label>
                  <input required name="productName" value={formData.productName || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Status</label>
                  <select name="status" value={formData.status || 'Created'} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none cursor-pointer">
                    <option value="Created">Created</option>
                    <option value="Submitted to Supplier">Submitted to Supplier</option>
                    <option value="Supplier Reviewing">Supplier Reviewing</option>
                    <option value="Waiting for Approval">Waiting for Approval</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                
                {/* New Follow-up fields */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Follow-up Status</label>
                  <select name="followUpStatus" value={formData.followUpStatus || 'Pending'} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none cursor-pointer">
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Next Follow-up Date</label>
                  <input type="date" name="nextFollowUpDate" value={formData.nextFollowUpDate ? formData.nextFollowUpDate.split('T')[0] : ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Issue Description</label>
                  <textarea required name="issueDescription" rows={3} value={formData.issueDescription || ''} onChange={handleChange} className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none resize-none" />
                </div>
              </div>
              <div className="pt-4 border-t border-border-base flex justify-end gap-3 shrink-0">
                <button type="button" onClick={closeModal} className="px-6 py-3 rounded-xl font-bold text-fg-muted hover:bg-bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : (isEditing ? 'Update Claim' : 'Create Claim')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
