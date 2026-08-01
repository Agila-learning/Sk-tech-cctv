"use client";
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { 
  BellRing, Power, Plus, Edit, Trash2, Send, 
  BarChart2, Smartphone, Calendar, Hash
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function EngagementDashboard() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isAutoEnabled, setIsAutoEnabled] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState({ title: '', message: '', category: 'service_reminder', isActive: true });
  const [editId, setEditId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'templates'>('dashboard');

  const loadData = async () => {
    try {
      setLoading(true);
      const [tplRes, anRes, setRes] = await Promise.all([
        fetchWithAuth('/engagement/templates'),
        fetchWithAuth('/engagement/analytics/summary'),
        fetchWithAuth('/engagement/settings')
      ]);
      setTemplates(tplRes);
      setAnalytics(anRes);
      setIsAutoEnabled(setRes.autoEngagementEnabled);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const toggleAutoEngagement = async () => {
    try {
      const res = await fetchWithAuth('/engagement/settings/toggle', { method: 'PUT' });
      setIsAutoEnabled(res.autoEngagementEnabled);
    } catch (err) {
      alert('Failed to toggle settings');
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (editId) {
        await fetchWithAuth(`/engagement/templates/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentTemplate)
        });
      } else {
        await fetchWithAuth('/engagement/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentTemplate)
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await fetchWithAuth(`/engagement/templates/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert('Failed to delete template');
    }
  };

  const handleBroadcast = async (templateId: string) => {
    if (!confirm('WARNING: This will instantly send a push notification to ALL customers. Proceed?')) return;
    try {
      const res = await fetchWithAuth('/engagement/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId })
      });
      alert(res.message);
      loadData();
    } catch (err) {
      alert('Failed to send broadcast');
    }
  };

  // Chart Logic
  const labels = analytics?.byCategory?.map((c: any) => c._id) || [];
  const dataValues = analytics?.byCategory?.map((c: any) => c.count) || [];
  const chartData = {
    labels,
    datasets: [{
      data: dataValues,
      backgroundColor: ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#14b8a6', '#6366f1'],
      borderWidth: 0
    }]
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-bg-surface p-6 rounded-2xl border border-border-base shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><BellRing size={28} /></div>
          <div>
            <h2 className="text-2xl font-bold text-fg-primary">Smart Engagement</h2>
            <p className="text-sm text-fg-muted">Automated push notifications for customer retention</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-bg-base px-4 py-2 rounded-xl border border-border-base">
            <span className="text-sm font-semibold text-fg-primary">AI Auto-Pilot</span>
            <button 
              onClick={toggleAutoEngagement}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAutoEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isAutoEnabled ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'dashboard' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-fg-muted hover:bg-gray-50'}`}>Overview</button>
        <button onClick={() => setActiveTab('templates')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'templates' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-fg-muted hover:bg-gray-50'}`}>Notification Templates ({templates.length})</button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white dark:bg-bg-surface p-6 rounded-2xl border border-border-base shadow-sm flex items-center gap-4">
                 <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl"><Send size={24} /></div>
                 <div>
                   <p className="text-sm font-medium text-fg-muted uppercase tracking-wider">Total Delivered</p>
                   <h3 className="text-3xl font-black text-fg-primary">{analytics?.totalSent || 0}</h3>
                 </div>
               </div>
               <div className="bg-white dark:bg-bg-surface p-6 rounded-2xl border border-border-base shadow-sm flex items-center gap-4">
                 <div className="p-4 bg-green-100 text-green-600 rounded-2xl"><Calendar size={24} /></div>
                 <div>
                   <p className="text-sm font-medium text-fg-muted uppercase tracking-wider">Sent (Last 30 Days)</p>
                   <h3 className="text-3xl font-black text-fg-primary">{analytics?.sentThisMonth || 0}</h3>
                 </div>
               </div>
             </div>

             <div className="bg-white dark:bg-bg-surface p-6 rounded-2xl border border-border-base shadow-sm">
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Smartphone className="text-purple-500" /> Active Schedule</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                 <div className="p-4 bg-gray-50 dark:bg-bg-base rounded-xl border border-border-base">
                   <p className="text-xs font-bold text-blue-600 uppercase">Monday</p>
                   <p className="text-sm font-semibold mt-1">Service Reminders</p>
                 </div>
                 <div className="p-4 bg-gray-50 dark:bg-bg-base rounded-xl border border-border-base">
                   <p className="text-xs font-bold text-green-600 uppercase">Wednesday</p>
                   <p className="text-sm font-semibold mt-1">Product Promos</p>
                 </div>
                 <div className="p-4 bg-gray-50 dark:bg-bg-base rounded-xl border border-border-base">
                   <p className="text-xs font-bold text-orange-600 uppercase">Friday</p>
                   <p className="text-sm font-semibold mt-1">Offers & Discounts</p>
                 </div>
                 <div className="p-4 bg-gray-50 dark:bg-bg-base rounded-xl border border-border-base">
                   <p className="text-xs font-bold text-purple-600 uppercase">Sunday</p>
                   <p className="text-sm font-semibold mt-1">Security Tips</p>
                 </div>
               </div>
               <p className="text-xs text-fg-muted mt-4 text-center">* System strictly prevents sending a user the same notification category within 30 days to avoid spam.</p>
             </div>
          </div>

          <div className="bg-white dark:bg-bg-surface p-6 rounded-2xl border border-border-base shadow-sm flex flex-col items-center">
             <h3 className="font-bold text-lg mb-6 self-start flex items-center gap-2"><BarChart2 className="text-blue-500" /> Category Distribution</h3>
             <div className="w-48 h-48 mb-6">
               <Doughnut data={chartData} options={{ plugins: { legend: { display: false } }, cutout: '75%' }} />
             </div>
             <div className="w-full space-y-2">
               {labels.map((l: string, i: number) => (
                 <div key={l} className="flex justify-between items-center text-sm">
                   <span className="capitalize text-fg-muted">{l.replace('_', ' ')}</span>
                   <span className="font-bold">{dataValues[i]} sent</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="bg-white dark:bg-bg-surface rounded-2xl border border-border-base shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border-base flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-lg text-fg-primary">Message Templates</h3>
            <button 
              onClick={() => { setEditId(null); setCurrentTemplate({ title: '', message: '', category: 'service_reminder', isActive: true }); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition text-sm"
            >
              <Plus size={16} /> New Template
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {templates.map(t => (
              <div key={t._id} className="border border-border-base rounded-2xl p-5 hover:shadow-md transition bg-white dark:bg-bg-base relative group">
                <span className="text-[10px] uppercase font-black tracking-wider text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                  {t.category.replace('_', ' ')}
                </span>
                <h4 className="font-bold text-fg-primary mt-3 text-lg leading-tight">{t.title}</h4>
                <p className="text-sm text-fg-muted mt-2 mb-4 h-10 overflow-hidden line-clamp-2">{t.message}</p>
                
                <div className="flex justify-between items-center pt-4 border-t border-border-base">
                   <div className="flex items-center gap-2">
                     <span className={`w-2.5 h-2.5 rounded-full ${t.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                     <span className="text-xs font-semibold text-fg-muted">{t.isActive ? 'Active' : 'Draft'}</span>
                   </div>
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                     <button onClick={() => handleBroadcast(t._id)} className="p-2 text-fg-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Blast Now"><Send size={14}/></button>
                     <button onClick={() => { setEditId(t._id); setCurrentTemplate(t); setIsModalOpen(true); }} className="p-2 text-fg-muted hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"><Edit size={14}/></button>
                     <button onClick={() => handleDeleteTemplate(t._id)} className="p-2 text-fg-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={14}/></button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-bg-surface w-full max-w-lg rounded-2xl shadow-2xl border border-border-base overflow-hidden">
            <div className="p-4 border-b border-border-base bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold">{editId ? 'Edit Template' : 'New Template'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-fg-muted hover:text-red-500">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-fg-muted uppercase mb-1">Category</label>
                <select 
                  value={currentTemplate.category}
                  onChange={e => setCurrentTemplate(p => ({...p, category: e.target.value}))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-border-base rounded-xl text-sm outline-none"
                >
                  <option value="service_reminder">Service Reminder</option>
                  <option value="offer_discount">Offer / Discount</option>
                  <option value="product_promotion">Product Promotion</option>
                  <option value="amc_warranty">AMC & Warranty</option>
                  <option value="security_awareness">Security Awareness</option>
                  <option value="customer_engagement">Customer Engagement</option>
                  <option value="personalized">Personalized</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-fg-muted uppercase mb-1">Title (Push Notification Header)</label>
                <input 
                  type="text"
                  value={currentTemplate.title}
                  onChange={e => setCurrentTemplate(p => ({...p, title: e.target.value}))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-border-base rounded-xl text-sm outline-none font-bold"
                  placeholder="e.g. Upgrade your Security!"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg-muted uppercase mb-1">Message Body</label>
                <textarea 
                  value={currentTemplate.message}
                  onChange={e => setCurrentTemplate(p => ({...p, message: e.target.value}))}
                  className="w-full px-4 py-3 bg-gray-50 border border-border-base rounded-xl text-sm outline-none resize-none h-24"
                  placeholder="Enter the notification content..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={currentTemplate.isActive}
                  onChange={e => setCurrentTemplate(p => ({...p, isActive: e.target.checked}))}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-fg-primary">Active (Eligible for Auto-Pilot)</label>
              </div>
            </div>

            <div className="p-4 border-t border-border-base flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white text-fg-primary font-bold rounded-xl border border-border-base">Cancel</button>
              <button onClick={handleSaveTemplate} className="px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md">Save Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
