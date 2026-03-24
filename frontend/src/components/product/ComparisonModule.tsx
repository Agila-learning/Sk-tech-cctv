"use client";
import React from 'react';
import { X, Zap } from 'lucide-react';
import { API_URL } from '@/utils/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  image?: string;
  category?: string;
  specifications?: {
    resolution?: string;
    nightVision?: string;
    storage?: string;
    connectivity?: string;
    [key: string]: string | undefined;
  };
  usage?: string;
  description?: string;
}

const getImageUrl = (path?: string) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  return `${API_URL.replace('/api', '')}${path}`;
};

const ComparisonModule = ({ onClose, products = [] }: { onClose?: () => void; products?: Product[] }) => {
  const [p1, p2] = products;

  const specLabels: Record<string, string> = {
    resolution: 'Resolution',
    nightVision: 'Night Vision',
    storage: 'Storage',
    connectivity: 'Connectivity',
  };

  const allSpecKeys = Array.from(new Set([
    ...Object.keys(p1?.specifications || {}),
    ...Object.keys(p2?.specifications || {})
  ])).filter(k => k !== '__v');

  return (
    <div className="glass-card p-10 rounded-[3rem] relative overflow-hidden">
      <div className="mb-10 flex justify-between items-end">
        <div className="space-y-2">
          <h3 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Compare Products</h3>
          <p className="text-fg-muted font-medium max-w-sm text-sm">Side-by-side specification comparison.</p>
        </div>
        <button
          onClick={onClose}
          className="p-4 bg-bg-muted border border-border-base rounded-2xl text-fg-muted hover:text-fg-primary transition-all active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {products.length < 2 ? (
        <div className="text-center py-16 text-fg-muted">
          <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-bold">Select at least 2 products to compare.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr>
                <th className="p-4 text-xs font-black uppercase text-fg-muted tracking-[0.2em] w-1/3">Feature</th>
                {[p1, p2].map((p, i) => (
                  <th key={p._id} className={`p-4 rounded-t-3xl border-t border-x text-center ${i === 0 ? 'bg-blue-600/10 border-blue-600/20' : 'bg-bg-muted border-border-base'}`}>
                    <div className="flex flex-col items-center space-y-3 py-3">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-bg-surface border border-border-base flex items-center justify-center">
                        <img
                          src={getImageUrl(p.images?.[0] || p.image)}
                          alt={p.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e: any) => { e.target.src = '/placeholder.png'; }}
                        />
                      </div>
                      <span className={`font-black text-sm uppercase tracking-wide ${i === 0 ? 'text-fg-primary' : 'text-fg-muted'}`}>{p.name}</span>
                      <span className={`text-lg font-black ${i === 0 ? 'text-blue-400' : 'text-fg-muted'}`}>₹{p.price?.toLocaleString()}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="group">
                <td className="p-5 text-xs font-black uppercase text-fg-muted tracking-widest border-b border-border-base">Category</td>
                <td className="p-5 bg-blue-600/5 text-center font-bold text-fg-primary border-x border-blue-600/10 text-sm">{p1?.category || '—'}</td>
                <td className="p-5 bg-bg-muted/50 text-center font-bold text-fg-muted border-x border-border-base text-sm">{p2?.category || '—'}</td>
              </tr>
              <tr className="group">
                <td className="p-5 text-xs font-black uppercase text-fg-muted tracking-widest border-b border-border-base">Usage</td>
                <td className="p-5 bg-blue-600/5 text-center font-bold text-fg-primary border-x border-blue-600/10 text-sm">{p1?.usage || 'All-purpose'}</td>
                <td className="p-5 bg-bg-muted/50 text-center font-bold text-fg-muted border-x border-border-base text-sm">{p2?.usage || 'All-purpose'}</td>
              </tr>
              {allSpecKeys.map(key => (
                <tr key={key} className="group">
                  <td className="p-5 text-xs font-black uppercase text-fg-muted tracking-widest border-b border-border-base">
                    {specLabels[key] || key}
                  </td>
                  <td className="p-5 bg-blue-600/5 text-center font-bold text-fg-primary border-x border-blue-600/10 text-sm">
                    {p1?.specifications?.[key] || '—'}
                  </td>
                  <td className="p-5 bg-bg-muted/50 text-center font-bold text-fg-muted border-x border-border-base text-sm">
                    {p2?.specifications?.[key] || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                <td className="p-6 text-center bg-blue-600 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] rounded-b-3xl">
                  <span className="text-white font-black text-xs uppercase tracking-[0.2em]">Best Choice</span>
                </td>
                <td className="p-6 text-center bg-bg-muted rounded-b-3xl">
                  <span className="text-fg-muted font-black text-xs uppercase tracking-[0.2em]">Alternative</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComparisonModule;
