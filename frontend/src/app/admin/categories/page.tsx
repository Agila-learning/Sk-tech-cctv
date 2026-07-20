"use client";
import React, { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { fetchWithAuth } from '@/utils/api';
import { 
  Folder, Plus, Trash2, Edit2, X, Upload, Search, 
  CheckCircle2, XCircle, ChevronLeft, Menu, Activity, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    name: '', displayName: '', description: '', order: '0', displayPriority: '0',
    image: null, icon: null, bannerImageDesktop: null, bannerImageMobile: null,
    isActive: true, isFeatured: false, showOnHome: false, parentCategory: '', filters: []
  });

  const [newFilter, setNewFilter] = useState('');
  const [currentUploadField, setCurrentUploadField] = useState<string>('image');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/internal/categories');
      setCategories(data || []);
    } catch (error: any) {
      console.error("Load Categories Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '', displayName: '', description: '', order: '0', displayPriority: '0',
      image: null, icon: null, bannerImageDesktop: null, bannerImageMobile: null,
      isActive: true, isFeatured: false, showOnHome: false, parentCategory: '', filters: []
    });
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setModalVisible(true);
  };
  
  const openEdit = (c: any) => {
    setEditingId(c._id);
    setFormData({
      name: c.name || '',
      displayName: c.displayName || '',
      description: c.description || '',
      order: c.order?.toString() || '0',
      displayPriority: c.displayPriority?.toString() || '0',
      image: c.image || null,
      icon: c.icon || null,
      bannerImageDesktop: c.bannerImageDesktop || null,
      bannerImageMobile: c.bannerImageMobile || null,
      isActive: c.isActive ?? true,
      isFeatured: c.isFeatured ?? false,
      showOnHome: c.showOnHome ?? false,
      parentCategory: c.parentCategory?._id || c.parentCategory || '',
      filters: c.filters || []
    });
    setModalVisible(true);
  };

  // Use generalized image upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('images', files[0]);

    try {
        const response = await fetchWithAuth('/upload', {
            method: 'POST',
            body: uploadData,
            headers: {} 
        });
        setFormData((prev: any) => ({ ...prev, [fieldName]: response.imageUrl || response.imageUrls?.[0] }));
    } catch (error: any) {
        console.error("Upload Error:", error);
        alert("Upload failed. Check network link.");
    } finally {
        setUploading(false);
    }
  };

  const addFilter = () => {
    if (newFilter.trim() && !formData.filters.includes(newFilter.trim())) {
      setFormData((prev: any) => ({ ...prev, filters: [...prev.filters, newFilter.trim()] }));
      setNewFilter('');
    }
  };

  const removeFilter = (idx: number) => {
    setFormData((prev: any) => ({ ...prev, filters: prev.filters.filter((_: any, i: number) => i !== idx) }));
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Category name is required.");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        ...formData,
        order: Number(formData.order),
        displayPriority: Number(formData.displayPriority),
        parentCategory: formData.parentCategory || null
      };
      
      if (editingId) {
        await fetchWithAuth(`/internal/categories/${editingId}`, { 
          method: 'PATCH', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload) 
        });
      } else {
        await fetchWithAuth('/internal/categories', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload) 
        });
      }
      setModalVisible(false);
      loadCategories();
    } catch (error: any) { 
      alert(error.message || "Failed to save category"); 
    } finally { 
      setLoading(false); 
    }
  };

  const deleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try { 
        setLoading(true);
        await fetchWithAuth(`/internal/categories/${id}`, { method: 'DELETE' }); 
        loadCategories(); 
      } catch (e: any) { 
        alert(e.message || "Failed to delete category"); 
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && categories.length === 0) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Activity className="w-12 h-12 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex transition-all duration-500 overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0 lg:ml-80 flex flex-col min-h-screen bg-background">
        <AdminNavbar />
        <div className="p-4 md:p-8 lg:p-12 overflow-y-auto w-full space-y-12 max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full">
            <div className="flex items-center gap-4 md:gap-6">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="lg:hidden p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl hover:bg-blue-600/20 transition-all shadow-lg shadow-blue-500/5 group"
              >
                <Menu className="h-6 w-6 text-fg-primary group-hover:scale-110 transition-transform" />
              </button>
              <button 
                onClick={() => router.push('/admin')}
                className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-bg-surface transition-all group"
                title="Back to Command Center"
              >
                <ChevronLeft className="h-6 w-6 text-fg-primary group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,1)] animate-pulse"></div>
                  <span className="text-purple-500 text-[10px] font-black uppercase tracking-[0.4em]">Classification & Architecture</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none italic">Category <span className="text-fg-primary not-italic">Grid</span></h1>
                <p className="text-fg-muted text-sm md:text-base font-medium uppercase tracking-widest italic leading-none">Catalog Structure & Display Order</p>
              </div>
            </div>

            <button 
              onClick={openAdd}
              className="flex items-center justify-center space-x-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/30 w-full sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              <span>New Category</span>
            </button>
          </header>

          {/* Hidden File Input for Modal */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleFileUpload(e, currentUploadField)} 
            className="hidden" 
            accept="image/*"
          />

          {/* Search Bar */}
          <div className="relative group max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search categories..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-bg-muted border border-border-base rounded-[2rem] pl-16 pr-8 py-4.5 outline-none focus:border-blue-600 font-bold text-xs text-fg-primary shadow-sm"
              />
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-32">
             <AnimatePresence>
                {filteredCategories.map((cat, i) => (
                   <motion.div 
                     key={cat._id}
                     initial={{ opacity: 0, scale: 0.95, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     transition={{ delay: i * 0.05 }}
                     className="glass-card rounded-[2.5rem] border border-border-base p-6 hover:border-blue-500/30 transition-all duration-500 group relative flex items-center space-x-6 shadow-xl"
                   >
                      {cat.image ? (
                        <img 
                          src={cat.image} 
                          alt={cat.name} 
                          className="w-20 h-20 rounded-[1.5rem] object-cover border border-white/10 shadow-md shrink-0" 
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-[1.5rem] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-inner">
                          <Folder className="h-8 w-8 text-blue-500" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-black text-fg-primary tracking-tight uppercase truncate" title={cat.name}>{cat.displayName || cat.name}</h4>
                          {cat.showOnHome && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase rounded-lg">Home</span>}
                        </div>
                        <div className="flex items-center space-x-3 mt-1 text-[10px] font-bold uppercase tracking-widest text-fg-muted flex-wrap gap-y-1">
                          <span className={cat.isActive ? 'text-green-500' : 'text-red-500'}>
                            {cat.isActive ? '● Active' : '○ Inactive'}
                          </span>
                          <span>•</span>
                          <span>Order: {cat.order}</span>
                          {(cat.parentCategory || cat.parentCategory?._id) && (
                            <>
                              <span>•</span>
                              <span className="text-purple-500 truncate max-w-[100px]" title="Subcategory">Subcategory</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openEdit(cat)}
                          className="p-3 bg-bg-muted rounded-xl border border-border-base hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-95"
                          title="Edit Category"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteCategory(cat._id)}
                          className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-md active:scale-95"
                          title="Delete Category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                   </motion.div>
                ))}
             </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Add / Edit Modal */}
      <AnimatePresence>
         {modalVisible && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 30 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 30 }}
                 className="relative w-full max-w-lg bg-bg-surface border border-border-base rounded-[3.5rem] p-8 md:p-12 shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10"></div>
                  
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter italic mb-1">
                        {editingId ? 'Edit' : 'Add'} <span className="text-blue-500 not-italic">Category</span>
                      </h3>
                      <p className="text-fg-muted font-black text-[10px] uppercase tracking-widest">Global Catalog Allocation</p>
                    </div>
                    <button 
                      onClick={() => setModalVisible(false)}
                      className="p-4 bg-bg-muted rounded-2xl border border-border-base hover:scale-105 active:scale-95 transition-all"
                    >
                      <X className="h-5 w-5 text-fg-primary" />
                    </button>
                  </div>
                  
                  <form onSubmit={saveCategory} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
                     <div className="grid grid-cols-2 gap-4">
                       {/* Thumbnail / Image Picker */}
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">Thumbnail</label>
                         <button 
                           type="button"
                           onClick={() => { setCurrentUploadField('image'); fileInputRef.current?.click(); }}
                           disabled={uploading}
                           className="w-full h-32 rounded-[2rem] bg-bg-muted border border-border-base border-dashed flex flex-col items-center justify-center gap-3 group relative overflow-hidden transition-all hover:border-blue-500/50 shadow-inner"
                         >
                            {formData.image ? (
                              <>
                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-black text-xs uppercase tracking-widest"><Upload className="h-4 w-4" /></div>
                              </>
                            ) : (
                              <Upload className="h-6 w-6 text-fg-muted group-hover:text-blue-500" />
                            )}
                         </button>
                       </div>
                       {/* Icon Picker */}
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">Icon</label>
                         <button 
                           type="button"
                           onClick={() => { setCurrentUploadField('icon'); fileInputRef.current?.click(); }}
                           disabled={uploading}
                           className="w-full h-32 rounded-[2rem] bg-bg-muted border border-border-base border-dashed flex flex-col items-center justify-center gap-3 group relative overflow-hidden transition-all hover:border-blue-500/50 shadow-inner"
                         >
                            {formData.icon ? (
                              <>
                                <img src={formData.icon} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-black text-xs uppercase tracking-widest"><Upload className="h-4 w-4" /></div>
                              </>
                            ) : (
                              <Upload className="h-6 w-6 text-fg-muted group-hover:text-blue-500" />
                            )}
                         </button>
                       </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">Category Name (Internal)</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. CCTV" required className="w-full bg-bg-muted border border-border-base rounded-[1.5rem] p-4 text-xs font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">Display Name (Customer Facing)</label>
                        <input type="text" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} placeholder="e.g. Security Cameras" className="w-full bg-bg-muted border border-border-base rounded-[1.5rem] p-4 text-xs font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner" />
                     </div>
                     
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Category description..." className="w-full bg-bg-muted border border-border-base rounded-[1.5rem] p-4 text-xs font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner min-h-[80px]" />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">Parent Category</label>
                           <select value={formData.parentCategory} onChange={(e) => setFormData({...formData, parentCategory: e.target.value})} className="w-full bg-bg-muted border border-border-base rounded-[1.5rem] p-4 text-xs font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner appearance-none">
                              <option value="">None (Top Level)</option>
                              {categories.filter(c => c._id !== editingId).map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                              ))}
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">Display Order</label>
                           <input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: e.target.value})} className="w-full bg-bg-muted border border-border-base rounded-[1.5rem] p-4 text-xs font-bold text-fg-primary outline-none focus:border-blue-600 transition-all shadow-inner" />
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] ml-2">Custom Filters (e.g. Resolution, Lens)</label>
                        <div className="flex gap-2">
                          <input type="text" value={newFilter} onChange={(e) => setNewFilter(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFilter())} placeholder="Add filter property" className="flex-1 bg-bg-muted border border-border-base rounded-[1.5rem] p-4 text-xs font-bold text-fg-primary outline-none focus:border-blue-600" />
                          <button type="button" onClick={addFilter} className="px-6 bg-blue-600 text-white font-bold text-xs uppercase rounded-[1.5rem]"><Plus className="w-4 h-4"/></button>
                        </div>
                        {formData.filters.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                             {formData.filters.map((f: string, idx: number) => (
                               <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-bold">
                                  <span>{f}</span>
                                  <button type="button" onClick={() => removeFilter(idx)}><X className="w-3 h-3"/></button>
                               </div>
                             ))}
                          </div>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-4 pt-2">
                        <button type="button" onClick={() => setFormData({...formData, isActive: !formData.isActive})} className={`p-4 rounded-[1.5rem] border font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 transition-all ${formData.isActive ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                           {formData.isActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                           <span>Active</span>
                        </button>
                        <button type="button" onClick={() => setFormData({...formData, showOnHome: !formData.showOnHome})} className={`p-4 rounded-[1.5rem] border font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 transition-all ${formData.showOnHome ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'bg-bg-muted border-border-base text-fg-muted'}`}>
                           <CheckCircle2 className="h-4 w-4" />
                           <span>Show on Home</span>
                        </button>
                     </div>

                     <div className="pt-6 flex gap-4">
                        <button type="button" onClick={() => setModalVisible(false)} className="flex-1 py-4 border border-border-base rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-bg-muted text-fg-muted">Cancel</button>
                        <button type="submit" disabled={uploading} className="flex-1 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:scale-105 disabled:opacity-50">{editingId ? 'Update' : 'Save'} Category</button>
                     </div>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default function CategoriesManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <CategoriesManagement />
    </ProtectedRoute>
  );
}
