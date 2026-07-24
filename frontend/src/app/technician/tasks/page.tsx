"use client";
import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth, API_URL } from '@/utils/api';
import BackButton from '@/components/common/BackButton';
import { 
  Briefcase, MapPin, Phone, Calendar, Clock, Image as ImageIcon, 
  Map, Camera, Loader2, CheckCircle2, ChevronRight, AlertCircle, X,
  Activity, Play, CheckCircle, Send, MessageCircle, FileText, Users, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import { AudioRecorder } from '@/components/common/AudioRecorder';

export default function TechnicianTasksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState<any[]>([]);
  const [availablePool, setAvailablePool] = useState<any[]>([]);
  const [taskTab, setTaskTab] = useState<'open' | 'active'>('active');
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [activeModal, setActiveModal] = useState<'start' | 'complete' | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [wizardStep, setWizardStep] = useState(1);
  
  // Form State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [voiceNoteBlob, setVoiceNoteBlob] = useState<Blob | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const [serviceData, internalData, poolData, bookingData] = await Promise.all([
        fetchWithAuth('/technician/my-tasks').catch(() => []),
        fetchWithAuth('/internal/tasks').catch(() => []),
        fetchWithAuth('/orders/available-pool').catch(() => []),
        fetchWithAuth('/technician/my-bookings').catch(() => [])
      ]);
      
      const unifiedTasks = [
        ...(serviceData || []).map((t: any) => ({ ...t, _unifiedType: 'workflow' })),
        ...(internalData || []).map((t: any) => ({ ...t, _unifiedType: 'internal' })),
        ...(bookingData || []).map((t: any) => ({ ...t, _unifiedType: 'booking' }))
      ].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      setTasks(unifiedTasks);
      setAvailablePool(poolData || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateInternalTaskStatus = async (taskId: string, status: string) => {
    const newNotes = prompt("Add any notes for this update (optional):", "");
    try {
      await fetchWithAuth(`/internal/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: newNotes || undefined })
      });
      alert(`Task marked as ${status}`);
      loadTasks();
    } catch (error: any) {
      alert(error.message || "Failed to update task");
    }
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 60000); // refresh every minute

    if (socket) {
      socket.on('technician_assigned', loadTasks);
      return () => {
        clearInterval(interval);
        socket.off('technician_assigned', loadTasks);
      };
    }
    
    return () => clearInterval(interval);
  }, []);

  // Grab location as soon as modal opens
  useEffect(() => {
    if (activeModal) {
      setPhotoPreview(null);
      setSelectedFile(null);
      setNotes('');
      setVoiceNoteBlob(null);
      setCoords(null);
      setLocationError('');
      setWizardStep(1);
      
      if (!navigator.geolocation) {
        setLocationError("Geolocation not supported by browser");
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => {
            console.warn("GPS acquisition failed:", err);
            setLocationError("GPS Acquisition Failed. Using network fallback.");
            setCoords({ lat: 0, lng: 0 }); // Fallback to avoid blocking if the technician is in a basement/etc.
          },
          { timeout: 8000, enableHighAccuracy: true }
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
    if (activeModal === 'complete' && !notes.trim()) return alert("Notes are mandatory for completion");
    
    setIsSubmitting(true);
    try {
      // 1. Upload Image
      const formData = new FormData();
      formData.append('images', selectedFile);
      const tokenAttr = localStorage.getItem('sk_auth_token');
      const uploadRes = await fetch(`${API_URL}/upload?type=workflow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenAttr}` },
        body: formData
      });
      if (!uploadRes.ok) throw new Error("Image upload failed");
      const uploadData = await uploadRes.json();
      const photoUrl = uploadData.imageUrl;

      // 1.5 Upload Voice Note if exists
      let voiceUrl = null;
      if (voiceNoteBlob) {
        const audioFormData = new FormData();
        audioFormData.append('images', new File([voiceNoteBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' }));
        const audioUploadRes = await fetch(`${API_URL}/upload?type=documents`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${tokenAttr}` },
          body: audioFormData
        });
        if (audioUploadRes.ok) {
          const audioUploadData = await audioUploadRes.json();
          voiceUrl = audioUploadData.imageUrl;
        }
      }

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
      
      // Auto-post to team notes if completed
      if (activeModal === 'complete') {
        try {
          const orderIdStr = selectedTask._type === 'internal' ? selectedTask._id.slice(-6).toUpperCase() : (selectedTask.order?._id?.slice(-6).toUpperCase() || 'N/A');
          const customerName = selectedTask._type === 'internal' ? (selectedTask.customerName || 'Internal') : (selectedTask.order?.customer?.name || 'Customer');
          const purpose = selectedTask._type === 'internal' ? selectedTask.title : (selectedTask.order?.products?.[0]?.product?.name || 'Service');
          
          let noteContent = `✅ **JOB COMPLETED**\n**Purpose:** ${purpose}\n**Ref ID:** #${orderIdStr}\n**Customer:** ${customerName}\n**Remarks:** ${notes}`;
          if (voiceUrl) {
            noteContent += `\n**Voice Note:** Attached`;
          }
          
          await fetchWithAuth('/notes', {
            method: 'POST',
            body: JSON.stringify({ 
              content: noteContent, 
              priority: 'High',
              images: [photoUrl],
              voiceUrl: voiceUrl || undefined
            })
          });
        } catch (noteErr) {
          console.error("Failed to post completion note", noteErr);
        }
      }
      
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
    if (task._type === 'internal') {
      if (task.status === 'completed') return { label: 'Completed', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
      if (task.status === 'in_progress') return { label: 'In Progress', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' };
      if (task.status === 'started') return { label: 'Started', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      return { label: 'Pending', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
    }
    if (task.stages?.completed?.status || task.order?.status === 'completed' || task.order?.status === 'delivered') return { label: 'Completed', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
    if (task.stages?.started?.status || task.stages?.inProgress?.status || task.order?.status === 'in_progress') return { label: 'In Progress', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' };
    if (task.stages?.assigned?.status || task.stages?.accepted?.status || task.order?.status === 'assigned') return { label: 'Assigned', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
    return { label: 'Pending', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
  };


  return (
    <div className="p-6 lg:p-12 space-y-12">
      <div className="max-w-7xl mx-auto space-y-12">
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

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-border-base pb-4">
          <button 
            onClick={() => setTaskTab('open')}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${taskTab === 'open' ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20' : 'text-fg-muted hover:bg-bg-muted border border-transparent'}`}
          >
            Open Pool
          </button>
          <button 
            onClick={() => setTaskTab('active')}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${taskTab === 'active' ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' : 'text-fg-muted hover:bg-bg-muted border border-transparent'}`}
          >
            My Active Tasks
          </button>
        </div>

        {/* Task Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="glass-card h-64 rounded-[2.5rem] border border-border-base animate-pulse" />)}
          </div>
        ) : taskTab === 'open' ? (
          availablePool.length === 0 ? (
            <div className="glass-card p-20 rounded-[3rem] border-dashed border-2 border-border-base text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-fg-dim mx-auto" />
              <p className="text-2xl font-black text-fg-primary uppercase tracking-tight">No Open Tasks</p>
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">All orders have been assigned</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {availablePool.map((booking) => (
                <div key={booking._id} className="glass-card p-8 rounded-[2.5rem] border border-border-base relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-3xl -z-10 group-hover:bg-emerald-600/10 transition-colors"></div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          AVAILABLE
                        </span>
                        <p className="text-xs font-black text-emerald-500 tracking-widest font-mono mt-3">
                          ORDER #{booking._id?.slice(-6).toUpperCase()}
                        </p>
                        {booking.createdAt && (
                          <p className="text-[9px] font-bold text-fg-muted mt-1 uppercase tracking-widest">{new Date(booking.createdAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-border-base">
                      {/* Customer Info */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-fg-primary tracking-tight uppercase leading-none">
                          {booking.customer?.name || 'Client'}
                        </h3>
                      </div>

                      {/* Service Type */}
                      <div className="flex items-center space-x-3 px-4 py-2.5 bg-bg-muted rounded-2xl border border-border-base">
                        <Activity className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-xs font-bold text-fg-primary">
                          {booking.serviceType || booking.category || 'Service'}
                        </span>
                      </div>

                      {/* Address & Time */}
                      <div className="space-y-2 text-[10px] font-bold text-fg-muted">
                        <div className="flex items-start gap-2 text-fg-secondary text-xs">
                           <MapPin className="h-4 w-4 text-blue-500 mt-0.5" />
                           <span className="leading-tight uppercase">{booking.address || booking.deliveryAddress || 'No address provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                           <span className="uppercase">{booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : 'Flexible Date'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Clock className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                           <span className="uppercase">{booking.preferredTiming || 'Flexible Time'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 mt-6 border-t border-border-base space-y-3">
                    <button 
                      onClick={async () => {
                        try {
                           await fetchWithAuth(`/orders/pickup/${booking._id}`, { method: 'PATCH' });
                           alert('Task accepted successfully!');
                           loadTasks();
                           setTaskTab('active');
                        } catch (e: any) {
                           alert(`Failed to accept task: ${e.message}`);
                        }
                      }}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20"
                    >
                      Self Assign Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : taskTab === 'active' ? (
          tasks.length === 0 ? (
            <div className="glass-card p-20 rounded-[3rem] border-dashed border-2 border-border-base text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-fg-dim mx-auto" />
              <p className="text-2xl font-black text-fg-primary uppercase tracking-tight">No Active Tasks</p>
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">You have a clear queue</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tasks.map((task) => {
              const statusInfo = getTaskStatus(task);
              const order = task.order || task; 
              const customer = order.customer || {};
              const products = order.products || [];
              const isStarted = task.stages?.started?.status;
              const isCompleted = task.stages?.completed?.status || order.status === 'completed' || order.status === 'delivered';
              
              let tagInfo = { label: "ONLINE", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
              if (task._unifiedType === 'internal') tagInfo = { label: "INTERNAL TASK", color: "bg-red-500/10 text-red-500 border-red-500/20" };
              else if (task._unifiedType === 'booking') tagInfo = { label: "SERVICE WARRANTY REWORK / FOLLOW-UP", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" };
              else if (order.orderType === 'offline' || order.isManual) tagInfo = { label: "OFFLINE", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" };

              return (
                <div key={task._id} className="glass-card p-8 rounded-[2.5rem] border border-border-base relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -z-10 group-hover:bg-blue-600/10 transition-colors"></div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <span className={`ml-2 px-2 py-1 border rounded-xl text-[8px] font-black uppercase tracking-widest ${tagInfo.color}`}>
                          {tagInfo.label}
                        </span>
                        <p className="text-xs font-black text-blue-500 tracking-widest font-mono mt-3">
                          {task._unifiedType === 'internal' ? `TASK #${task._id.slice(-6).toUpperCase()}` : `REF #${(order._id || task._id)?.slice(-6).toUpperCase()}`}
                        </p>
                        {(order.createdAt || task.createdAt) && (
                          <p className="text-[9px] font-bold text-fg-muted mt-1 uppercase tracking-widest">{new Date(order.createdAt || task.createdAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    {/* Pipeline Progress Visualization */}
                    {task._unifiedType !== 'internal' && (
                      <div className="py-4 border-b border-border-base">
                        <div className="flex justify-between items-center relative before:absolute before:inset-0 before:h-0.5 before:bg-border-base before:top-1/2 before:-translate-y-1/2 before:-z-10">
                          {[
                            { label: 'Assigned', active: task.stages?.assigned?.status || order.status === 'assigned' || order.status === 'in_progress' || order.status === 'completed' },
                            { label: 'Accepted', active: task.stages?.accepted?.status || order.status === 'accepted' || order.status === 'in_progress' || order.status === 'completed' },
                            { label: 'Started', active: task.stages?.started?.status || order.status === 'in_progress' || order.status === 'completed' },
                            { label: 'Completed', active: task.stages?.completed?.status || order.status === 'completed' },
                          ].map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1.5 bg-bg-surface px-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-[2px] ${step.active ? 'border-blue-500 bg-blue-50 text-blue-500' : 'border-slate-200 bg-slate-50 text-slate-300'}`}>
                                {step.active ? <CheckCircle className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-wider ${step.active ? 'text-fg-primary' : 'text-slate-400'}`}>{step.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 pt-4">
                      {/* Customer Info */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-fg-primary tracking-tight uppercase leading-none">
                          {task.customerName || customer.name || task.name || 'Client'}
                        </h3>
                        {/* Click-to-Call */}
                        {(task.customerPhone || customer.phone) && (
                          <a
                            href={`tel:${(task.customerPhone || customer.phone || '').replace(/\D/g, '')}`}
                            className="flex items-center gap-2 w-fit px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {task.customerPhone || customer.phone}
                          </a>
                        )}
                        {/* Chat with Customer */}
                        {(customer._id || task.customerId) && (
                          <button
                            onClick={() => router.push(`/technician/chat?userId=${customer._id || task.customerId}`)}
                            className="flex items-center gap-2 w-fit px-3 py-1.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Chat with Customer
                          </button>
                        )}
                        {/* Team Collaboration */}
                        <button
                          onClick={() => router.push(`/technician/tasks/collaboration?taskId=${task.order?._id || task._id}&type=${task._type === 'internal' ? 'task' : 'order'}`)}
                          className="flex items-center gap-2 w-fit px-3 py-1.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all mt-2"
                        >
                          <Users className="h-3.5 w-3.5" />
                          Team Collaboration Workspace
                        </button>
                        {/* Live Location Link */}
                        {task.liveLocation && (
                          <a
                            href={task.liveLocation}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 w-fit px-3 py-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"
                          >
                            <Map className="h-3.5 w-3.5" />
                            Open Live Location
                          </a>
                        )}
                      </div>

                      {/* Service Type */}
                      <div className="flex items-center space-x-3 px-4 py-2.5 bg-bg-muted rounded-2xl border border-border-base">
                        <Activity className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="text-xs font-bold text-fg-primary">
                          {task._unifiedType === 'internal' ? task.title : task._unifiedType === 'booking' ? (task.serviceType || task.category || 'Warranty Follow-up') : (products?.[0]?.product?.name || 'Service Node')}
                        </span>
                      </div>

                      {task._type === 'internal' && task.description && (
                        <div className="px-4 py-3 bg-bg-muted/50 rounded-2xl border border-border-base">
                          <p className="text-[10px] font-bold text-fg-secondary italic">{task.description}</p>
                        </div>
                      )}

                      {/* Address & Time */}
                      <div className="space-y-2 text-[10px] font-bold text-fg-muted">
                        <div className="flex items-start gap-2">
                           <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                           <span className="leading-tight uppercase">{order.deliveryAddress || task.address || task.liveLocation || 'No address provided'}</span>
                        </div>
                        {(order.dueDate || order.scheduledDate || task.dueDate) && (
                          <div className="flex items-center gap-2">
                             <Calendar className={`h-3.5 w-3.5 ${(order.dueDate || task.dueDate) ? 'text-red-500' : 'text-blue-400'} shrink-0`} />
                             <span className="uppercase">{(order.dueDate || task.dueDate) ? `Due: ${new Date(order.dueDate || task.dueDate).toLocaleString()}` : new Date(order.scheduledDate).toLocaleString()}</span>
                          </div>
                        )}
                        {(order.timeToComplete || task.timeToComplete) && (
                          <div className="flex items-center gap-2">
                             <Clock className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                             <span className="uppercase">Target: {order.timeToComplete || task.timeToComplete}</span>
                          </div>
                        )}
                        {order.scheduledSlot && !order.timeToComplete && task._unifiedType !== 'internal' && (
                          <div className="flex items-center gap-2">
                             <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                             <span className="uppercase">Slot: {order.scheduledSlot}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 mt-6 border-t border-border-base space-y-3">
                    {task._unifiedType === 'internal' ? (
                      <>
                         {task.status === 'pending' && (
                            <button onClick={() => updateInternalTaskStatus(task._id, 'started')} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20">
                              Start Task
                            </button>
                         )}
                         {task.status === 'started' && (
                            <button onClick={() => updateInternalTaskStatus(task._id, 'in_progress')} className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20">
                              Mark In Progress
                            </button>
                         )}
                         {task.status === 'in_progress' && (
                            <button onClick={() => handleActionClick(task, 'complete')} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-green-500/20">
                              Complete Task
                            </button>
                         )}
                      </>
                    ) : (
                      <>
                        {!isStarted && !isCompleted && (
                          <button 
                            onClick={() => handleActionClick(task, 'start')}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20"
                          >
                            Start Mission
                          </button>
                        )}
                        
                        {isStarted && !isCompleted && (
                          <button 
                            onClick={() => handleActionClick(task, 'complete')}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-green-600/20"
                          >
                            Mark Completed
                          </button>
                        )}
                        
                        {isCompleted && (
                          <div className="w-full py-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center">
                            Mission Accomplished
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : null}
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
                
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 uppercase tracking-tighter mb-2">
                   {activeModal === 'start' ? 'Start Work' : 'Complete Work'}
                </h3>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest font-mono mb-8 bg-blue-500/10 w-fit px-3 py-1 rounded-lg">NODE #{selectedTask.order?._id?.slice(-6).toUpperCase() || selectedTask._id?.slice(-6).toUpperCase()}</p>
                
                {/* Pipeline Progress Indicator */}
                <div className="flex items-center justify-between mb-8 relative">
                   <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border-base -z-10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: wizardStep === 1 ? '50%' : '100%' }}></div>
                   </div>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${wizardStep >= 1 ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-bg-muted text-fg-muted'}`}>1</div>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${wizardStep >= 2 ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-bg-muted text-fg-muted'}`}>2</div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-8 pr-2 scrollbar-hide">
                  
                  {wizardStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                     <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        {activeModal === 'start' ? 'Pre-Installation Photo' : 'Post-Installation Photo'} *
                     </label>
                     <div className="relative">
                        {photoPreview ? (
                           <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-blue-500/30 group shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)]">
                              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black hover:scale-105 transition-all shadow-xl">Retake Photo</button>
                              </div>
                           </div>
                        ) : (
                           <button onClick={() => fileInputRef.current?.click()} className="w-full h-40 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-2 border-dashed border-blue-300 dark:border-blue-700/50 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all text-blue-500/70 hover:text-blue-600 shadow-inner group">
                              <div className="p-4 bg-white dark:bg-card rounded-full shadow-lg group-hover:scale-110 transition-transform">
                                <ImageIcon className="h-6 w-6 text-blue-500" />
                              </div>
                              <span className="font-black text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400">Tap to Upload Image</span>
                           </button>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" capture="environment" className="hidden" />
                     </div>
                  </motion.div>
                  )}

                  {wizardStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    {/* Location Status */}
                    <div className="space-y-4 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/10 shadow-sm">
                       <div className="flex items-center gap-3 mb-2">
                          <Map className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-[10px] font-black text-blue-900 dark:text-blue-100 uppercase tracking-widest">Location Verification</span>
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

                    {/* Notes & Voice Note */}
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest flex items-center justify-between">
                         <span>Work Notes {activeModal === 'complete' ? '*' : '(Optional)'}</span>
                         <button 
                           onClick={() => setShowRecorder(!showRecorder)}
                           className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
                         >
                           <Mic className="h-3.5 w-3.5" />
                           {voiceNoteBlob ? 'Retake Voice Note' : 'Add Voice Note'}
                         </button>
                       </label>
                       
                       {showRecorder && (
                         <div className="bg-bg-muted/30 border border-border-base rounded-2xl p-4 mb-4">
                           <AudioRecorder 
                             onRecordingComplete={(blob) => {
                               setVoiceNoteBlob(blob);
                               setShowRecorder(false);
                             }}
                             onCancel={() => setShowRecorder(false)}
                           />
                         </div>
                       )}

                       {voiceNoteBlob && !showRecorder && (
                         <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
                           <div className="flex items-center gap-2 text-blue-500">
                             <Mic className="h-4 w-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Voice Note Attached</span>
                           </div>
                           <button 
                             onClick={() => setVoiceNoteBlob(null)}
                             className="text-red-500 hover:text-red-600"
                           >
                             <X className="h-4 w-4" />
                           </button>
                         </div>
                       )}

                       <textarea 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add any remarks or observations..."
                          className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none transition-all shadow-inner"
                          rows={3}
                       />
                    </div>
                  </motion.div>
                  )}
                </div>
                <div className="pt-8 mt-4 border-t border-border-base flex gap-4">
                   {wizardStep === 1 ? (
                     <button 
                        onClick={() => setWizardStep(2)}
                        disabled={!photoPreview}
                        className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:hover:bg-blue-600 disabled:cursor-not-allowed"
                     >
                        <span>Next Step</span>
                        <ChevronRight className="h-5 w-5" />
                     </button>
                   ) : (
                     <div className="w-full flex gap-3">
                       <button 
                          onClick={() => setWizardStep(1)} 
                          className="px-6 py-5 bg-bg-muted text-fg-primary rounded-2xl font-black text-xs uppercase hover:bg-bg-hover transition-all"
                       >
                          Back
                       </button>
                       <button 
                          onClick={handleSubmit} 
                          disabled={isSubmitting || !photoPreview || !coords}
                          className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:hover:bg-blue-600 disabled:cursor-not-allowed"
                       >
                          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                          <span>{isSubmitting ? 'Uploading...' : 'Confirm & Complete'}</span>
                       </button>
                     </div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
