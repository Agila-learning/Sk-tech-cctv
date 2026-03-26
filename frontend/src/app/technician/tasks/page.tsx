"use client";
import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth, API_URL } from '@/utils/api';
import BackButton from '@/components/common/BackButton';
import { 
  Briefcase, MapPin, Phone, Calendar, Clock, Image as ImageIcon, 
  Map, Camera, Loader2, CheckCircle2, ChevronRight, AlertCircle, X,
  Activity, Play, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function TechnicianTasksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [activeModal, setActiveModal] = useState<'start' | 'complete' | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Form State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/technician/my-tasks');
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  // Grab location as soon as modal opens
  useEffect(() => {
    if (activeModal) {
      setPhotoPreview(null);
      setSelectedFile(null);
      setNotes('');
      setCoords(null);
      setLocationError('');
      
      if (!navigator.geolocation) {
        setLocationError("Geolocation not supported by browser");
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => setLocationError("Failed to get location. Please enable GPS.")
        );
      }
    }
  }, [activeModal]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleActionClick = (task: any, action: 'start' | 'complete') => {
    setSelectedTask(task);
    setActiveModal(action);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return alert("Please upload a photo first");
    if (!coords) return alert("Waiting for GPS location...");
    
    setIsSubmitting(true);
    try {
      // 1. Upload Image
      const formData = new FormData();
      formData.append('image', selectedFile);
      const tokenAttr = localStorage.getItem('sk_auth_token');
      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenAttr}` },
        body: formData
      });
      if (!uploadRes.ok) throw new Error("Image upload failed");
      const uploadData = await uploadRes.json();
      const photoUrl = uploadData.imageUrl;

      // 2. Update Stage
      const stageName = activeModal === 'start' ? 'started' : 'completed';
      const payload = {
        photoUrl,
        lat: coords.lat,
        lng: coords.lng,
        notes,
        finalize: activeModal === 'complete'
      };

      await fetchWithAuth(`/technician/workflow/${selectedTask._id}/stage/${stageName}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      
      // Update local task state directly for immediate feedback, or reload
      await loadTasks();
      setActiveModal(null);
      setSelectedTask(null);
      alert(`Job ${activeModal === 'start' ? 'started' : 'completed'} successfully!`);
    } catch (error: any) {
      alert(error.message || "Failed to submit progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTaskStatus = (task: any) => {
    if (task.stages.completed?.status || task.order.status === 'completed' || task.order.status === 'delivered') return { label: 'Completed', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
    if (task.stages.started?.status || task.stages.inProgress?.status || task.order.status === 'in_progress') return { label: 'In Progress', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' };
    if (task.stages.assigned?.status || task.stages.accepted?.status || task.order.status === 'assigned') return { label: 'Assigned', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
    return { label: 'Pending', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
  };

  return (
    <div className="min-h-screen bg-background text-fg-primary p-4 md:p-10 pb-32 transition-all duration-500">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-6">
            <BackButton />
            <div className="pt-2">
               <div className="flex items-center space-x-3 text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] mb-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Work Center</span>
               </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none italic">
                My <span className="text-blue-500 non-italic">Tasks</span>
              </h1>
              <p className="text-fg-muted font-medium text-lg mt-2">Manage assigned jobs and upload progress.</p>
            </div>
          </div>
        </header>

        {/* Task Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="glass-card h-64 rounded-[2.5rem] border border-border-base animate-pulse" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="glass-card p-20 rounded-[3rem] border-dashed border-2 border-border-base text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-fg-dim mx-auto" />
            <p className="text-2xl font-black text-fg-primary uppercase tracking-tight">No Tasks Assigned</p>
            <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">You have a clear queue</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tasks.map((task) => {
              const statusInfo = getTaskStatus(task);
              const order = task.order || {};
              const customer = order.customer || {};
              const products = order.products || [];
              const isStarted = task.stages?.started?.status;
              const isCompleted = task.stages?.completed?.status || order.status === 'completed' || order.status === 'delivered';
              
              return (
                <div key={task._id} className="glass-card p-8 rounded-[2.5rem] border border-border-base relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -z-10 group-hover:bg-blue-600/10 transition-colors"></div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <p className="text-xs font-black text-blue-500 tracking-widest font-mono mt-3">ORDER #{order._id?.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-border-base">
                      {/* Customer Info */}
                      <div>
                        <h3 className="text-xl font-black text-fg-primary tracking-tight uppercase leading-none mb-1 text-ellipsis overflow-hidden">{customer.name || 'Client'}</h3>
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-fg-muted">
                           <Phone className="h-3 w-3" />
                           <span>{customer.phone || 'No phone'}</span>
                        </div>
                      </div>

                      {/* Service Type */}
                      <div className="flex items-center space-x-3 px-4 py-2.5 bg-bg-muted rounded-2xl border border-border-base">
                        <Activity className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="text-xs font-bold text-fg-primary truncate">{products?.[0]?.product?.name || 'Service Node'}</span>
                      </div>

                      {/* Address & Time */}
                      <div className="space-y-2 text-[10px] font-bold text-fg-muted">
                        <div className="flex items-start gap-2">
                           <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                           <span className="leading-tight uppercase truncate">{order.deliveryAddress || 'No address provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Calendar className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                           <span className="uppercase">{new Date(order.scheduledDate || order.createdAt).toLocaleDateString()}</span>
                        </div>
                        {order.scheduledSlot && (
                          <div className="flex items-center gap-2">
                             <Clock className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                             <span className="uppercase">{order.scheduledSlot}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 mt-6 border-t border-border-base space-y-3">
                    {!isStarted && !isCompleted && (
                      <button 
                        onClick={() => handleActionClick(task, 'start')}
                        className="w-full py-4 bg-orange-500/10 text-orange-500 border border-orange-500/30 hover:bg-orange-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl"
                      >
                        <Play className="h-4 w-4" />
                        Start Work (Pre-Photo)
                      </button>
                    )}

                    {isStarted && !isCompleted && (
                      <button 
                        onClick={() => handleActionClick(task, 'complete')}
                        className="w-full py-4 bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Complete Work (Post-Photo)
                      </button>
                    )}

                    {isCompleted && (
                      <div className="w-full py-4 bg-green-500/5 text-green-400 border border-green-500/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center flex items-center justify-center gap-2 cursor-default">
                        <CheckCircle2 className="h-4 w-4" />
                        Task Finished
                      </div>
                    )}
                    
                    <button 
                      onClick={() => router.push(`/technician/report/${task._id}`)}
                      className="w-full py-3 bg-bg-muted text-fg-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-bg-hover transition-all"
                    >
                      {isCompleted ? 'View Service Report' : 'View Full Details'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress Upload Modal */}
      <AnimatePresence>
        {activeModal && selectedTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-black/80 backdrop-blur-md">
             <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-card border border-card-border rounded-[3rem] p-8 lg:p-12 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-4">
                   <button onClick={() => setActiveModal(null)} className="p-3 bg-bg-muted hover:bg-red-500 hover:text-white rounded-2xl transition-all">
                      <X className="h-5 w-5" />
                   </button>
                </div>
                
                <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter mb-2">
                   {activeModal === 'start' ? 'Start Work' : 'Complete Work'}
                </h3>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest font-mono mb-8">NODE #{selectedTask.order?._id?.slice(-6).toUpperCase()}</p>
                
                <div className="flex-1 overflow-y-auto space-y-8 pr-2 scrollbar-hide">
                  {/* Photo Upload */}
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        {activeModal === 'start' ? 'Pre-Installation Photo' : 'Post-Installation Photo'} *
                     </label>
                     <div className="relative">
                        {photoPreview ? (
                           <div className="relative aspect-video rounded-3xl overflow-hidden border border-border-base group">
                              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">Retake</button>
                              </div>
                           </div>
                        ) : (
                           <button onClick={() => fileInputRef.current?.click()} className="w-full h-40 bg-bg-muted border-2 border-dashed border-border-base rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-600/5 transition-all text-fg-muted hover:text-blue-500">
                              <ImageIcon className="h-8 w-8" />
                              <span className="font-black text-[10px] uppercase tracking-widest">Tap to Upload Image</span>
                           </button>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" capture="environment" className="hidden" />
                     </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Work Notes (Optional)</label>
                     <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any remarks or observations..."
                        className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary focus:border-blue-500 outline-none resize-none"
                        rows={3}
                     />
                  </div>

                  {/* Location Status */}
                  <div className="space-y-4 p-5 rounded-2xl border border-border-base bg-bg-muted/50">
                     <div className="flex items-center gap-3 mb-2">
                        <Map className="h-4 w-4 text-blue-500" />
                        <span className="text-[10px] font-black text-fg-primary uppercase tracking-widest">Location Tracking</span>
                     </div>
                     {coords ? (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase">
                           <CheckCircle2 className="h-3.5 w-3.5" />
                           GPS Locked ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
                        </div>
                     ) : locationError ? (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase">
                           <AlertCircle className="h-3.5 w-3.5" />
                           {locationError}
                        </div>
                     ) : (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-orange-500 uppercase">
                           <Loader2 className="h-3.5 w-3.5 animate-spin" />
                           Acquiring GPS Signal...
                        </div>
                     )}
                  </div>
                </div>

                <div className="pt-8 mt-4 border-t border-border-base">
                   <button 
                      onClick={handleSubmit} 
                      disabled={isSubmitting || !photoPreview || !coords}
                      className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:hover:bg-blue-600 disabled:cursor-not-allowed"
                   >
                      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                      <span>{isSubmitting ? 'Uploading...' : 'Confirm Upload'}</span>
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
