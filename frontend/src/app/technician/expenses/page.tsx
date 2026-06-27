"use client";
import React, { useState, useEffect } from 'react';
import { 
  Zap, IndianRupee, Plus, Clock, CheckCircle, XCircle, 
  ChevronLeft, LayoutDashboard, User as UserIcon, MessageSquare, LogOut, Menu, MapPin, Upload, Image as ImageIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth, API_URL } from '@/utils/api';

const TechnicianExpenses = () => {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Travel / Transport'
  });
  const [customCategory, setCustomCategory] = useState('');
  const [billImage, setBillImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [locationData, setLocationData] = useState({ lat: 0, lng: 0, address: '' });
  const [fetchingGps, setFetchingGps] = useState(false);

  const loadExpenses = async () => {
    try {
      const data = await fetchWithAuth('/expenses'); // Backend should filter by user in controller
      setExpenses(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const fetchGpsLocation = () => {
    setFetchingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocationData({ lat, lng, address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}` });
          setFetchingGps(false);
        },
        (error) => {
          alert("GPS fetching failed. Please enter address manually.");
          setFetchingGps(false);
        }
      );
    } else {
      alert("Geolocation not supported by this browser.");
      setFetchingGps(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('images', file);
      const token = localStorage.getItem('sk_auth_token');
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setBillImage(data.imageUrl);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          category: formData.category === 'Other (Custom)' ? customCategory || 'Custom Expense' : formData.category,
          type: 'employee',
          billImage,
          location: locationData
        })
      });
      setShowForm(false);
      setFormData({ description: '', amount: '', category: 'Travel / Transport' });
      setCustomCategory('');
      setBillImage('');
      setLocationData({ lat: 0, lng: 0, address: '' });
      loadExpenses();
    } catch (err) {
      alert("Failed to submit expense");
    }
  };

  return (
    <div className="p-6 lg:p-12 space-y-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Financial Portal</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic text-fg-primary">Field <span className="text-blue-500 non-italic">Expenses</span></h1>
            <p className="text-fg-muted text-lg font-medium uppercase tracking-widest leading-none">Submit Claims & Reimbursements</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-8 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 flex items-center gap-3 transition-all active:scale-95"
          >
             <Plus className="h-4 w-4" />
             New Claim
          </button>
        </header>

        {showForm && (
          <div className="glass-card p-10 rounded-[3rem] border border-blue-500/30 mb-12 bg-blue-600/5 animate-in slide-in-from-top-4 duration-500">
             <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Category</label>
                   <select 
                     value={formData.category}
                     onChange={e => setFormData({...formData, category: e.target.value})}
                     className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-xs uppercase"
                   >
                      <option>Travel / Transport</option>
                      <option>Tools / Equipment</option>
                      <option>Food & Accommodation</option>
                      <option>Repair Material / Spares</option>
                      <option>Other (Custom)</option>
                   </select>
                   {formData.category === 'Other (Custom)' && (
                     <input 
                       type="text"
                       required
                       placeholder="Enter custom category name..."
                       value={customCategory}
                       onChange={e => setCustomCategory(e.target.value)}
                       className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-xs mt-3"
                     />
                   )}
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Amount (INR)</label>
                   <input 
                     type="number"
                     required
                     placeholder="0.00"
                     value={formData.amount}
                     onChange={e => setFormData({...formData, amount: e.target.value})}
                     className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-xs"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Description</label>
                   <input 
                     type="text"
                     required
                     placeholder="Purpose of claim..."
                     value={formData.description}
                     onChange={e => setFormData({...formData, description: e.target.value})}
                     className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-xs"
                   />
                </div>

                {/* Location & Image Upload Section */}
                <div className="space-y-3 md:col-span-2">
                   <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Location / Address</label>
                     <button 
                       type="button" 
                       onClick={fetchGpsLocation} 
                       disabled={fetchingGps}
                       className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1 hover:underline"
                     >
                       <MapPin className="h-3.5 w-3.5" /> {fetchingGps ? 'Fetching GPS...' : 'Auto Fetch GPS'}
                     </button>
                   </div>
                   <input 
                     type="text"
                     placeholder="Manually enter address or click Auto Fetch..."
                     value={locationData.address}
                     onChange={e => setLocationData({...locationData, address: e.target.value})}
                     className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-xs"
                   />
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-1">Bill / Proof Photo</label>
                   <div className="relative w-full bg-bg-muted border border-border-base rounded-2xl p-5 flex items-center justify-between overflow-hidden">
                     <div className="flex items-center gap-3">
                       {billImage && (
                         <div className="w-8 h-8 rounded-lg overflow-hidden border border-border-base shrink-0">
                           <img src={billImage} alt="Bill Proof" className="w-full h-full object-cover" />
                         </div>
                       )}
                       <span className="text-xs font-bold text-fg-primary truncate max-w-[150px]">
                         {uploading ? 'Uploading...' : billImage ? 'Proof Uploaded' : 'Upload Image'}
                       </span>
                     </div>
                     <Upload className="h-4 w-4 text-fg-muted" />
                     <input 
                       type="file" 
                       accept="image/*"
                       capture="environment"
                       onChange={handleImageUpload}
                       className="absolute inset-0 opacity-0 cursor-pointer" 
                     />
                   </div>
                </div>

                <div className="md:col-span-3 flex justify-end gap-4 mt-4">
                   <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 text-fg-muted font-black text-[10px] uppercase">Cancel</button>
                   <button type="submit" className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Submit Claim</button>
                </div>
             </form>
          </div>
        )}

        <div className="glass-card rounded-[3.5rem] overflow-hidden border border-border-base shadow-2xl bg-card/30 backdrop-blur-xl">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-bg-muted/50 text-[10px] font-black uppercase tracking-widest text-fg-muted border-b border-border-base">
                    <tr>
                       <th className="px-10 py-8 text-nowrap">Service Details</th>
                       <th className="px-10 py-8 text-nowrap">Category</th>
                       <th className="px-10 py-8 text-nowrap">Date</th>
                       <th className="px-10 py-8 text-nowrap">Location</th>
                       <th className="px-10 py-8 text-nowrap">Bill Proof</th>
                       <th className="px-10 py-8 text-nowrap text-right">Amount</th>
                       <th className="px-10 py-8 text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border-subtle">
                    {expenses.map((expense) => (
                      <tr key={expense._id} className="hover:bg-bg-muted/30 transition-all group">
                         <td className="px-10 py-8">
                            <p className="font-black text-sm text-fg-primary uppercase tracking-tight">{expense.description}</p>
                         </td>
                         <td className="px-10 py-8">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/5 px-4 py-2 rounded-lg border border-blue-500/10">{expense.category}</span>
                         </td>
                         <td className="px-10 py-8 text-[10px] font-bold text-fg-muted uppercase">
                            {new Date(expense.date).toLocaleDateString()}
                         </td>
                         <td className="px-10 py-8 text-[10px] font-bold text-fg-muted uppercase">
                            {expense.location?.address || 'Manually Entered'}
                         </td>
                         <td className="px-10 py-8">
                            {expense.billImage ? (
                              <a href={expense.billImage} target="_blank" rel="noreferrer" className="text-blue-500 flex items-center gap-1 text-[10px] font-black uppercase hover:underline">
                                <ImageIcon className="h-4 w-4" /> View Bill
                              </a>
                            ) : (
                              <span className="text-[10px] font-bold text-fg-dim">No Image</span>
                            )}
                         </td>
                         <td className="px-10 py-8 text-right font-black text-fg-primary tabular-nums">
                            ₹{expense.amount.toLocaleString()}
                         </td>
                         <td className="px-10 py-8 text-right">
                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                              expense.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              expense.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            }`}>
                               {expense.status}
                            </span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
              {expenses.length === 0 && !loading && (
                <div className="py-24 text-center">
                   <IndianRupee className="h-12 w-12 text-fg-dim mx-auto mb-6 opacity-20" />
                   <p className="text-[10px] font-black text-fg-dim uppercase tracking-[0.4em]">No Claims Registered</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianExpenses;
