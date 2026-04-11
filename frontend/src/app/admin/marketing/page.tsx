"use client";
import React, { useState, useEffect, useRef } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { fetchWithAuth, getImageUrl, API_URL } from '@/utils/api';
import { 
  Layers, Megaphone, Plus, Image as ImageIcon, Trash2, Edit3, 
  Search, Filter, Menu, X, Send, Target, ChevronRight,
  Upload, CheckCircle, Clock, AlertCircle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import AdminNavbar from '@/components/admin/AdminNavbar';

const AdminMarketingPage = () => {
  const { user } = useAuth();
  const canAddEdit = ['admin', 'sub-admin', 'marketing-manager', 'team-leader'].includes(user?.role);
  const canDelete = ['admin', 'sub-admin'].includes(user?.role);

  const [activeTab, setActiveTab] = useState<'offers' | 'categories'>('offers');
  
  useEffect(() => {
    const savedTab = sessionStorage.getItem('marketingTab');
    if (savedTab === 'offers' || savedTab === 'categories') {
      setActiveTab(savedTab);
    }
  }, []);

  const handleTabChange = (tab: 'offers' | 'categories') => {
    setActiveTab(tab);
    sessionStorage.setItem('marketingTab', tab);
  };
  
  const [offers, setOffers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [currentOffer, setCurrentOffer] = useState({
    title: '',
    description: '',
    code: '',
    discountPercentage: '',
    expiryDate: '',
    isActive: true,
    image: ''
  });

  const [currentCategory, setCurrentCategory] = useState({
    _id: '',
    name: '',
    order: 0,
    isActive: true,
    image: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [offerData, catData] = await Promise.all([
        fetchWithAuth('/offers'),
        fetchWithAuth('/internal/categories')
      ]);
      setOffers(offerData || []);
      setCategories(catData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('images', file);
      
      const token = localStorage.getItem('sk_auth_token');
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setCurrentOffer(p => ({ ...p, image: data.imageUrl }));
    } catch (error) {
      alert("Upload failed");
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await fetchWithAuth('/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentOffer)
      });
      setIsModalOpen(false);
      setCurrentOffer({ title: '', description: '', code: '', discountPercentage: '', expiryDate: '', isActive: true, image: '' });
      loadData();
    } catch (err) {
      alert("Failed to save offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleOffer = async (offer: any) => {
    try {
      await fetchWithAuth(`/offers/${offer._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !offer.isActive })
      });
      loadData();
    } catch (err) {
      alert("Failed to toggle status");
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Remove this campaign forever?")) return;
    try {
      await fetchWithAuth(`/offers/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await fetchWithAuth(`/internal/categories/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert("Failed to delete category");
    }
  };

  const handleUpdateCategory = async (cat: any, newImage: string) => {
    try {
      await fetchWithAuth(`/internal/categories/${cat._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: newImage })
      });
      loadData();
    } catch (err) {
      alert("Failed to update category");
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const url = currentCategory._id ? `/internal/categories/${currentCategory._id}` : '/internal/categories';
      const method = currentCategory._id ? 'PATCH' : 'POST';
      
      const payload = { ...currentCategory };
      if (!payload._id) delete (payload as any)._id; // Remove dummy ID on create
      
      await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setIsCategoryModalOpen(false);
      setCurrentCategory({ _id: '', name: '', order: 0, isActive: true, image: '' });
      loadData();
    } catch(err) {
      alert("Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('images', file);
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('sk_auth_token')}` },
        body: formData
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setCurrentCategory(p => ({ ...p, image: data.imageUrl }));
    } catch (error) {
      alert("Upload failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex transition-all duration-500 overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:ml-80 flex flex-col min-h-screen">
        <AdminNavbar />
        
        <div className="p-6 md:p-12 space-y-16">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-bg-muted rounded-2xl border border-border-base">
              <Menu className="h-6 w-6 text-fg-primary" />
            </button>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,1)] animate-pulse"></div>
                <span className="text-blue-500 text-[10px] font-bold uppercase tracking-[0.4em]">Growth Engine</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none text-slate-800 dark:text-white">Marketing <span className="text-primary-blue">Hub</span></h1>
              <p className="text-slate-500 text-lg md:text-xl font-medium uppercase tracking-widest">Manage Campaigns & Site Content</p>
            </div>
          </div>
          <div className="flex gap-4">
             <button 
                onClick={() => handleTabChange('offers')}
                className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'offers' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-bg-muted text-fg-muted border border-border-base'}`}
             >
                Offers
             </button>
             <button 
                onClick={() => handleTabChange('categories')}
                className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-bg-muted text-fg-muted border border-border-base'}`}
             >
                Categories
             </button>
          </div>
        </header>

        {activeTab === 'offers' ? (
           <div className="space-y-12">
              <div className="flex justify-between items-center bg-card p-8 rounded-[2.5rem] border border-border-base">
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center">
                       <Megaphone className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight">Promotional Campaigns</h3>
                       <p className="text-[10px] font-bold text-fg-dim uppercase tracking-widest">{offers.length} Active Prototypes</p>
                    </div>
                 </div>
                 {canAddEdit && (
                 <button 
                   onClick={() => setIsModalOpen(true)}
                   className="px-8 py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95"
                 >
                    New Campaign
                 </button>
                 )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                 {offers.map((offer) => (
                   <div key={offer._id} className="glass-card rounded-[3rem] overflow-hidden border border-border-base bg-card shadow-2xl group">
                      <div className="aspect-video relative overflow-hidden bg-bg-muted">
                         <img 
                           src={getImageUrl(offer.image)} 
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                           onError={(e: any) => e.target.src = '/placeholder.png'}
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                         <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                            <span className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                               {offer.discountPercentage}% OFF
                            </span>
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                               CODE: <span className="text-white">{offer.code}</span>
                            </span>
                         </div>
                      </div>
                      <div className="p-10 space-y-6">
                         <div>
                            <h4 className="text-xl font-black text-fg-primary uppercase tracking-tight mb-2">{offer.title}</h4>
                            <p className="text-xs text-fg-muted font-medium line-clamp-2">{offer.description}</p>
                         </div>
                         <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
                            <div className="flex items-center gap-4">
                               {canAddEdit && (
                               <button 
                                 onClick={() => handleToggleOffer(offer)}
                                 className={`w-12 h-6 rounded-full transition-all relative ${offer.isActive ? 'bg-green-500' : 'bg-fg-dim'}`}
                               >
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${offer.isActive ? 'right-1' : 'left-1'}`}></div>
                               </button>
                               )}
                               <span className="text-[8px] font-black text-fg-dim uppercase tracking-widest">
                                  {offer.isActive ? 'Live' : 'Inactive'}
                               </span>
                            </div>
                            {canDelete && (
                            <button 
                              onClick={() => handleDeleteOffer(offer._id)}
                              className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                            >
                               <Trash2 className="h-4 w-4" />
                            </button>
                            )}
                         </div>
                      </div>
                   </div>
                 ))}
                 {offers.length === 0 && (
                   <div className="md:col-span-3 py-40 text-center opacity-30">
                      <Sparkles className="h-16 w-16 mx-auto mb-6" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Grid Ready for Inbound Campaigns</p>
                   </div>
                 )}
              </div>
           </div>
        ) : (
            <div className="space-y-12">
               <div className="bg-card p-10 rounded-[3rem] border border-border-base">
                  <div className="flex justify-between items-center mb-10">
                     <div>
                        <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight mb-2">Grid Architecture</h3>
                        <p className="text-[10px] font-bold text-fg-dim uppercase tracking-widest">Configure Top Category Visuals & Routing</p>
                     </div>
                     {canAddEdit && (
                     <button 
                       onClick={() => { setCurrentCategory({ _id: '', name: '', order: 0, isActive: true, image: '' }); setIsCategoryModalOpen(true); }}
                       className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg"
                     >
                        <Plus className="h-4 w-4" /> Add Node
                     </button>
                     )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {categories.map((cat) => (
                       <div key={cat._id} className="flex items-center p-6 bg-bg-muted/50 rounded-[2rem] border border-border-base gap-6 group hover:border-blue-500/30 transition-all">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden border border-border-base relative shrink-0">
                             <img src={getImageUrl(cat.image)} className="w-full h-full object-cover" />
                             {canAddEdit && (
                             <label className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                                <Upload className="h-5 w-5 text-white" />
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  onChange={async (e) => {
                                     const file = e.target.files?.[0];
                                     if(file) {
                                        const formData = new FormData();
                                        formData.append('images', file);
                                        const res = await fetch(`${API_URL}/upload`, {
                                           method: 'POST',
                                           headers: { 'Authorization': `Bearer ${localStorage.getItem('sk_auth_token')}` },
                                           body: formData
                                        });
                                        const data = await res.json();
                                        handleUpdateCategory(cat, data.imageUrl);
                                     }
                                  }} 
                                />
                             </label>
                             )}
                          </div>
                          <div className="flex-1">
                             <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">Index: #{cat.order}</p>
                             <h5 className="text-lg font-black text-fg-primary uppercase tracking-tight group-hover:text-blue-500 transition-colors">{cat.name}</h5>
                             <div className="flex items-center gap-4 mt-2">
                                <p className="text-[9px] font-bold text-fg-dim uppercase tracking-widest flex items-center gap-2">
                                   <Clock className="h-3 w-3" /> Managed
                                </p>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest ${cat.isActive ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-fg-dim border-border-base bg-bg-muted'}`}>
                                   {cat.isActive ? 'Active' : 'Hidden'}
                                </span>
                             </div>
                          </div>
                           <div className="flex flex-col gap-2">
                              {canAddEdit && (
                              <button onClick={() => { setCurrentCategory({ ...cat }); setIsCategoryModalOpen(true); }} className="p-3 bg-bg-card rounded-xl border border-border-base hover:border-blue-500 hover:text-blue-500 transition-all">
                                 <Edit3 className="h-4 w-4 text-inherit" />
                              </button>
                              )}
                              {canDelete && (
                              <button onClick={() => handleDeleteCategory(cat._id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/10">
                                 <Trash2 className="h-4 w-4" />
                              </button>
                              )}
                           </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
        )}

        {/* New Offer Modal */}
        <AnimatePresence>
           {isModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95, y: 30 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95, y: 30 }}
                   className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3.5rem] p-12 lg:p-16 relative overflow-y-auto max-h-[90vh] custom-scrollbar"
                 >
                    <div className="flex justify-between items-start mb-16">
                       <h2 className="text-4xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Campaign <span className="text-blue-600">Manifest</span></h2>
                       <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg border border-slate-200 dark:border-slate-800">
                          <X className="h-6 w-6" />
                       </button>
                    </div>

                    <form onSubmit={handleSubmitOffer} className="space-y-8">
                       <div className="grid grid-cols-2 gap-8">
                          <div className="col-span-2 space-y-3">
                             <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-2">Display Asset</label>
                             <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-video bg-bg-muted border-2 border-dashed border-border-base rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-blue-600/5 transition-all overflow-hidden group shadow-inner"
                             >
                                {currentOffer.image ? (
                                   <img src={getImageUrl(currentOffer.image)} className="w-full h-full object-cover" />
                                ) : (
                                   <>
                                      <ImageIcon className="h-10 w-10 text-fg-dim group-hover:scale-110 transition-transform" />
                                      <span className="text-[10px] font-black text-fg-dim uppercase tracking-widest">Select Promotion Media</span>
                                   </>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                             </div>
                          </div>
                          <div className="col-span-2">
                             <input required placeholder="Campaign Title (e.g. Summer Lockdown Sale)" value={currentOffer.title} onChange={e => setCurrentOffer(p => ({...p, title: e.target.value}))} className="w-full bg-bg-muted border border-border-base rounded-2xl p-6 text-sm font-bold focus:border-blue-600 outline-none" />
                          </div>
                          <div>
                             <input required placeholder="Voucher Code" value={currentOffer.code} onChange={e => setCurrentOffer(p => ({...p, code: e.target.value}))} className="w-full bg-bg-muted border border-border-base rounded-2xl p-6 text-sm font-black text-blue-500 uppercase tracking-widest focus:border-blue-600 outline-none" />
                          </div>
                          <div>
                             <input type="number" required placeholder="Discount %" value={currentOffer.discountPercentage} onChange={e => setCurrentOffer(p => ({...p, discountPercentage: e.target.value}))} className="w-full bg-bg-muted border border-border-base rounded-2xl p-6 text-sm font-black focus:border-blue-600 outline-none" />
                          </div>
                          <div className="col-span-2">
                             <textarea required placeholder="Campaign Intelligence / Description..." value={currentOffer.description} onChange={e => setCurrentOffer(p => ({...p, description: e.target.value}))} className="w-full bg-bg-muted border border-border-base rounded-3xl p-6 text-sm font-medium focus:border-blue-600 outline-none h-32 resize-none" />
                          </div>
                       </div>
                       
                       <button 
                         type="submit" 
                         disabled={isSubmitting}
                         className="w-full py-8 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-700 transition-all active:scale-95"
                       >
                          Deploy Campaign
                       </button>
                    </form>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>
        {/* New Category Modal */}
        <AnimatePresence>
           {isCategoryModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95, y: 30 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95, y: 30 }}
                   className="w-full max-w-lg bg-card border border-card-border rounded-[3.5rem] p-12 relative overflow-y-auto max-h-[90vh] custom-scrollbar"
                 >
                    <div className="flex justify-between items-start mb-12">
                       <h2 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic leading-none">{currentCategory._id ? 'Refine' : 'Add'} <span className="text-blue-500 non-italic">Node</span></h2>
                       <button onClick={() => setIsCategoryModalOpen(false)} className="p-3 bg-bg-muted rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg border border-border-base">
                          <X className="h-5 w-5" />
                       </button>
                    </div>

                    <form onSubmit={handleSubmitCategory} className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-2">Node Graphic</label>
                          <div 
                             onClick={() => fileInputRef.current?.click()}
                             className="aspect-square w-32 mx-auto bg-bg-muted border-2 border-dashed border-border-base rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-blue-600/5 transition-all overflow-hidden group shadow-inner relative"
                          >
                             {currentCategory.image ? (
                                <img src={getImageUrl(currentCategory.image)} className="w-full h-full object-cover" />
                             ) : (
                                <ImageIcon className="h-8 w-8 text-fg-dim group-hover:scale-110 transition-transform" />
                             )}
                             <input type="file" ref={fileInputRef} className="hidden" onChange={handleCategoryFileUpload} />
                          </div>
                       </div>
                       
                       <input required placeholder="Category Identity" value={currentCategory.name} onChange={e => setCurrentCategory(p => ({...p, name: e.target.value}))} className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-bold focus:border-blue-600 outline-none" />
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-2 mb-2 block">Index Priority</label>
                             <input type="number" required placeholder="1" value={currentCategory.order} onChange={e => setCurrentCategory(p => ({...p, order: parseInt(e.target.value) || 0}))} className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-black focus:border-blue-600 outline-none" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-2 mb-2 block">Visibility</label>
                             <select value={currentCategory.isActive.toString()} onChange={e => setCurrentCategory(p => ({...p, isActive: e.target.value === 'true'}))} className="w-full bg-bg-muted border border-border-base rounded-2xl p-5 text-sm font-black focus:border-blue-600 outline-none appearance-none">
                                <option value="true">Active (Live)</option>
                                <option value="false">Hidden</option>
                             </select>
                          </div>
                       </div>
                       
                       <button 
                         type="submit" 
                         disabled={isSubmitting}
                         className="w-full py-6 mt-4 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:bg-blue-700 transition-all active:scale-95"
                       >
                          {currentCategory._id ? 'Commit Changes' : 'Initialize Node'}
                       </button>
                    </form>
                 </motion.div>
              </div>
           )}
        </AnimatePresence>
        </div>
        </main>
      </div>
  );
};

export default AdminMarketingPage;
