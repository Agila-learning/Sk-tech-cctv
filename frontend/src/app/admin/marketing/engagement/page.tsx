"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { Sparkles, MessageSquare, List, Send, Plus, Trash2, Edit, CheckCircle2, XCircle } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import TemplateModal from './components/TemplateModal';
import ManualCampaign from './components/ManualCampaign';

export default function EngagementDashboard() {
  const [activeTab, setActiveTab] = useState('templates');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [settings, setSettings] = useState({ autoEngagementEnabled: false });
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sets, tpls, hists] = await Promise.all([
        fetchWithAuth('/engagement/settings'),
        fetchWithAuth('/engagement/templates'),
        fetchWithAuth('/engagement/logs')
      ]);
      setSettings(sets);
      setTemplates(tpls);
      setLogs(hists);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleAutoEngagement = async () => {
    try {
      const res = await fetchWithAuth('/engagement/settings/toggle', { 
        method: 'PUT',
        body: JSON.stringify({ autoEngagementEnabled: !settings.autoEngagementEnabled })
      });
      setSettings(res);
    } catch (err) {
      console.error(err);
      alert('Failed to update settings');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await fetchWithAuth(`/engagement/templates/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };

  const quickSendTemplate = async (tpl: any) => {
    if (!confirm(`Are you sure you want to send "${tpl.title}" to all customers now?`)) return;
    try {
      setLoading(true);
      const payload = {
        title: tpl.title,
        message: tpl.message,
        targetRole: 'customer',
        category: tpl.category,
        templateId: tpl._id
      };
      const res = await fetchWithAuth('/engagement/manual-campaign', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      alert(`Success: Sent to ${res.sentCount} out of ${res.totalFound} matching customers.`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[280px] bg-background text-fg-base h-screen overflow-hidden transition-all duration-500">
        <AdminNavbar />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header & Metrics */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
              <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
                  <Sparkles size={14} /> Smart Engagement System
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-fg-primary">
                  Auto Notifications
                </h1>
                <p className="text-fg-muted mt-2">Manage personalized AI-like random campaigns and blast targeting.</p>
              </div>

              <div className="flex items-center gap-4 bg-surface border border-border-base p-2 pr-6 rounded-2xl relative z-10">
                <button 
                  onClick={toggleAutoEngagement}
                  className={`w-14 h-8 rounded-full transition-colors flex items-center p-1 ${settings.autoEngagementEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-white/10'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${settings.autoEngagementEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <div>
                  <div className="text-sm font-semibold text-fg-primary">Auto Campaigns</div>
                  <div className="text-xs text-fg-muted">{settings.autoEngagementEnabled ? 'Active (Mon/Wed/Fri/Sun)' : 'Paused'}</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 p-1 bg-surface border border-border-base rounded-xl w-fit relative z-10">
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'templates' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-fg-muted hover:text-fg-primary hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <MessageSquare size={16} /> Templates
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-fg-muted hover:text-fg-primary hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <List size={16} /> History Log
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'manual' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-fg-muted hover:text-fg-primary hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Send size={16} /> Manual Blast
              </button>
            </div>

            {/* Content Area */}
            <div className="relative z-10">
              {loading ? (
                <div className="flex justify-center p-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'templates' && (
                    <div className="space-y-6">
                      <div className="flex justify-end">
                        <button 
                          onClick={() => { setEditingTemplate(null); setModalOpen(true); }}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                          <Plus size={16} /> Add Template
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map((tpl: any) => (
                          <div key={tpl._id} className="bg-surface border border-border-base rounded-2xl p-5 hover:border-primary/50 transition-colors group">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md">
                                {tpl.category}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => quickSendTemplate(tpl)} className="p-1.5 hover:bg-green-500/10 rounded-md text-fg-muted hover:text-green-500" title="Send Now">
                                  <Send size={14} />
                                </button>
                                <button onClick={() => { setEditingTemplate(tpl); setModalOpen(true); }} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-fg-muted hover:text-fg-primary" title="Edit Template">
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => deleteTemplate(tpl._id)} className="p-1.5 hover:bg-red-500/10 rounded-md text-fg-muted hover:text-red-500" title="Delete Template">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <h3 className="font-bold text-fg-primary mb-2">{tpl.title}</h3>
                            <p className="text-sm text-fg-muted line-clamp-3">{tpl.message}</p>
                            
                            <div className="mt-4 pt-4 border-t border-border-base flex justify-between items-center text-xs text-fg-muted">
                              <span>Status: <span className={tpl.active ? "text-green-500" : "text-red-500"}>{tpl.active ? 'Active' : 'Inactive'}</span></span>
                            </div>
                          </div>
                        ))}
                        {templates.length === 0 && (
                          <div className="col-span-full py-12 text-center text-fg-muted border border-dashed border-border-base rounded-2xl">
                            No templates found. Create one to get started!
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="bg-surface border border-border-base rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-black/5 dark:bg-white/5 border-b border-border-base text-fg-muted uppercase">
                            <tr>
                              <th className="px-6 py-4 font-medium">Date</th>
                              <th className="px-6 py-4 font-medium">Customer</th>
                              <th className="px-6 py-4 font-medium">Category</th>
                              <th className="px-6 py-4 font-medium">Message Details</th>
                              <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-base text-fg-base">
                            {logs.map((log: any) => (
                              <tr key={log._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">{new Date(log.sentAt).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                  <div className="font-medium text-fg-primary">{log.userId?.name || 'Unknown'}</div>
                                  <div className="text-xs text-fg-muted">{log.userId?.email || 'No email'}</div>
                                </td>
                                <td className="px-6 py-4 text-primary">{log.category}</td>
                                <td className="px-6 py-4 truncate max-w-[250px]">
                                  <div className="font-medium text-fg-primary">{log.templateId?.title || 'Manual Blast'}</div>
                                  <div className="text-xs text-fg-muted truncate">{log.templateId?.message || 'Custom Message'}</div>
                                </td>
                                <td className="px-6 py-4">
                                  {log.status === 'Delivered' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                                      <CheckCircle2 size={12} /> Delivered
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20">
                                      <XCircle size={12} /> Failed
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {logs.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-fg-muted">
                                  No engagement logs found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'manual' && (
                    <ManualCampaign templates={templates} />
                  )}
                </>
              )}
            </div>

          </div>
        </main>
      </div>

      <TemplateModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        template={editingTemplate}
        onSuccess={fetchData}
      />
    </div>
  );
}
