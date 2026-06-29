"use client";

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  X, 
  Save, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';

interface Slot {
  _id?: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface AdminSlotManagerProps {
  technician: { _id: string; name: string };
  onClose: () => void;
}

const AdminSlotManager: React.FC<AdminSlotManagerProps> = ({ technician, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [existingSlots, setExistingSlots] = useState<Slot[]>([]);
  const [newSlots, setNewSlots] = useState<{startTime: string, endTime: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSlots = async () => {
    try {
      setLoading(true);
      setError("");
      // Using a filtered fetch or getting all and filtering client-side
      const data = await fetchWithAuth(`/slots/available?date=${selectedDate}`);
      // The API returns all available slots for ALL technicians on that day.
      // We need to filter for this specific technician. 
      // NOTE: In a more optimized API, we'd pass technicianId to /available.
      const techSlots = data.filter((s: any) => s.technician?._id === technician._id);
      setExistingSlots(techSlots);
    } catch (err) {
      setError("Failed to load existing slots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [selectedDate]);

  const addSlotRow = () => {
    setNewSlots([...newSlots, { startTime: '09:00', endTime: '11:00' }]);
  };

  const removeNewSlot = (index: number) => {
    setNewSlots(newSlots.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!newSlots.length) return;
    try {
      setSaving(true);
      setError("");
      await fetchWithAuth('/slots/bulk-create', {
        method: 'POST',
        body: JSON.stringify({
          technicianId: technician._id,
          date: selectedDate,
          slots: newSlots
        })
      });
      setNewSlots([]);
      loadSlots();
      alert("Slots successfully added.");
    } catch (err: any) {
      setError(err.message || "Failed to create slots");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Delete this slot?")) return;
    try {
      await fetchWithAuth(`/slots/${id}`, { method: 'DELETE' });
      loadSlots();
    } catch (err: any) {
      alert(err.message || "Deletion failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="glass-card w-full max-w-2xl rounded-[3rem] border border-white/10 p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
        
        <div className="flex justify-between items-start mb-10">
          <div>
            <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tighter">Availability <span className="text-blue-500 italic">Control</span></h3>
            <p className="text-fg-muted font-bold text-xs uppercase tracking-widest mt-1">{technician.name} • Protocol Scheduled</p>
          </div>
          <button onClick={onClose} className="p-3 bg-bg-muted hover:bg-bg-surface rounded-2xl transition-all">
            <X className="h-5 w-5 text-fg-muted" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Date Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">Sequence Date</label>
            <div className="relative group">
              <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full bg-bg-muted border border-border-base rounded-[1.5rem] pl-16 pr-6 py-4 outline-none focus:border-blue-600 font-bold text-fg-primary"
              />
            </div>
          </div>

          {/* Existing Slots */}
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">Active Slots</h4>
                {loading && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {existingSlots.length === 0 && !loading && (
                   <div className="col-span-full py-6 text-center bg-bg-muted/30 rounded-2xl border border-dashed border-border-base">
                      <p className="text-xs font-bold text-fg-muted">No slots defined for this cycle.</p>
                   </div>
                )}
                {existingSlots.map((slot) => (
                   <div key={slot._id} className="flex items-center justify-between p-4 bg-bg-surface border border-border-base rounded-2xl group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-3">
                         <Clock className="h-4 w-4 text-blue-500" />
                         <span className="text-xs font-black text-fg-primary tracking-tight">{slot.startTime} - {slot.endTime}</span>
                      </div>
                      <button 
                        onClick={() => slot._id && handleDeleteSlot(slot._id)}
                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                      >
                         <Trash2 className="h-4 w-4" />
                      </button>
                   </div>
                ))}
             </div>
          </div>

          {/* New Slots Definition */}
          <div className="space-y-4 pt-4 border-t border-border-base">
             <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">New Sequence Addition</h4>
                <button 
                  onClick={addSlotRow}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                >
                   <Plus className="h-3 w-3" /> Add Slot
                </button>
             </div>

             <div className="space-y-3">
                {newSlots.map((slot, idx) => (
                   <div key={idx} className="flex items-center gap-4 animate-in slide-in-from-right duration-300">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                         <input 
                           type="time" 
                           value={slot.startTime}
                           onChange={e => {
                             const n = [...newSlots];
                             n[idx].startTime = e.target.value;
                             setNewSlots(n);
                           }}
                           className="bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-xs font-bold text-fg-primary outline-none focus:border-blue-600"
                         />
                         <input 
                           type="time" 
                           value={slot.endTime}
                           onChange={e => {
                             const n = [...newSlots];
                             n[idx].endTime = e.target.value;
                             setNewSlots(n);
                           }}
                           className="bg-bg-muted border border-border-base rounded-xl px-4 py-3 text-xs font-bold text-fg-primary outline-none focus:border-blue-600"
                         />
                      </div>
                      <button onClick={() => removeNewSlot(idx)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                         <Trash2 className="h-4 w-4" />
                      </button>
                   </div>
                ))}
             </div>
          </div>

          {error && (
             <p className="p-3 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {error}
             </p>
          )}

          <div className="pt-4">
             <button 
                disabled={!newSlots.length || saving}
                onClick={handleSave}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
             >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                <span>Transmit Availability</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSlotManager;
