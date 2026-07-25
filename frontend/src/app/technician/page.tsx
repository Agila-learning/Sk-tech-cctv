"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, CheckCircle2, Clock, Camera, MapPin, Zap, 
  TrendingUp, DollarSign, Star, Activity, Menu, LayoutDashboard, 
  Settings, LogOut, ChevronRight, MessageSquare, 
  AlertTriangle, UserIcon, RefreshCcw, Play, Square, Bell, Navigation, Phone,
  Calendar, Check, Info, MoreVertical, Briefcase, ChevronLeft, Share2, ExternalLink, Users, IndianRupee, ArrowRight, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { fetchWithAuth, API_URL } from '@/utils/api';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { NotificationSection } from '@/components/NotificationSection';
import { TechnicianServiceFlow } from '@/components/technician/TechnicianServiceFlow';
import { WelcomeModal } from '@/components/common/WelcomeModal';

const TechnicianDashboard = () => {
  const { logout, user, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { socket } = useSocket();

  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [gpsStatus, setGpsStatus] = useState<'active' | 'weak' | 'denied'>('active');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'Available' | 'Busy' | 'Offline'>('Offline');
  const [isOnline, setIsOnline] = useState(false);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDates, setLeaveDates] = useState({ start: '', end: '' });
  
  const [rescheduleOrder, setRescheduleOrder] = useState<any>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', reason: '' });
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<'admin' | 'customer'>('admin');
  const [copySuccess, setCopySuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [availablePool, setAvailablePool] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [internalTasks, setInternalTasks] = useState<any[]>([]);
  const [orderTab, setOrderTab] = useState<'open' | 'present' | 'past' | 'service'>('present');

  // New Work Tracking State
  const [isWorking, setIsWorking] = useState(false);
  const [activeWorkLog, setActiveWorkLog] = useState<any>(null);
  const [todayWorkLogs, setTodayWorkLogs] = useState<any[]>([]);

  // Daily Report State
  const [dailyDescription, setDailyDescription] = useState('');
  const [dailyRemarks, setDailyRemarks] = useState('');
  const [dailyProgress, setDailyProgress] = useState(25);
  const [dailyPhotos, setDailyPhotos] = useState<string[]>([]);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Manual Billing State
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingData, setBillingData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    description: 'CCTV Service & Parts',
    amount: 0,
    taxRate: 18,
    notes: '',
    warranty: '12 Months Warranty',
    location: ''
  });
  const [generatingBill, setGeneratingBill] = useState(false);

  const getWarrantyStatus = (item: any) => {
    const startDate = item.warrantyStartDate ? new Date(item.warrantyStartDate) : item.createdAt ? new Date(item.createdAt) : new Date();
    const diffMonths = (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    const isExpired = diffMonths > 12;
    return {
      text: isExpired ? 'Warranty Expired (Chargeable Service)' : 'Under Warranty (Free Rework)',
      isExpired
    };
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);
  const workTimerRef = useRef<any>(null);
  const [workTime, setWorkTime] = useState(0);

  // --- Initial Load ---
  useEffect(() => {
    const init = async () => {
      try {
        await loadDashboard();
      } catch (e: any) { console.error(e); }
    };
    if (isAuthenticated) init();
  }, [isAuthenticated]);

  const toggleOnlineStatus = async (status: boolean) => {
    try {
      const res = await fetchWithAuth('/technician/toggle-online', {
        method: 'POST',
        body: JSON.stringify({ isOnline: status })
      });
      setIsOnline(res.isOnline);
      setAvailabilityStatus(res.availabilityStatus);
      window.dispatchEvent(new CustomEvent('tech_online_changed', { detail: res.isOnline }));
    } catch (e: any) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  useEffect(() => {
    const handleSync = (e: any) => {
      setIsOnline(e.detail);
      // We can also fetch the exact status or let it be 'Available'/'Offline' based on detail
      setAvailabilityStatus(e.detail ? 'Available' : 'Offline');
    };
    window.addEventListener('tech_online_changed', handleSync);
    return () => window.removeEventListener('tech_online_changed', handleSync);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        fetchWithAuth('/technician/my-tasks'),
        fetchWithAuth('/internal/announcements'),
        fetchWithAuth('/technician/stats'),
        fetchWithAuth('/orders/available-pool'),
        fetchWithAuth('/technician/my-bookings'),
        fetchWithAuth('/internal/tasks'),
        fetchWithAuth('/chat')
      ]);

      const [jobs, anns, techStats, pool, bookingData, tasks, msgData] = results.map(
        res => res.status === 'fulfilled' ? res.value : null
      );

      setAnnouncements(anns || []);
      setStats(techStats || {});
      setAvailablePool(pool || []);
      setMyBookings(bookingData || []);
      setInternalTasks(tasks || []);
      setMessages(msgData || []);
      
      if (user && user.availabilityStatus) {
        setAvailabilityStatus(user.availabilityStatus);
      }
      if (user && user.isOnline !== undefined) {
        setIsOnline(user.isOnline);
      }

      if (jobs?.length > 0) {
        const activeJobs = (jobs as any[]).filter((j: any) => j.order?.status !== 'completed' && j.order?.status !== 'delivered');
        const active = activeJobs.find((j: any) => j.order?.status === 'in_progress' || (j.stages?.started?.status && !j.stages?.completed?.status)) || 
                       activeJobs.find((j: any) => j.order?.status === 'assigned' || j.order?.status === 'accepted' || (j.stages?.accepted?.status && !j.stages?.completed?.status)) ||
                       activeJobs.find((j: any) => j.order?.status === 'pending_approval' || (j.stages?.completed?.status && j.order?.status === 'pending_approval')) ||
                       activeJobs.find((j: any) => !j.stages?.completed?.status);
        setActiveJob(active || null);
      } else {
        setActiveJob(null);
      }
    } catch (e: any) { 
      console.error("Technician Dashboard Load Error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (isWorking) {
      workTimerRef.current = setInterval(() => {
        setWorkTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(workTimerRef.current);
    }
    return () => clearInterval(workTimerRef.current);
  }, [isWorking]);

  // --- Socket Listeners ---
  useEffect(() => {
    if (socket && user) {
      socket.on('technician_assigned', loadDashboard);
      socket.on(`message:${user._id}`, (msg: any) => {
        setMessages(prev => [...prev, msg]);
        if (!isChatOpen) { /* potential notification logic */ }
      });
      socket.on('message_role:technician', (msg: any) => {
        setMessages(prev => [...prev, msg]);
      });
      socket.on('message', (msg: any) => {
        if (msg?.sender?._id !== user._id) {
          setMessages(prev => [...prev, msg]);
        }
      });
      // Refresh announcements when a new one is broadcast
      const refreshAnnouncements = async () => {
        try {
          const data = await fetchWithAuth('/internal/announcements');
          setAnnouncements(data || []);
        } catch {}
      };
      socket.on('new_notification', refreshAnnouncements);
      socket.on('notification', refreshAnnouncements);
      return () => {
        socket.off('technician_assigned');
        socket.off(`message:${user._id}`);
        socket.off('message_role:technician');
        socket.off('message');
        socket.off('new_notification', refreshAnnouncements);
        socket.off('notification', refreshAnnouncements);
      };
    }
  }, [socket, user]);

  // --- Get GPS Helper ---
  const getGPS = async () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: 0, lng: 0, address: 'GPS Not Supported' });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: 'Live Location' }),
        () => resolve({ lat: 0, lng: 0, address: 'GPS Denied' }),
        { timeout: 1500 }
      );
      setTimeout(() => resolve({ lat: 0, lng: 0, address: 'GPS Timeout' }), 1600);
    });
  };

  const getDeviceInfo = () => {
    return `${navigator.platform} - ${navigator.userAgent.slice(0, 50)}...`;
  };

  // --- Handlers ---


  const handleAvailabilityToggle = async () => {
    const newStatus = availabilityStatus === 'Available' ? 'Offline' : 'Available';
    try {
      await fetchWithAuth('/technician/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setAvailabilityStatus(newStatus);
    } catch (e: any) {
      alert("Failed to update status");
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleData.date || !rescheduleData.reason) return alert("Please provide date and reason");
    try {
      const orderId = rescheduleOrder?._id || rescheduleOrder;
      await fetchWithAuth(`/orders/reschedule/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rescheduleData)
      });
      alert('Reschedule request sent to admin');
      setRescheduleOrder(null);
    } catch (e: any) { alert('Failed to send request'); }
  };

  const handleJobAction = async (action: 'accept' | 'reject') => {
    if (!activeJob) return;
    try {
      if (!activeJob?.order?._id) return alert("Task order details are missing.");
      await fetchWithAuth(`/orders/respond/${activeJob.order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      loadDashboard();
    } catch (e: any) { alert("Action failed"); }
  };

  const handlePickup = async (orderId: string) => {
    try {
      await fetchWithAuth(`/orders/pickup/${orderId}`, { method: 'PATCH' });
      alert("Job self-assigned successfully.");
      loadDashboard();
    } catch (e: any) { alert("Pickup failed. Job might be taken."); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, stage?: 'start' | 'inProgress' | 'completion') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      
      const gps: any = await getGPS();
      const tokenAttr = localStorage.getItem('sk_auth_token');
      
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenAttr}` },
        body: formData
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      
      const currentStep = getWorkflowStep();
      const orderId = activeJob?.order?._id || activeJob?._id;

      // Handle Multi-stage Upload
      if (stage) {
        await fetchWithAuth(`/orders/technician/proof/${orderId}`, {
          method: 'POST',
          body: JSON.stringify({
            stage,
            photoUrl: data.imageUrl,
            lat: gps.lat,
            lng: gps.lng,
            remarks: stage === 'completion' ? prompt("Final Remarks:") : ''
          })
        });
      } else {
        // Fallback for general progress photos
        await fetchWithAuth(`/technician/workflow/${activeJob._id}/progress-photo`, {
           method: 'POST',
           body: JSON.stringify({ photoUrl: data.imageUrl, lat: gps.lat, lng: gps.lng })
        });
      }
      loadDashboard();
    } catch (error: any) {
       alert(`Upload failed: ${error.message}`);
    } finally {
       setUploading(false);
    }
  };

  const advanceStage = async (stageName: string, photoUrl?: string, gps?: { lat: number, lng: number }) => {
    if (!activeJob) return;
    try {
      setUploading(true);
      await fetchWithAuth(`/technician/workflow/${activeJob._id}/stage/${stageName}`, {
        method: 'PATCH',
        body: JSON.stringify({ photoUrl, lat: gps?.lat || 0, lng: gps?.lng || 0 })
      });
      loadDashboard();
    } catch (e: any) {
      alert(`Update failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDailyPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const tokenAttr = localStorage.getItem('sk_auth_token');
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('images', files[i]);
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${tokenAttr}` },
          body: formData
        });
        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.imageUrl);
        }
      }
      setDailyPhotos(prev => [...prev, ...uploadedUrls]);
      alert(`Successfully uploaded ${uploadedUrls.length} daily progress photo(s)`);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddExpectedDay = async () => {
    if (!activeJob) return;
    try {
      const order = activeJob.order || activeJob;
      const orderId = order._id || order;
      await fetchWithAuth(`/orders/${orderId}/add-expected-day`, { method: 'PATCH' });
      alert("Successfully added an expected day to the task duration!");
      loadDashboard();
    } catch (err: any) {
      alert(`Failed to add expected day: ${err.message}`);
    }
  };

  const handleTogglePause = async (action: 'pause' | 'resume') => {
    if (!activeJob) return;
    const reason = action === 'pause' ? prompt("Please provide a reason for pausing the job:") : null;
    if (action === 'pause' && !reason) return;
    
    try {
      await fetchWithAuth(`/technician/workflow/${activeJob._id}/toggle-pause`, {
        method: 'PATCH',
        body: JSON.stringify({ action, reason })
      });
      alert(`Job successfully ${action === 'pause' ? 'paused' : 'resumed'}.`);
      loadDashboard();
    } catch (err: any) {
      alert(`Failed to ${action} job: ${err.message}`);
    }
  };

  const handleSubmitDailyReport = async (isFinalCompletion: boolean = false) => {
    if (!activeJob) return;
    if (!dailyDescription.trim() && !isFinalCompletion) {
      alert("Please enter a work description for today's progress report.");
      return;
    }
    setSubmittingReport(true);
    try {
      const gps: any = await getGPS();
      const order = activeJob.order || activeJob;
      const currentReportsCount = order.dailyReports?.length || 0;
      const nextDayNumber = currentReportsCount + 1;

      await fetchWithAuth('/daily-reports', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order._id,
          dayNumber: nextDayNumber,
          workDate: new Date(),
          description: dailyDescription || (isFinalCompletion ? 'Final Work Completion' : 'Daily progress update'),
          progress: isFinalCompletion ? 100 : dailyProgress,
          remarks: dailyRemarks,
          photos: dailyPhotos,
          location: {
            latitude: gps.lat,
            longitude: gps.lng,
            address: gps.address
          },
          isFinalCompletion
        })
      });
      if (isFinalCompletion) {
        alert(`Final Work submitted successfully to Admin! Status is now Pending Admin Approval.`);
      } else {
        alert(`Day ${nextDayNumber} Daily Progress Report submitted successfully to Admin!`);
      }
      setDailyDescription('');
      setDailyRemarks('');
      setDailyPhotos([]);
      loadDashboard();
    } catch (err: any) {
      alert(`Failed to submit report: ${err.message}`);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleGenerateManualBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingBill(true);
    try {
      await fetchWithAuth('/billing', {
        method: 'POST',
        body: JSON.stringify({
          manualCustomer: {
            name: billingData.customerName,
            phone: billingData.customerPhone,
            email: billingData.customerEmail
          },
          items: [{
            description: billingData.description,
            unitPrice: billingData.amount,
            quantity: 1,
            total: billingData.amount
          }],
          taxRate: billingData.taxRate,
          totalAmount: billingData.amount + (billingData.amount * billingData.taxRate / 100),
          notes: billingData.notes,
          warranty: billingData.warranty,
          location: billingData.location ? { address: billingData.location } : undefined
        })
      });
      alert("Manual Invoice generated successfully!");
      setShowBillingModal(false);
    } catch (err: any) {
      alert(`Failed to generate manual bill: ${err.message}`);
    } finally {
      setGeneratingBill(false);
    }
  };

  const shareViaWhatsApp = (bill: any) => {
    const text = `Hello ${bill.customerName}, here is your invoice summary for CCTV services: ₹${bill.amount + (bill.amount * bill.taxRate / 100)}. Description: ${bill.description}. Warranty: ${bill.warranty}. ${bill.location ? `Location: ${bill.location}.` : ''} Thank you for choosing SK Technology!`;
    window.open(`https://api.whatsapp.com/send?phone=${bill.customerPhone}&text=${encodeURIComponent(text)}`);
  };

  const shareViaEmail = (bill: any) => {
    const subject = `Invoice from SK Technology for CCTV Services`;
    const body = `Hello ${bill.customerName},\n\nHere is your invoice summary for CCTV services:\nTotal Amount: ₹${bill.amount + (bill.amount * bill.taxRate / 100)}\nDescription: ${bill.description}\nWarranty: ${bill.warranty}\n${bill.location ? `Location: ${bill.location}\n` : ''}\nThank you for choosing SK Technology!`;
    window.open(`mailto:${bill.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newMessage.trim()) return;
     try {
        const payload: any = { content: newMessage };
        if (chatTarget === 'customer' && activeJob) {
          const order = activeJob.order || activeJob;
          payload.receiver = order.customer?._id || order.customer;
          payload.receiverRole = 'customer';
          payload.orderId = order._id;
        } else {
          payload.receiverRole = 'admin';
        }
        const msg = await fetchWithAuth('/chat', {
           method: 'POST',
           body: JSON.stringify(payload)
        });
        setMessages([...messages, msg]);
        setNewMessage('');
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     } catch (e: any) { alert(`Failed to send message. ${e.message || ''}`); }
  };

  const handleUpdateInternalTask = async (taskId: string, status: string) => {
    try {
      await fetchWithAuth(`/internal/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      loadDashboard();
    } catch (err: any) {
      alert("Status update failed");
    }
  };

  const getWorkflowStep = () => {
    if (!activeJob) return 0;
    const order = activeJob.order || activeJob;
    if (order.status === 'completed' || order.status === 'delivered') return 6;
    if (order.status === 'pending_approval') return 5;
    if (order.status === 'in_progress') return 4;
    
    const workProofs = order.workProofs || activeJob.workProofs || {};
    const stages = activeJob.stages || {};

    if (workProofs.start?.url || stages.started?.status) return 4;
    if (stages.reached?.status) return 3;
    if (stages.accepted?.status) return 2;
    if (stages.assigned?.status || order.status === 'assigned') return 1;
    return 0;
  };
  if (loading) return (
     <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
     </div>
  );

  return (
    <div className="min-h-screen bg-background text-fg-primary relative overflow-x-hidden">
      <WelcomeModal 
        tasksCount={stats?.pendingTasks || 0}
        followupsCount={0}
        userName={user?.name?.split(' ')[0] || 'Technician'}
      />
      <div className="p-4 lg:p-12 space-y-12 lg:space-y-16 w-full max-w-7xl mx-auto">
        <div className="w-full space-y-16">
          {/* Dashboard Header Status */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 lg:gap-10 w-full">
             <div className="space-y-4">
                <div className="flex items-center space-x-3 text-blue-500 font-black text-[10px] uppercase tracking-[0.3em]">
                   <Activity className="h-4 w-4 animate-pulse" />
                   <span>Terminal Connection Active</span>
                </div>
                 <h2 className="text-4xl lg:text-5xl font-black text-fg-primary uppercase tracking-tighter italic leading-none whitespace-nowrap">Service <span className="text-blue-600 dark:text-blue-500 non-italic">Board</span></h2>
                 <p className="text-fg-muted font-medium text-base lg:text-xl">Task Management & Schedule</p>
             </div>
             
              <div className="flex flex-wrap items-center gap-4 lg:gap-6 bg-bg-surface p-6 lg:p-8 rounded-[2.5rem] border border-border-base shadow-xl relative overflow-hidden group w-full xl:w-auto">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl group-hover:bg-blue-600/10 transition-all duration-700"></div>
                
                <div className="flex-1 min-w-[120px] py-2 sm:pr-4 sm:border-r border-border-base last:border-0 last:pr-0">
                   <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] mb-2">Status</p>
                   <button 
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${availabilityStatus === 'Available' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : availabilityStatus === 'Busy' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                   >
                     <div className={`w-1.5 h-1.5 rounded-full ${availabilityStatus === 'Available' ? 'bg-green-500 animate-pulse' : availabilityStatus === 'Busy' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></div>
                     {availabilityStatus}
                   </button>
                </div>

                <div className="flex-1 min-w-[120px] py-2 sm:pr-4 sm:border-r border-border-base last:border-0 last:pr-0">
                   <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] mb-2">Leave Management</p>
                   <button 
                     onClick={() => setShowLeaveModal(true)}
                     className="px-4 py-2 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all shadow-sm"
                   >
                     Leave Portal
                   </button>
                </div>
                
                <div className="flex-1 min-w-[200px] py-2 flex items-center justify-between pl-4">
                   <div className="pr-4">
                      <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] mb-1">Availability</p>
                       <p className={`text-base lg:text-xl font-mono font-black tracking-tighter ${isOnline ? 'text-green-500' : 'text-fg-muted'}`}>
                         {isOnline ? 'ONLINE' : 'OFFLINE'}
                       </p>
                   </div>
                   <button 
                     onClick={() => toggleOnlineStatus(!isOnline)}
                     className={`p-4 rounded-2xl transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-xl font-black text-[10px] uppercase tracking-widest ${isOnline ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-green-500 text-white shadow-green-500/30'}`}
                   >
                       {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
                   </button>
                </div>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full">
            {/* Stats Sidebar */}
            <div className="lg:col-span-4 space-y-10 w-full">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  {[{ icon: DollarSign, label: 'Income', val: stats?.weeklyEarnings || '₹0', col: 'text-green-500' },
                    { icon: Star, label: 'Rating', val: stats?.SystemsScore || '0.0', col: 'text-amber-500' },
                    { icon: Shield, label: 'Success', val: stats?.completedJobs || '0', col: 'text-blue-500' },
                    { icon: Zap, label: 'Load', val: stats?.responseTime || '0m', col: 'text-purple-500' }
                  ].map((s, i) => (
                    <div key={i} className="bg-bg-surface p-6 rounded-[2.5rem] border border-border-base shadow-xl hover:translate-y-[-5px] transition-all duration-500 w-full">
                       <div className={`p-4 rounded-2xl w-fit ${s.col.replace('text', 'bg')}/10 mb-4`}>
                          <s.icon className={`h-6 w-6 ${s.col}`} />
                       </div>
                       <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1">{s.label}</p>
                       <p className="text-2xl font-black text-fg-primary tracking-tighter">{s.val}</p>
                    </div>
                  ))}
               </div>

               {/* Productivity Summary Matrix */}
               <div className="bg-card p-8 rounded-[3rem] border border-card-border relative overflow-hidden">
                  <div className="flex items-center justify-between mb-10">
                     <h3 className="text-xs font-black text-fg-muted uppercase tracking-[0.3em] flex items-center">
                        <Activity className="h-5 w-5 mr-3 text-amber-500" />
                         Productivity Log
                     </h3>
                     <span className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center font-black text-xs">
                        {todayWorkLogs.length}
                     </span>
                  </div>
                  <div className="space-y-6">
                     <div className="flex items-center justify-between p-4 bg-bg-muted rounded-2xl border border-border-base">
                        <div>
                           <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1">Work Time Today</p>
                           <p className="text-xl font-black text-fg-primary tracking-tighter">
                              {(todayWorkLogs.reduce((acc, log) => acc + (log.duration || 0), 0) + (workTime / 3600)).toFixed(2)}h
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1">Status</p>
                           <p className="text-xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                              Active
                           </p>
                        </div>
                     </div>

                     <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                        {todayWorkLogs.map((log, i) => (
                           <div key={i} className="p-4 bg-bg-muted/30 rounded-2xl border border-border-base/50 flex justify-between items-center group hover:bg-bg-muted transition-all">
                              <div className="flex items-center space-x-4">
                                 <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center shadow-lg">
                                    <Clock className="h-5 w-5 text-fg-muted" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-black text-fg-primary uppercase tracking-tight truncate w-32">{log.taskDescription || 'Productive Work'}</p>
                                    <p className="text-[9px] font-bold text-fg-muted uppercase tracking-widest">
                                       {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {log.endTime ? new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                                    </p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-xs font-black text-blue-500">{log.duration ? `${log.duration}h` : '...'}</p>
                                 <div className={`w-2 h-2 rounded-full ml-auto mt-1 ${log.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-fg-muted opacity-30'}`}></div>
                              </div>
                           </div>
                        ))}
                        {todayWorkLogs.length === 0 && <div className="text-center py-10 opacity-30 font-black uppercase text-[10px] tracking-widest">No Sessions Logged</div>}
                     </div>
                  </div>
               </div>

               {/* Operational Command Matrix */}
               <div className="bg-card p-8 rounded-[3rem] border border-card-border relative overflow-hidden">
                  <NotificationSection />
               </div>
            </div>

            {/* Workflow Area */}
            <div className="lg:col-span-8 space-y-10">
               {activeJob ? (
                  <div className="bg-bg-surface rounded-[3rem] border border-border-base shadow-2xl overflow-hidden relative group">
                     <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.03] blur-[150px] -z-10 group-hover:bg-blue-600/[0.06] transition-all duration-1000"></div>
                     
                     <div className="p-6 lg:p-16">
                        {/* Task Progress Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
                           <div className="space-y-4">
                              <div className="flex flex-wrap items-center gap-4">
                                 <div className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20">Current Job</div>
                                 <span className="font-mono text-xs font-black text-fg-muted">NODE: #{activeJob.order?._id?.slice(-6) || 'N/A'}</span>
                                 <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    {activeJob.order?.serviceType || activeJob.order?.category || 'CCTV Installation'}
                                 </span>
                                 <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    {activeJob.order?.status?.replace('_', ' ') || 'Pending'}
                                 </span>
                                 <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    Day {activeJob.order?.dailyReports?.length || 0} / {activeJob.order?.totalDays || 1} Completed
                                 </span>
                              </div>
                              <h3 className="text-xl md:text-3xl lg:text-4xl font-black text-fg-primary uppercase tracking-tighter italic">
                                 {activeJob.customerName || activeJob.order?.customerDetails?.name || activeJob.order?.customer?.name || activeJob.order?.products?.[0]?.product?.name || 'Client'}
                              </h3>
                              <div className="flex flex-wrap items-center gap-4 text-fg-muted font-bold text-sm">
                                 <div className="flex items-center space-x-2">
                                     <MapPin className="h-4 w-4 text-red-500" />
                                     <a 
                                       href={`https://www.google.com/maps/search/?api=1&query=${activeJob.order?.locationDetails?.lat ? `${activeJob.order.locationDetails.lat},${activeJob.order.locationDetails.lng}` : encodeURIComponent(activeJob.order?.deliveryAddress || '')}`}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="uppercase hover:text-blue-500 hover:underline transition-colors"
                                       title="Open in Google Maps"
                                     >
                                        {activeJob.order?.deliveryAddress || 'No Address Provided'}
                                     </a>
                                  </div>
                                 {(activeJob.customerPhone || activeJob.order?.customerDetails?.phone || activeJob.order?.customer?.phone) && (
                                    <div className="flex items-center space-x-2 text-blue-500">
                                       <Phone className="h-4 w-4" />
                                       <span>{activeJob.customerPhone || activeJob.order?.customerDetails?.phone || activeJob.order?.customer?.phone}</span>
                                    </div>
                                 )}
                              </div>
                           </div>
                           
                           <div className="flex flex-wrap items-center gap-4">
                              {(activeJob.customerPhone || activeJob.order?.customerDetails?.phone || activeJob.order?.customer?.phone) && (
                                 <a 
                                    href={`tel:${activeJob.customerPhone || activeJob.order?.customerDetails?.phone || activeJob.order?.customer?.phone}`}
                                    className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all group shadow-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                                    title="Call Customer"
                                 >
                                    <Phone className="h-5 w-5" />
                                    <span>Call</span>
                                 </a>
                              )}
                              <button 
                                 onClick={() => setIsChatOpen(true)} 
                                 className="p-4 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group shadow-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                                 title="Chat with Customer"
                              >
                                 <MessageSquare className="h-5 w-5" />
                                 <span>Chat</span>
                              </button>
                              <button 
                                 onClick={() => {
                                    setBillingData({
                                       ...billingData,
                                       customerName: activeJob.customerName || activeJob.order?.customerDetails?.name || activeJob.order?.customer?.name || '',
                                       customerPhone: activeJob.customerPhone || activeJob.order?.customerDetails?.phone || activeJob.order?.customer?.phone || '',
                                       customerEmail: activeJob.order?.customer?.email || ''
                                    });
                                    setShowBillingModal(true);
                                 }}
                                 className="p-4 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl hover:bg-purple-500 hover:text-white transition-all group shadow-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                                 title="Manual Billing"
                              >
                                 <IndianRupee className="h-5 w-5" />
                                 <span>Bill</span>
                              </button>
                              <button 
                                 onClick={() => {
                                    const phone = activeJob.customerPhone || activeJob.order?.customerDetails?.phone || activeJob.order?.customer?.phone || '';
                                    const name = activeJob.customerName || activeJob.order?.customerDetails?.name || activeJob.order?.customer?.name || 'Customer';
                                    const text = encodeURIComponent(`Hello ${name}, here is your service invoice/summary for Order #${activeJob.order?._id?.slice(-6) || 'N/A'}. Thank you for choosing SK Technology!`);
                                    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                                 }}
                                 className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all group shadow-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                                 title="Share Invoice via WhatsApp"
                              >
                                 <Share2 className="h-5 w-5" />
                                 <span>Share Invoice</span>
                              </button>
                              <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${activeJob.order?.locationDetails?.lat ? `${activeJob.order.locationDetails.lat},${activeJob.order.locationDetails.lng}` : encodeURIComponent(activeJob.order?.deliveryAddress || '')}`)} className="p-4 bg-bg-muted rounded-2xl border border-border-base hover:border-blue-500/50 transition-all group shadow-xl">
                                 <Navigation className="h-6 w-6 text-fg-muted group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                              </button>
                              <button onClick={() => setRescheduleOrder(activeJob.order || activeJob)} className="px-8 py-4 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-white transition-all shadow-xl">
                                 Reschedule
                              </button>
                           </div>
                        </div>

                        {/* Numeric Visual Steps */}
                        <div className="relative mb-24 overflow-x-auto -mx-6 px-6 md:mx-0 md:px-8 hide-scrollbar">
                           <div className="min-w-[600px] relative w-full">
                              <div className="absolute top-7 left-14 right-14 h-1 bg-bg-muted rounded-full">
                                 <motion.div initial={{ width: 0 }} animate={{ width: `${(Math.max(0, getWorkflowStep() - 1) / 5) * 100}%` }} className="h-full bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]" />
                              </div>
                              <div className="relative flex justify-between w-full">
                                  {[1, 2, 3, 4, 5, 6].map((num) => {
                                 const step = getWorkflowStep();
                                 const isActive = step === num;
                                 const isDone = step > num;
                                 return (
                                    <div key={num} className="flex flex-col items-center space-y-4">
                                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-700 relative z-10 ${isDone ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-500/30' : isActive ? 'bg-card border-blue-500 shadow-[0_0_25px_rgba(37,99,235,0.2)] scale-110' : 'bg-card border-card-border text-fg-dim'}`}>
                                          {isDone ? <Check className="h-6 w-6 text-white" /> : <span className={`font-black text-xl ${isActive ? 'text-blue-500' : 'text-fg-dim'}`}>{num}</span>}
                                       </div>
                                       <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-blue-500' : 'text-fg-dim'}`}>
                                           {['Accepting', 'Arrived', 'Before Photo', 'Day-Wise Execution', 'Pending Approval', 'Completed'][num-1]}
                                       </span>
                                    </div>
                                 );
                              })}
                           </div>
                           </div>
                        </div>

                        {/* Workflow Action Terminal */}
                        <div className="bg-bg-muted/30 border border-border-base rounded-[2.5rem] lg:rounded-[3rem] p-6 md:p-10 lg:p-16">
                           {(activeJob.technician?._id !== user?._id && activeJob.technician !== user?._id) ? (
                              <div className="text-center space-y-8">
                                 <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20 shadow-xl">
                                    <Users className="h-10 w-10 text-purple-500" />
                                 </div>
                                 <div className="space-y-4">
                                    <h4 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Supporting Technician</h4>
                                    <p className="text-fg-muted font-medium max-w-sm mx-auto">You are assigned to assist the primary technician. You can upload independent photos of your work here, which will be attached to the task.</p>
                                    <div className="bg-bg-surface border border-border-base rounded-2xl p-4 max-w-md mx-auto text-left space-y-2 mt-4">
                                       <div className="flex justify-between items-center text-xs">
                                          <span className="font-bold text-fg-muted uppercase tracking-widest">Order ID:</span>
                                          <span className="font-black text-fg-primary">#{activeJob.order?._id?.slice(-6) || 'N/A'}</span>
                                       </div>
                                       <div className="flex justify-between items-center text-xs">
                                          <span className="font-bold text-fg-muted uppercase tracking-widest">Customer:</span>
                                          <span className="font-black text-fg-primary">{activeJob.customerName || activeJob.order?.customerDetails?.name || activeJob.order?.customer?.name || 'Client'}</span>
                                       </div>
                                       <div className="flex justify-between items-center text-xs">
                                          <span className="font-bold text-fg-muted uppercase tracking-widest">Date:</span>
                                          <span className="font-black text-fg-primary">{new Date().toLocaleDateString()}</span>
                                       </div>
                                    </div>
                                 </div>
                                 
                                 <div className="max-w-md mx-auto space-y-4 pt-6 border-t border-border-base">
                                    <label className="cursor-pointer px-6 py-6 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl w-full">
                                       <Camera className="h-5 w-5" />
                                       <span>Upload Independent Photos</span>
                                       <input type="file" multiple accept="image/*" onChange={handleDailyPhotoUpload} className="hidden" />
                                    </label>
                                    
                                    {dailyPhotos.length > 0 && (
                                       <div className="space-y-3 pt-4">
                                          <span className="text-xs font-black text-purple-500 uppercase tracking-widest">
                                             {dailyPhotos.length} Photo{dailyPhotos.length > 1 ? 's' : ''} Selected
                                          </span>
                                          <button 
                                             disabled={submittingReport || uploading}
                                             onClick={() => handleSubmitDailyReport(false)}
                                             className="w-full py-4 bg-bg-surface hover:bg-bg-hover text-purple-500 border border-purple-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                          >
                                             {submittingReport || uploading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                             <span>Submit Photos to Task</span>
                                          </button>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           ) : (
                              <AnimatePresence mode="wait">
                                 {getWorkflowStep() === 1 && (
                                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center space-y-12">
                                    <div className="space-y-4">
                                       <h4 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic">Initial Assignment</h4>
                                       <p className="text-fg-muted font-medium max-w-sm mx-auto">Verify technical node requirements and logistics. Once confirmed, initiate the site journey.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-6 max-w-md mx-auto">
                                       <button onClick={() => handleJobAction('accept')} className="flex-1 py-6 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all">Accept Node</button>
                                       <button onClick={() => handleJobAction('reject')} className="flex-1 py-6 border border-red-500/20 bg-red-500/5 text-red-500 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-red-500/10 transition-all">Decline</button>
                                    </div>
                                 </motion.div>
                              )}

                              {getWorkflowStep() === 2 && (
                                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                    <div className="flex items-center justify-between gap-10">
                                       <div className="space-y-4">
                                          <h4 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Site Navigation</h4>
                                          <p className="text-fg-muted font-medium">Coordinate via terminal maps to arrive at the specified node. Confirm arrival only once GPS lock is acquired.</p>
                                       </div>
                                       <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shrink-0 shadow-2xl shadow-blue-600/20">
                                          <Navigation className="h-10 w-10 text-white animate-bounce" />
                                       </div>
                                    </div>
                                    <button onClick={() => advanceStage('reached')} className="w-full py-8 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-700 transition-all">Report Site Arrival</button>
                                 </motion.div>
                              )}

                              {getWorkflowStep() === 3 && (
                                 <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                       <div className="space-y-6">
                                          <h4 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Start Work Proof</h4>
                                          <p className="text-fg-muted font-medium leading-relaxed">Capture the worksite before starting. This initiates the 'Assigned' work timer.</p>
                                          <button onClick={() => fileInputRef.current?.click()} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4">
                                             <Camera className="h-5 w-5" />
                                             <span>Upload Start Photo</span>
                                          </button>
                                          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'start')} accept="image/*" />
                                       </div>
                                       <div className="aspect-square bg-card border-2 border-dashed border-card-border rounded-[2.5rem] flex items-center justify-center relative overflow-hidden">
                                          {uploading ? <Activity className="h-10 w-10 text-blue-500 animate-spin" /> : <div className="text-center opacity-30 font-black text-[10px] uppercase tracking-[0.3em]">Ready for Start Proof</div>}
                                       </div>
                                    </div>
                                 </motion.div>
                              )}

                              {getWorkflowStep() === 4 && (
                                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 py-6">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border-base pb-8">
                                       <div>
                                          <h4 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic">Day-Wise <span className="text-purple-500 non-italic">Execution</span></h4>
                                          <p className="text-xs font-medium text-fg-muted mt-2">Manage multi-day installation tasks. Add expected days dynamically and upload daily progress without redundant before/after prompts.</p>
                                       </div>
                                       <div className="flex items-center gap-4">
                                          <button 
                                             onClick={handleAddExpectedDay}
                                             className="px-6 py-4 bg-purple-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-purple-600 transition-all flex items-center gap-2"
                                          >
                                             <Calendar className="h-4 w-4" />
                                             <span>+ Add Expected Day</span>
                                          </button>
                                          
                                          {activeJob.order?.status === 'on_hold' || activeJob.order?.workStatus === 'on_hold' ? (
                                             <button 
                                                onClick={() => handleTogglePause('resume')}
                                                className="px-6 py-4 bg-green-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-green-600 transition-all flex items-center gap-2"
                                             >
                                                <Play className="h-4 w-4" />
                                                <span>Resume Job</span>
                                             </button>
                                          ) : (
                                             <button 
                                                onClick={() => handleTogglePause('pause')}
                                                className="px-6 py-4 bg-amber-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-amber-600 transition-all flex items-center gap-2"
                                             >
                                                <AlertCircle className="h-4 w-4" />
                                                <span>Pause Job</span>
                                             </button>
                                          )}
                                       </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                       <div className="space-y-2">
                                          <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Daily Work Description / Milestones (Optional)</label>
                                          <textarea 
                                             rows={3}
                                             placeholder="e.g. Completed wiring for Day 1, mounted brackets..."
                                             value={dailyDescription}
                                             onChange={e => setDailyDescription(e.target.value)}
                                             className="w-full bg-bg-surface border border-border-base rounded-2xl p-6 text-xs font-medium text-fg-primary outline-none focus:border-purple-500 transition-all resize-none shadow-sm placeholder:text-fg-dim/50"
                                          />
                                       </div>
                                       <div className="space-y-2">
                                          <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Issues & Remarks (Optional)</label>
                                          <textarea 
                                             rows={3}
                                             placeholder="e.g. Pending final camera alignment tomorrow..."
                                             value={dailyRemarks}
                                             onChange={e => setDailyRemarks(e.target.value)}
                                             className="w-full bg-bg-surface border border-border-base rounded-2xl p-6 text-xs font-medium text-fg-primary outline-none focus:border-purple-500 transition-all resize-none shadow-sm placeholder:text-fg-dim/50"
                                          />
                                       </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                       <div className="space-y-4">
                                          <div className="flex justify-between items-center">
                                             <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Overall Progress Percentage</label>
                                             <span className="text-sm font-black text-purple-500">{dailyProgress}%</span>
                                          </div>
                                          <input 
                                             type="range"
                                             min="5"
                                             max="100"
                                             step="5"
                                             value={dailyProgress}
                                             onChange={e => setDailyProgress(parseInt(e.target.value))}
                                             className="w-full accent-purple-500 bg-bg-muted h-3 rounded-lg cursor-pointer"
                                          />
                                       </div>

                                       <div className="space-y-3">
                                          <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Daily Photo Upload</label>
                                          <div className="flex flex-wrap items-center gap-4">
                                             <label className="cursor-pointer px-6 py-4 bg-bg-surface hover:bg-bg-hover border border-border-base rounded-2xl text-xs font-black text-fg-primary uppercase tracking-widest transition-all flex items-center gap-3 shadow-sm">
                                                <Camera className="h-4 w-4 text-purple-500" />
                                                <span>Attach Daily Photos</span>
                                                <input type="file" multiple accept="image/*" onChange={handleDailyPhotoUpload} className="hidden" />
                                             </label>
                                             {dailyPhotos.length > 0 && (
                                                <span className="text-xs font-black text-purple-500 uppercase tracking-widest bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-500/20">
                                                   {dailyPhotos.length} Photo{dailyPhotos.length > 1 ? 's' : ''} Attached
                                                </span>
                                             )}
                                             {uploading && <RefreshCcw className="h-5 w-5 animate-spin text-purple-500" />}
                                          </div>
                                       </div>
                                    </div>

                                    <div className="pt-6 border-t border-border-base flex flex-col sm:flex-row gap-6 items-center justify-between">
                                       <button 
                                          disabled={submittingReport || uploading}
                                          onClick={() => handleSubmitDailyReport(false)}
                                          className="w-full sm:w-auto px-8 py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                       >
                                          {submittingReport ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                                          <span>Submit Daily Progress</span>
                                       </button>
                                       
                                       <button 
                                          disabled={submittingReport || uploading}
                                          onClick={() => handleSubmitDailyReport(true)}
                                          className="w-full sm:w-auto px-8 py-5 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                       >
                                          <CheckCircle2 className="h-5 w-5" />
                                          <span>Submit Final Work for Admin Approval</span>
                                       </button>
                                    </div>
                                 </motion.div>
                              )}

                              {getWorkflowStep() === 5 && (
                                 <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-12 py-10">
                                    <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse border border-amber-500/20">
                                       <Clock className="h-12 w-12 text-amber-500" />
                                    </div>
                                    <h4 className="text-4xl font-black text-fg-primary uppercase tracking-tighter">Pending Admin Approval</h4>
                                    <p className="text-fg-muted font-medium max-w-md mx-auto">Your final work report has been successfully transmitted. Waiting for Admin verification (Auto-approves and unlocks to 'Available' in 30 minutes).</p>
                                 </motion.div>
                              )}

                              {getWorkflowStep() === 6 && (
                                 <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-12 py-10">
                                    <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-8">
                                       <CheckCircle2 className="h-12 w-12 text-blue-500" />
                                    </div>
                                    <h4 className="text-4xl font-black text-fg-primary uppercase tracking-tighter">Task Complete</h4>
                                    <p className="text-fg-muted font-medium max-w-sm mx-auto">Work verified and approved by Admin! You are now unlocked and available for new assignments. Generate the formal service report below.</p>
                                    <button onClick={() => window.location.href = `/technician/report/${activeJob.order?._id || activeJob._id}`} className="w-full max-w-md py-8 bg-blue-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:scale-[1.05] transition-all">Generate Service Report</button>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                           )}
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="bg-card rounded-[3rem] border border-card-border p-20 text-center space-y-10 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-green-500/[0.02] -z-10 group-hover:bg-green-500/5 transition-all duration-1000"></div>
                     <div className="w-32 h-32 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-green-500/20">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                     </div>
                     <h3 className="text-5xl font-black text-fg-primary uppercase tracking-tighter italic">Grid <span className="text-green-500 non-italic">Neutral</span></h3>
                     <p className="text-lg font-medium text-fg-muted max-w-md mx-auto">No pending node assignments. Your local grid is fully optimized and secured.</p>
                     <div className="flex justify-center gap-6 pt-6">
                        <button onClick={loadDashboard} className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.05] transition-all">Refresh Grid</button>
                        <a href="https://mybillbook.in/" target="_blank" rel="noopener noreferrer" className="px-12 py-5 bg-bg-muted border border-border-base rounded-[2rem] font-black text-[11px] uppercase tracking-[0.1em] hover:bg-bg-hover transition-all inline-flex items-center justify-center">View Logs</a>
                     </div>
                   </div>
                )}

               <div className="space-y-16">
                  {/* My Orders Section - Tabbed */}
                  <div className="space-y-8">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1">
                           <h3 className="text-2xl font-black uppercase tracking-tighter italic">My <span className="text-blue-500">Deployments</span></h3>
                           <p className="text-[10px] font-bold text-fg-muted uppercase tracking-[0.2em]">Operational Task History</p>
                        </div>
                        <div className="flex bg-bg-muted p-1.5 rounded-2xl border border-border-base self-start">
                           <button 
                             onClick={() => setOrderTab('open')}
                             className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${orderTab === 'open' ? 'bg-emerald-600 text-white shadow-lg' : 'text-fg-muted hover:text-fg-primary'}`}
                           >
                             Open Pool
                           </button>
                           <button 
                             onClick={() => setOrderTab('present')}
                             className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${orderTab === 'present' ? 'bg-blue-600 text-white shadow-lg' : 'text-fg-muted hover:text-fg-primary'}`}
                           >
                             Present
                           </button>
                           <button 
                             onClick={() => setOrderTab('past')}
                             className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${orderTab === 'past' ? 'bg-blue-600 text-white shadow-lg' : 'text-fg-muted hover:text-fg-primary'}`}
                           >
                             Past
                           </button>
                           <button 
                             onClick={() => setOrderTab('service')}
                             className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${orderTab === 'service' ? 'bg-amber-600 text-white shadow-lg' : 'text-fg-muted hover:text-fg-primary'}`}
                           >
                             Service & Warranty
                           </button>
                        </div>
                     </div>

                     {orderTab === 'service' ? (
                       <TechnicianServiceFlow />
                     ) : (
                       <div className="glass-card rounded-[2.5rem] border border-border-base overflow-hidden shadow-2xl">
                        <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar">
                           <table className="w-full text-left border-collapse min-w-[900px]">
                              <thead className="bg-bg-muted/50 text-[10px] font-black uppercase tracking-widest text-fg-muted border-b border-border-base sticky top-0 z-10">
                                 <tr>
                                    <th className="px-8 py-6">Order Information</th>
                                    <th className="px-8 py-6">Schedule / Timeline</th>
                                    <th className="px-8 py-6 text-center">Protocol Status</th>
                                    {orderTab === 'past' && <th className="px-8 py-6">Feedback</th>}
                                    <th className="px-8 py-6 text-right">Actions</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-border-subtle">
                                 {orderTab === 'open' ? (
                                    availablePool.length === 0 ? (
                                       <tr>
                                          <td colSpan={4} className="px-8 py-12 text-center text-fg-muted font-bold">No available tasks in the open pool at the moment.</td>
                                       </tr>
                                    ) : (
                                       availablePool.map((booking) => (
                                          <tr key={booking._id} className="hover:bg-emerald-600/03 transition-colors group">
                                             <td className="px-8 py-8">
                                                <div className="flex items-center gap-4">
                                                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-sm font-black shadow-lg">
                                                      {booking.customer?.name?.[0] || 'N'}
                                                   </div>
                                                   <div>
                                                      <p className="text-sm font-black text-fg-primary tracking-tight">#{booking._id.slice(-6).toUpperCase()}</p>
                                                      <p className="text-xs font-bold text-fg-muted uppercase tracking-widest">{booking.serviceType || booking.category}</p>
                                                      <p className="text-[10px] font-medium text-fg-muted mt-1 max-w-[200px] truncate">📍 {booking.locationDetails || booking.deliveryAddress}</p>
                                                   </div>
                                                </div>
                                             </td>
                                             <td className="px-8 py-8">
                                                <div className="space-y-1.5">
                                                   <div className="flex items-center gap-2 text-fg-primary font-bold text-xs tabular-nums">
                                                      <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                                                      {booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Flexible'}
                                                   </div>
                                                   <div className="flex items-center gap-2 text-fg-muted font-black text-[9px] uppercase tracking-widest">
                                                      <Clock className="h-3.5 w-3.5" />
                                                      Slot: {booking.preferredTiming || 'Flexible'}
                                                   </div>
                                                </div>
                                             </td>
                                             <td className="px-8 py-8 text-center">
                                                <span className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                   AVAILABLE
                                                </span>
                                             </td>
                                             <td className="px-8 py-8 text-right">
                                                <button 
                                                   onClick={async () => {
                                                      try {
                                                         await fetchWithAuth(`/orders/pickup/${booking._id}`, { method: 'PATCH' });
                                                         alert('Task accepted successfully!');
                                                         loadDashboard();
                                                         setOrderTab('present');
                                                      } catch (e: any) {
                                                         alert(`Failed to accept task: ${e.message}`);
                                                      }
                                                   }}
                                                   className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-600/30 whitespace-nowrap"
                                                >
                                                   Self Assign
                                                </button>
                                             </td>
                                          </tr>
                                       ))
                                    )
                                 ) : (
                                    myBookings
                                  .filter(b => orderTab === 'present' ? (b.status !== 'delivered' && b.status !== 'completed') : (b.status === 'delivered' || b.status === 'completed'))
                                  .map((booking) => (
                                    <tr key={booking._id} className="hover:bg-blue-600/03 transition-colors group">
                                       <td className="px-8 py-8">
                                          <div className="flex items-center gap-4">
                                             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-black shadow-lg">
                                                {booking.customer?.name?.[0] || 'N'}
                                             </div>
                                             <div>
                                                <p className="text-sm font-black text-fg-primary tracking-tight">#{booking._id.slice(-6).toUpperCase()}</p>
                                                <p className="text-xs font-bold text-fg-muted uppercase tracking-widest">{booking.serviceType}</p>
                                                <p className="text-[10px] font-medium text-fg-muted mt-1 max-w-[200px] truncate">📍 {booking.address || booking.deliveryAddress}</p>
                                                {booking.notes && <p className="text-[10px] font-medium text-fg-dim mt-0.5 italic">📝 Notes: {booking.notes}</p>}
                                                <div className="mt-2">
                                                  {(() => {
                                                    const wStatus = getWarrantyStatus(booking);
                                                    return (
                                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${wStatus.isExpired ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                                        {wStatus.text}
                                                      </span>
                                                    );
                                                  })()}
                                                </div>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-8 py-8">
                                          <div className="space-y-1.5">
                                             <div className="flex items-center gap-2 text-fg-primary font-bold text-xs tabular-nums">
                                                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                                {new Date(booking.scheduledDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                             </div>
                                             <div className="flex items-center gap-2 text-fg-muted font-black text-[9px] uppercase tracking-widest">
                                                <Clock className="h-3.5 w-3.5" />
                                                Slot: {booking.scheduledSlot || '9AM - 5PM'}
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-8 py-8 text-center">
                                          <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                             booking.status === 'delivered' || booking.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                             'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                          }`}>
                                             {booking.status}
                                          </span>
                                       </td>
                                       {orderTab === 'past' && (
                                          <td className="px-8 py-8">
                                             {booking.review ? (
                                                <div className="space-y-1.5">
                                                   <div className="flex items-center gap-1">
                                                      {[...Array(5)].map((_, i) => (
                                                         <Star key={i} className={`h-3 w-3 ${i < (booking.review.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-fg-dim'}`} />
                                                      ))}
                                                   </div>
                                                   <p className="text-[10px] font-medium text-fg-muted italic line-clamp-2 max-w-[180px]">"{booking.review.comment}"</p>
                                                </div>
                                             ) : (
                                                <span className="text-[9px] font-black text-fg-dim uppercase tracking-widest">Pending Review</span>
                                             )}
                                          </td>
                                       )}
                                       <td className="px-8 py-8 text-right">
                                          <div className="flex items-center justify-end gap-3">
                                             <button 
                                                onClick={() => {
                                                  const link = `${window.location.origin}/review/${booking._id}`;
                                                  navigator.clipboard.writeText(link);
                                                  alert('Operational Review Link Copied!');
                                                }}
                                                className="p-3 bg-bg-muted border border-border-base rounded-xl hover:bg-blue-600 hover:text-white transition-all group/btn"
                                                title="Share Review"
                                             >
                                                <Share2 className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                                             </button>
                                             <button 
                                                onClick={() => window.location.href = `/technician/report/${booking._id}`}
                                                className="p-3 bg-bg-muted border border-border-base rounded-xl hover:bg-indigo-600 hover:text-white transition-all group/btn"
                                                title="View Report"
                                             >
                                                <ExternalLink className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                                             </button>
                                          </div>
                                       </td>
                                    </tr>
                                 ))
                                 )}
                                 {myBookings.filter(b => orderTab === 'present' ? (b.status !== 'delivered' && b.status !== 'completed') : (b.status === 'delivered' || b.status === 'completed')).length === 0 && (
                                    <tr>
                                       <td colSpan={orderTab === 'past' ? 5 : 4} className="py-24 text-center">
                                          <div className="flex flex-col items-center gap-4 opacity-30">
                                             <div className="p-6 bg-bg-muted rounded-full">
                                                <Briefcase className="h-10 w-10" />
                                             </div>
                                             <p className="text-xs font-black uppercase tracking-[0.3em]">No {orderTab} deployments on record</p>
                                          </div>
                                       </td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                     )}
                  </div>
               </div>

               {/* Assigned Tasks (Internal Tasks) */}
               <div className="space-y-8">
                  <div className="flex items-center justify-between">
                     <h3 className="text-2xl font-black uppercase tracking-tighter italic">Mission <span className="text-blue-500">Directives</span></h3>
                     <span className="text-[10px] font-black text-fg-muted uppercase py-1 px-3 bg-bg-muted rounded-lg tracking-widest">{internalTasks.length} Assigned</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {internalTasks.map((task) => (
                        <div key={task._id} className="bg-card p-8 rounded-[2.5rem] border border-card-border shadow-xl relative overflow-hidden group">
                           <div className={`absolute top-0 right-0 w-1.5 h-full ${
                              task.status === 'completed' ? 'bg-green-500' : 
                              task.status === 'in_progress' ? 'bg-blue-500' : 'bg-fg-dim'
                           }`}></div>
                           <div className="flex justify-between items-start mb-6">
                              <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                 task.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              }`}>
                                 {task.status.replace('_', ' ')}
                              </span>
                              <span className="text-[8px] font-black text-fg-dim uppercase">{task.priority} Priority</span>
                           </div>
                           <h4 className="text-lg font-black text-fg-primary uppercase tracking-tight mb-3">{task.title}</h4>
                           <p className="text-[11px] text-fg-muted font-medium mb-4 leading-relaxed line-clamp-2">{task.description}</p>
                           <div className="space-y-1.5 mb-6 bg-bg-muted/40 p-4 rounded-2xl border border-border-subtle">
                             <div className="flex items-center text-[10px] font-bold text-fg-primary">
                               <MapPin className="h-3.5 w-3.5 text-blue-500 mr-1.5 shrink-0" />
                               <span className="truncate">Location: {task.location || 'HQ Base / Default Site'}</span>
                             </div>
                             <div className="flex items-center text-[10px] font-bold text-fg-primary">
                               <CheckCircle2 className="h-3.5 w-3.5 text-purple-500 mr-1.5 shrink-0" />
                               <span>Warranty: {task.warranty || '12 Months Warranty'}</span>
                             </div>
                             {task.notes && (
                               <p className="text-[10px] text-fg-muted italic pt-1 border-t border-border-subtle mt-2">📌 Notes: {task.notes}</p>
                             )}
                           </div>
                           
                           <div className="flex gap-2">
                              {task.status !== 'completed' && (
                                 <>
                                    {task.status === 'pending' && <button onClick={() => handleUpdateInternalTask(task._id, 'started')} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">Start Task</button>}
                                    {task.status === 'started' && <button onClick={() => handleUpdateInternalTask(task._id, 'in_progress')} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">In Progress</button>}
                                    {['started', 'in_progress'].includes(task.status) && <button onClick={() => handleUpdateInternalTask(task._id, 'completed')} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">Complete</button>}
                                 </>
                              )}
                              {task.status === 'completed' && (
                                 <div className="w-full py-3 bg-green-500/10 text-green-500 text-center rounded-xl font-black text-[9px] uppercase tracking-widest">Target Secured</div>
                              )}
                           </div>
                        </div>
                     ))}
                     {internalTasks.length === 0 && (
                        <div className="md:col-span-2 py-20 text-center bg-bg-muted/30 rounded-[2.5rem] border border-dashed border-border-base">
                           <p className="text-[10px] font-black text-fg-dim uppercase tracking-[0.3em]">No System Directives Issued</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Pool Section */}
              {availablePool.length > 0 && (
                 <div className="space-y-8 pb-32">
                    <div className="flex items-center justify-between">
                       <h3 className="text-2xl font-black uppercase tracking-tighter italic">Nearby <span className="text-blue-500">Nodes</span></h3>
                       <span className="text-[10px] font-black text-fg-muted uppercase py-1 px-3 bg-bg-muted rounded-lg tracking-widest">{availablePool.length} Available</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {availablePool.map(job => (
                          <div key={job._id} className="bg-card p-8 rounded-[2.5rem] border border-card-border hover:border-blue-500/50 transition-all duration-500 group relative shadow-xl">
                             <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                                <Zap className="h-5 w-5 text-blue-500 animate-pulse" />
                             </div>
                             <div className="space-y-4">
                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">ID: #{job._id.slice(-6)}</p>
                                <h4 className="text-xl font-black text-fg-primary uppercase tracking-tight leading-tight">{job.products?.[0]?.product?.name || 'Security Install'}</h4>
                                <div className="flex items-center space-x-3 text-xs font-bold text-fg-muted border-t border-card-border pt-4">
                                   <MapPin className="h-4 w-4 text-red-500" />
                                   <span className="truncate uppercase">{job.deliveryAddress}</span>
                                </div>
                                <button onClick={() => handlePickup(job._id)} className="w-full py-5 bg-blue-600/5 text-blue-500 border border-blue-600/20 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-xl">Pick Up Task</button>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              )}
            </div>
         </div>

      {/* Modals Section */}
      <AnimatePresence>
         {showLeaveModal && (
            <div 
               className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-left bg-black/80 backdrop-blur-xl"
               onClick={() => setShowLeaveModal(false)}
            >
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-lg bg-bg-surface border border-border-base rounded-[3rem] p-10 lg:p-14 shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 blur-[80px] -z-10"></div>
                  <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter mb-2">Leave Portal</h3>
                  <p className="text-fg-muted font-medium mb-10">Submit operational absence request for HQ approval.</p>
                  
                  <div className="space-y-8">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Absence Start</label>
                           <input type="date" value={leaveDates.start} onChange={e => setLeaveDates({...leaveDates, start: e.target.value})} className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 text-fg-primary font-bold" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Absence End</label>
                           <input type="date" value={leaveDates.end} onChange={e => setLeaveDates({...leaveDates, end: e.target.value})} className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 text-fg-primary font-bold" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Objective Classification</label>
                        <textarea rows={3} value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="State reason for operational absence..." className="w-full bg-bg-muted border border-border-base rounded-2xl p-6 outline-none focus:border-blue-600 text-fg-primary font-medium resize-none shadow-inner" />
                     </div>
                     <div className="flex gap-6 pt-6">
                        <button onClick={() => setShowLeaveModal(false)} className="flex-1 py-5 border border-border-base rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-bg-muted transition-all">Cancel</button>
                        <button onClick={async () => {
                           if (!leaveReason || !leaveDates.start) return alert("All parameters required");
                           try {
                              await fetchWithAuth('/internal/leave', { method: 'POST', body: JSON.stringify({ reason: leaveReason, startDate: leaveDates.start, endDate: leaveDates.end }) });
                              alert("Submitted to HQ");
                              setShowLeaveModal(false);
                           } catch (e: any) { alert("Submission failed"); }
                        }} className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-600/30">Submit to Admin</button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}

         {rescheduleOrder && (
            <div 
               className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-left bg-black/80 backdrop-blur-xl"
               onClick={() => setRescheduleOrder(null)}
            >
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.9 }} 
                  onClick={(e) => e.stopPropagation()}
                  className="relative bg-bg-surface border border-border-base w-full max-w-md rounded-[3rem] p-10 lg:p-14 shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-[80px] -z-10"></div>
                  <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter mb-2">Reschedule Node</h3>
                  <p className="text-fg-muted font-black text-[10px] uppercase tracking-widest mb-10">ORDER: #{rescheduleOrder?._id?.toString().slice(-6) || rescheduleOrder?.toString().slice(-6) || 'UNKNOWN'}</p>
                  
                  <div className="space-y-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Target Date</label>
                        <input type="date" value={rescheduleData.date} onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})} className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-fg-primary" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Strategic Reason</label>
                        <textarea rows={3} value={rescheduleData.reason} onChange={e => setRescheduleData({...rescheduleData, reason: e.target.value})} placeholder="Reason for grid rescheduling..." className="w-full bg-bg-muted border border-border-base rounded-2xl p-6 outline-none focus:border-blue-600 font-medium resize-none shadow-inner text-fg-primary" />
                     </div>
                     <div className="flex gap-6 pt-6">
                        <button onClick={() => setRescheduleOrder(null)} className="flex-1 py-5 border border-border-base rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-bg-muted transition-all">Cancel</button>
                        <button onClick={handleRescheduleSubmit} className="flex-1 py-5 bg-amber-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-amber-500/30">Confirm Reschedule</button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}

         {showBillingModal && (
            <div 
               className="fixed inset-0 z-[120] flex items-center justify-center p-6 text-left bg-black/80 backdrop-blur-xl"
               onClick={() => setShowBillingModal(false)}
            >
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-2xl bg-card border border-card-border rounded-[3rem] p-10 lg:p-14 shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden max-h-[90vh] flex flex-col"
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[90px] -z-10"></div>
                  <div className="flex justify-between items-start mb-8 border-b border-card-border pb-6">
                     <div>
                        <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic">Manual <span className="text-purple-500 non-italic">Billing</span></h3>
                        <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] mt-1">Generate & Share Instant Invoice</p>
                     </div>
                     <button onClick={() => setShowBillingModal(false)} className="p-3 bg-bg-muted rounded-2xl hover:bg-bg-hover transition-all text-fg-dim hover:text-fg-primary">
                        <Square className="h-5 w-5" />
                     </button>
                  </div>

                  <form onSubmit={handleGenerateManualBill} className="space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Customer Name</label>
                           <input 
                              required 
                              type="text" 
                              placeholder="e.g. ABC Corporation" 
                              value={billingData.customerName} 
                              onChange={e => setBillingData({...billingData, customerName: e.target.value})} 
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-purple-500 transition-all shadow-sm" 
                           />
                        </div>
                        <div className="space-y-2">
                           <div className="flex items-center justify-between ml-1 mr-1">
                              <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Customer Phone</label>
                              {billingData.customerPhone?.trim().length >= 10 && (
                                 <a 
                                    href={`tel:${billingData.customerPhone.replace(/\D/g, '')}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 hover:bg-green-500 hover:text-white text-green-400 border border-green-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                                 >
                                    <Phone className="h-3 w-3" /> Call
                                 </a>
                              )}
                           </div>
                           <input 
                              required 
                              type="tel" 
                              placeholder="10-digit number" 
                              value={billingData.customerPhone} 
                              onChange={e => setBillingData({...billingData, customerPhone: e.target.value})} 
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-purple-500 transition-all shadow-sm" 
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Customer Email</label>
                           <input 
                              type="email" 
                              placeholder="client@example.com" 
                              value={billingData.customerEmail} 
                              onChange={e => setBillingData({...billingData, customerEmail: e.target.value})} 
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-purple-500 transition-all shadow-sm" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">GST Tax Rate (%)</label>
                           <div className="flex flex-wrap gap-1.5 mb-2">
                              {[0, 5, 12, 18, 28].map((rate) => (
                                 <button
                                    key={rate}
                                    type="button"
                                    onClick={() => setBillingData({...billingData, taxRate: rate})}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                       billingData.taxRate === rate
                                          ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/20'
                                          : 'bg-bg-surface text-fg-muted border-border-base hover:text-fg-primary hover:bg-bg-muted'
                                    }`}
                                 >
                                    {rate}%
                                 </button>
                              ))}
                           </div>
                           <input 
                              type="number" 
                              value={billingData.taxRate} 
                              onChange={e => setBillingData({...billingData, taxRate: parseFloat(e.target.value) || 0})} 
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-black text-purple-500 outline-none focus:border-purple-500 transition-all shadow-sm" 
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Item Description</label>
                           <input 
                              required 
                              type="text" 
                              placeholder="CCTV Service & Parts" 
                              value={billingData.description} 
                              onChange={e => setBillingData({...billingData, description: e.target.value})} 
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-purple-500 transition-all shadow-sm" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Base Amount (₹)</label>
                           <div className="relative">
                              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                              <input 
                                 required 
                                 type="number" 
                                 placeholder="0.00" 
                                 value={billingData.amount} 
                                 onChange={e => setBillingData({...billingData, amount: parseFloat(e.target.value) || 0})} 
                                 className="w-full bg-bg-muted border border-border-base rounded-2xl pl-10 pr-6 p-5 text-sm font-black text-purple-500 outline-none focus:border-purple-500 transition-all shadow-sm" 
                              />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Warranty Period</label>
                           <input 
                              type="text" 
                              placeholder="e.g. 12 Months Warranty" 
                              value={billingData.warranty} 
                              onChange={e => setBillingData({...billingData, warranty: e.target.value})} 
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-purple-500 transition-all shadow-sm" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Exact Location / Landmark</label>
                           <input 
                              type="text" 
                              placeholder="e.g. Main Gate / Server Room B" 
                              value={billingData.location} 
                              onChange={e => setBillingData({...billingData, location: e.target.value})} 
                              className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-purple-500 transition-all shadow-sm" 
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Invoice Notes / Terms</label>
                        <textarea 
                           placeholder="Terms & Conditions, Payment Details..." 
                           value={billingData.notes} 
                           onChange={e => setBillingData({...billingData, notes: e.target.value})} 
                           className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold text-fg-primary outline-none focus:border-purple-500 transition-all shadow-sm h-24 custom-scrollbar resize-none" 
                        />
                     </div>

                     <div className="p-6 bg-bg-muted/50 rounded-2xl border border-border-base flex justify-between items-center">
                        <span className="text-xs font-bold text-fg-muted uppercase tracking-widest">Total with GST ({billingData.taxRate}%):</span>
                        <span className="text-2xl font-black text-purple-500 tracking-tighter">₹{(billingData.amount + (billingData.amount * billingData.taxRate / 100)).toFixed(2)}</span>
                     </div>

                     <div className="pt-6 border-t border-card-border space-y-4">
                        <button 
                           type="submit" 
                           disabled={generatingBill}
                           className="w-full py-6 bg-purple-600 hover:bg-purple-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-purple-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                           {generatingBill ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                           <span>Confirm & Generate Invoice</span>
                        </button>

                        <div className="flex gap-4 pt-2">
                           <button 
                              type="button"
                              onClick={() => shareViaWhatsApp(billingData)}
                              className="flex-1 py-5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border border-green-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                           >
                              <Share2 className="h-4 w-4" />
                              <span>Share WhatsApp</span>
                           </button>
                           <button 
                              type="button"
                              onClick={() => shareViaEmail(billingData)}
                              className="flex-1 py-5 bg-blue-500/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                           >
                              <ExternalLink className="h-4 w-4" />
                              <span>Share Email</span>
                           </button>
                        </div>
                     </div>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* HQ Communication Hub */}
      <AnimatePresence>
         {isChatOpen && (
            <div 
               className="fixed inset-0 z-[150] flex items-center justify-center p-6 text-left lg:items-end lg:justify-end lg:p-10 bg-black/80 backdrop-blur-xl"
               onClick={() => setIsChatOpen(false)}
            >
               <motion.div 
                  initial={{ opacity: 0, y: 100, scale: 0.9 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 100, scale: 0.9 }} 
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-xl bg-card border border-card-border rounded-[3rem] h-[80vh] flex flex-col shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden lg:w-[500px]"
               >
                  <div className="p-10 bg-blue-600 flex items-center justify-between shadow-2xl relative z-10">
                     <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-inner">
                           <Users className="h-7 w-7 text-white" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-1">HQ Connection</p>
                           <p className="text-xl font-black text-white uppercase tracking-tighter">Live Terminal</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
                           <button 
                              onClick={() => setChatTarget('admin')}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chatTarget === 'admin' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/70 hover:text-white'}`}
                           >
                              Admin HQ
                           </button>
                           <button 
                              onClick={() => setChatTarget('customer')}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chatTarget === 'customer' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/70 hover:text-white'}`}
                           >
                              Customer
                           </button>
                        </div>
                        <button onClick={() => setIsChatOpen(false)} className="p-4 bg-white/10 hover:bg-white/20 rounded-[1.2rem] transition-all transform hover:rotate-90">
                           <ChevronLeft className="h-6 w-6 text-white rotate-180" />
                        </button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide bg-bg-muted/10 pattern-bg">
                     {messages.map((msg, i) => {
                        const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                        return (
                           <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] space-y-3`}>
                                 <div className={`p-6 rounded-[2rem] text-sm font-medium leading-relaxed shadow-xl border ${isMe ? 'bg-blue-600 text-white rounded-tr-none border-blue-500 shadow-blue-600/20' : 'bg-card text-fg-primary border-card-border rounded-tl-none'}`}>
                                    {msg.content}
                                 </div>
                                 <p className={`text-[9px] font-black uppercase tracking-widest text-fg-dim px-2 ${isMe ? 'text-right' : 'text-left'}`}>
                                    {isMe ? 'Staff ID: Verified' : (msg.sender?.name || 'Admin')}
                                 </p>
                              </div>
                           </div>
                        );
                     })}
                     <div ref={chatEndRef}></div>
                  </div>

                  <form onSubmit={handleSendMessage} className="p-10 bg-card border-t border-card-border shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                     <div className="relative group">
                        <input 
                           type="text" 
                           value={newMessage}
                           onChange={(e) => setNewMessage(e.target.value)}
                           placeholder="Transmit to HQ..."
                           className="w-full bg-bg-muted border border-border-base rounded-[2rem] p-6 pr-20 text-xs font-black uppercase outline-none focus:border-blue-600 focus:ring-8 focus:ring-blue-600/5 transition-all text-fg-primary tracking-[0.05em]"
                        />
                        <button type="submit" className="absolute top-2 right-2 p-5 bg-blue-600 text-white rounded-[1.5rem] shadow-xl hover:scale-[1.05] active:scale-95 transition-all">
                           <Play className="h-5 w-5" />
                        </button>
                     </div>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  </div>
</div>
  );
};

export default TechnicianDashboard;
