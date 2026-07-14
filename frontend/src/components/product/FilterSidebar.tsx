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
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Price Range</h4>
          <div className="space-y-10">
            <div className="h-12 flex items-center relative group/slider px-2" id="price-slider-track">
              {/* Track Background */}
              <div className="absolute left-2 right-2 h-10 bg-white border border-border-base shadow-inner overflow-hidden">
                <div 
                  className="absolute h-full bg-blue-50/50"
                  style={{ 
                    left: `${(activeFilters.priceRange[0] / 50000) * 100}%`,
                    width: `${((activeFilters.priceRange[1] - activeFilters.priceRange[0]) / 50000) * 100}%`
                  }}
                ></div>
              </div>
              
              {/* Layered Range Inputs */}
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
                className="absolute inset-x-0 h-full pointer-events-none appearance-none bg-transparent z-30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer"
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
                className="absolute inset-x-0 h-full pointer-events-none appearance-none bg-transparent z-40 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer"
              />

              {/* Visual Decorative Thumbs */}
              <div 
                className="absolute w-8 h-8 bg-white rounded-full border-[3px] border-blue-600 shadow-md pointer-events-none z-20 flex items-center justify-center transition-all group-hover/slider:scale-110"
                style={{ left: `calc(${(activeFilters.priceRange[0] / 50000) * 100}% + 8px)`, transform: 'translate(-50%, 0)' }}
              >
                 <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              </div>
              <div 
                className="absolute w-8 h-8 bg-white rounded-full border-[3px] border-blue-600 shadow-md pointer-events-none z-30 flex items-center justify-center transition-all group-hover/slider:scale-110"
                style={{ left: `calc(${(activeFilters.priceRange[1] / 50000) * 100}% + 8px)`, transform: 'translate(-50%, 0)' }}
              >
                 <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase text-muted-foreground ml-1">Min Price</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">₹</span>
                  <input 
                    type="number"
                    value={activeFilters.priceRange[0]}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), activeFilters.priceRange[1] - 500);
                      onToggle('priceRange', [val, activeFilters.priceRange[1]]);
                    }}
                    className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 pl-10 text-[11px] font-black text-foreground outline-none focus:border-blue-600 transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase text-muted-foreground ml-1">Max Price</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">₹</span>
                  <input 
                    type="number"
                    value={activeFilters.priceRange[1]}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), activeFilters.priceRange[0] + 500);
                      onToggle('priceRange', [activeFilters.priceRange[0], val]);
                    }}
                    className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 pl-10 text-[11px] font-black text-foreground outline-none focus:border-blue-600 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button className="w-full py-5 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 hover:text-white transition-all mt-6 transform active:scale-95">
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;
