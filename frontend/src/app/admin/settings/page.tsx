"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Settings, Shield, Bell, Database, Palette, Save, RefreshCw } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { useTheme } from 'next-themes';

const AdminSettingsPage = () => {
  const { setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    siteName: 'SK Technology',
    supportEmail: 'sktechnologycctv@gmail.com',
    supportPhone: '+91 96009 75483',
    maintenanceMode: false,
    emailNotifications: true,
    smsAlerts: false,
    autoAssignTechnician: true,
    maxOrdersPerTechnician: 5,
    theme: 'dark',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchWithAuth('/admin/settings');
        setSettings(prev => ({ ...prev, ...data }));
      } catch (error) {
        console.error("Settings load failed:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchWithAuth('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert("Failed to synchronize settings with security core.");
    } finally {
      setSaving(false);
    }
  };

  const SectionCard = ({ title, icon: Icon, children }: any) => (
    <div className="bg-bg-muted/40 border border-border-base rounded-3xl p-8 space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-border-subtle">
        <div className="p-2.5 bg-blue-600/10 rounded-xl">
          <Icon className="h-5 w-5 text-blue-500" />
        </div>
        <h3 className="font-black text-sm text-fg-primary uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, children }: any) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
      <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">{label}</label>
      <div className="flex-1 max-w-md">
        {children}
      </div>
    </div>
  );

  const Toggle = ({ value, onChange }: { value: boolean, onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ${value ? 'bg-blue-600 shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]' : 'bg-bg-muted border border-border-base'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${value ? 'translate-x-8' : 'translate-x-1'}`} />
    </button>
  );

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background transition-colors">
      <AdminSidebar />
      <main className="ml-80 flex-1 p-12 space-y-12">
        <div className="flex items-end justify-between mb-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-fg-primary tracking-tighter uppercase leading-none">System <span className="text-blue-500 italic">Settings</span></h1>
            <p className="text-fg-muted text-lg font-medium">Manage global platform configurations and preferences.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            {saving ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /><span>Saving...</span></>
            ) : saved ? (
              <><Save className="h-4 w-4" /><span>Saved!</span></>
            ) : (
              <><Save className="h-4 w-4" /><span>Save Changes</span></>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <SectionCard title="General" icon={Settings}>
            <Field label="Site Brand">
              <input
                className="w-full bg-bg-surface border border-border-base rounded-2xl px-5 py-3 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
                value={settings.siteName}
                onChange={e => setSettings({ ...settings, siteName: e.target.value })}
              />
            </Field>
            <Field label="Support Node">
              <input
                className="w-full bg-bg-surface border border-border-base rounded-2xl px-5 py-3 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
                value={settings.supportEmail}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </Field>
            <Field label="Hotline Link">
              <input
                className="w-full bg-bg-surface border border-border-base rounded-2xl px-5 py-3 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
                value={settings.supportPhone}
                onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
              />
            </Field>
            <Field label="Maintenance Lockdown">
              <Toggle value={settings.maintenanceMode} onChange={v => setSettings({ ...settings, maintenanceMode: v })} />
            </Field>
          </SectionCard>

          <SectionCard title="Alert Systems" icon={Bell}>
            <Field label="Email Protocols">
              <Toggle value={settings.emailNotifications} onChange={v => setSettings({ ...settings, emailNotifications: v })} />
            </Field>
            <Field label="SMS Frequency">
              <Toggle value={settings.smsAlerts} onChange={v => setSettings({ ...settings, smsAlerts: v })} />
            </Field>
          </SectionCard>

          <SectionCard title="Deployment Matrix" icon={Database}>
            <Field label="Auto-Assignment">
              <Toggle value={settings.autoAssignTechnician} onChange={v => setSettings({ ...settings, autoAssignTechnician: v })} />
            </Field>
            <Field label="Max Job Capacity">
              <input
                type="number"
                className="w-24 bg-bg-surface border border-border-base rounded-2xl px-5 py-3 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all text-center"
                value={settings.maxOrdersPerTechnician}
                onChange={e => setSettings({ ...settings, maxOrdersPerTechnician: Number(e.target.value) })}
              />
            </Field>
          </SectionCard>

          <SectionCard title="Interface" icon={Palette}>
            <Field label="Visual Theme">
              <select
                className="w-full bg-bg-surface border border-border-base rounded-2xl px-5 py-3 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 transition-all"
                value={settings.theme}
                onChange={e => {
                  const newTheme = e.target.value;
                  setSettings({ ...settings, theme: newTheme });
                  setTheme(newTheme);
                }}
              >
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
              </select>
            </Field>
          </SectionCard>
        </div>
      </main>
    </div>
  );
};

export default AdminSettingsPage;
