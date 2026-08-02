"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, PhoneCall, CheckCircle, Clock, XCircle, Search, Menu, MessageCircle, MoreVertical, Edit2 } from 'lucide-react';
import jsPDF from 'jspdf';

const QuotationKanban = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/billing');
      const allBilling = Array.isArray(res) ? res : [];
      setQuotations(allBilling.filter((item: any) => item.type === 'quotation'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetchWithAuth(`/billing/${id}/follow-up`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpStatus: newStatus })
      });
      loadData();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleWhatsApp = (q: any) => {
    const phone = q.manualCustomer?.phone || q.customer?.phone || '';
    if (!phone) return alert('No phone number found');
    const text = `Hello ${q.manualCustomer?.name || 'Customer'},\nWe are following up on your quotation #${q.invoiceNumber}. Please let us know if you have any questions!`;
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const columns = [
    { id: 'Pending', title: 'Pending & Drafts', statuses: ['Draft', 'Waiting', 'Pending'] },
    { id: 'Follow-up', title: 'In Follow-Up', statuses: ['Called', 'Customer Interested', 'Negotiation', 'Pending Approval'] },
    { id: 'Completed', title: 'Completed', statuses: ['Confirmed', 'Converted to Invoice', 'Completed', 'Approved', 'Converted to Order'] },
    { id: 'Lost', title: 'Lost / Cancelled', statuses: ['Cancelled', 'Rejected', 'Expired'] },
  ];

  const getFilteredQuotations = () => {
    if (!searchQuery) return quotations;
    return quotations.filter(q => 
      q.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.manualCustomer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredQuotes = getFilteredQuotations();

  return (
    <div className="flex h-screen bg-bg-base text-fg-base overflow-hidden selection:bg-blue-500/30 font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0 lg:ml-[280px] relative flex flex-col h-screen overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px] mix-blend-screen" />
        </div>

        <div className="relative z-10 p-6 md:p-8 flex-1 flex flex-col min-h-0">
          {/* Header */}
          <header className="flex justify-between items-center mb-8 shrink-0">
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase text-fg-primary">Quotation Pipeline</h1>
              <p className="text-fg-muted font-medium mt-1">Track and follow-up on your pending quotes</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" size={16} />
                <input 
                  type="text" 
                  placeholder="Search quotations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-base rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-3 rounded-xl bg-bg-surface border border-border-base hover:bg-bg-hover"
              >
                <Menu size={20} />
              </button>
            </div>
          </header>

          {/* Kanban Board */}
          <div className="flex-1 flex gap-6 overflow-x-auto pb-4 no-scrollbar">
            {columns.map(column => {
              const colQuotes = filteredQuotes.filter(q => column.statuses.includes(q.followUpStatus || 'Draft'));
              
              return (
                <div key={column.id} className="w-80 shrink-0 flex flex-col">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-fg-primary uppercase tracking-widest text-sm">{column.title}</h3>
                    <span className="bg-bg-surface border border-border-base text-xs font-black px-2 py-0.5 rounded-full">
                      {colQuotes.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-10">
                    <AnimatePresence>
                      {colQuotes.map(q => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={q._id}
                          className="bg-bg-surface border border-border-base rounded-2xl p-5 hover:border-blue-500/50 transition-colors shadow-xl shadow-black/5"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md">
                              {q.invoiceNumber}
                            </span>
                            <span className="text-[10px] font-bold text-fg-muted">{new Date(q.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <h4 className="font-bold text-fg-primary text-sm mb-1">{q.manualCustomer?.name || 'Walk-in Customer'}</h4>
                          <p className="text-xs text-fg-muted mb-4">{q.manualCustomer?.phone || 'No Phone'}</p>
                          
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1 h-1 bg-border-base rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${column.id === 'Completed' ? 'bg-green-500 w-full' : column.id === 'Lost' ? 'bg-red-500 w-full' : 'bg-blue-500 w-1/2'}`} />
                            </div>
                            <span className="text-[10px] font-bold uppercase text-fg-muted whitespace-nowrap">{q.followUpStatus}</span>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-base">
                            <span className="font-black text-fg-primary">₹{q.totalAmount?.toLocaleString()}</span>
                            <div className="flex gap-2">
                              <button onClick={() => handleWhatsApp(q)} className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500/20 transition-colors" title="WhatsApp">
                                <MessageCircle size={14} />
                              </button>
                              
                              <select 
                                value={q.followUpStatus}
                                onChange={(e) => handleUpdateStatus(q._id, e.target.value)}
                                className="px-2 py-1 bg-blue-50/50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold outline-none cursor-pointer hover:bg-blue-100 transition-colors"
                              >
                                {['Draft', 'Waiting', 'Called', 'Customer Interested', 'Negotiation', 'Pending Approval', 'Confirmed', 'Converted to Invoice', 'Cancelled', 'Rejected'].map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {colQuotes.length === 0 && (
                      <div className="border-2 border-dashed border-border-base rounded-2xl p-8 text-center text-fg-muted font-medium text-sm">
                        No quotes here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuotationKanban;
