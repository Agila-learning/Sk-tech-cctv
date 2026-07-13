"use client";

import React, { useState, useEffect } from 'react';
import { QrCode, Search, RefreshCw, ZoomIn, Share2, Copy, Check } from 'lucide-react';
import { fetchWithAuth, getImageUrl } from '@/utils/api';
import QRFullscreenView from '@/components/technician/QRFullscreenView';
import io from 'socket.io-client';
import { API_URL } from '@/utils/api';

interface QRCodeData {
  _id: string;
  qrName: string;
  category: string;
  customCategory?: string;
  qrImage: string;
  description?: string;
  color: string;
  targetType?: string;
  targetValue?: string;
}

export default function TechnicianQRCodesPage() {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncRequired, setSyncRequired] = useState(false);
  
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Try to load from localStorage first for immediate display
    const cached = localStorage.getItem('sk_tech_qrcodes');
    if (cached) {
      try {
        setQrCodes(JSON.parse(cached));
        setLoading(false);
      } catch (e) {
        console.error('Failed to parse cached QR codes');
      }
    }

    // 2. Fetch fresh data
    fetchQRCodes();

    // 3. Socket listener for real-time updates
    const socketUrl = API_URL.replace(/\/api\/?$/, '');
    const socket = io(socketUrl);

    socket.emit('join', 'role:technician');
    socket.on('qr_code_update', () => {
      setSyncRequired(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchQRCodes = async () => {
    setLoading(true);
    try {
      setSyncRequired(false);
      const data = await fetchWithAuth('/qrcodes?activeOnly=true');
      setQrCodes(data);
      localStorage.setItem('sk_tech_qrcodes', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to fetch QR codes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (value: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = qrCodes.filter(qr => 
    qr.qrName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-3xl border border-border-base shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-fg-primary tracking-tight flex items-center gap-3">
            <QrCode className="text-blue-500 h-8 w-8" />
            QR Code Center
          </h1>
          <p className="text-fg-muted text-sm mt-1 font-medium">Quick access to all authorized QR codes</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {syncRequired && (
            <button 
              onClick={fetchQRCodes}
              className="flex items-center gap-2 bg-blue-500/10 text-blue-500 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"
            >
              <RefreshCw className="h-4 w-4 animate-spin" />
              Sync
            </button>
          )}

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
            <input
              type="text"
              placeholder="Search QR codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-muted border border-border-base rounded-2xl pl-11 pr-4 py-3 text-sm text-fg-primary placeholder:text-fg-muted focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading && qrCodes.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border-base rounded-[2rem] h-64 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(qr => (
            <div 
              key={qr._id} 
              onClick={() => setSelectedQR(qr)}
              className="group cursor-pointer bg-card border border-border-base rounded-[2rem] overflow-hidden hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col"
            >
              <div className="flex-1 p-6 flex flex-col items-center justify-center">
                <div 
                  className="w-32 h-32 rounded-3xl p-3 bg-white shadow-sm mb-6 flex items-center justify-center border-4 border-bg-muted transition-transform group-hover:scale-105"
                >
                  <img 
                    src={getImageUrl(qr.qrImage)} 
                    alt={qr.qrName}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <h3 className="text-fg-primary font-bold text-lg text-center leading-tight mb-2">{qr.qrName}</h3>
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-bg-muted text-fg-muted">
                  {qr.category === 'Custom' ? qr.customCategory : qr.category}
                </span>
                
                {qr.description && (
                  <p className="text-xs text-fg-muted text-center mt-3 line-clamp-2">{qr.description}</p>
                )}
              </div>

              <div className="w-full flex items-center justify-between border-t border-border-base bg-bg-muted/30 px-6 py-4">
                <button 
                   className="flex items-center gap-2 text-xs font-bold text-blue-500 group-hover:text-blue-600 transition-colors"
                >
                  <ZoomIn className="h-4 w-4" /> Expand
                </button>
                
                {qr.targetValue && (
                  <button 
                    onClick={(e) => handleCopy(qr.targetValue!, qr._id, e)}
                    className={`p-2 rounded-xl border transition-all ${
                      copiedId === qr._id 
                        ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                        : 'bg-bg-surface border-border-strong text-fg-muted hover:text-fg-primary hover:border-fg-primary/20'
                    }`}
                    title="Copy Value"
                  >
                    {copiedId === qr._id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center flex flex-col items-center text-fg-muted">
              <QrCode className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-semibold">No active QR codes available.</p>
            </div>
          )}
        </div>
      )}

      <QRFullscreenView 
        isOpen={!!selectedQR} 
        onClose={() => setSelectedQR(null)} 
        qr={selectedQR} 
      />
    </div>
  );
}
