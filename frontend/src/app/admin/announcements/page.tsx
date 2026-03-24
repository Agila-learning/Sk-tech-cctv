"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Megaphone, Plus, Trash2, Clock, Globe, Shield, User, Send, Bell } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', priority: 'low', targetAudience: 'all' });

  const loadAnnouncements = async () => {
    try {
      const data = await fetchWithAuth('/internal/announcements');
      setAnnouncements(data);
    } catch (error) {
      console.error("Load Announcements Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/internal/announcements', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({ title: '', content: '', priority: 'low', targetAudience: 'all' });
      loadAnnouncements();
    } catch (error) {
      alert("Broadcast failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this broadcast from history?")) return;
    try {
      await fetchWithAuth(`/internal/announcements/${id}`, { method: 'DELETE' });
      setAnnouncements(prev => prev.filter((ann: any) => ann._id !== id));
    } catch (error) {
      alert("Termination failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background transition-colors">
      <AdminSidebar />
      <main className="flex-1 ml-80 p-12">
        <header className="flex justify-between items-end mb-16">
          <div className="space-y-3">
            <h1 className="text-5xl font-black text-fg-primary tracking-tighter uppercase">Professional <span className="text-fg-muted italic">Announcements</span></h1>
            <p className="text-fg-muted text-lg font-medium">Broadcast critical updates to the technician network.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] flex items-center space-x-2"
          >
             <Send className="h-4 w-4" />
             <span>Initialize Broadcast</span>
          </button>
        </header>

        <div className="grid grid-cols-1 gap-8">
           {announcements.map((ann: any) => (
             <div key={ann._id} className="glass-card p-10 rounded-[2.5rem] border border-border-base relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${ann.priority === 'high' ? 'bg-red-500' : ann.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                <div className="flex justify-between items-start">
                   <div className="space-y-4 max-w-3xl">
                      <div className="flex items-center space-x-3">
                         <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${ann.priority === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {ann.priority} Priority
                         </span>
                         <span className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center">
                            <Globe className="h-3 w-3 mr-1" /> Target: {ann.targetAudience}
                         </span>
                         <span className="text-[10px] font-bold text-fg-muted uppercase tracking-widest flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> {new Date(ann.createdAt).toLocaleString()}
                         </span>
                      </div>
                      <h3 className="text-2xl font-black text-fg-primary tracking-tight uppercase group-hover:text-blue-500 transition-colors">{ann.title}</h3>
                      <p className="text-fg-secondary font-medium leading-relaxed">{ann.content}</p>
                   </div>
                    <button 
                      onClick={() => handleDelete(ann._id)}
                      className="p-3 bg-bg-muted border border-border-base rounded-2xl text-fg-muted hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                       <Trash2 className="h-5 w-5" />
                    </button>
                </div>
             </div>
           ))}
           {announcements.length === 0 && (
             <div className="glass-card p-20 rounded-[3.5rem] border border-border-base text-center">
                <Bell className="h-12 w-12 text-fg-muted mx-auto mb-6 opacity-20" />
                <p className="text-fg-secondary font-bold">Silence on all channels. No active broadcasts.</p>
             </div>
           )}
        </div>
      </main>

      {/* Broadcast Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-xl rounded-[2.5rem] border border-border-base p-10 animate-in fade-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tighter">Professional <span className="text-fg-muted italic">Broadcast</span></h3>
                <button onClick={() => setShowModal(false)} className="text-fg-muted hover:text-white transition-colors"><Plus className="rotate-45 h-6 w-6" /></button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-6">
                <input 
                  type="text" placeholder="Broadcast Headline" required
                  className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-blue-600"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                />
                <select 
                  className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 appearance-none"
                  value={formData.targetAudience} onChange={e => setFormData({...formData, targetAudience: e.target.value})}
                >
                   <option value="all">Global (All Technicians)</option>
                   <option value="technician">Field Agents Only</option>
                   <option value="customer">Client Base</option>
                </select>
                <select 
                  className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 appearance-none"
                  value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                >
                   <option value="low">Low Priority</option>
                   <option value="medium">Medium Priority</option>
                   <option value="high">Critical / High Priority</option>
                </select>
                <textarea 
                  placeholder="Intelligence details..." required
                  className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 h-32"
                  value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
                />
                <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.4em] transition-all shadow-xl shadow-blue-600/30">
                  Execute Broadcast
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
