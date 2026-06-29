"use client";
import React, { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { fetchWithAuth } from '@/utils/api';
import { 
  MessageSquare, Send, Clock, Activity, 
  Paperclip, Shield, AlertCircle, Users, User, ChevronLeft, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const TechnicianChat = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [chatMode, setChatMode] = useState<'admin' | 'customer'>('admin');
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [msgData, bookingsData, ordersData] = await Promise.all([
        fetchWithAuth('/chat'),
        fetchWithAuth('/bookings/technician/all').catch(() => []),
        fetchWithAuth('/orders/technician/all').catch(() => [])
      ]);
      
      setAllMessages(msgData || []);
      
      // Extract unique customers from bookings and orders
      const custMap = new Map();
      const combine = [...(bookingsData || []), ...(ordersData || [])];
      combine.forEach(item => {
        if (item.customer && item.customer._id) {
          custMap.set(item.customer._id, item.customer);
        } else if (item.customer && typeof item.customer === 'string') {
          custMap.set(item.customer, { _id: item.customer, name: item.customerName || 'Active Customer', phone: item.contactNumber || item.phone || 'N/A' });
        }
      });
      
      const custList = Array.from(custMap.values());
      setCustomers(custList);
      if (custList.length > 0 && !selectedCustomer) {
        setSelectedCustomer(custList[0]);
      }
    } catch (e) { 
      console.error("Load Chat Error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter messages based on active mode
  useEffect(() => {
    if (chatMode === 'admin') {
      const filtered = allMessages.filter((m: any) => {
          const senderRole = typeof m.sender === 'object' ? m.sender?.role : null;
          return m.receiverRole === 'admin' || senderRole === 'admin' || (typeof m.receiver === 'object' && m.receiver?.role === 'admin');
      });
      setMessages(filtered.reverse() || []); // API returns latest first
    } else if (chatMode === 'customer' && selectedCustomer) {
      const filtered = allMessages.filter((m: any) => {
          const senderId = typeof m.sender === 'object' ? m.sender?._id : m.sender;
          const receiverId = typeof m.receiver === 'object' ? m.receiver?._id : m.receiver;
          return senderId === selectedCustomer._id || receiverId === selectedCustomer._id;
      });
      setMessages(filtered.reverse() || []);
    } else {
      setMessages([]);
    }
  }, [chatMode, selectedCustomer, allMessages]);

  useEffect(() => {
    if (socket) {
      socket.on(`message:${user?._id}`, (msg: any) => {
          setAllMessages(prev => [msg, ...prev]); // Prepend since API returns latest first
      });

      return () => {
        if (socket) socket.off(`message:${user?._id}`);
      };
    }
  }, [socket, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMode, selectedCustomer]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }

    try {
        const response = await fetchWithAuth('/upload?type=documents', {
            method: 'POST',
            body: formData,
            headers: {} 
        });

        const newAttachments = response.imageUrls.map((url: string, index: number) => ({
            url,
            filename: files[index].name,
            fileType: files[index].type
        }));

        setAttachments(prev => [...prev, ...newAttachments]);
    } catch (error) {
        console.error("Upload Error:", error);
        alert("Transmission failed. Secure link compromised.");
    } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;
    
    const payload = chatMode === 'admin' ? {
      receiverRole: 'admin', 
      content: newMessage || (attachments.length > 0 ? "Sent Attachments" : ""),
      attachments: attachments
    } : {
      receiver: selectedCustomer?._id,
      receiverRole: 'customer',
      content: newMessage || (attachments.length > 0 ? "Sent Attachments" : ""),
      attachments: attachments
    };

    try {
      const msg = await fetchWithAuth('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setAllMessages(prev => [msg, ...prev]);
      setNewMessage('');
      setAttachments([]);
      if (socket && chatMode === 'customer' && selectedCustomer) {
        socket.emit('send_message', { ...msg, room: selectedCustomer._id });
      }
    } catch (e) { 
        alert('Transmission failed. Check network link.'); 
    }
  };

  if (loading && allMessages.length === 0) return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-background">
        <Activity className="h-12 w-12 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col max-w-7xl mx-auto">
      {/* Hidden File Input */}
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept="image/*,.pdf"
      />

      {/* Header & Toggle */}
      <div className="p-6 md:p-8 glass-card rounded-[2.5rem] border border-border-base mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl shrink-0">
          <div className="flex items-center space-x-6">
              <button 
                onClick={() => router.push('/technician')}
                className="p-4 bg-bg-muted border border-border-base rounded-2xl hover:bg-bg-surface transition-all group"
                title="Back to Dashboard"
              >
                <ChevronLeft className="h-6 w-6 text-fg-primary group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20">
                  <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                  <h2 className="text-2xl md:text-3xl font-black text-fg-primary uppercase tracking-tighter italic">Communication <span className="text-blue-500 not-italic">Hub</span></h2>
                  <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.3em] flex items-center mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      Encrypted Relay Protocol
                  </p>
              </div>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex bg-bg-muted rounded-2xl p-1.5 border border-border-base shadow-inner w-full lg:w-auto">
              <button 
                onClick={() => setChatMode('admin')}
                className={`flex-1 lg:flex-none flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${chatMode === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-fg-muted hover:text-fg-primary'}`}
              >
                <Shield className="h-4 w-4" />
                <span>HQ Admin Chat</span>
              </button>
              <button 
                onClick={() => setChatMode('customer')}
                className={`flex-1 lg:flex-none flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${chatMode === 'customer' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-fg-muted hover:text-fg-primary'}`}
              >
                <Users className="h-4 w-4" />
                <span>Customer Chat</span>
              </button>
          </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-[600px] bg-card rounded-[3rem] border border-card-border shadow-2xl">
          {/* Customer Selection Sidebar (Only visible in Customer Mode) */}
          {chatMode === 'customer' && (
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-card-border p-6 flex flex-col bg-bg-surface/50 overflow-y-auto scrollbar-hide">
              <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.3em] mb-4 px-2">Assigned Clients</p>
              {customers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-40">
                  <User className="h-10 w-10 text-fg-dim mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">No Active Clients</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customers.map((cust: any) => (
                    <button
                      key={cust._id}
                      onClick={() => setSelectedCustomer(cust)}
                      className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] border transition-all text-left ${selectedCustomer?._id === cust._id ? 'bg-blue-600/10 border-blue-600/30 text-fg-primary shadow-sm' : 'bg-bg-muted/50 border-border-base text-fg-muted hover:bg-bg-muted'}`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-xs shadow-md shrink-0">
                          {cust.name?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-black uppercase tracking-tight truncate">{cust.name || 'Active Client'}</p>
                          <p className="text-[9px] font-bold text-fg-muted uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            <Phone className="h-2.5 w-2.5 text-blue-500" />
                            <span>{cust.phone || 'Offline Link'}</span>
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages & Input Area */}
          <div className={`flex flex-col h-full ${chatMode === 'customer' ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 scrollbar-hide bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-600/[0.03] via-transparent to-transparent">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-50 py-20">
                        <div className="w-20 h-20 bg-bg-muted rounded-[2.5rem] flex items-center justify-center border border-border-base">
                            <MessageSquare className="h-8 w-8 text-fg-dim" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-black text-fg-primary uppercase tracking-widest italic">No Transmissions Logged</p>
                            <p className="text-xs font-medium text-fg-muted max-w-[260px]">
                              {chatMode === 'admin' ? 'Start a secure communication thread with Admin Command.' : 'Initiate secure live link with the selected customer.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg: any, i: number) => {
                            const isMe = typeof msg.sender === 'object' ? msg.sender?._id === user?._id : msg.sender === user?._id;
                            return (
                                <motion.div 
                                    key={msg._id || i}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] md:max-w-[75%] space-y-2`}>
                                        <div className={`p-6 rounded-[2.5rem] text-xs font-bold shadow-xl leading-relaxed tracking-tight ${isMe ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-600/20' : 'bg-bg-muted border border-border-base text-fg-primary rounded-tl-none'}`}>
                                            {msg.content}
                                            
                                            {/* Render Attachments */}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-4 grid grid-cols-1 gap-3">
                                                    {msg.attachments.map((file: any, idx: number) => (
                                                        <div key={idx} className="group relative">
                                                            {file.fileType?.startsWith('image/') ? (
                                                                <img 
                                                                    src={file.url} 
                                                                    alt={file.filename} 
                                                                    className="rounded-2xl w-full max-h-60 object-cover border border-white/10 cursor-pointer"
                                                                    onClick={() => window.open(file.url, '_blank')}
                                                                />
                                                            ) : (
                                                                <a 
                                                                    href={file.url} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className={`flex items-center space-x-3 p-4 rounded-2xl border ${isMe ? 'bg-white/10 border-white/20' : 'bg-blue-600/5 border-blue-500/20'}`}
                                                                >
                                                                    <Shield className="h-5 w-5" />
                                                                    <span className="text-[10px] font-black uppercase truncate max-w-[150px]">{file.filename}</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`flex items-center space-x-2 px-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <Clock className="h-3 w-3 text-fg-muted" />
                                            <p className="text-[9px] font-black uppercase tracking-widest text-fg-muted">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
                <div ref={chatEndRef}></div>
            </div>

            {/* Input Area */}
            <div className="p-6 md:p-8 bg-card border-t border-card-border">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                    {/* Attachment Previews */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-4 mb-6">
                            {attachments.map((file, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center space-x-3 pr-10">
                                        <Shield className="h-4 w-4 text-blue-500" />
                                        <span className="text-[10px] font-black uppercase truncate max-w-[100px]">{file.filename}</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading || (chatMode === 'customer' && !selectedCustomer)}
                          className={`p-5 bg-bg-muted text-fg-dim rounded-[1.5rem] border border-border-base hover:text-blue-500 hover:border-blue-500 transition-all active:scale-95 ${uploading ? 'animate-pulse opacity-50' : ''} disabled:opacity-50`}
                        >
                            {uploading ? <Activity className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                        </button>
                        <div className="flex-1 relative group">
                            <input 
                                type="text" 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={uploading ? "Uploading secure assets..." : chatMode === 'admin' ? "Type status update or query for HQ..." : `Type message to ${selectedCustomer?.name || 'Customer'}...`}
                                disabled={uploading || (chatMode === 'customer' && !selectedCustomer)}
                                className="w-full bg-bg-muted border border-border-base rounded-[2rem] py-5 px-8 pr-16 text-xs font-black uppercase tracking-tight outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all text-fg-primary disabled:opacity-50"
                            />
                            <button 
                                type="submit" 
                                disabled={(!newMessage.trim() && attachments.length === 0) || uploading || (chatMode === 'customer' && !selectedCustomer)}
                                className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:scale-100"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-center space-x-6 text-[9px] font-black text-fg-muted uppercase tracking-[0.2em]">
                        <div className="flex items-center space-x-2">
                             <Shield className="h-3 w-3 text-green-500" />
                             <span>End-to-End Encryption Active</span>
                        </div>
                        <div className="flex items-center space-x-2">
                             <AlertCircle className="h-3 w-3 text-blue-500" />
                             <span>Standard Protocol Applies</span>
                        </div>
                    </div>
                </form>
            </div>
          </div>
      </div>
    </div>
  );
};

export default function TechnicianChatPage() {
  return (
    <ProtectedRoute allowedRoles={['technician']}>
      <TechnicianChat />
    </ProtectedRoute>
  );
}
