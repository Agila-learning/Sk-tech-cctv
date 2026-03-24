"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Package, Plus, Trash2, Edit3, Image as ImageIcon, Search, Filter, Camera, Shield, IndianRupee } from 'lucide-react';
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
    usage: 'Outdoor' as string
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
        images: [], images360: [], videoUrl: '',
        specifications: { resolution: '', storage: '', connectivity: '', sensor: '', weatherproofing: '', nightVision: '' }
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
      images360: product.images360 || [],
      videoUrl: product.videoUrl || '',
      specifications: product.specifications || { resolution: '', storage: '', connectivity: '', sensor: '', weatherproofing: '', nightVision: '' }
    });
    setShowModal(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, previewImage: reader.result as string }));
    };
    reader.readAsDataURL(file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('sk_auth_token') : null;
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData
      });
      const data = await res.json();
      if (res.ok) {
        // Only save relative path to DB
        setFormData(prev => ({ ...prev, images: [data.imageUrl] }));
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      alert('Upload failed: Ensure backend server is running on port 5000');
    }
  };

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-20">
          <div className="glass-card w-full max-w-2xl rounded-[2.5rem] border border-border-base p-10 animate-in fade-in zoom-in duration-300 my-8">
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
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">Gallery Images (JSON or comma-sep URLs)</label>
                      <textarea 
                        placeholder="['url1', 'url2'] or url1, url2"
                        className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-[10px] font-bold text-fg-primary outline-none focus:border-blue-600 h-20"
                        value={Array.isArray(formData.images) ? JSON.stringify(formData.images) : formData.images} 
                        onChange={e => {
                          try {
                            const val = e.target.value.trim();
                            if (val.startsWith('[')) {
                              setFormData({...formData, images: JSON.parse(val)});
                            } else {
                              setFormData({...formData, images: val.split(',').map(s => s.trim()).filter(Boolean)});
                            }
                          } catch {
                            setFormData({...formData, images: e.target.value as any});
                          }
                        }}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest ml-4">360 View Images (CSV URLs)</label>
                      <input 
                        type="text" placeholder="url1, url2, url3..."
                        className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-[10px] font-bold text-fg-primary outline-none focus:border-blue-600"
                        value={formData.images360?.join(', ') || ''} 
                        onChange={e => setFormData({...formData, images360: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                      />
                   </div>
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
                          value={formData.usage} onChange={e => setFormData({...formData, usage: e.target.value})}
                        >
                           <option>Indoor</option>
                           <option>Outdoor</option>
                           <option>Industrial</option>
                        </select>
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
