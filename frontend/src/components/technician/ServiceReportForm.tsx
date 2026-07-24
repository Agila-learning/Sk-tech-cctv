"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, CheckCircle2, ChevronRight, Plus, X, Mic, Square, Loader2, FileText, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth, API_URL } from '@/utils/api';

const ServiceReportForm = ({ jobId, onComplete, initialData }: { 
  jobId: string, 
  onComplete: () => void,
  initialData?: any
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerName: initialData?.customerName || '',
    customerAddress: initialData?.customerAddress || '',
    serviceType: 'Installation',
    problemIdentified: '',
    workPerformed: '',
    materialsUsed: [{ name: '', quantity: 1, costPerUnit: 0 }],
    laborCost: 0,
    partsCost: 0,
    technicianRemarks: '',
    recommendReview: false,
    photos: {
       before: initialData?.photos?.before || '',
       after: initialData?.photos?.after || ''
    },
    location: { lat: 0, lng: 0 },
    signature: ''
  });

  // Voice Note state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceNoteText, setVoiceNoteText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const formatRecordingTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const addMaterial = () => {
    setFormData({
      ...formData,
      materialsUsed: [...formData.materialsUsed, { name: '', quantity: 1, costPerUnit: 0 }]
    });
  };

  const removeMaterial = (index: number) => {
    const newItems = formData.materialsUsed.filter((_, i) => i !== index);
    setFormData({ ...formData, materialsUsed: newItems });
  };
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.customerName || !formData.customerAddress || !formData.problemIdentified) {
        return alert("Please fill in all required fields (Name, Address, Issue Details) before proceeding.");
      }
    } else if (step === 2) {
      if (!formData.workPerformed) {
        return alert("Please provide details of the work performed.");
      }
    }
    setStep(prev => prev + 1);
  };
  const prevStep = () => setStep(prev => prev - 1);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formPayload = new FormData();
      formPayload.append('images', file);
      const token = localStorage.getItem('sk_auth_token');
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formPayload
      });
      const data = await response.json();
      setFormData(prev => ({ ...prev, photos: { ...prev.photos, [type]: data.imageUrl } }));
    } catch (e: any) { alert("Upload failed"); }
    finally { setUploading(false); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error: any) {
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadFile = async (file: Blob, filename: string): Promise<string | null> => {
    const fd = new FormData();
    fd.append('images', file, filename);
    const token = localStorage.getItem('sk_auth_token');
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.imageUrl || data.imageUrls?.[0] || null;
  };

  const handleSubmit = async () => {
    if (!formData.photos.before || !formData.photos.after) {
      return alert("MANDATORY: Both Before and After photos are required for job completion.");
    }
    setSubmitting(true);
    try {
      const materialsTotal = formData.materialsUsed.reduce((acc, item) => acc + (item.quantity * item.costPerUnit), 0);
      const totalServiceCost = materialsTotal + formData.laborCost + formData.partsCost;

      const pos: any = await new Promise((res) => {
        navigator.geolocation.getCurrentPosition(
          res, 
          () => res({ coords: { latitude: 0, longitude: 0 } }),
          { timeout: 1500, enableHighAccuracy: false }
        );
        setTimeout(() => res({ coords: { latitude: 0, longitude: 0 } }), 1600);
      });
      
      let uploadedVoiceUrl = '';
      if (audioBlob) {
        uploadedVoiceUrl = await uploadFile(audioBlob, `completion_report_${jobId}.webm`) || '';
      }

      // 1. Submit the main service report
      const resData = await fetchWithAuth('/technician/report', {
        method: 'POST',
        body: JSON.stringify({
          jobId,
          ...formData,
          totalServiceCost,
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          voiceNote: uploadedVoiceUrl
        })
      });

      // 2. Save to Notes feed for global admin and technician visibility
      if (voiceNoteText.trim() || uploadedVoiceUrl) {
        await fetchWithAuth('/notes', {
          method: 'POST',
          body: JSON.stringify({
            content: voiceNoteText.trim() || `Service Report Submitted for Job #${jobId.slice(-6)}`,
            priority: 'Medium',
            voiceUrl: uploadedVoiceUrl,
            reportId: resData._id,
            images: []
          })
        });
      }

      setShowSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 3000);
    } catch (e: any) {
      alert("Failed to submit report. Please check required fields and network connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-bg-surface border border-border-base rounded-3xl shadow-2xl p-6 md:p-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="premium-label text-blue-500">Final Step</p>
          <h2 className="text-2xl md:text-3xl font-black text-fg-primary uppercase tracking-tighter">Service Report</h2>
        </div>
        <div className="flex space-x-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-2 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-blue-500' : s < step ? 'w-4 bg-green-500' : 'w-4 bg-border-base'}`}></div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <h3 className="premium-label text-fg-muted">Service Details</h3>
            <div className="space-y-4">
              <div className="premium-form-group">
                <label className="premium-label">Customer Name *</label>
                <input 
                  placeholder="Customer Name" 
                  className="premium-input"
                  value={formData.customerName}
                  onChange={e => setFormData({...formData, customerName: e.target.value})}
                />
              </div>
              <div className="premium-form-group">
                <label className="premium-label">Customer Address *</label>
                <input 
                  placeholder="Full installation address" 
                  className="premium-input"
                  value={formData.customerAddress}
                  onChange={e => setFormData({...formData, customerAddress: e.target.value})}
                />
              </div>
              <div className="premium-form-group">
                <label className="premium-label">Issue Details *</label>
                <textarea 
                  placeholder="Describe the problem that was reported" 
                  className="premium-textarea"
                  value={formData.problemIdentified}
                  onChange={e => setFormData({...formData, problemIdentified: e.target.value})}
                />
              </div>
              <div className="premium-form-group">
                <label className="premium-label">Service Type</label>
                <select className="premium-select" value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})}>
                  <option value="Installation">Installation</option>
                  <option value="Repair">Repair</option>
                  <option value="AMC Visit">AMC Visit</option>
                  <option value="Replacement">Replacement</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <h3 className="premium-label text-fg-muted">Work Performed</h3>
            <div className="space-y-4">
              <div className="premium-form-group">
                <label className="premium-label">Work Details *</label>
                <textarea 
                  placeholder="Details of work performed..." 
                  className="premium-textarea"
                  value={formData.workPerformed}
                  onChange={e => setFormData({...formData, workPerformed: e.target.value})}
                />
              </div>
              <div className="p-5 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/10 rounded-2xl space-y-4">
                 <div className="flex justify-between items-center">
                    <p className="premium-label text-blue-600 dark:text-blue-400">Materials & Components</p>
                    <button type="button" onClick={addMaterial} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                       <Plus className="h-4 w-4" />
                    </button>
                 </div>
                 <div className="space-y-3">
                    {formData.materialsUsed.map((item, index) => (
                      <div key={index} className="flex gap-3 items-center">
                         <input 
                           placeholder="Item Name" 
                           className="flex-1 premium-input text-xs py-2"
                           value={item.name}
                           onChange={e => {
                             const nm = [...formData.materialsUsed];
                             nm[index].name = e.target.value;
                             setFormData({...formData, materialsUsed: nm});
                           }}
                         />
                         <input 
                           placeholder="Qty" 
                           type="number" 
                           className="w-16 premium-input text-xs py-2 text-center"
                           value={item.quantity}
                           onChange={e => {
                             const nm = [...formData.materialsUsed];
                             nm[index].quantity = Number(e.target.value);
                             setFormData({...formData, materialsUsed: nm});
                           }}
                         />
                         <input 
                           placeholder="?" 
                           type="number" 
                           className="w-20 premium-input text-xs py-2 text-center"
                           value={item.costPerUnit}
                           onChange={e => {
                             const nm = [...formData.materialsUsed];
                             nm[index].costPerUnit = Number(e.target.value);
                             setFormData({...formData, materialsUsed: nm});
                           }}
                         />
                         {formData.materialsUsed.length > 1 && (
                           <button type="button" onClick={() => removeMaterial(index)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                             <X className="h-4 w-4" />
                           </button>
                         )}
                      </div>
                    ))}
                 </div>
                 <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-200 dark:border-blue-500/10">
                    <div className="premium-form-group">
                       <label className="premium-label">Labor Cost (?)</label>
                       <input type="number" className="premium-input py-2" value={formData.laborCost} onChange={e => setFormData({...formData, laborCost: Number(e.target.value)})} />
                    </div>
                    <div className="premium-form-group">
                       <label className="premium-label">Other Parts (?)</label>
                       <input type="number" className="premium-input py-2" value={formData.partsCost} onChange={e => setFormData({...formData, partsCost: Number(e.target.value)})} />
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h3 className="premium-label text-fg-muted">Photos, Voice Note & Completion</h3>
            
            {/* Photo Upload */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <p className="premium-label">Before Work Photo *</p>
                  <label className="block aspect-video bg-bg-muted border-2 border-dashed border-border-base rounded-2xl overflow-hidden cursor-pointer relative group hover:border-blue-400 transition-colors">
                     {formData.photos.before ? (
                       <img src={getImageUrl(formData.photos.before)} className="w-full h-full object-cover" />
                     ) : (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-fg-dim group-hover:text-blue-500 transition-colors">
                          <Camera className="h-7 w-7 mb-2" />
                          <span className="text-[9px] font-black uppercase">Upload</span>
                       </div>
                     )}
                     <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e, 'before')} accept="image/*" />
                  </label>
               </div>
               <div className="space-y-2">
                  <p className="premium-label text-green-600 dark:text-green-400">After Work Photo *</p>
                  <label className="block aspect-video bg-bg-muted border-2 border-dashed border-green-200 dark:border-green-500/20 rounded-2xl overflow-hidden cursor-pointer relative group hover:border-green-400 transition-colors">
                     {formData.photos.after ? (
                       <img src={getImageUrl(formData.photos.after)} className="w-full h-full object-cover" />
                     ) : (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-fg-dim group-hover:text-green-500 transition-colors">
                          <Camera className="h-7 w-7 mb-2" />
                          <span className="text-[9px] font-black uppercase">Upload</span>
                       </div>
                     )}
                     <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e, 'after')} accept="image/*" />
                  </label>
               </div>
            </div>

            {/* Voice Note Section — saves to Admin Notes */}
            <div className="p-5 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/15 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                  <Mic className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Completion Voice Note</p>
                  <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/60 font-medium">Will be saved to Team Notes — visible to Admin</p>
                </div>
              </div>

              <div className="premium-form-group">
                <label className="premium-label">Written Summary (Optional)</label>
                <textarea
                  placeholder="e.g. Installed 4 cameras, tested live feed, customer satisfied..."
                  className="premium-textarea"
                  rows={2}
                  value={voiceNoteText}
                  onChange={e => setVoiceNoteText(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                {!audioBlob ? (
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`voice-record-btn flex-1 ${isRecording ? 'recording' : 'idle'}`}
                  >
                    {isRecording ? (
                      <><Square className="h-4 w-4" fill="currentColor" /> Stop {formatRecordingTime(recordingTime)}</>
                    ) : (
                      <><Mic className="h-4 w-4" /> Record Voice Note</>
                    )}
                  </button>
                ) : (
                  <div className="flex-1 flex items-center gap-3 p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                    <Volume2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex-1">Voice note recorded ?</span>
                    <button type="button" onClick={() => setAudioBlob(null)} className="p-1 text-emerald-500 hover:text-red-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-bg-muted/50 rounded-2xl border border-border-base">
                 <div className="flex items-center gap-2 text-green-500 mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Job Completion Check</span>
                 </div>
                 <p className="text-xs text-fg-muted font-medium">By submitting, you confirm that all work is completed, tested, and the customer has been informed.</p>
              </div>
              
              <label className="flex items-start gap-3 p-4 bg-blue-600/5 rounded-2xl border border-blue-600/20 cursor-pointer hover:bg-blue-600/10 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.recommendReview} 
                  onChange={e => setFormData({...formData, recommendReview: e.target.checked})} 
                  className="mt-1 w-5 h-5 accent-blue-600 rounded" 
                />
                <div>
                  <p className="text-sm font-black text-blue-600 uppercase tracking-tight">Recommend for Review</p>
                  <p className="text-xs text-blue-600/70 font-medium">Send a notification requesting the customer to leave a verified review.</p>
                </div>
              </label>
            </div>
          </motion.div>
        )}

        <div className="flex gap-4 pt-4">
          {step > 1 && (
            <button onClick={prevStep} className="flex-1 py-4 border border-border-base text-fg-muted rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-bg-muted transition-all">
              Back
            </button>
          )}
          <button 
            onClick={step === 3 ? handleSubmit : nextStep}
            className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={uploading || submitting}
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
            ) : step === 3 ? (
              <><CheckCircle2 className="h-4 w-4" /> Submit Final Report</>
            ) : (
              <>Next Step <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-bg-surface border border-green-500/20 p-12 rounded-[4rem] text-center space-y-8 shadow-2xl shadow-green-500/10 max-w-md w-full"
            >
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20 relative">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full -z-10 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-black text-fg-primary uppercase tracking-tighter">Report <span className="text-green-500 italic">Submitted</span></h3>
                <p className="text-fg-muted font-medium">Service report saved successfully. <br/>
                {(audioBlob || voiceNoteText) && <span className="text-emerald-500 font-bold">Voice note posted to Team Notes ?</span>}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceReportForm;
