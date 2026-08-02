import React, { useState } from 'react';
import { Send, Users, Filter, CheckCircle2 } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';

export default function ManualCampaign({ templates }: any) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetRole: 'customer',
    productsPurchased: '',
    category: 'Manual Campaign'
  });

  const handleTemplateSelect = (e: any) => {
    const template = templates.find((t: any) => t._id === e.target.value);
    if (template) {
      setFormData({
        ...formData,
        title: template.title,
        message: template.message,
        category: template.category
      });
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const payload = {
        ...formData,
        productsPurchased: formData.productsPurchased ? formData.productsPurchased.split(',').map(s => s.trim()) : []
      };

      const res = await fetchWithAuth('/engagement/manual-campaign', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSuccess(`Success: Sent to ${res.sentCount} out of ${res.totalFound} matching users.`);
      
      // Reset form on success
      setFormData({
        title: '',
        message: '',
        targetRole: 'customer',
        productsPurchased: '',
        category: 'Manual Campaign'
      });
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-surface border border-border-base rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-fg-primary mb-6 flex items-center gap-2">
        <Send className="text-primary" size={20} />
        Launch Manual Campaign
      </h3>

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-3">
          <CheckCircle2 size={20} />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-fg-muted uppercase tracking-wider mb-2">Message Content</h4>
            
            <div>
              <label className="block text-sm text-fg-muted mb-2">Load from Template (Optional)</label>
              <select 
                onChange={handleTemplateSelect}
                className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-border-base rounded-xl px-4 py-3 text-fg-primary focus:outline-none"
              >
                <option value="">-- Select a template --</option>
                {templates?.filter((t: any) => t.active).map((t: any) => (
                  <option key={t._id} value={t._id}>{t.title} ({t.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-fg-muted mb-2">Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-gray-50 dark:bg-black/20 border border-border-base rounded-xl px-4 py-3 text-fg-primary focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-fg-muted mb-2">Message</label>
              <textarea 
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-gray-50 dark:bg-black/20 border border-border-base rounded-xl px-4 py-3 text-fg-primary h-24 resize-none focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-fg-muted uppercase tracking-wider mb-2">Target Audience</h4>
            
            <div>
              <label className="block text-sm text-fg-muted mb-2 flex items-center gap-2">
                <Users size={16} /> Target Role
              </label>
              <select 
                value={formData.targetRole}
                onChange={e => setFormData({ ...formData, targetRole: e.target.value })}
                className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-border-base rounded-xl px-4 py-3 text-fg-primary focus:outline-none"
              >
                <option value="customer">Customers Only</option>
                <option value="all">All Users</option>
                <option value="technician">Technicians</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-fg-muted mb-2 flex items-center gap-2">
                <Filter size={16} /> Purchase History Filter (Product IDs)
              </label>
              <input 
                type="text" 
                value={formData.productsPurchased}
                onChange={e => setFormData({ ...formData, productsPurchased: e.target.value })}
                placeholder="Comma separated Product Object IDs (Optional)"
                className="w-full bg-gray-50 dark:bg-black/20 border border-border-base rounded-xl px-4 py-3 text-fg-primary focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-fg-muted mt-2">Only sends to users who purchased these specific products.</p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Send size={18} />
            {loading ? 'Sending Blast...' : 'Send Campaign Blast Now'}
          </button>
        </div>
      </form>
    </div>
  );
}
