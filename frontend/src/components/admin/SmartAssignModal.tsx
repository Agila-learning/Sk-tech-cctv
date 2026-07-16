import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, User, Users, Check, AlertCircle, Save } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';

interface SmartAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobType: 'task' | 'order';
  onSuccess: () => void;
}

export default function SmartAssignModal({ isOpen, onClose, jobId, jobType, onSuccess }: SmartAssignModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  
  const [primaryId, setPrimaryId] = useState<string>('');
  const [supportingIds, setSupportingIds] = useState<string[]>([]);
  const [allTechs, setAllTechs] = useState<any[]>([]);
  const [mode, setMode] = useState<'auto' | 'manual' | 'hybrid'>('auto');

  useEffect(() => {
    if (isOpen && jobId) {
      fetchRecommendations();
      fetchAllTechs();
    }
  }, [isOpen, jobId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/assignment/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: jobId, type: jobType })
      });
      setRecommendations(data);
      if (data.recommendedPrimary) {
        setPrimaryId(data.recommendedPrimary._id);
      }
      if (data.recommendedSupporting) {
        setSupportingIds(data.recommendedSupporting.map((t: any) => t._id));
      }
    } catch (err) {
      console.error(err);
      setMode('manual'); // fallback to manual if AI fails
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTechs = async () => {
    try {
      const data = await fetchWithAuth('/admin/technicians');
      setAllTechs(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSupporting = (id: string) => {
    if (id === primaryId) return; // Cannot be both
    setSupportingIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
    setMode('hybrid');
  };

  const handleSave = async () => {
    if (!primaryId) return alert('Primary Technician is required');
    try {
      setSaving(true);
      await fetchWithAuth('/assignment/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: jobId,
          type: jobType,
          primaryId,
          supportingIds,
          assignmentMode: mode
        })
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
       <motion.div 
         initial={{ opacity: 0, scale: 0.95, y: 20 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.95, y: 20 }}
         className="relative w-full max-w-3xl bg-card border border-card-border rounded-[2rem] p-8 shadow-2xl max-h-[90vh] flex flex-col"
       >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] -z-10 rounded-full"></div>
          
          <div className="flex justify-between items-start mb-6 shrink-0">
             <div className="space-y-2">
                <h2 className="text-3xl font-black text-fg-primary flex items-center gap-3">
                  <Cpu className="text-indigo-500 h-8 w-8" />
                  Smart Assignment
                </h2>
                <p className="text-xs font-bold text-fg-muted uppercase tracking-widest">AI-Powered Resource Allocation</p>
             </div>
             <button onClick={onClose} className="p-3 bg-bg-muted rounded-xl hover:bg-red-500 hover:text-white transition-all">
                <X className="h-5 w-5" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Cpu className="h-16 w-16 mb-4 animate-pulse text-indigo-500" />
                <p className="font-bold uppercase tracking-widest text-xs">Analyzing telemetry & calculating scores...</p>
              </div>
            ) : (
              <>
                <div className="flex gap-4">
                   <button onClick={() => setMode('auto')} className={`flex-1 p-4 rounded-2xl border-2 transition-all ${mode === 'auto' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' : 'border-border-base bg-bg-muted text-fg-muted hover:border-indigo-500/50'}`}>
                      <p className="font-black uppercase tracking-widest text-[10px] mb-1">Mode</p>
                      <p className="font-black text-lg">Auto</p>
                   </button>
                   <button onClick={() => setMode('hybrid')} className={`flex-1 p-4 rounded-2xl border-2 transition-all ${mode === 'hybrid' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-border-base bg-bg-muted text-fg-muted hover:border-amber-500/50'}`}>
                      <p className="font-black uppercase tracking-widest text-[10px] mb-1">Mode</p>
                      <p className="font-black text-lg">Hybrid</p>
                   </button>
                   <button onClick={() => setMode('manual')} className={`flex-1 p-4 rounded-2xl border-2 transition-all ${mode === 'manual' ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-border-base bg-bg-muted text-fg-muted hover:border-blue-500/50'}`}>
                      <p className="font-black uppercase tracking-widest text-[10px] mb-1">Mode</p>
                      <p className="font-black text-lg">Manual</p>
                   </button>
                </div>

                <div className="space-y-4">
                   <h3 className="text-sm font-black text-fg-primary uppercase tracking-widest flex items-center gap-2">
                     <User className="h-4 w-4" /> Primary Technician
                   </h3>
                   <select 
                     value={primaryId} 
                     onChange={(e) => {
                       setPrimaryId(e.target.value);
                       setMode('hybrid');
                       setSupportingIds(prev => prev.filter(id => id !== e.target.value));
                     }}
                     className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary focus:border-indigo-500 outline-none cursor-pointer"
                   >
                     <option value="">Select Primary Operative...</option>
                     {allTechs.map(t => {
                       const scoreInfo = recommendations?.scores?.find((s:any) => s.id === t._id);
                       const scoreText = scoreInfo ? ` [AI Score: ${scoreInfo.score}]` : '';
                       return (
                         <option key={t._id} value={t._id} className="bg-background">
                           {t.name} {t.availabilityStatus !== 'Available' ? `(${t.availabilityStatus})` : ''} {scoreText}
                         </option>
                       );
                     })}
                   </select>
                </div>

                <div className="space-y-4">
                   <h3 className="text-sm font-black text-fg-primary uppercase tracking-widest flex items-center gap-2">
                     <Users className="h-4 w-4" /> Supporting Team (Optional)
                   </h3>
                   <div className="grid grid-cols-2 gap-3">
                     {allTechs.filter(t => t._id !== primaryId).map(t => {
                       const isSelected = supportingIds.includes(t._id);
                       const scoreInfo = recommendations?.scores?.find((s:any) => s.id === t._id);
                       return (
                         <div 
                           key={t._id}
                           onClick={() => toggleSupporting(t._id)}
                           className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                             isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-border-base bg-bg-muted hover:border-emerald-500/50'
                           }`}
                         >
                           <div>
                             <p className={`font-black text-sm ${isSelected ? 'text-emerald-500' : 'text-fg-primary'}`}>{t.name}</p>
                             <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest mt-1">
                               {t.availabilityStatus} {scoreInfo ? `• Score: ${scoreInfo.score}` : ''}
                             </p>
                           </div>
                           {isSelected && <Check className="h-5 w-5 text-emerald-500" />}
                         </div>
                       );
                     })}
                   </div>
                </div>

                {recommendations?.scores && (
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-indigo-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-1">AI Recommendation Details</p>
                      <p className="text-xs font-medium text-fg-primary leading-relaxed">
                        The AI analyzed {recommendations.scores.length} available technicians based on GPS proximity to the site, current workload, ratings, and skill matches.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-border-subtle shrink-0">
             <button 
                onClick={handleSave}
                disabled={saving || loading || !primaryId}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
             >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Confirm Team Assignment</span>
                  </>
                )}
             </button>
          </div>
       </motion.div>
    </div>
  );
}
