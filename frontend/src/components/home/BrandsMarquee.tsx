"use client";
import React from 'react';

const brands = [
  "Hikvision",
  "Dahua",
  "CP Plus",
  "UNV",
  "Ezviz",
  "Godrej",
];

const BrandsMarquee = () => {
  return (
    <section className="py-12 bg-background border-y border-border-base overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <h4 className="text-center text-xs font-black tracking-[0.3em] uppercase text-fg-muted">Trusted by Industry Leaders</h4>
      </div>
      
      <div className="relative flex overflow-x-hidden group">
        <div className="animate-marquee whitespace-nowrap flex items-center group-hover:pause">
          {[...brands, ...brands, ...brands].map((brand, i) => (
            <span key={i} className="mx-8 md:mx-16 text-2xl md:text-4xl font-black text-fg-dim tracking-tighter opacity-50 hover:opacity-100 hover:text-blue-500 transition-all cursor-default">
              {brand}
            </span>
          ))}
        </div>
        
        <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center group-hover:pause">
          {[...brands, ...brands, ...brands].map((brand, i) => (
            <span key={`second-${i}`} className="mx-8 md:mx-16 text-2xl md:text-4xl font-black text-fg-dim tracking-tighter opacity-50 hover:opacity-100 hover:text-blue-500 transition-all cursor-default">
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsMarquee;
