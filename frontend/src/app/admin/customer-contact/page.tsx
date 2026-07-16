"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { Users, Plus, PhoneCall, MessageCircle, MapPin, Download, Search } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CustomerContactPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredContacts = contacts.filter(c => 
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobileNumber?.includes(searchTerm) ||
    c.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <div className="flex min-h-screen bg-bg-body text-fg-primary">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
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
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 bg-bg-surface border border-border-base px-4 py-3 rounded-xl font-bold hover:bg-bg-muted transition-colors">
                  <Download className="h-5 w-5" /> Export
                </button>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
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
                  className="w-full pl-10 pr-4 py-3 bg-bg-surface border border-border-base rounded-xl focus:outline-none focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Contacts Table */}
            <div className="bg-bg-surface border border-border-base rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
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
                             <p className="font-bold text-lg">{contact.customerName}</p>
                             <div className="flex items-center gap-2 mt-1">
                               <p className="text-sm font-mono text-fg-secondary">{contact.mobileNumber}</p>
                               {contact.email && <span className="text-xs text-fg-muted">| {contact.email}</span>}
                             </div>
                          </td>
                          <td className="p-4">
                             <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                               <MapPin className="h-3 w-3 text-fg-muted" />
                               {contact.location || contact.address || 'Unknown'}
                             </div>
                             <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-bg-muted text-fg-secondary">
                               {contact.customerType}
                             </span>
                          </td>
                          <td className="p-4">
                             <div className="flex items-center justify-end gap-2">
                               <a href={`tel:${contact.mobileNumber}`} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20" title="Call">
                                 <PhoneCall className="h-5 w-5" />
                               </a>
                               <a href={`https://wa.me/91${contact.mobileNumber.replace(/\\D/g, '')}`} target="_blank" rel="noreferrer" className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20" title="WhatsApp">
                                 <MessageCircle className="h-5 w-5" />
                               </a>
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
    </ProtectedRoute>
  );
}
