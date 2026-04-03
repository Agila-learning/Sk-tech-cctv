"use client";
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Trash2, Shield, Info, 
  MapPin, Clock, ArrowLeft, Search, Filter,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '@/utils/api';
import { useRouter } from 'next/navigation';

const HolidaysPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'national',
    description: '',
    isRecurring: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/holidays');
      setHolidays(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetchWithAuth('/holidays', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setIsModalOpen(false);
      setFormData({ name: '', date: '', type: 'national', description: '', isRecurring: false });
      loadHolidays();
    } catch (e: any) {
      alert(e.message || "Failed to add holiday");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;
    try {
      await fetchWithAuth(`/holidays/${id}`, { method: 'DELETE' });
      loadHolidays();
    } catch (e) {
      alert("Delete failed");
    }
  };

  const getHolidayColor = (type: string) => {
    switch (type) {
      case 'national': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'regional': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'restricted': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      default: return 'text-fg-muted bg-fg-muted/10 border-fg-muted/20';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-fg-muted hover:text-blue-500 transition-colors group mb-4"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dashboard / Settings</span>
            </button>
            <h1 className="text-4xl lg:text-7xl font-black text-fg-primary uppercase tracking-tighter italic leading-none">
              Holiday <span className="text-blue-500 non-italic">Calendar</span>
            </h1>
            <p className="text-fg-muted font-medium text-lg lg:text-xl">Dynamic Holiday & Leave Management</p>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
          >
            <Plus className="h-5 w-5" />
            Add New Holiday
          </button>
        </header>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {holidays.map((holiday) => (
                <motion.div
                  key={holiday._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card p-8 rounded-[2.5rem] border border-border-base relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl group-hover:bg-blue-600/10 transition-all duration-700"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${getHolidayColor(holiday.type)}`}>
                      {holiday.type}
                    </div>
                    <button 
                      onClick={() => handleDelete(holiday._id)}
                      className="p-3 bg-bg-muted text-fg-muted hover:text-red-500 hover:bg-red-500/10 rounded-2xl border border-border-base transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight line-clamp-1">{holiday.name}</h3>
                    <div className="flex items-center space-x-3 text-fg-muted">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-bold">{new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    {holiday.description && (
                      <p className="text-xs font-medium text-fg-muted line-clamp-2 leading-relaxed">
                        {holiday.description}
                      </p>
                    )}
                  </div>

                  {holiday.isRecurring && (
                    <div className="mt-6 pt-6 border-t border-border-base flex items-center text-[9px] font-black text-blue-500 uppercase tracking-widest">
                      <Clock className="h-3 w-3 mr-2" />
                      Annual Recurring Event
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {holidays.length === 0 && (
              <div className="lg:col-span-3 text-center py-20 bg-bg-muted rounded-[3rem] border border-dashed border-border-base opacity-50">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-fg-muted" />
                <p className="font-black uppercase tracking-widest text-xs">No Dynamic Holidays Configured</p>
              </div>
            )}
          </div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass-card w-full max-w-xl rounded-[3rem] border border-border-base p-10 overflow-hidden relative shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Add <span className="text-blue-500">Holiday</span></h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-4 bg-bg-muted rounded-2xl border border-border-base">
                    <Trash2 className="h-5 w-5 text-fg-muted" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Holiday Name</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-4 bg-bg-muted rounded-2xl border border-border-base focus:border-blue-500 transition-all font-bold text-sm"
                      placeholder="e.g. Independence Day"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Date</label>
                      <input 
                        required
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full p-4 bg-bg-muted rounded-2xl border border-border-base focus:border-blue-500 transition-all font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Type</label>
                      <select 
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full p-4 bg-bg-muted rounded-2xl border border-border-base focus:border-blue-500 transition-all font-bold text-sm uppercase"
                      >
                        <option value="national">National</option>
                        <option value="regional">Regional</option>
                        <option value="restricted">Restricted</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Description (Optional)</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full p-4 bg-bg-muted rounded-2xl border border-border-base focus:border-blue-500 transition-all font-bold text-sm h-24"
                      placeholder="Tell us more about this holiday..."
                    />
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                    <input 
                      type="checkbox"
                      id="recurring"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                      className="w-5 h-5 rounded-lg accent-blue-600"
                    />
                    <label htmlFor="recurring" className="text-xs font-black text-fg-primary uppercase tracking-tight cursor-pointer">
                      Annual Recurring Event
                    </label>
                  </div>

                  <button 
                    disabled={submitting}
                    className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Allocating Resources...' : 'Force Generate Holiday'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default HolidaysPage;
