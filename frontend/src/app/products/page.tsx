"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FilterSidebar from '@/components/product/FilterSidebar';
import ProductCard from '@/components/product/ProductCard';
import ComparisonModule from '@/components/product/ComparisonModule';
import { Search, SlidersHorizontal, Grid, List as ListIcon, ArrowRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';
import { fetchWithAuth, getImageUrl } from '@/utils/api';

const ProductsPage = () => {
  const [activeFilters, setActiveFilters] = useState({
    categories: [] as string[],
    resolutions: [] as string[],
    usage: [] as string[],
    priceRange: [2000, 50000] as [number, number]
  });
  const [showComparison, setShowComparison] = useState(false);
  const [sortBy, setSortBy] = useState("Latest Service");
  const [searchQuery, setSearchQuery] = useState("");
  const [compareList, setCompareList] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const loadProducts = async (pageNum = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '9',
        category: activeFilters.categories.join(','),
        minPrice: activeFilters.priceRange[0].toString(),
        maxPrice: activeFilters.priceRange[1].toString(),
        search: searchQuery, // Send search to backend
        sort: sortBy === "Price (Low to High)" ? "price_asc" : (sortBy === "Price (High to Low)" ? "price_desc" : "")
      });
      
      const data = await fetchWithAuth(`/products?${queryParams.toString()}`);
      if (append) {
        setProducts(prev => [...prev, ...(data.products || [])]);
      } else {
        setProducts(data.products || []);
      }
      setTotalPages(data.pages || 1);
      setPage(data.page || 1);
    } catch (error) {
      console.error("Catalog Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(1, false);
  }, [activeFilters, sortBy, searchQuery]); // Added searchQuery to reload from backend

  const toggleCompare = (id: string) => {
    setCompareList(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredProducts = products; // Rely on backend filtering

  const toggleFilter = (type: keyof typeof activeFilters, item: any) => {
    setActiveFilters(prev => {
      if (type === 'priceRange') {
        // LoadProducts is already dependent on activeFilters, we'll let it happen
        return { ...prev, priceRange: item };
      }
      const current = prev[type] as string[];
      const next = current.includes(item) 
        ? current.filter(i => i !== item) 
        : [...current, item];
      return { ...prev, [type]: next };
    });
  };

  const resetFilters = () => {
    setActiveFilters({ categories: [], resolutions: [], usage: [], priceRange: [2000, 50000] });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="h-20"></div>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header omitted for brevity in replace call */}
        <div className="flex flex-col lg:flex-row justify-between items-end gap-12 mb-20">
          <div className="space-y-6">
             <div className="flex items-center space-x-3">
                <div className="w-12 h-1 bg-blue-600"></div>
                <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.4em]">Security Products</span>
             </div>
             <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9]">Product <span className="text-muted-foreground/30 italic">Catalog</span></h1>
             <p className="text-muted-foreground text-lg font-medium max-w-xl">Browse our professional selection of security cameras and hardware.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 w-full lg:w-auto">
             <div className="relative group flex-1 sm:flex-none">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..." 
                  className="bg-card border border-card-border text-foreground pl-16 pr-8 py-5 rounded-3xl w-full lg:w-96 focus:border-blue-600 outline-none transition-all font-black text-xs uppercase tracking-widest placeholder:text-muted-foreground/50 shadow-sm"
                />
             </div>
             <div className="flex items-center bg-card border border-card-border rounded-3xl p-1.5 shadow-sm">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-4 rounded-2xl transition-all shadow-sm ${viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-4 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <ListIcon className="h-4 w-4" />
                </button>
             </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <FilterSidebar 
            activeFilters={activeFilters} 
            onToggle={toggleFilter} 
            onReset={resetFilters} 
          />
          
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6 bg-card/50 p-6 rounded-[2rem] border border-card-border overflow-hidden lg:overflow-visible">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] text-center w-full sm:w-auto">Status: <span className="text-foreground font-black">{filteredProducts.length} Products Found</span></p>
               <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 w-full sm:w-auto">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Order:</span>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-foreground text-[10px] font-black uppercase tracking-[0.2em] border-none outline-none cursor-pointer hover:text-blue-600 transition-colors w-28 sm:w-auto truncate"
                    >
                       <option>Latest Arrivals</option>
                       <option>Price (Low to High)</option>
                       <option>Price (High to Low)</option>
                       <option>Featured</option>
                    </select>
                  </div>
                  <div className="hidden sm:block h-4 w-px bg-card-border"></div>
                  <button 
                    onClick={() => setIsMobileFilterOpen(true)}
                    className="flex items-center justify-center space-x-2 text-[10px] font-black text-blue-600 uppercase tracking-widest group border border-blue-600/20 px-4 py-2.5 rounded-xl lg:hidden bg-blue-600/5 hover:bg-blue-600/10 transition-colors"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Refine</span>
                  </button>
               </div>
            </div>

            <div className="min-h-[800px]">
              {loading ? (
                <div className="flex justify-center p-20">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10" : "flex flex-col gap-6"}>
                  {filteredProducts.map((product, i) => (
                    <div key={product._id} className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both" style={{ animationDelay: `${i * 50}ms` }}>
                      <ProductCard 
                        {...product} 
                        id={product._id}
                        image={product.images?.[0] || product.image || '/placeholder.png'}
                        resolution={product.specifications?.resolution || 'HD'}
                        onCompare={toggleCompare}
                        isComparing={compareList.includes(product._id)}
                        viewMode={viewMode}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comparison Bar: Professional Synergy Hub */}
            {compareList.length > 0 && (
              <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-20 duration-500 w-[90%] md:w-auto">
                 <div className="bg-foreground/95 backdrop-blur-2xl text-background px-10 py-6 rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border border-white/10 flex items-center gap-12">
                    <div className="flex -space-x-4">
                       {compareList.slice(0, 3).map((id, i) => {
                           const p = products.find(x => x._id === id);
                           const imgSrc = p?.images?.[0] || p?.image || '/placeholder.png';
                           const fullImg = getImageUrl(imgSrc);
                           return (
                             <div key={id} className="w-14 h-14 rounded-2xl bg-muted border-2 border-foreground overflow-hidden shadow-lg transform hover:translate-y-[-5px] transition-transform relative">
                                <img src={fullImg} alt="comp" className="w-full h-full object-contain p-1" onError={(e:any) => e.target.src='/placeholder.png'} />
                             </div>
                          );
                       })}
                       {compareList.length > 3 && (
                         <div className="w-14 h-14 rounded-2xl bg-blue-600 border-2 border-foreground flex items-center justify-center font-black text-xs">
                            +{compareList.length - 3}
                         </div>
                       )}
                    </div>
                    <div className="h-10 w-px bg-white/10"></div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em]">{compareList.length} Products Selected</p>
                       <p className="text-white/40 text-[9px] font-medium">Ready for comparison.</p>
                    </div>
                     <div className="flex gap-4">
                       <button 
                         onClick={() => setShowComparison(true)}
                         className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/30 active:scale-95"
                       >
                          Compare Now
                       </button>
                       <button 
                         onClick={() => setCompareList([])}
                         className="px-8 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-red-500/20 active:scale-95"
                       >
                          Clear
                       </button>
                    </div>
                 </div>
              </div>
            )}

            {page < totalPages && (
              <div className="mt-24 flex justify-center">
                 <button 
                   onClick={() => loadProducts(page + 1, true)}
                   className="group flex items-center space-x-6 px-16 py-6 bg-card border border-card-border hover:border-blue-600/50 text-foreground rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] transition-all shadow-sm hover:shadow-xl"
                 >
                    <span>Load More</span>
                    <div className="w-12 h-px bg-muted group-hover:bg-blue-600 transition-all"></div>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                 </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Comparison Modal Overlays */}
      {showComparison && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={() => setShowComparison(false)}></div>
           <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <ComparisonModule
                 onClose={() => setShowComparison(false)}
                 products={compareList.map(id => products.find(p => p._id === id)).filter(Boolean)}
              />
           </div>
        </div>
      )}

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-[250] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-full max-w-[85vw] sm:max-w-xs bg-card border-l border-card-border p-6 shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase tracking-tighter">Refine Grid</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 hover:bg-muted rounded-xl transition-all">
                  <Plus className="rotate-45 h-6 w-6" />
                </button>
              </div>
              <FilterSidebar 
                activeFilters={activeFilters} 
                onToggle={toggleFilter} 
                onReset={resetFilters} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default ProductsPage;
