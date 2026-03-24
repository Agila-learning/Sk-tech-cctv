"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Package, Plus, Trash2, Edit3, Image as ImageIcon, Search, Filter, Camera, Shield, IndianRupee, X, Upload } from 'lucide-react';
import { fetchWithAuth, API_URL } from '@/utils/api';

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'CCTV Cameras',
    brand: 'SK TECH',
    price: 0,
    stock: 0,
    description: '',
    images: [] as string[],
    viewImages: {
      front: '',
      top: '',
      bottom: '',
      side: ''
    },
    images360: [] as string[],
    videoUrl: '',
    specifications: { 
      resolution: '', 
      storage: '', 
      connectivity: '',
      sensor: '',
      weatherproofing: '',
      nightVision: ''
    },
    usage: 'outdoor' as string,
    features: [] as string[]
  });

  const loadProducts = async () => {
    try {
      const data = await fetchWithAuth('/products?limit=100'); // Load more for admin
      setProducts(data.products || []);
    } catch (error) {
      console.error("Load Products Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingProduct ? `/products/${editingProduct._id}` : '/products';
      const method = editingProduct ? 'PATCH' : 'POST';
      
      await fetchWithAuth(endpoint, {
        method,
        body: JSON.stringify(formData)
      });
      
      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '', category: 'CCTV Cameras', brand: 'SK TECH', price: 0, stock: 0, description: '', 
        images: [], 
        viewImages: { front: '', top: '', bottom: '', side: '' },
        images360: [], videoUrl: '',
        specifications: { resolution: '', storage: '', connectivity: '', sensor: '', weatherproofing: '', nightVision: '' },
        usage: 'outdoor',
        features: []
      });
      loadProducts();
    } catch (error) {
      alert("Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this Product from inventory?")) return;
    try {
      await fetchWithAuth(`/products/${id}`, { method: 'DELETE' });
      loadProducts();
    } catch (error) {
      alert("Delete failed");
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      brand: product.brand || 'SK TECH',
      price: product.price,
      stock: product.stock !== undefined ? product.stock : 0,
      description: product.description,
      images: product.images || (product.image ? [product.image] : []),
      viewImages: product.viewImages || { front: '', top: '', bottom: '', side: '' },
      images360: product.images360 || [],
      videoUrl: product.videoUrl || '',
      specifications: product.specifications || { resolution: '', storage: '', connectivity: '', sensor: '', weatherproofing: '', nightVision: '' },
      usage: (product.usage || 'outdoor').toLowerCase(),
      features: product.features || []
    });
    setShowModal(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'images' | 'images360') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('sk_auth_token') : null;
    const uploadData = new FormData();
    
    Array.from(files).forEach(file => {
      uploadData.append('images', file);
    });

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ 
          ...prev, 
          [field]: [...prev[field], ...data.imageUrls] 
        }));
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      alert('Upload failed: Ensure backend server is running');
    }
  };

  const removeImage = (field: 'images' | 'images360', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>, view: 'front' | 'top' | 'bottom' | 'side') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('sk_auth_token') : null;
    const uploadData = new FormData();
    uploadData.append('images', file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ 
          ...prev, 
          viewImages: { ...prev.viewImages, [view]: data.imageUrls[0] }
        }));
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      alert('Upload failed');
    }
  };

  const ImageUploader = ({ label, images, field }: { label: string, images: string[], field: 'images' | 'images360' }) => (
    <div className="space-y-4">
      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">{label}</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-4 bg-bg-muted rounded-[2rem] border border-border-base">
        {images.map((img, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-border-subtle bg-black/20">
            <img 
              src={img.startsWith('http') ? img : `${API_URL.split('/api')[0]}${img}`} 
              alt="" 
              className="w-full h-full object-cover" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('placeholder')) {
                  target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                }
              }}
            />
            <button 
              type="button"
              onClick={() => removeImage(field, i)}
              className="absolute top-1 right-1 p-1 bg-danger-red/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="aspect-square rounded-xl border-2 border-dashed border-border-base flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all group">
          <Upload className="h-5 w-5 text-fg-muted group-hover:text-blue-500 mb-1" />
          <span className="text-[8px] font-black uppercase text-fg-muted group-hover:text-blue-500">Add</span>
          <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleUpload(e, field)} />
        </label>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background transition-colors overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:ml-80 p-6 md:p-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-3 bg-bg-muted border border-border-base rounded-2xl text-fg-primary"
            >
              <div className="w-6 h-0.5 bg-fg-primary mb-1.5"></div>
              <div className="w-6 h-0.5 bg-fg-primary mb-1.5"></div>
              <div className="w-6 h-0.5 bg-fg-primary"></div>
            </button>
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-black text-fg-primary tracking-tighter uppercase">Product <span className="text-fg-muted italic">Inventory</span></h1>
              <p className="text-fg-muted text-lg font-medium">Manage your CCTV hardware and Professional gear.</p>
            </div>
          </div>
          <button 
            onClick={() => { setEditingProduct(null); setShowModal(true); }}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] flex items-center space-x-2"
          >
             <Plus className="h-4 w-4" />
             <span>Add New Product</span>
          </button>
        </header>

        <div className="glass-card rounded-[3rem] overflow-hidden border border-border-base">
           <div className="p-8 border-b border-border-base flex justify-between items-center">
              <h3 className="text-fg-primary font-black uppercase tracking-widest text-sm">Product Matrix</h3>
              <div className="flex items-center space-x-4">
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
                    <input type="text" placeholder="Search products..." className="bg-bg-muted border border-border-base rounded-xl pl-12 pr-4 py-2.5 text-xs font-bold text-fg-primary outline-none focus:border-blue-600 w-64" />
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-bg-muted/50">
                    <tr className="border-b border-border-base">
                       <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Product Detail</th>
                       <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Category</th>
                       <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Stock Status</th>
                       <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Technician Value</th>
                       <th className="px-8 py-6 text-[10px] font-black text-fg-muted uppercase tracking-[0.2em]">Control</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border-base">
                    {products.map((product: any) => (
                      <tr key={product._id} className="hover:bg-bg-muted/30 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-bg-muted rounded-2xl flex items-center justify-center overflow-hidden border border-border-subtle">
                                 {product.image || product.images?.[0] ? <img src={product.image || product.images?.[0]} alt="" className="w-full h-full object-cover" /> : <Camera className="h-5 w-5 text-fg-muted" />}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-fg-primary">{product.name}</p>
                                 <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">{product.brand}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-3 py-1 bg-blue-600/10 text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                              {product.category}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center space-x-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-fg-muted">
                                {product.stock} Units in Stock
                              </span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-sm font-black text-fg-primary tracking-tighter">
                          ₹{product.price.toLocaleString()}
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center space-x-2">
                             <button 
                               onClick={() => handleEdit(product)}
                               className="p-2.5 bg-bg-muted border border-border-base rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-fg-muted hover:text-blue-500"
                             >
                                <Edit3 className="h-4 w-4" />
                             </button>
                             <button 
                               onClick={() => handleDelete(product._id)}
                               className="p-2.5 bg-danger-red/5 border border-danger-red/10 rounded-xl hover:border-danger-red/50 hover:bg-danger-red/10 transition-all text-danger-red"
                             >
                                <Trash2 className="h-4 w-4" />
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </main>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-10 sm:pt-20">
          <div className="glass-card w-full max-w-4xl rounded-[2.5rem] border border-border-base p-6 sm:p-10 animate-in fade-in zoom-in duration-300 my-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-fg-primary uppercase tracking-tighter">
                  {editingProduct ? 'Edit' : 'Add New'} <span className="text-fg-muted italic">Product</span>
                </h3>
                <button onClick={() => setShowModal(false)} className="text-fg-muted hover:text-white transition-colors">
                  <Plus className="rotate-45 h-6 w-6" />
                </button>
             </div>
             <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Product Name</label>
                      <input 
                        type="text" placeholder="Product Name" required
                        className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Brand</label>
                      <input 
                        type="text" placeholder="Brand (e.g. SK TECH)"
                        className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600"
                        value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Price (₹)</label>
                        <input 
                          type="number" placeholder="Price" required
                          className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600"
                          value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Stock Qty</label>
                        <input 
                          type="number" placeholder="Stock" required
                          className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600"
                          value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                        />
                      </div>
                   </div>
                   <ImageUploader 
                      label="Gallery Images" 
                      images={formData.images} 
                      field="images" 
                   />

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Strategic Views (4-Point)</label>
                      <div className="grid grid-cols-2 gap-4">
                         {(['front', 'top', 'bottom', 'side'] as const).map((view) => (
                           <label key={view} className="relative aspect-video rounded-2xl border border-border-base bg-bg-muted overflow-hidden cursor-pointer hover:border-blue-500 transition-all group">
                             {formData.viewImages[view] ? (
                               <img 
                                 src={formData.viewImages[view].startsWith('http') ? formData.viewImages[view] : `${API_URL.split('/api')[0]}${formData.viewImages[view]}`} 
                                 className="w-full h-full object-cover" 
                               />
                             ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center space-y-2 opacity-40 group-hover:opacity-100 group-hover:text-blue-500 transition-all">
                                 <Camera className="h-6 w-6" />
                                 <span className="text-[8px] font-black uppercase tracking-widest">{view} View</span>
                               </div>
                             )}
                             <input type="file" className="hidden" onChange={e => handleSingleUpload(e, view)} />
                             {formData.viewImages[view] && (
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                 <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Replace {view}</span>
                               </div>
                             )}
                           </label>
                         ))}
                      </div>
                   </div>
                   
                   <ImageUploader 
                     label="360 View Images" 
                     images={formData.images360} 
                     field="images360" 
                   />
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Resolution</label>
                      <input 
                        type="text" placeholder="Resolution (e.g. 4K, 1080p)"
                        className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600"
                        value={formData.specifications.resolution} onChange={e => setFormData({...formData, specifications: {...formData.specifications, resolution: e.target.value}})}
                      />
                   </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Sensor Type</label>
                          <input type="text" placeholder="e.g. 1/2.8 CMOS" className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600"
                            value={formData.specifications.sensor} onChange={e => setFormData({...formData, specifications: {...formData.specifications, sensor: e.target.value}})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Connectivity</label>
                          <input type="text" placeholder="e.g. RJ45, Wi-Fi" className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600"
                            value={formData.specifications.connectivity} onChange={e => setFormData({...formData, specifications: {...formData.specifications, connectivity: e.target.value}})}
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Video URL (Demo)</label>
                       <input type="text" placeholder="YouTube/MP4 URL" className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600"
                         value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                       />
                    </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Category</label>
                      <select 
                        className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 appearance-none"
                        value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                         <option>CCTV Cameras</option>
                         <option>Dome Cameras</option>
                         <option>Bullet Cameras</option>
                         <option>Wireless Cameras</option>
                         <option>PTZ Cameras</option>
                         <option>DVR / NVR</option>
                         <option>Accessories</option>
                      </select>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Storage</label>
                        <input type="text" placeholder="e.g. 256GB MicroSD" className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600"
                          value={formData.specifications.storage} onChange={e => setFormData({...formData, specifications: {...formData.specifications, storage: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Night Vision</label>
                        <input type="text" placeholder="e.g. 30m IR" className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600"
                          value={formData.specifications.nightVision} onChange={e => setFormData({...formData, specifications: {...formData.specifications, nightVision: e.target.value}})}
                        />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Weatherproofing</label>
                        <input type="text" placeholder="e.g. IP67" className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600"
                          value={formData.specifications.weatherproofing} onChange={e => setFormData({...formData, specifications: {...formData.specifications, weatherproofing: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Usage Environment</label>
                         <select className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600"
                          value={formData.usage} onChange={e => setFormData({...formData, usage: e.target.value.toLowerCase()})}
                        >
                           <option value="indoor">Indoor</option>
                           <option value="outdoor">Outdoor</option>
                           <option value="both">Both (Indoor/Outdoor)</option>
                        </select>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Core Features</label>
                      <div className="flex flex-wrap gap-2 p-4 bg-bg-muted rounded-2xl border border-border-base min-h-[100px]">
                         {formData.features.map((feat, i) => (
                           <span key={i} className="px-3 py-1.5 bg-blue-600/10 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center space-x-2">
                             <span>{feat}</span>
                             <button type="button" onClick={() => setFormData({...formData, features: formData.features.filter((_, idx) => idx !== i)})}><X className="h-2.5 w-2.5" /></button>
                           </span>
                         ))}
                         <input 
                           type="text" 
                           placeholder="+ Add feature (press enter)" 
                           className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-fg-primary flex-1 min-w-[150px]"
                           onKeyDown={e => {
                             if (e.key === 'Enter') {
                               e.preventDefault();
                               const val = (e.currentTarget as HTMLInputElement).value.trim();
                               if (val && !formData.features.includes(val)) {
                                 setFormData({...formData, features: [...formData.features, val]});
                                 (e.currentTarget as HTMLInputElement).value = '';
                               }
                             }
                           }}
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Description</label>
                      <textarea 
                        placeholder="Product description..."
                        className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm font-bold text-fg-primary outline-none focus:border-blue-600 h-28"
                        value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                   </div>
                </div>

                <div className="md:col-span-2">
                   <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.4em] transition-all shadow-xl shadow-blue-600/30">
                     {editingProduct ? 'Save Changes' : 'Add Product'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
