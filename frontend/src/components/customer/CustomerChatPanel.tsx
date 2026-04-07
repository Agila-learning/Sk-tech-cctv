"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { fetchWithAuth } from '@/utils/api';
import { 
  MessageSquare, Send, Clock, X, Info, 
  Shield, AlertCircle, Paperclip, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  targetId?: string; // Technician ID, null for Admin
  targetName: string;
  orderStatus?: string; // To check if 'completed'
}

const CustomerChatPanel = ({ isOpen, onClose, targetId, targetName, orderStatus }: CustomerChatPanelProps) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isReadOnly = orderStatus === 'completed';

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen, targetId]);

  useEffect(() => {
    if (socket && isOpen) {
      const handleIncoming = (msg: any) => {
        // Only add if it belongs to this conversation
        const isFromTarget = targetId ? msg.sender === targetId || msg.sender?._id === targetId : msg.receiverRole === 'admin' || msg.sender?.role === 'admin';
        if (isFromTarget || msg.sender === user?._id) {
            setMessages(prev => [...prev, msg]);
        }
      };

      socket.on(`message:${user?._id}`, handleIncoming);
      return () => { socket.off(`message:${user?._id}`, handleIncoming); };
    }
  }, [socket, isOpen, targetId, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const allMessages = await fetchWithAuth('/chat');
      const filtered = allMessages.filter((m: any) => {
        const senderId = typeof m.sender === 'object' ? m.sender?._id : m.sender;
        const receiverId = typeof m.receiver === 'object' ? m.receiver?._id : m.receiver;
        
        if (targetId) {
          // Chat with Technician
          return (senderId === targetId && receiverId === user?._id) || 
                 (senderId === user?._id && receiverId === targetId);
        } else {
          // Chat with Admin
          return m.receiverRole === 'admin' || (typeof m.sender === 'object' && m.sender?.role === 'admin');
        }
      });
      setMessages(filtered.reverse());
    } catch (e) {
      console.error("Load Chat Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || isReadOnly) return;

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
    } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || isReadOnly) return;
    
    try {
      const payload: any = {
        content: newMessage || (attachments.length > 0 ? "Sent Attachments" : ""),
        attachments: attachments
      };

      if (targetId) {
        payload.receiver = targetId;
      } else {
        payload.receiverRole = 'admin';
      }

      const msg = await fetchWithAuth('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setMessages([...messages, msg]);
      setNewMessage('');
      setAttachments([]);
    } catch (e: any) {
      alert(e.message || 'Failed to send message');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed bottom-6 right-6 z-[300] w-full max-w-[400px] h-[600px] bg-bg-primary border border-border-base rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-border-subtle bg-bg-muted/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600 font-black">
                {targetName.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-black text-fg-primary uppercase tracking-tight">{targetName}</h3>
                <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest flex items-center mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Secure Connection
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-bg-muted rounded-full transition-colors">
              <X className="h-5 w-5 text-fg-muted" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[url('/grid.svg')] bg-[length:20px_20px] bg-opacity-5">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <MessageSquare className="h-10 w-10 text-fg-dim" />
                <p className="text-[10px] font-black uppercase tracking-widest italic">Start communication...</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = typeof msg.sender === 'object' ? msg.sender?._id === user?._id : msg.sender === user?._id;
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] space-y-1.5`}>
                      <div className={`p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-bg-muted text-fg-primary border border-border-base rounded-tl-none'}`}>
                        {msg.content}
                        {msg.attachments?.map((file: any, idx: number) => (
                           <div key={idx} className="mt-2">
                             {file.fileType?.startsWith('image/') ? (
                               <img src={file.url} className="rounded-lg max-h-40 w-full object-cover cursor-pointer" onClick={() => window.open(file.url, '_blank')} />
                             ) : (
                               <a href={file.url} target="_blank" className={`flex items-center gap-2 p-2 rounded-lg border ${isMe ? 'bg-white/10 border-white/20' : 'bg-blue-600/5 border-blue-500/20'}`}>
                                 <Info className="h-3 w-3" />
                                 <span className="text-[9px] truncate">{file.filename}</span>
                               </a>
                             )}
                           </div>
                        ))}
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <Clock className="h-2.5 w-2.5 text-fg-muted" />
                        <span className="text-[8px] font-black text-fg-muted uppercase">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef}></div>
          </div>

          {/* Footer - Read Only Logic */}
          <div className="p-6 border-t border-border-subtle bg-bg-surface">
            {isReadOnly ? (
              <div className="flex items-center gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-[9px] font-black text-yellow-700 uppercase tracking-widest">Job completed. Conversation is read-only.</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="relative p-2 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center gap-2">
                        <span className="text-[8px] font-black truncate max-w-[60px] uppercase">{file.filename}</span>
                        <X className="h-2 w-2 cursor-pointer" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} />
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-3 bg-bg-muted hover:bg-bg-hover rounded-xl transition-all">
                    {uploading ? <Activity className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4 text-fg-dim" />}
                  </button>
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full bg-bg-muted border border-border-base rounded-xl py-3 px-4 pr-12 text-[11px] font-bold outline-none focus:border-blue-600 transition-all"
                    />
                    <button type="submit" disabled={!newMessage.trim() && attachments.length === 0} className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-50">
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            )}
            <div className="mt-4 flex items-center justify-center gap-4 text-[8px] font-black text-fg-muted uppercase tracking-widest">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-green-500" /> Encrypted</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" /> Instant</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomerChatPanel;
