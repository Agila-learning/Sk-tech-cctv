"use client";
import React, { useState } from 'react';
import { Filter, ChevronDown, Check } from 'lucide-react';

const FilterSection = ({ title, options, selected, onToggle }: any) => {
  const [isOpen, setIsOpen] = useState(true);
  if (!options || options.length === 0) return null;
  return (
    <div className="border-b border-card-border pb-6 mb-6 last:border-0">
      <div className="flex justify-between items-center mb-4 group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-blue-600 transition-colors">{title}</h4>
        <ChevronDown className={`h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="space-y-3">
        {options.map((option: string) => (
          <label key={option} className="flex items-center space-x-3 group cursor-pointer">
            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selected.includes(option) ? 'bg-blue-600 border-blue-600' : 'border-card-border group-hover:border-blue-600/50'}`}>
              {selected.includes(option) && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className={`text-sm font-bold transition-colors ${selected.includes(option) ? 'text-foreground' : 'text-slate-500 group-hover:text-blue-600'}`}>{option}</span>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={selected.includes(option)} 
              onChange={() => onToggle(option)}
            />
          </label>
        ))}
        </div>
      )}
    </div>
  );
};

const CategoryFilterSection = ({ categoriesData, selected, onToggle }: any) => {
  const [isOpen, setIsOpen] = useState(true);
  // Get top-level categories
  const parents = categoriesData.filter((c: any) => !c.parentCategory && c.isActive).sort((a: any, b: any) => a.order - b.order);
  
  if (parents.length === 0) return null;

  return (
    <div className="border-b border-card-border pb-6 mb-6 last:border-0">
      <div className="flex justify-between items-center mb-4 group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-blue-600 transition-colors">Categories</h4>
        <ChevronDown className={`h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="space-y-4">
        {parents.map((parent: any) => {
          const subcategories = categoriesData.filter((c: any) => 
            c.parentCategory === parent._id || 
            (c.parentCategory && c.parentCategory._id === parent._id) // Handle populated cases
          );
          return (
            <div key={parent._id} className="space-y-2">
              <label className="flex items-center space-x-3 group cursor-pointer">
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selected.includes(parent.name) ? 'bg-blue-600 border-blue-600' : 'border-card-border group-hover:border-blue-600/50'}`}>
                  {selected.includes(parent.name) && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className={`text-sm font-bold transition-colors ${selected.includes(parent.name) ? 'text-foreground' : 'text-slate-500 group-hover:text-blue-600'}`}>{parent.displayName || parent.name}</span>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={selected.includes(parent.name)} 
                  onChange={() => onToggle(parent.name)}
                />
              </label>
              
              {/* Subcategories */}
              {subcategories.length > 0 && (
                <div className="pl-6 space-y-2 border-l-2 border-card-border ml-2 mt-2">
                  {subcategories.map((sub: any) => (
                    <label key={sub._id} className="flex items-center space-x-3 group cursor-pointer">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selected.includes(sub.name) ? 'bg-blue-600 border-blue-600' : 'border-card-border group-hover:border-blue-600/50'}`}>
                        {selected.includes(sub.name) && <Check className="h-2 w-2 text-white" />}
                      </div>
                      <span className={`text-xs font-semibold transition-colors ${selected.includes(sub.name) ? 'text-foreground' : 'text-slate-500 group-hover:text-blue-600'}`}>{sub.displayName || sub.name}</span>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={selected.includes(sub.name)} 
                        onChange={() => onToggle(sub.name)}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

const FilterSidebar = ({ activeFilters, onToggle, onReset, categoriesData = [] }: any) => {
  // Extract unique filters from all active categories
  const allFilters = categoriesData.flatMap((c: any) => c.filters || []);
  const uniqueFilters = Array.from(new Set(allFilters));
  
  return (
    <div className="w-full lg:w-80 pr-0 lg:pr-8">
      <div className="bg-card p-6 lg:p-10 rounded-3xl lg:rounded-[3rem] border border-card-border sticky top-32 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-black text-foreground uppercase tracking-tighter">Filters</h3>
          </div>
          <button 
            onClick={onReset}
            className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-700 transition-colors"
          >
            Reset
          </button>
        </div>

        <CategoryFilterSection 
          categoriesData={categoriesData} 
          selected={activeFilters.categories}
          onToggle={(item: string) => onToggle('categories', item)}
        />

        <FilterSection 
          title="Features & Filters" 
          options={uniqueFilters} 
          selected={activeFilters.resolutions} // Map this generically to dynamic category filters
          onToggle={(item: string) => onToggle('resolutions', item)}
        />

        <FilterSection 
          title="Usage Type" 
          options={['Indoor', 'Outdoor', 'Industrial']} 
          selected={activeFilters.usage}
          onToggle={(item: string) => onToggle('usage', item)}
        />

        <div className="py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-xl font-bold text-foreground">PRICE RANGE</h4>
              <p className="text-sm text-muted-foreground mt-1">Select your budget range</p>
            </div>
            <div className="w-10 h-10 rounded-xl border border-border-base flex items-center justify-center bg-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-white border border-border-base rounded-2xl p-4 shadow-sm">
                <p className="text-sm text-muted-foreground mb-1">Min Price</p>
                <div className="flex items-center text-xl font-bold text-foreground">
                  <span className="mr-2 text-slate-400">₹</span>
                  <input 
                    type="number"
                    value={activeFilters.priceRange[0]}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), activeFilters.priceRange[1] - 500);
                      onToggle('priceRange', [val, activeFilters.priceRange[1]]);
                    }}
                    className="w-full outline-none bg-transparent"
                  />
                </div>
              </div>
              <div className="w-8 flex items-center justify-center">
                <div className="w-4 h-[2px] bg-border-base"></div>
              </div>
              <div className="flex-1 bg-white border border-border-base rounded-2xl p-4 shadow-sm">
                <p className="text-sm text-muted-foreground mb-1">Max Price</p>
                <div className="flex items-center text-xl font-bold text-foreground">
                  <span className="mr-2 text-slate-400">₹</span>
                  <input 
                    type="number"
                    value={activeFilters.priceRange[1]}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), activeFilters.priceRange[0] + 500);
                      onToggle('priceRange', [activeFilters.priceRange[0], val]);
                    }}
                    className="w-full outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Range Slider */}
            <div className="pt-6 pb-2">
              <div className="relative h-2 rounded-full bg-slate-100">
                <div 
                  className="absolute h-full bg-blue-600 rounded-full"
                  style={{ 
                    left: `${(activeFilters.priceRange[0] / 50000) * 100}%`,
                    width: `${((activeFilters.priceRange[1] - activeFilters.priceRange[0]) / 50000) * 100}%`
                  }}
                />
                
                {/* Custom Thumbs */}
                <div 
                  className="absolute top-1/2 -mt-3 w-6 h-6 bg-white border-[3px] border-blue-600 rounded-full shadow-md z-10 pointer-events-none"
                  style={{ left: `calc(${(activeFilters.priceRange[0] / 50000) * 100}% - 12px)` }}
                />
                <div 
                  className="absolute top-1/2 -mt-3 w-6 h-6 bg-white border-[3px] border-blue-600 rounded-full shadow-md z-10 pointer-events-none"
                  style={{ left: `calc(${(activeFilters.priceRange[1] / 50000) * 100}% - 12px)` }}
                />

                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="500"
                  value={activeFilters.priceRange[0]}
                  onChange={(e) => {
                    const val = Math.min(Number(e.target.value), activeFilters.priceRange[1] - 1000);
                    onToggle('priceRange', [val, activeFilters.priceRange[1]]);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 pointer-events-auto"
                />
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="500"
                  value={activeFilters.priceRange[1]}
                  onChange={(e) => {
                    const val = Math.max(Number(e.target.value), activeFilters.priceRange[0] + 1000);
                    onToggle('priceRange', [activeFilters.priceRange[0], val]);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 pointer-events-auto"
                />
              </div>
              
              {/* Scale marks */}
              <div className="flex justify-between mt-4 text-xs text-slate-400 font-medium px-1">
                <div className="flex flex-col items-center"><div className="w-[1px] h-1 bg-slate-300 mb-1"></div>0</div>
                <div className="flex flex-col items-center"><div className="w-[1px] h-1 bg-slate-300 mb-1"></div>1K</div>
                <div className="flex flex-col items-center"><div className="w-[1px] h-1 bg-slate-300 mb-1"></div>5K</div>
                <div className="flex flex-col items-center"><div className="w-[1px] h-1 bg-slate-300 mb-1"></div>10K</div>
                <div className="flex flex-col items-center"><div className="w-[1px] h-1 bg-slate-300 mb-1"></div>15K</div>
                <div className="flex flex-col items-center"><div className="w-[1px] h-1 bg-slate-300 mb-1"></div>20K</div>
                <div className="flex flex-col items-center"><div className="w-[1px] h-1 bg-slate-300 mb-1"></div>25K</div>
                <div className="flex flex-col items-center"><div className="w-[1px] h-1 bg-slate-300 mb-1"></div>30K+</div>
              </div>
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onToggle('priceRange', [0, 1000])} className="flex-1 py-2 px-3 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap">Under ₹1,000</button>
              <button onClick={() => onToggle('priceRange', [1000, 5000])} className="flex-1 py-2 px-3 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap">₹1,000 - ₹5,000</button>
              <button onClick={() => onToggle('priceRange', [5000, 25000])} className="flex-1 py-2 px-3 bg-blue-600 border border-blue-600 text-white rounded-lg text-xs font-semibold shadow-md whitespace-nowrap">₹5,000 - ₹25,000</button>
              <button onClick={() => onToggle('priceRange', [25000, 50000])} className="flex-1 py-2 px-3 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap">Above ₹25,000</button>
            </div>

            <div className="flex gap-4 mt-6">
              <button 
                onClick={onReset}
                className="flex-1 py-4 bg-white border border-border-base text-blue-600 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                Reset
              </button>
              <button className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <Filter className="w-4 h-4" />
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
