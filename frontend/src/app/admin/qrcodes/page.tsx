"use client";

import React, { useState, useEffect } from 'react';
import { QrCode, Plus, Search, Edit2, Trash2, Power, Eye, Upload, Save, X, Copy, RefreshCw, Link2, Smartphone } from 'lucide-react';
import { fetchWithAuth, getImageUrl } from '@/utils/api';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { Menu } from 'lucide-react';

interface QRCodeData {
  _id: string;
  qrName: string;
  category: string;
  customCategory?: string;
  qrImage: string;
  description?: string;
  displayOrder: number;
  status: boolean;
  isDefault: boolean;
  icon: string;
  color: string;
  targetType?: string;
  targetValue?: string;
  notes?: string;
}

const CATEGORIES = [
  'Payment', 'Social Media', 'Website', 'WiFi',
  'Customer Support', 'Business', 'Marketing',
  'Documents', 'Other', 'Custom'
];

const ICONS = ['QrCode', 'CreditCard', 'Instagram', 'Youtube', 'Globe', 'Wifi', 'Phone', 'Briefcase', 'FileText', 'Share2'];
const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export default function AdminQRCodesPage() {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<QRCodeData>>({
    qrName: '', category: 'Payment', customCategory: '', qrImage: '',
    description: '', displayOrder: 0, status: true, isDefault: false,
    icon: 'QrCode', color: '#3b82f6', targetType: '', targetValue: '', notes: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    try {
      const data = await fetchWithAuth('/qrcodes');
      setQrCodes(data);
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Failed to fetch QR codes', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (qr?: QRCodeData) => {
    if (qr) {
      setFormData(qr);
      setEditingId(qr._id);
    } else {
      setFormData({
        qrName: '', category: 'Payment', customCategory: '', qrImage: '',
        description: '', displayOrder: qrCodes.length, status: true, isDefault: false,
        icon: 'QrCode', color: '#3b82f6', targetType: 'Image', targetValue: '', notes: ''
      });
      setEditingId(null);
    }
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('images', file);

    setUploading(true);
    try {
      const res = await fetchWithAuth('/upload?type=qrcode', {
        method: 'POST',
        body: data,
      });
      if (res && res.imageUrl) {
        setFormData((prev) => ({ ...prev, qrImage: res.imageUrl }));
        setToast({ message: 'Image uploaded successfully', type: 'success' });
      }
    } catch (error: any) {
      console.error('Upload Error:', error);
      setToast({ message: 'Image upload failed', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.qrName || !formData.qrImage) {
      setToast({ message: 'Name and QR Image are required', type: 'error' });
      return;
    }

    const payload = { ...formData };
    if (!payload.targetType) {
      payload.targetType = 'Image';
    }

    try {
      if (editingId) {
        await fetchWithAuth(`/qrcodes/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        setToast({ message: 'QR Code updated successfully', type: 'success' });
      } else {
        await fetchWithAuth('/qrcodes', { method: 'POST', body: JSON.stringify(payload) });
        setToast({ message: 'QR Code created successfully', type: 'success' });
      }
      setModalOpen(false);
      fetchQRCodes();
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Failed to save QR code', type: 'error' });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await fetchWithAuth(`/qrcodes/${id}/toggle`, { method: 'PUT' });
      setToast({ message: 'Status toggled successfully', type: 'success' });
      fetchQRCodes();
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Failed to toggle status', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this QR Code?')) return;
    try {
      await fetchWithAuth(`/qrcodes/${id}`, { method: 'DELETE' });
      setToast({ message: 'QR Code deleted', type: 'success' });
      fetchQRCodes();
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Failed to delete QR Code', type: 'error' });
    }
  };

  const filtered = qrCodes.filter(qr => 
    qr.qrName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen mesh-bg bg-background text-fg-primary flex overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0 lg:ml-[280px] flex flex-col min-h-screen animate-fade-in">
        <AdminNavbar />
        <div className="p-6 md:p-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-surface p-6 rounded-2xl border border-border-base shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 glass-card rounded-2xl border border-[#1E3A8A]/15 hover:border-[#1E3A8A]/30 transition-all group">
                <Menu className="h-5 w-5 text-[#1E3A8A] group-hover:scale-110 transition-transform" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-fg-primary tracking-tight flex items-center gap-3">
                  <QrCode className="text-[#14B8A6] h-8 w-8" />
                  QR Code Center
                </h1>
                <p className="text-fg-muted text-sm mt-1">Manage and sync dynamic QR codes across all technician devices.</p>
              </div>
            </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
            <input
              type="text"
              placeholder="Search QR codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-muted border border-border-base rounded-xl pl-10 pr-4 py-2.5 text-sm text-fg-primary placeholder:text-fg-muted focus:outline-none focus:border-[#14B8A6]/50 transition-colors"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-bg-surface border border-border-base rounded-2xl h-64 animate-pulse"></div>
          ))}
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(qr => (
            <div key={qr._id} className="group relative bg-bg-surface border border-border-base rounded-2xl overflow-hidden hover:border-border-strong transition-all shadow-sm">
              <div className="absolute top-3 right-3 z-10 flex gap-2">
                <button
                  onClick={() => handleToggle(qr._id)}
                  className={`p-2 rounded-xl backdrop-blur-md border ${qr.status ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
                >
                  <Power className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 flex flex-col items-center">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-border-base shadow-lg"
                  style={{ backgroundColor: `${qr.color}15` }}
                >
                  {/* Try to render matching lucide icon or fallback */}
                  <div style={{ color: qr.color }}>
                    <QrCode className="h-8 w-8" />
                  </div>
                </div>
                
                <h3 className="text-fg-primary font-bold text-lg text-center">{qr.qrName}</h3>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-bg-muted text-fg-muted mt-2">
                  {qr.category === 'Custom' ? qr.customCategory : qr.category}
                </span>

                <div className="w-full mt-6 flex justify-between items-center border-t border-border-base pt-4">
                  <button onClick={() => handleOpenModal(qr)} className="flex items-center gap-1 text-sm text-[#14B8A6] hover:text-[#0D9488] transition-colors font-semibold">
                    <Edit2 className="h-4 w-4" /> Edit
                  </button>
                  <button onClick={() => handleDelete(qr._id)} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition-colors font-semibold">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center flex flex-col items-center text-fg-muted">
              <QrCode className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-semibold">No QR codes found.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-surface w-full max-w-2xl rounded-2xl shadow-2xl border border-border-strong overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 flex justify-between items-center border-b border-border-base bg-bg-muted/30">
              <h2 className="text-xl font-bold text-fg-primary flex items-center gap-2">
                {editingId ? <Edit2 className="h-5 w-5 text-[#14B8A6]" /> : <Plus className="h-5 w-5 text-[#14B8A6]" />}
                {editingId ? 'Edit QR Code' : 'Add New QR Code'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-fg-muted hover:text-fg-primary transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">QR Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.qrName}
                      onChange={(e) => setFormData({ ...formData, qrName: e.target.value })}
                      className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-fg-primary focus:outline-none focus:border-[#14B8A6]/50"
                      placeholder="e.g. Google Pay Account 1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-fg-primary focus:outline-none focus:border-[#14B8A6]/50"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c} className="bg-bg-surface">{c}</option>)}
                    </select>
                  </div>

                  {formData.category === 'Custom' && (
                    <div>
                      <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Custom Category</label>
                      <input
                        type="text"
                        value={formData.customCategory}
                        onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                        className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-fg-primary focus:outline-none focus:border-[#14B8A6]/50"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Target Type (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. UPI, URL"
                      value={formData.targetType}
                      onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                      className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-fg-primary focus:outline-none focus:border-[#14B8A6]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Target Value (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. upi@id or https://..."
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                      className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-fg-primary focus:outline-none focus:border-[#14B8A6]/50"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">QR Image *</label>
                    <div className="border-2 border-dashed border-border-strong rounded-2xl p-4 flex flex-col items-center justify-center bg-bg-muted/30 hover:bg-bg-muted transition-colors relative cursor-pointer group h-48 overflow-hidden">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
                      />
                      {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#14B8A6]"></div>
                      ) : formData.qrImage ? (
                        <div className="absolute inset-2 flex items-center justify-center pointer-events-none">
                          <img src={getImageUrl(formData.qrImage)} alt="QR" className="max-w-full max-h-full object-contain rounded-xl" />
                        </div>
                      ) : (
                        <div className="pointer-events-none flex flex-col items-center">
                          <Upload className="h-8 w-8 text-fg-muted group-hover:text-[#14B8A6] transition-colors mb-2" />
                          <span className="text-sm font-semibold text-fg-muted">Upload QR Image</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Color Tag</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.color === color ? 'border-fg-primary scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Display Order</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-fg-primary focus:outline-none focus:border-[#14B8A6]/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-fg-primary focus:outline-none focus:border-[#14B8A6]/50 min-h-[100px]"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 mt-4 bg-bg-muted/30 p-4 rounded-xl border border-border-base">
                 <input 
                    type="checkbox" 
                    id="statusToggle"
                    checked={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                    className="w-4 h-4 rounded text-[#14B8A6] bg-bg-surface border-border-strong"
                 />
                 <label htmlFor="statusToggle" className="text-fg-primary font-semibold">Active Status</label>
              </div>

            </div>

            <div className="p-6 border-t border-border-base bg-bg-muted/30 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-fg-muted hover:bg-bg-muted hover:text-fg-primary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={uploading}
                className="flex items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold transition-all"
              >
                <Save className="h-4 w-4" />
                {editingId ? 'Update QR Code' : 'Save QR Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg text-white font-semibold flex justify-between items-center gap-4 z-50 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}><X className="h-4 w-4" /></button>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}
