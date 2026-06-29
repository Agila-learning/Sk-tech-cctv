"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, User, Map, Clock, AlertCircle, Loader2, Play, ChevronLeft, Plus, X, CheckCircle } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import Link from 'next/link';
import { useSocket } from '@/context/SocketContext';

export default function AdminTrackingPage() {
  const [activeTechs, setActiveTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTechForAssign, setSelectedTechForAssign] = useState<any>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const { socket } = useSocket();

  const loadTrackingData = async () => {
    try {
      const [trackingData, ordersData] = await Promise.all([
        fetchWithAuth('/admin/tracking/live'),
        fetchWithAuth('/bookings/admin/all')
      ]);
      setActiveTechs(trackingData);
      setPendingOrders(ordersData?.filter((o: any) => !o.technician && o.status !== 'completed') || []);
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackingData();
    // Auto refresh every 60s as a fallback
    const interval = setInterval(loadTrackingData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for live GPS pings via socket
    const handleGpsUpdate = (data: any) => {
      setActiveTechs(current => {
        const index = current.findIndex(t => t.technician._id === data.technicianId);
        if (index >= 0) {
          const newArray = [...current];
          newArray[index].location = { 
            lat: data.lat, 
            lng: data.lng, 
            lastUpdate: new Date(), 
            status: data.status 
          };
          setLastUpdate(new Date());
          return newArray;
        }
        return current;
      });
    };

    socket.on('gps_update', handleGpsUpdate);
    return () => {
      socket.off('gps_update', handleGpsUpdate);
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-background text-fg-primary p-6 md:p-10 pb-32 transition-all">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <Link 
              href="/admin" 
              className="group flex items-center space-x-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] hover:text-blue-600 transition-all mb-4"
            >
              <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Command Center</span>
            </Link>
            <div className="flex items-center space-x-3 text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] bg-blue-600/10 px-4 py-2 rounded-2xl w-fit">
              <Map className="h-4 w-4" />
              <span>Fleet Tracking</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none italic">
              Live <span className="text-blue-500 non-italic">Map</span>
            </h1>
            <p className="text-fg-muted font-medium ml-1">Real-time GPS telemetry from active technicians.</p>
          </div>

          <div className="glass-card px-6 py-4 rounded-3xl border border-border-base flex flex-col items-end shadow-xl">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted mb-1">Grid Sync</span>
             <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-bold text-fg-primary">{activeTechs.length} Active Nodes</span>
             </div>
             <p className="text-[9px] text-fg-dim font-bold mt-2">Latest Ping: {lastUpdate.toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Live Grid */}
        {loading ? (
          <div className="flex p-20 justify-center text-blue-500"><Loader2 className="h-10 w-10 animate-spin" /></div>
        ) : activeTechs.length === 0 ? (
           <div className="glass-card p-20 rounded-[3rem] border border-border-base text-center space-y-6 select-none relative overflow-hidden">
             <MapPin className="h-16 w-16 text-fg-dim mx-auto relative z-10" />
             <div className="relative z-10 space-y-2">
               <p className="text-3xl font-black text-fg-primary uppercase tracking-tight">No Active Techs</p>
               <p className="text-xs font-black text-fg-muted uppercase tracking-[0.2em]">All technicians are currently offline or idle</p>
             </div>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTechs.map((tech) => {
              const { technician, location, order } = tech;
              const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
              const timeAgo = Math.floor((new Date().getTime() - new Date(location.lastUpdate).getTime()) / 60000); // minutes
              
              const isStale = timeAgo > 15;

              return (
                <div key={technician._id} className="glass-card p-8 rounded-[2.5rem] border border-border-base relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -z-10 group-hover:bg-blue-600/10 transition-colors"></div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <img 
                          src={technician.profilePic || '/default-avatar.png'} 
                          alt={technician.name} 
                          className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                        />
                        <div>
                          <h3 className="text-lg font-black text-fg-primary uppercase tracking-tight truncate max-w-[150px]">{technician.name}</h3>
                          <div className="flex items-center space-x-2 text-[9px] font-black uppercase text-fg-muted tracking-widest mt-1">
                             <User className="h-3 w-3" />
                             <span>{technician.phone}</span>
                          </div>
                        </div>
                      </div>
                      
                      {order?.status === 'completed' ? (
                        <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                           <CheckCircle className="h-3 w-3" /> Task Completed
                        </div>
                      ) : isStale ? (
                        <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5" title="No ping received recently">
                           <AlertCircle className="h-3 w-3" /> Stale
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 line-clamp-1">
                           <Navigation className="h-3 w-3 -rotate-45" /> Live
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border-base/50">
                       <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-dim">Current Assignment</p>
                          <p className="text-sm font-bold text-fg-primary line-clamp-2 leading-snug">{order?.deliveryAddress || 'Address Unknown'}</p>
                          <p className="text-xs font-black text-blue-500 tracking-widest font-mono">ORDER #{order?._id?.slice(-6).toUpperCase()}</p>
                       </div>
                       
                       <div className="flex items-center justify-between p-4 rounded-2xl bg-bg-muted/50 border border-border-base">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black uppercase tracking-widest text-fg-muted flex items-center gap-1">
                               <MapPin className="h-3 w-3" /> Coordinates
                             </p>
                             <p className="text-xs font-mono font-bold text-fg-primary">{location.lat?.toFixed(5)}, {location.lng?.toFixed(5)}</p>
                          </div>
                          <div className="space-y-1 text-right">
                             <p className="text-[9px] font-black uppercase tracking-widest text-fg-muted flex items-center justify-end gap-1">
                               <Clock className="h-3 w-3" /> Last Seen
                             </p>
                             <p className="text-xs font-bold text-fg-primary">{timeAgo === 0 ? 'Just now' : `${timeAgo}m ago`}</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border-base grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        setSelectedTechForAssign(technician);
                        setIsAssignModalOpen(true);
                      }}
                      className="py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Assign Job
                    </button>
                    <a 
                      href={gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-4 bg-bg-muted text-fg-muted border border-border-base hover:bg-bg-hover rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                    >
                      <Map className="h-4 w-4" />
                      Maps
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAssignModalOpen && selectedTechForAssign && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md rounded-[3rem] border border-border-base p-10 space-y-8 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-fg-primary uppercase italic tracking-tight">Assign <span className="text-blue-500">Node</span></h3>
                  <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mt-1">Dispensing to {selectedTechForAssign.name}</p>
                </div>
                <button onClick={() => setIsAssignModalOpen(false)} className="p-3 bg-bg-muted rounded-2xl hover:bg-bg-card transition-all">
                  <X className="h-6 w-6 text-fg-muted" />
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {pendingOrders.length === 0 ? (
                  <p className="py-10 text-center text-[10px] font-black text-fg-muted uppercase tracking-widest">No Pending Orders to Assign</p>
                ) : (
                  pendingOrders.map((order) => (
                    <button
                      key={order._id}
                      onClick={async () => {
                        try {
                          await fetchWithAuth(`/orders/assign/${order._id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ technicianId: selectedTechForAssign._id })
                          });
                          setIsAssignModalOpen(false);
                          loadTrackingData();
                        } catch (e) { alert("Assignment Failed"); }
                      }}
                      className="w-full p-6 rounded-2xl bg-bg-muted/50 border border-border-base hover:border-blue-500 hover:bg-bg-muted transition-all text-left group"
                    >
                      <div className="flex justify-between items-start mb-2 text-[10px] font-black uppercase text-blue-500 tracking-widest">
                        <span>#{order._id.slice(-6).toUpperCase()}</span>
                        <span>{order.orderType || 'Online'}</span>
                      </div>
                      <p className="text-sm font-bold text-fg-primary mb-1">{order.customer?.name || 'Client'}</p>
                      <p className="text-[10px] text-fg-muted font-medium line-clamp-2">{order.deliveryAddress}</p>
                    </button>
                  ))
                )}
              </div>

              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="w-full py-5 bg-bg-muted border border-border-base rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-bg-card transition-all"
              >
                Cancel Allocation
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
