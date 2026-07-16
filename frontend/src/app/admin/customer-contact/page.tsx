"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { Users, Plus, PhoneCall, MessageCircle, MapPin, Download, Search, Edit, Trash2, X } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CustomerContactPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/customer-contact');
      setContacts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (contact = null) => {
    if (contact) {
      setFormData(contact);
      setIsEditing(true);
    } else {
      setFormData({
        customerName: '', mobileNumber: '', alternateNumber: '', email: '',
        address: '', location: '', customerType: 'Residential', notes: ''
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
        await fetchWithAuth(`/customer-contact/${formData._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await fetchWithAuth('/customer-contact', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      closeModal();
      fetchContacts();
    } catch (err) {
      alert("Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await fetchWithAuth(`/customer-contact/${id}`, { method: 'DELETE' });
      fetchContacts();
    } catch (err) {
      alert("Failed to delete contact");
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobileNumber?.includes(searchTerm) ||
    c.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <div className="flex min-h-screen bg-bg-body text-fg-primary">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="flex-1 lg:ml-80 flex flex-col min-h-screen transition-all duration-300">
          <AdminNavbar />
          
          <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-600/10 rounded-2xl">
                  <Users className="h-8 w-8 text-indigo-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight">Customer Contact</h1>
                  <p className="text-fg-muted font-medium text-sm">CRM directory for all leads and customers</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <button className="flex items-center justify-center gap-2 bg-bg-surface border border-border-base px-4 py-3 rounded-xl font-bold hover:bg-bg-muted transition-colors w-full md:w-auto">
                  <Download className="h-5 w-5" /> Export
                </button>
                <button onClick={() => openModal()} className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors w-full md:w-auto">
                  <Plus className="h-5 w-5" />
                  Add Customer
                </button>
              </div>
            </header>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted" />
                <input 
                  type="text" 
                  placeholder="Search by name, phone or area..." 
                  className="w-full pl-10 pr-4 py-3 bg-bg-surface border border-border-base rounded-xl focus:outline-none focus:border-indigo-500 font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Contacts Table */}
            <div className="bg-bg-surface border border-border-base rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-bg-muted/50 border-b border-border-base text-xs uppercase tracking-widest text-fg-muted">
                      <th className="p-4 font-black">Customer Details</th>
                      <th className="p-4 font-black">Location / Type</th>
                      <th className="p-4 font-black text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={3} className="p-8 text-center text-fg-muted">Loading directory...</td></tr>
                    ) : filteredContacts.length === 0 ? (
                      <tr><td colSpan={3} className="p-8 text-center text-fg-muted">No customers found.</td></tr>
                    ) : (
                      filteredContacts.map((contact) => (
                        <tr key={contact._id} className="border-b border-border-base/50 hover:bg-bg-muted/20">
                          <td className="p-4">
                            <p className="font-black text-lg text-fg-primary uppercase tracking-tight">{contact.customerName}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-fg-secondary">
                                <PhoneCall className="h-3.5 w-3.5 text-indigo-500" />
                                {contact.mobileNumber}
                              </span>
                              {contact.email && (
                                <span className="text-xs font-medium text-fg-muted bg-bg-muted px-2 py-0.5 rounded-lg border border-border-base">{contact.email}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-2">
                              <span className="flex items-center gap-1.5 text-sm font-bold text-fg-primary">
                                <MapPin className="h-4 w-4 text-indigo-500" />
                                {contact.location || 'No Area Specified'}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 w-fit">
                                {contact.customerType}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                               <button 
                                 onClick={() => window.open(`tel:${contact.mobileNumber}`)}
                                 className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl transition-all"
                                 title="Call Customer"
                               >
                                 <PhoneCall className="h-4 w-4" />
                               </button>
                               <button 
                                 onClick={() => {
                                   const cleanPhone = contact.mobileNumber.replace(/\D/g, '');
                                   window.open(`https://wa.me/${cleanPhone}`, '_blank');
                                 }}
                                 className="p-2.5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl transition-all"
                                 title="WhatsApp Customer"
                               >
                                 <MessageCircle className="h-4 w-4" />
                               </button>
                               <button onClick={() => openModal(contact)} className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-500 hover:text-white rounded-xl transition-all">
                                 <Edit className="h-4 w-4" />
                               </button>
                               <button onClick={() => handleDelete(contact._id)} className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all">
                                 <Trash2 className="h-4 w-4" />
                               </button>
                             </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] -z-10 rounded-full"></div>
            <div className="p-10 border-b border-gray-100 flex justify-between items-start shrink-0">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">
                  {isEditing ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Contact Directory</p>
              </div>
              <button type="button" onClick={closeModal} className="p-3 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col overflow-hidden min-h-0 text-slate-800">
              <div className="p-10 space-y-8 overflow-y-auto flex-1 scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Customer Name</label>
                    <input required name="customerName" value={formData.customerName || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400" placeholder="e.g. Rahul Sharma" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center justify-between">
                       <span>Mobile Number</span>
                       {isEditing && formData.mobileNumber && (
                         <a href={`tel:${formData.mobileNumber}`} className="text-green-500 hover:text-green-600 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-lg">
                           <Phone className="h-3 w-3" /> Call
                         </a>
                       )}
                    </label>
                    <input required name="mobileNumber" value={formData.mobileNumber || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400" placeholder="10-digit number" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center justify-between">
                       <span>Alternate Number</span>
                       {isEditing && formData.alternateNumber && (
                         <a href={`tel:${formData.alternateNumber}`} className="text-green-500 hover:text-green-600 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-lg">
                           <Phone className="h-3 w-3" /> Call
                         </a>
                       )}
                    </label>
                    <input name="alternateNumber" value={formData.alternateNumber || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400" placeholder="Optional" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email Address</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400" placeholder="e.g. user@example.com" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Customer Type</label>
                    <select name="customerType" value={formData.customerType || 'Residential'} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none cursor-pointer">
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Office">Office</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Location / Area</label>
                    <input name="location" value={formData.location || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none placeholder:text-slate-400" placeholder="e.g. Krishnagiri" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Full Address</label>
                    <textarea name="address" rows={2} value={formData.address || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none h-24 resize-none placeholder:text-slate-400" placeholder="House/Building Details..." />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Notes</label>
                    <textarea name="notes" rows={2} value={formData.notes || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:border-blue-600 focus:bg-white transition-colors outline-none h-24 resize-none placeholder:text-slate-400" placeholder="Additional details..." />
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-gray-100 flex justify-end gap-4 shrink-0 bg-gray-50">
                <button type="button" onClick={closeModal} className="px-8 py-4 rounded-xl font-bold text-slate-500 bg-white border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-10 py-4 rounded-xl font-black bg-blue-600 text-white uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50">
                  {saving ? 'Saving...' : (isEditing ? 'Update Customer' : 'Save Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
