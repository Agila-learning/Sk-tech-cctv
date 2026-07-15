"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { ShieldCheck, Plus, Package, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { format } from 'date-fns';

export default function ProductWarrantyPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <div className="flex min-h-screen bg-bg-body text-fg-primary">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          <AdminNavbar onMenuClick={() => setIsSidebarOpen(true)} />
          
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
              <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                <Plus className="h-5 w-5" />
                New Warranty Claim
              </button>
            </header>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                   <h3 className="font-bold text-fg-muted">Pending Review</h3>
                 </div>
                 <p className="text-4xl font-black">{warranties.filter(w => w.status === 'Created' || w.status === 'Supplier Reviewing').length}</p>
               </div>
               <div className="bg-bg-surface border border-border-base rounded-2xl p-6">
                 <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><AlertCircle className="h-6 w-6"/></div>
                   <h3 className="font-bold text-fg-muted">Follow-up Today</h3>
                 </div>
                 <p className="text-4xl font-black">0</p>
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
                <table className="w-full text-left border-collapse">
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
                             <button className="text-blue-500 hover:text-blue-600 font-bold text-sm">View Details</button>
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
