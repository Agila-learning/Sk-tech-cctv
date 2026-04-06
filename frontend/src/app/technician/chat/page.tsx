"use client";
import React, { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { fetchWithAuth } from '@/utils/api';
import { 
  MessageSquare, Send, Clock, Activity, 
  Paperclip, Shield, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TechnicianChat = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      const allMessages = await fetchWithAuth('/chat');
      // Filter for messages between me and admin roles
      const filtered = allMessages.filter((m: any) => {
          const senderRole = typeof m.sender === 'object' ? m.sender?.role : null;
          const receiverRole = m.receiverRole;
          return m.receiverRole === 'admin' || senderRole === 'admin' || (typeof m.receiver === 'object' && m.receiver?.role === 'admin');
      });
      setMessages(filtered.reverse() || []); // API returns latest first
    } catch (e) { 
      console.error("Load Chat Error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on(`message:${user?._id}`, (msg: any) => {
          setMessages(prev => [...prev, msg]);
      });

      return () => {
        if (socket) socket.off(`message:${user?._id}`);
      };
    }
  }, [socket, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const msg = await fetchWithAuth('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          receiverRole: 'admin', 
          content: newMessage 
        })
      });
      setMessages([...messages, msg]);
      setNewMessage('');
    } catch (e) { 
        alert('Transmission failed. Check network link.'); 
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-bg-muted/10">
        <Activity className="h-8 w-8 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] m-4 md:m-8 bg-card rounded-[3rem] border border-card-border overflow-hidden shadow-2xl relative text-fg-primary italic selection:bg-blue-600/30">
      {/* Header */}
      <div className="p-8 border-b border-card-border bg-card/50 backdrop-blur-xl flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-6">
              <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20">
                  <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                  <h2 className="text-2xl font-black text-fg-primary uppercase tracking-tighter">Command <span className="text-blue-500 italic">Interface</span></h2>
                  <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.3em] flex items-center mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      Secure Line to HQ
                  </p>
              </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                  <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest leading-none">Response Time</p>
                  <p className="text-sm font-black text-blue-500 mt-1 uppercase italic">&lt; 5 MINS</p>
              </div>
          </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 scrollbar-hide bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-600/[0.03] via-transparent to-transparent">
          {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-50">
                  <div className="w-24 h-24 bg-bg-muted rounded-[2.5rem] flex items-center justify-center border border-border-base">
                      <MessageSquare className="h-10 w-10 text-fg-dim" />
                  </div>
                  <div className="space-y-2">
                      <p className="text-sm font-black text-fg-primary uppercase tracking-widest italic">No Transmissions Logged</p>
                      <p className="text-xs font-medium text-fg-muted max-w-[240px]">Start a secure communication thread with Admin Command.</p>
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
                              <div className={`max-w-[85%] md:max-w-[70%] space-y-3`}>
                                  <div className={`p-6 rounded-[2.5rem] text-sm font-bold shadow-xl leading-relaxed tracking-tight ${isMe ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-600/20' : 'bg-bg-muted border border-border-base text-fg-primary rounded-tl-none'}`}>
                                      {msg.content}
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
      <div className="p-8 md:p-10 bg-card border-t border-card-border">
          <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4">
                  <button type="button" className="p-5 bg-bg-muted text-fg-dim rounded-[1.5rem] border border-border-base hover:text-blue-500 hover:border-blue-500 transition-all active:scale-95">
                      <Paperclip className="h-5 w-5" />
                  </button>
                  <div className="flex-1 relative group">
                      <input 
                          type="text" 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type status update or query for HQ..."
                          className="w-full bg-bg-muted border border-border-base rounded-[2rem] py-5 px-8 pr-16 text-xs font-black uppercase tracking-tight outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all text-fg-primary"
                      />
                      <button 
                          type="submit" 
                          disabled={!newMessage.trim()}
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
  );
};

export default function TechnicianChatPage() {
  return (
    <ProtectedRoute allowedRoles={['technician']}>
      <TechnicianChat />
    </ProtectedRoute>
  );
}
