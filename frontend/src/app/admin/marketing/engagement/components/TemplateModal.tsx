import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';

export default function TemplateModal({ isOpen, onClose, onSuccess, template }: any) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'Service Reminder',
    active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title,
        message: template.message,
        category: template.category,
        active: template.active
      });
    } else {
      setFormData({ title: '', message: '', category: 'Service Reminder', active: true });
    }
  }, [template, isOpen]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (template) {
        await fetchWithAuth(`/engagement/templates/${template._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await fetchWithAuth('/engagement/templates', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const categories = [
    'Service Reminder', 'Product Promotion', 'Offer', 
    'Security Tip', 'Customer Engagement', 'Personalized'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">{template ? 'Edit Template' : 'New Template'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Title</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              placeholder="e.g. Special Offer!"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Message</label>
            <textarea 
              value={formData.message} 
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white h-24 resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              placeholder="Your notification message..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
            <select 
              value={formData.category} 
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="text-sm font-medium text-white/70">Active Status</label>
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, active: !formData.active })}
              className={`w-12 h-6 rounded-full transition-colors ${formData.active ? 'bg-primary' : 'bg-white/20'} relative`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.active ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="pt-6 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/70 font-medium hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
