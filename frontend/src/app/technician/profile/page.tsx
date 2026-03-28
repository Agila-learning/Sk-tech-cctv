"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, Camera, Shield, FileText, Lock, 
  ChevronLeft, Upload, CheckCircle2, AlertCircle, 
  Calendar, Clock, Trash2, Loader2, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth, API_URL, getImageUrl } from '@/utils/api';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NextImage from 'next/image';

const TechnicianProfile = () => {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'attendance' | 'security' | 'history'>('info');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [attData, taskData] = await Promise.all([
          fetchWithAuth(`/attendance?userId=${user?._id}`),
          fetchWithAuth('/technician/my-tasks')
        ]);
        setAttendance(attData || []);
        setTasks(taskData || []);
      } catch (e) { console.error(e); }
    };
    if (user) loadData();
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      
      const token = localStorage.getItem('sk_auth_token');
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      
      await fetchWithAuth('/profile/photo', {
        method: 'PATCH',
        body: JSON.stringify({ profilePic: data.imageUrl })
      });
      
      refreshUser();
      setSuccessMsg("Tactical Profile Photo Updated");
    } catch (e) { setErrorMsg("Failed to upload photo"); }
    finally { setUploading(false); }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      const token = localStorage.getItem('sk_auth_token');
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      
      await fetchWithAuth('/profile/document', {
        method: 'PATCH',
        body: JSON.stringify({ name: file.name, url: data.imageUrl })
      });
      
      refreshUser();
      setSuccessMsg("Security Document Encrypted & Stored");
    } catch (e) { setErrorMsg("Document upload failed"); }
    finally { setUploading(false); }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return setErrorMsg("Passwords do not match");
    
    setLoading(true);
    try {
      await fetchWithAuth('/profile/reset-password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
      });
      setSuccessMsg("Security Clearance Updated");
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (e: any) { setErrorMsg(e.message || "Reset failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-4">
              <button 
                onClick={() => router.push('/technician')}
                className="flex items-center space-x-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] hover:text-blue-600 transition-all mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Terminal</span>
              </button>
              <button 
                onClick={() => router.push('/technician')}
                className="group flex items-center space-x-3 px-6 py-3 bg-bg-muted border border-border-base rounded-2xl text-[10px] font-black text-fg-primary uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              >
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span>Abort and Return to Command Center</span>
              </button>
          <h1 className="text-5xl lg:text-7xl font-black text-fg-primary uppercase tracking-tighter italic leading-none">Staff <span className="text-blue-500 non-italic">Profile</span></h1>
              <p className="text-fg-muted font-medium text-lg lg:text-xl uppercase tracking-widest">Field Operative: {user?.name}</p>
           </div>
                      <div className="flex bg-card p-1.5 rounded-2xl border border-card-border shadow-2xl overflow-x-auto scrollbar-hide">
              {['info', 'docs', 'attendance', 'history', 'security'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-fg-muted hover:text-fg-primary'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               <div className="lg:col-span-4 space-y-8">
                  <div className="bg-card p-10 rounded-[3rem] border border-card-border text-center space-y-6 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full"></div>
                     <div className="relative w-48 h-48 mx-auto group">
                        <div className="w-full h-full rounded-[2.5rem] bg-bg-muted border border-border-base relative overflow-hidden shadow-2xl">
                           {user?.profilePic ? (
                             <NextImage src={getImageUrl(user.profilePic)} alt="Profile" fill className="object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center">
                               <UserIcon className="h-20 w-20 text-fg-dim" />
                             </div>
                           )}
                        </div>
                        <button 
                          onClick={() => photoInputRef.current?.click()}
                          className="absolute -bottom-4 -right-4 w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all"
                        >
                           <Camera className="h-6 w-6" />
                        </button>
                        <input type="file" ref={photoInputRef} className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight">{user?.name}</h3>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{user?.role}</p>
                     </div>
                     <div className="pt-6 border-t border-card-border grid grid-cols-2 gap-4">
                        <div className="text-center">
                           <p className="text-xl font-black text-fg-primary">{user?.rating?.toFixed(1) || '5.0'}</p>
                           <p className="text-[8px] font-black text-fg-muted uppercase tracking-widest">Efficiency</p>
                        </div>
                        <div className="text-center border-l border-card-border">
                           <p className="text-xl font-black text-fg-primary">{user?.reviewCount || '0'}</p>
                           <p className="text-[8px] font-black text-fg-muted uppercase tracking-widest">Deployments</p>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="lg:col-span-8 space-y-8">
                  <div className="bg-card p-12 rounded-[4rem] border border-card-border space-y-10 shadow-sm relative overflow-hidden">
                     <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full"></div>
                     <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic">Operational <span className="text-blue-500 non-italic">Intel</span></h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Email Signal</p>
                           <p className="text-lg font-bold text-fg-primary">{user?.email}</p>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Tactical Contact</p>
                           <p className="text-lg font-bold text-fg-primary">{user?.phone || 'Not Registered'}</p>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Assigned Zone</p>
                           <p className="text-lg font-bold text-fg-primary">{user?.zone || 'Global Operations'}</p>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Field Specialist</p>
                           <p className="text-lg font-bold text-fg-primary">{user?.skills?.join(', ') || 'General Deployment'}</p>
                        </div>
                        <div className="md:col-span-2 space-y-2 pt-4">
                           <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">Strategic Headquarters</p>
                           <p className="text-lg font-medium text-fg-primary leading-relaxed">{user?.address || 'Field Deployed'}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'docs' && (
            <motion.div key="docs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
               <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Security <span className="text-blue-500">Vault</span></h3>
                  <button 
                    onClick={() => docInputRef.current?.click()}
                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center gap-3"
                  >
                     <Upload className="h-4 w-4" />
                     <span>Upload Credential</span>
                  </button>
                  <input type="file" ref={docInputRef} className="hidden" onChange={handleDocUpload} />
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {user?.documents?.map((doc: any, i: number) => (
                    <div key={i} className="bg-card p-8 rounded-[3rem] border border-card-border hover:border-blue-600/30 transition-all group relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                       </div>
                       <div className="p-4 bg-bg-muted rounded-2xl w-fit mb-6">
                          <FileText className="h-8 w-8 text-blue-500" />
                       </div>
                       <h4 className="text-lg font-black text-fg-primary uppercase tracking-tight truncate mb-2">{doc.name}</h4>
                       <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-6">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                       <a href={getImageUrl(doc.url)} target="_blank" className="w-full py-4 bg-bg-muted text-fg-primary rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all text-center block">View Internal Key</a>
                    </div>
                  ))}
                  {(!user?.documents || user.documents.length === 0) && (
                     <div className="col-span-full py-20 bg-card rounded-[4rem] border border-card-border text-center space-y-6">
                        <div className="w-20 h-20 bg-bg-muted rounded-[2rem] flex items-center justify-center mx-auto opacity-30">
                           <Shield className="h-10 w-10 text-fg-dim" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-fg-dim">No Security Credentials Stored</p>
                     </div>
                  )}
               </div>
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div key="attendance" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
               <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Mission <span className="text-blue-500">Logs</span></h3>
                  <div className="flex bg-card p-1 rounded-xl border border-card-border">
                     <button className="px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white">Grid History</button>
                  </div>
               </div>
               
               <div className="bg-card rounded-[3rem] border border-card-border overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-bg-muted/50 border-b border-card-border text-[10px] font-black uppercase tracking-widest text-fg-muted">
                        <tr>
                           <th className="px-10 py-6">Mission Date</th>
                           <th className="px-10 py-6">Initiated</th>
                           <th className="px-10 py-6">Terminated</th>
                           <th className="px-10 py-6">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-card-border">
                        {attendance.map((log, i) => (
                           <tr key={i} className="hover:bg-bg-muted/30 transition-all group">
                              <td className="px-10 py-8">
                                 <div className="flex items-center space-x-4 font-bold text-fg-primary">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <span>{new Date(log.date).toLocaleDateString()}</span>
                                 </div>
                              </td>
                              <td className="px-10 py-8 text-sm font-medium text-fg-muted">
                                 {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'SIGNAL LOST'}
                              </td>
                              <td className="px-10 py-8 text-sm font-medium text-fg-muted">
                                 {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ACTIVE'}
                              </td>
                              <td className="px-10 py-8">
                                 <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.status === 'present' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{log.status}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  {attendance.length === 0 && (
                     <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">No Operational Data Found</div>
                  )}
               </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
               <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Tactical <span className="text-blue-500">History</span></h3>
               </div>
               
               <div className="bg-card rounded-[3rem] border border-card-border overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-bg-muted/50 border-b border-card-border text-[10px] font-black uppercase tracking-widest text-fg-muted">
                        <tr>
                           <th className="px-10 py-6">Node ID</th>
                           <th className="px-10 py-6">Asset</th>
                           <th className="px-10 py-6">Deployment Date</th>
                           <th className="px-10 py-6">Status</th>
                           <th className="px-10 py-6 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-card-border">
                        {tasks.map((task, i) => (
                           <tr key={i} className="hover:bg-bg-muted/30 transition-all group">
                              <td className="px-10 py-8">
                                 <span className="font-mono text-xs font-black text-blue-500">#{task.order?._id.slice(-6)}</span>
                              </td>
                              <td className="px-10 py-8">
                                 <p className="font-black text-fg-primary uppercase text-sm">{task.order?.products?.[0]?.product?.name || 'Security Install'}</p>
                              </td>
                              <td className="px-10 py-8 text-sm font-medium text-fg-muted">
                                 {new Date(task.updatedAt).toLocaleDateString()}
                              </td>
                              <td className="px-10 py-8">
                                 <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${task.order?.status === 'completed' || task.order?.status === 'delivered' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                    {task.order?.status}
                                 </span>
                              </td>
                              <td className="px-10 py-8 text-right">
                                 <button onClick={() => router.push(`/technician/report/${task.order?._id}`)} className="p-3 bg-bg-muted rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                    <FileText className="h-4 w-4" />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  {tasks.length === 0 && (
                    <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">No Tactical Assignments Registered</div>
                  )}
               </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto space-y-12 py-10">
               <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                     <Lock className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Security <span className="text-blue-500">Node</span></h3>
                  <p className="text-fg-muted font-black text-[10px] uppercase tracking-widest italic">Rotate Strategic Access Credentials</p>
               </div>
               
               <form onSubmit={handlePasswordReset} className="bg-card p-10 rounded-[3rem] border border-card-border space-y-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-4">Current Protocol</label>
                     <input 
                        type="password" 
                        required
                        value={passwords.current}
                        onChange={e => setPasswords({...passwords, current: e.target.value})}
                        className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-4">New Credential</label>
                     <input 
                        type="password" 
                        required
                        value={passwords.new}
                        onChange={e => setPasswords({...passwords, new: e.target.value})}
                        className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-fg-muted uppercase tracking-widest ml-4">Confirm Credential</label>
                     <input 
                        type="password" 
                        required
                        value={passwords.confirm}
                        onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                        className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold" 
                     />
                  </div>
                  <button 
                    disabled={loading}
                    type="submit" 
                    className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 group"
                  >
                     {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
                     <span>Execute Update</span>
                  </button>
               </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications */}
      <AnimatePresence>
         {(successMsg || errorMsg) && (
            <motion.div 
               initial={{ opacity: 0, y: 100 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: 100 }} 
               className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm"
            >
               <div className={`p-6 rounded-[2rem] shadow-2xl border flex items-center gap-4 ${successMsg ? 'bg-green-600 border-green-500' : 'bg-red-600 border-red-500'} text-white`}>
                  {successMsg ? <CheckCircle2 className="h-6 w-6 shrink-0" /> : <AlertCircle className="h-6 w-6 shrink-0" />}
                  <p className="font-black text-[10px] uppercase tracking-widest">{successMsg || errorMsg}</p>
                  <button onClick={() => { setSuccessMsg(''); setErrorMsg(''); }} className="ml-auto p-2 hover:bg-white/10 rounded-xl transition-all">
                     <ChevronLeft className="h-4 w-4 rotate-90" />
                  </button>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

const TechnicianProfilePage = () => {
  return (
    <ProtectedRoute allowedRoles={['technician']}>
      <TechnicianProfile />
    </ProtectedRoute>
  );
};

export default TechnicianProfilePage;
