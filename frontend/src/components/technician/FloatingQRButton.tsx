"use client";
import React, { useState, useEffect } from 'react';
import { QrCode, Search, RefreshCw, X, ZoomIn, Share2, Copy, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchWithAuth, getImageUrl } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import io from 'socket.io-client';

interface QRCodeData {
  _id: string;
  qrName: string;
  category: string;
  customCategory?: string;
  qrImage: string;
  description?: string;
  displayOrder: number;
  status: boolean;
  icon: string;
  color: string;
  targetType?: string;
  targetValue?: string;
}

export default function FloatingQRButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [syncRequired, setSyncRequired] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [fullscreenQr, setFullscreenQr] = useState<QRCodeData | null>(null);
  
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    // Load from cache first
    const cached = localStorage.getItem('sk_tech_qrcodes');
    if (cached) {
      setQrCodes(JSON.parse(cached));
    }
    // Fetch fresh data
    fetchQRCodes();

    // Setup Socket
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      withCredentials: true
    });
    
    if (user) {
      socket.emit('join', { userId: user._id, role: 'technician' });
    }

    socket.on('new_notification', (data) => {
      if (data?.type === 'qr_code_update') {
        setSyncRequired(true);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const fetchQRCodes = async () => {
    try {
      setSyncRequired(false);
      const data = await fetchWithAuth('/qrcodes?activeOnly=true');
      setQrCodes(data);
      localStorage.setItem('sk_tech_qrcodes', JSON.stringify(data));
    } catch (err: any) {
      console.error('Failed to fetch QR codes', err);
      // Offline fallback is already handled because we load from localStorage on init
    }
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (qr: QRCodeData) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: qr.qrName,
          text: qr.description || 'Scan this QR Code',
          url: getImageUrl(qr.qrImage)
        });
      } catch (err: any) {
        console.error('Share failed', err);
      }
    } else {
      handleCopy(getImageUrl(qr.qrImage));
    }
  };

  const categories = ['All', ...Array.from(new Set(qrCodes.map(q => q.category === 'Custom' ? q.customCategory || 'Custom' : q.category)))];
  
  const filtered = qrCodes.filter(qr => 
    (selectedCategory === 'All' || (qr.category === 'Custom' ? qr.customCategory === selectedCategory : qr.category === selectedCategory)) &&
    qr.qrName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-[#14B8A6] hover:bg-[#0D9488] text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all flex items-center justify-center group"
        >
          <QrCode className="h-6 w-6" />
          {syncRequired && (
            <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-[#14B8A6] animate-pulse"></span>
          )}
          
          <span className="absolute -top-10 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Show QR
          </span>
        </button>
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-bg-surface w-full sm:max-w-md h-[85vh] sm:h-[80vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col border border-white/10"
            >
              {/* Header */}
              <div className="p-5 flex justify-between items-center border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="bg-[#14B8A6]/20 p-2 rounded-xl text-[#14B8A6]">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-fg-primary">QR Code Center</h2>
                    {syncRequired && (
                      <p className="text-[10px] text-red-500 font-bold uppercase flex items-center gap-1 cursor-pointer" onClick={fetchQRCodes}>
                        <RefreshCw className="h-3 w-3" /> Sync Required
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl bg-black/10 text-fg-secondary hover:bg-black/20 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search & Filter */}
              <div className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-tertiary" />
                  <input
                    type="text"
                    placeholder="Search QR..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-black/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-fg-primary focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>
                
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedCategory === cat ? 'bg-[#14B8A6] text-white' : 'bg-black/5 text-fg-secondary border border-white/10'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/20">
                {filtered.length === 0 ? (
                  <div className="text-center text-fg-tertiary py-10 flex flex-col items-center">
                    <QrCode className="h-12 w-12 mb-3 opacity-20" />
                    <p>No QR codes available.</p>
                  </div>
                ) : (
                  filtered.map(qr => (
                    <div 
                      key={qr._id}
                      onClick={() => { setFullscreenQr(qr); setZoomLevel(1); setRotation(0); }}
                      className="bg-bg-surface border border-white/5 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-[#14B8A6]/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${qr.color}20` }}>
                        <QrCode className="h-6 w-6" style={{ color: qr.color }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-fg-primary font-bold text-sm">{qr.qrName}</h4>
                        <p className="text-xs text-fg-tertiary">{qr.category === 'Custom' ? qr.customCategory : qr.category}</p>
                      </div>
                      <ZoomIn className="h-5 w-5 text-fg-tertiary" />
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen View */}
      <AnimatePresence>
        {fullscreenQr && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-xl"
          >
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
              <div className="text-white">
                <h3 className="font-black text-xl">{fullscreenQr.qrName}</h3>
                <p className="text-white/60 text-sm">{fullscreenQr.description}</p>
              </div>
              <button onClick={() => setFullscreenQr(null)} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center w-full max-w-sm overflow-hidden">
              <motion.div 
                animate={{ scale: zoomLevel, rotate: rotation }}
                transition={{ type: 'spring', damping: 20 }}
                className="bg-white p-4 rounded-3xl"
              >
                <img 
                  src={getImageUrl(fullscreenQr.qrImage)} 
                  alt={fullscreenQr.qrName} 
                  className="w-full h-auto rounded-xl shadow-2xl" 
                />
              </motion.div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-4 z-10">
              <button 
                onClick={() => setRotation(r => r - 90)}
                className="p-4 bg-black/80 rounded-2xl text-white font-bold backdrop-blur-md border border-white/20 shadow-xl"
              >
                Rotate
              </button>
              <button 
                onClick={() => handleShare(fullscreenQr)}
                className="p-4 bg-black/80 rounded-2xl text-white font-bold backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-2"
              >
                <Share2 className="h-5 w-5" /> Share
              </button>
              
              {(fullscreenQr.targetType || fullscreenQr.targetValue) && (
                 <button 
                    onClick={() => handleCopy(fullscreenQr.targetValue || '')}
                    className="p-4 bg-[#14B8A6] rounded-2xl text-white font-bold flex items-center gap-2 shadow-lg shadow-[#14B8A6]/20"
                 >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    {copied ? 'Copied!' : 'Copy Value'}
                 </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
