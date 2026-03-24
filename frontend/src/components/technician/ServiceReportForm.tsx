"use client";
import React, { useState } from 'react';
import { Camera, MapPin, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { motion } from 'framer-motion';
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
    materialsUsed: [{ name: '', quantity: 1 }],
    technicianRemarks: '',
    photos: {
       before: initialData?.photos?.before || '',
       after: initialData?.photos?.after || ''
    },
    location: { lat: 0, lng: 0 },
    signature: ''
  });
  const [uploading, setUploading] = useState(false);
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
      formPayload.append('image', file);
      const token = localStorage.getItem('sk_auth_token');
      // Using API_URL instead of potentially undefined NEXT_PUBLIC_API_URL
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formPayload
      });
      const data = await response.json();
      setFormData(prev => ({ ...prev, photos: { ...prev.photos, [type]: data.imageUrl } }));
    } catch (e) { alert("Upload failed"); }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!formData.photos.before || !formData.photos.after) {
      return alert("MANDATORY: Both Before and After photos are required for job completion.");
    }
    try {
      // Get final GPS
      const pos: any = await new Promise((res) => navigator.geolocation.getCurrentPosition(res, () => res({ coords: { latitude: 0, longitude: 0 } })));
      
      await fetchWithAuth('/technician/report', {
        method: 'POST',
        body: JSON.stringify({
          jobId,
          ...formData,
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        })
      });
      setShowSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 3000);
    } catch (e) {
      alert("Failed to submit report. Please check required fields and network connection.");
    }
  };

  return (
    <div className="glass-card p-10 rounded-[3rem] border border-white/10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Final Step</p>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Service Report</h2>
        </div>
        <div className="flex space-x-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-2 h-2 rounded-full ${s === step ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Service Details</h3>
            <div className="space-y-4">
              <input 
                placeholder="Customer Name" 
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all"
                value={formData.customerName}
                onChange={e => setFormData({...formData, customerName: e.target.value})}
              />
              <input 
                placeholder="Customer Address" 
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all"
                value={formData.customerAddress}
                onChange={e => setFormData({...formData, customerAddress: e.target.value})}
              />
              <textarea 
                placeholder="Issue Details" 
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-blue-500 h-32 transition-all"
                value={formData.problemIdentified}
                onChange={e => setFormData({...formData, problemIdentified: e.target.value})}
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Work Performed</h3>
            <div className="space-y-4">
              <textarea 
                placeholder="Details of work performed..." 
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-blue-500 h-32 transition-all"
                value={formData.workPerformed}
                onChange={e => setFormData({...formData, workPerformed: e.target.value})}
              />
              <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Materials Used</p>
                 <div className="flex gap-4">
                    <input 
                      placeholder="Item" 
                      className="flex-1 bg-transparent border-b border-white/10 p-2 text-xs font-bold text-white outline-none" 
                      value={formData.materialsUsed[0]?.name || ''}
                      onChange={e => {
                        const nm = [...formData.materialsUsed];
                        nm[0] = { ...nm[0], name: e.target.value };
                        setFormData({...formData, materialsUsed: nm});
                      }}
                    />
                    <input 
                      placeholder="Qty" 
                      type="number" 
                      className="w-20 bg-transparent border-b border-white/10 p-2 text-xs font-bold text-white outline-none" 
                      value={formData.materialsUsed[0]?.quantity || 1}
                      onChange={e => {
                        const nm = [...formData.materialsUsed];
                        nm[0] = { ...nm[0], quantity: Number(e.target.value) };
                        setFormData({...formData, materialsUsed: nm});
                      }}
                    />
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Photos & Final Check</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Before Work Photo</p>
                  <label className="block aspect-video bg-slate-900 border border-white/5 rounded-2xl overflow-hidden cursor-pointer relative group">
                     {formData.photos.before ? (
                       <img src={getImageUrl(formData.photos.before)} className="w-full h-full object-cover" />
                     ) : (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 group-hover:text-blue-500 transition-colors">
                          <Camera className="h-6 w-6 mb-2" />
                          <span className="text-[8px] font-black uppercase">Capture</span>
                       </div>
                     )}
                     <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e, 'before')} accept="image/*" />
                  </label>
               </div>
               <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-green-500">After Work Photo</p>
                  <label className="block aspect-video bg-slate-900 border border-white/5 rounded-2xl overflow-hidden cursor-pointer relative group">
                     {formData.photos.after ? (
                       <img src={getImageUrl(formData.photos.after)} className="w-full h-full object-cover" />
                     ) : (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 group-hover:text-green-500 transition-colors">
                          <Camera className="h-6 w-6 mb-2" />
                          <span className="text-[8px] font-black uppercase">Capture</span>
                       </div>
                     )}
                     <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e, 'after')} accept="image/*" />
                  </label>
               </div>
            </div>
            <div className="p-8 bg-slate-900/80 rounded-3xl border border-white/5 space-y-4">
               <div className="flex items-center space-x-2 text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Check Complete</span>
               </div>
               <div className="h-20 bg-black/50 rounded-2xl flex items-center justify-center border border-white/5">
                  <span className="italic text-slate-700 font-serif text-sm">Customer Signature Done</span>
               </div>
            </div>
          </motion.div>
        )}

        <div className="flex gap-4 pt-10">
          {step > 1 && (
            <button onClick={prevStep} className="flex-1 py-5 border border-white/10 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
              Back
            </button>
          )}
          <button 
            onClick={step === 3 ? handleSubmit : nextStep}
            className="flex-[2] py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-500/20"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : step === 3 ? 'Submit Final Report' : 'Next Step'}
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
              className="glass-card p-12 rounded-[4rem] border border-green-500/20 text-center space-y-8 shadow-2xl shadow-green-500/10"
            >
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-white/5 relative">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full -z-10 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Report <span className="text-green-500 italic">Secured</span></h3>
                <p className="text-fg-muted font-medium">Professional service log successfully uploaded. <br/> Redirecting to active terminal...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceReportForm;

