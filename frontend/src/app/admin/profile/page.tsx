"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { User, Shield, CheckCircle2, AlertCircle, Save, Phone, Mail, Home, Lock, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/utils/api';

const AdminProfilePage = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '', address: user.address || '' });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedUser = await fetchWithAuth('/profile/update', {
        method: 'PATCH',
        body: JSON.stringify(form)
      });
      if (updatedUser && !updatedUser.message) {
        updateUser(updatedUser);
      }
      refreshUser();
      setIsEditing(false);
      setMsg({ type: 'success', text: 'Admin Profile Updated Successfully' });
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setPassLoading(true);
    try {
      await fetchWithAuth('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMsg({ type: 'success', text: 'Admin Security Credentials Updated' });
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Password update failed' });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background transition-colors overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-80 flex-1 min-w-0 p-6 lg:p-12 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-4 mb-4 lg:hidden">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-3 bg-bg-muted border border-border-base rounded-2xl active:scale-95 transition-all group"
              >
                <Menu className="h-6 w-6 text-blue-500 group-hover:scale-110 transition-transform" />
              </button>
              <span className="text-sm font-black uppercase tracking-widest text-fg-muted">Navigation Panel</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-fg-primary tracking-tighter uppercase leading-none">Admin <span className="text-blue-500 italic">Profile</span></h1>
            <p className="text-fg-muted text-lg font-medium">Enterprise administrator identity & security configurations.</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-3 px-8 py-4 bg-bg-muted border border-border-base text-fg-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm w-fit"
          >
            <User className="h-4 w-4" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>

        {msg.text && (
          <div className={`p-6 rounded-3xl border flex items-center gap-4 text-white ${msg.type === 'success' ? 'bg-green-600 border-green-500' : 'bg-red-600 border-red-500'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="h-6 w-6 shrink-0" /> : <AlertCircle className="h-6 w-6 shrink-0" />}
            <p className="font-black text-xs uppercase tracking-widest">{msg.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-7 space-y-8">
            <div className="bg-bg-muted/40 border border-border-base rounded-3xl p-8 space-y-8 shadow-sm">
              <div className="flex items-center space-x-4 pb-6 border-b border-border-subtle">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-600/20">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tight">{user?.name}</h3>
                  <p className="text-xs font-black text-blue-500 uppercase tracking-widest mt-1">{user?.role || 'Root Admin'}</p>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Full Name</label>
                    <input 
                      type="text"
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full bg-bg-surface border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-fg-primary" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Phone Number</label>
                    <input 
                      type="text"
                      value={form.phone}
                      onChange={e => setForm({...form, phone: e.target.value})}
                      className="w-full bg-bg-surface border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-fg-primary" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Physical Headquarters</label>
                    <textarea 
                      rows={3}
                      value={form.address}
                      onChange={e => setForm({...form, address: e.target.value})}
                      className="w-full bg-bg-surface border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-fg-primary resize-none" 
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save className="h-5 w-5" />}
                    Save Profile Settings
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-5 bg-bg-surface border border-border-base rounded-2xl">
                    <Mail className="h-5 w-5 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest mb-1">Email Identity</p>
                      <p className="text-fg-primary font-bold text-sm">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-bg-surface border border-border-base rounded-2xl">
                    <Phone className="h-5 w-5 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest mb-1">Secure Mobile Node</p>
                      <p className="text-fg-primary font-bold text-sm">{user?.phone || 'Not Configured'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-bg-surface border border-border-base rounded-2xl">
                    <Home className="h-5 w-5 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest mb-1">Enterprise Registry Address</p>
                      <p className="text-fg-primary font-bold text-sm">{user?.address || 'Not Configured'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-5 space-y-8">
            <form onSubmit={handlePasswordUpdate} className="bg-bg-muted/40 border border-border-base rounded-3xl p-8 space-y-6 shadow-sm">
              <div className="flex items-center space-x-3 pb-4 border-b border-border-subtle">
                <div className="p-2.5 bg-blue-600/10 rounded-xl">
                  <Lock className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-black text-sm text-fg-primary uppercase tracking-widest">Master Clearance Protocol</h3>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Current Master Key</label>
                <input 
                  type="password"
                  value={passwords.currentPassword}
                  onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                  className="w-full bg-bg-surface border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-fg-primary" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">New Secret Key</label>
                <input 
                  type="password"
                  value={passwords.newPassword}
                  onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                  className="w-full bg-bg-surface border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-fg-primary" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Confirm Secret Key</label>
                <input 
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                  className="w-full bg-bg-surface border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-fg-primary" 
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={passLoading}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
              >
                {passLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Shield className="h-5 w-5" />}
                Update Access Keys
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminProfilePage;
