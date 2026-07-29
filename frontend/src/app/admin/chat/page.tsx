"use client";
import React, { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { fetchWithAuth, API_URL } from '@/utils/api';
import { useSearchParams } from 'next/navigation';
import { 
  MessageSquare, User, Send, Search, 
  Clock, CheckCircle, ChevronLeft,
  Users, Activity, Paperclip, MoreVertical, Menu, Shield,
  X, UserPlus, Mic
} from 'lucide-react';
import { AudioRecorder } from '@/components/common/AudioRecorder';
import { uploadFile } from '@/utils/uploadHelper';

const AdminChat = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const searchParams = useSearchParams();
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Customer search state
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);

  const loadData = async (initialUserId?: string) => {
    try {
      const [allMessages, chatSummaries] = await Promise.all([
        fetchWithAuth('/chat'),
        fetchWithAuth('/chat/summary')
      ]);
      setMessages((allMessages || []).reverse());
      setSummaries(chatSummaries || []);
      // Build unique participants from all messages as a fallback
      const uniqueSenders = new Map();
      allMessages.forEach((msg: any) => {
         const otherUser = msg.sender?._id === user?._id ? msg.receiver : msg.sender;
         if (otherUser && typeof otherUser === 'object' && otherUser._id) {
            if (!uniqueSenders.has(otherUser._id)) {
               uniqueSenders.set(otherUser._id, {
                  ...otherUser,
                  lastActivity: msg.createdAt,
                  unreadCount: 0,
                  lastMessage: msg.content
               });
            }
         }
      });
      
      // Map summaries to a unified participant list, merge with unique senders
      const unified = (chatSummaries || []).map((s: any) => {
         uniqueSenders.delete(s._id);
         return {
           ...s.userInfo,
           _id: s._id,
           lastActivity: s.lastMessage?.createdAt || 0,
           unreadCount: s.unreadCount || 0,
           lastMessage: s.lastMessage?.content || ''
         };
      });
      
      const fullParticipantList = [...unified, ...Array.from(uniqueSenders.values())];
      setParticipants(fullParticipantList);
      
      if (initialUserId) {
         const found = fullParticipantList.find(p => p._id === initialUserId);
         if (found) {
             setSelectedUser(found);
         } else {
             // Fetch that specific user profile if not in history
             try {
                 const res = await fetchWithAuth(`/admin/users/${initialUserId}`);
                 if (res) {
                     const newUser = {
                         ...res,
                         lastActivity: Date.now(),
                         unreadCount: 0,
                         lastMessage: 'New Conversation'
                     };
                     setParticipants(prev => [newUser, ...prev]);
                     setSelectedUser(newUser);
                 }
             } catch (err: any) {
                 console.error("Could not fetch initial user profile for chat", err);
             }
         }
      }
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const startWithId = searchParams?.get('startWith') || searchParams?.get('userId');
    loadData(startWithId || undefined);
    
    // Set up polling for new messages
    const interval = setInterval(() => loadData(startWithId || undefined), 10000);
    return () => clearInterval(interval);
  }, [searchParams]);

  useEffect(() => {
    if (socket && user?._id) {
      const handleNewMessage = (msg: any) => {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        loadData();
      };
      
      socket.on(`message:${user._id}`, handleNewMessage);
      socket.on(`message_role:admin`, handleNewMessage);
      socket.on(`message_role:sub-admin`, handleNewMessage);
    }
    return () => {
      if (socket && user?._id) {
        socket.off(`message:${user._id}`);
        socket.off('message_role:admin');
        socket.off('message_role:sub-admin');
      }
    };
  }, [socket, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  // Search for customers to start a new conversation
  const handleCustomerSearch = async (query: string) => {
    setCustomerQuery(query);
    if (query.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    setCustomerSearching(true);
    try {
      const data = await fetchWithAuth(`/admin/users?role=customer&search=${encodeURIComponent(query)}`);
      setCustomerResults(data || []);
    } catch (e: any) {
      console.error(e);
      setCustomerResults([]);
    } finally {
      setCustomerSearching(false);
    }
  };

  const startConversationWith = (customer: any) => {
    const exists = participants.find((p: any) => p._id === customer._id);
    if (!exists) {
      setParticipants(prev => [{
        ...customer,
        lastActivity: 0,
        unreadCount: 0,
        lastMessage: ''
      }, ...prev]);
    }
    selectParticipant(customer);
    setShowCustomerSearch(false);
    setCustomerQuery('');
    setCustomerResults([]);
  };

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
            body: formData
        });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();

      const newAttachments = (data.imageUrls || []).map((url: string, index: number) => ({
        url,
        filename: files[index]?.name || `file_${index + 1}`,
        fileType: files[index]?.type || 'application/octet-stream'
      }));

      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (error: any) {
      console.error("Upload Error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const selectParticipant = async (participant: any) => {
    setSelectedUser(participant);
    // Optimistic UI update: clear unread count locally immediately
    setParticipants(prev => prev.map(p => p._id === participant._id ? { ...p, unreadCount: 0 } : p));
    
    try {
      await fetchWithAuth(`/chat/read/${participant._id}`, { method: 'PATCH' });
      loadData();
    } catch (e: any) {
      console.error("Mark as read error:", e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || !selectedUser) return;
    try {
      const msg = await fetchWithAuth('/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          receiver: selectedUser._id, 
          content: newMessage || (attachments.length > 0 ? "📎 Attachment" : ""),
          attachments: attachments
        })
      });
      setMessages([...messages, msg]);
      setNewMessage('');
      setAttachments([]);
      loadData();
    } catch (e: any) { alert('Failed to send message. Please try again.'); }
  };

  const handleVoiceNoteSubmit = async (blob: Blob) => {
    if (!selectedUser) return;
    setUploading(true);
    try {
      const voiceUrl = await uploadFile(blob, `voice_${Date.now()}.webm`);
      if (voiceUrl) {
        const msg = await fetchWithAuth('/chat', {
          method: 'POST',
          body: JSON.stringify({ 
            receiver: selectedUser._id, 
            content: "🎤 Voice Note",
            attachments: [{ url: voiceUrl, filename: "Voice Note", fileType: "audio/webm" }]
          })
        });
        setMessages([...messages, msg]);
        loadData();
      }
    } catch (e) {
      console.error(e);
      alert('Failed to send voice note.');
    } finally {
      setUploading(false);
      setShowRecorder(false);
    }
  };

  const [roleFilter, setRoleFilter] = useState<'all'|'technician'|'customer'>('all');

  const filteredMessages = selectedUser 
    ? messages.filter(m => {
        const senderId = typeof m.sender === 'object' ? m.sender?._id : m.sender;
        const receiverId = typeof m.receiver === 'object' ? m.receiver?._id : m.receiver;
        
        if (user?.role === 'admin' || user?.role === 'sub-admin') {
          return senderId === selectedUser._id || 
                 receiverId === selectedUser._id || 
                 (senderId === user?._id && !receiverId && m.receiverRole === selectedUser.role);
        }
        
        return (senderId === selectedUser._id && receiverId === user?._id) ||
               (senderId === user?._id && receiverId === selectedUser._id) ||
               (senderId === selectedUser._id && m.receiverRole === user?.role) ||
               (senderId === user?._id && !receiverId && m.receiverRole === selectedUser.role);
      }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const roleColor = (role: string) => {
    if (role === 'customer') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
    if (role === 'technician') return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
    return 'bg-purple-500/10 border-purple-500/20 text-purple-500';
  };

  return (
    <div className="flex h-screen bg-background transition-all duration-300 overflow-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 min-w-0 lg:ml-[280px] flex flex-col h-screen relative bg-bg-muted/10 overflow-hidden">
        {/* Hidden File Input */}
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept="image/*,.pdf,.doc,.docx"
        />

        {/* Header */}
        <div className="p-6 border-b border-border-base bg-bg-primary flex items-center justify-between shadow-sm z-10 shrink-0">
           <div className="flex items-center space-x-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-bg-muted border border-border-base rounded-xl">
                 <Menu className="h-5 w-5 text-fg-primary" />
              </button>
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                 <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-fg-primary uppercase tracking-tight">Support <span className="text-blue-500">Chat</span></h2>
                 <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] mt-0.5">Admin Communication Hub</p>
              </div>
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
           {/* Contacts List */}
           <div className="w-96 border-r border-border-base bg-bg-primary flex flex-col">
              <div className="p-6 pb-2 space-y-4">
                {/* Search existing contacts */}
                <div className="relative group">
                   <Search className="absolute top-4 left-5 h-4 w-4 text-fg-dim group-focus-within:text-blue-500 transition-colors" />
                   <input 
                      type="text" 
                      placeholder="Search contacts..." 
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-bg-muted border border-border-base rounded-2xl py- pr- pl- text-[10px] font-black uppercase outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all text-fg-primary"
                   />
                </div>
                
                {/* Role Filters */}
                <div className="flex items-center gap-2 bg-bg-muted/50 p-1.5 rounded-xl border border-border-base">
                   {(['all', 'technician', 'customer'] as const).map(role => (
                      <button
                         key={role}
                         onClick={() => setRoleFilter(role)}
                         className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${roleFilter === role ? 'bg-blue-600 text-white shadow-md' : 'text-fg-muted hover:text-fg-primary'}`}
                      >
                         {role}
                      </button>
                   ))}
                </div>

                {/* New Customer Conversation Button */}
                <button
                  onClick={() => setShowCustomerSearch(v => !v)}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${showCustomerSearch ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20' : 'bg-bg-muted border-border-base text-fg-primary hover:border-blue-500/30 hover:bg-bg-surface'}`}
                >
                  <UserPlus className="h-4 w-4" />
                  Message a Customer
                </button>

                {/* Customer search dropdown */}
                {showCustomerSearch && (
                  <div className="space-y-2 relative z-20">
                    <div className="relative">
                      <Search className="absolute top-4 left-4 h-4 w-4 text-fg-dim" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search customer name or phone..."
                        value={customerQuery}
                        onChange={e => handleCustomerSearch(e.target.value)}
                        className="w-full bg-bg-surface border border-blue-500/50 rounded-2xl py- pr- pl- text-[10px] font-black uppercase outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all text-fg-primary shadow-lg"
                      />
                    </div>
                    {customerSearching && (
                      <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest px-2">Searching...</p>
                    )}
                    {customerResults.length > 0 && (
                      <div className="bg-bg-surface border border-border-base rounded-2xl overflow-hidden max-h-48 overflow-y-auto shadow-2xl absolute w-full z-50">
                        {customerResults.map((c: any) => (
                          <button
                            key={c._id}
                            onClick={() => startConversationWith(c)}
                            className="w-full flex items-center gap-3 p-4 hover:bg-bg-muted transition-all text-left border-b border-border-base last:border-b-0"
                          >
                            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center font-black text-blue-600 text-sm">
                              {c.name?.[0]}
                            </div>
                            <div>
                              <p className="text-xs font-black text-fg-primary">{c.name}</p>
                              <p className="text-[9px] text-fg-muted font-bold tracking-widest">{c.phone || c.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {!customerSearching && customerQuery.length >= 2 && customerResults.length === 0 && (
                      <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest px-2">No customers found.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Contacts */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                 {loading ? (
                   <div className="flex justify-center py-10">
                     <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                   </div>
                 ) : (
                   participants
                     .filter((p: any) => {
                        if (searchFilter && !p.name?.toLowerCase().includes(searchFilter.toLowerCase())) return false;
                        if (roleFilter !== 'all' && p.role !== roleFilter) return false;
                        return true;
                     })
                     .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
                     .map((participant) => (
                     <button 
                        key={participant._id}
                        onClick={() => selectParticipant(participant)}
                        className={`w-full p-5 rounded-[2rem] flex items-center space-x-4 transition-all group ${selectedUser?._id === participant._id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'hover:bg-bg-muted text-fg-primary'}`}
                     >
                        <div className="relative shrink-0">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${selectedUser?._id === participant._id ? 'bg-white/20' : 'bg-bg-hover text-blue-500 border border-border-subtle group-hover:bg-blue-600 group-hover:text-white transition-all'}`}>
                              {participant.name?.[0]}
                           </div>
                           <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-4 border-bg-primary rounded-full ${participant.availabilityStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]' : 'bg-fg-dim'}`}></div>
                        </div>
                        <div className="flex-1 text-left overflow-hidden">
                           <div className="flex items-center justify-between gap-1 mb-1">
                             <p className="text-[11px] font-black uppercase tracking-tight truncate">{participant.name}</p>
                             <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${selectedUser?._id === participant._id ? 'bg-white/20 border-white/20 text-white' : 'bg-blue-600/10 border-blue-500/20 text-blue-500'} uppercase shrink-0`}>{participant.role}</span>
                           </div>
                           <p className={`text-[9px] font-bold uppercase tracking-widest truncate ${selectedUser?._id === participant._id ? 'text-white/60' : 'text-fg-muted'}`}>
                             {participant.lastMessage || (participant.availabilityStatus === 'online' ? 'Signal Active' : 'Start a conversation')}
                           </p>
                        </div>
                        {participant.unreadCount > 0 && selectedUser?._id !== participant._id && (
                           <div className="bg-red-500 text-white text-[8px] font-black w-6 h-6 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/40 shrink-0">
                              {participant.unreadCount}
                           </div>
                        )}
                     </button>
                  ))
                 )}
                 {!loading && participants.length === 0 && (
                   <div className="text-center py-12">
                     <MessageSquare className="h-10 w-10 text-fg-dim opacity-20 mx-auto mb-3" />
                     <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">No conversations yet</p>
                     <p className="text-[9px] text-fg-dim mt-1">Use "Message a Customer" to start</p>
                   </div>
                 )}
              </div>
           </div>

           {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-bg-muted/20 relative overflow-hidden">
              {selectedUser ? (
                 <>
                    {/* Chat Window Header */}
                    <div className="p-5 bg-bg-primary border-b border-border-base flex items-center justify-between shadow-sm shrink-0">
                       <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-bg-muted rounded-xl flex items-center justify-center font-black text-blue-600 text-sm border border-border-subtle">
                             {selectedUser.name?.[0]}
                          </div>
                          <div>
                             <h3 className="text-xs font-black text-fg-primary uppercase tracking-widest">{selectedUser.name}</h3>
                             <div className="flex items-center gap-2 mt-0.5">
                               <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${roleColor(selectedUser.role)}`}>{selectedUser.role}</span>
                               {selectedUser.phone && <span className="text-[9px] text-fg-muted">{selectedUser.phone}</span>}
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                       {filteredMessages.length === 0 && (
                         <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                           <MessageSquare className="h-12 w-12 text-fg-dim opacity-20" />
                           <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest">No messages yet</p>
                           <p className="text-[9px] text-fg-dim">Send a message to start the conversation</p>
                         </div>
                       )}
                       {filteredMessages.map((msg: any, i: number) => {
                          const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                          return (
                             <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className="max-w-[70%] space-y-1.5">
                                   {!isMe && (
                                     <p className="text-[8px] font-black uppercase tracking-widest text-fg-muted px-3">{msg.sender?.name || selectedUser.name}</p>
                                   )}
                                   <div className={`p-5 rounded-[2rem] text-[11px] font-medium leading-relaxed shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-bg-primary border border-border-base text-fg-primary rounded-tl-sm'}`}>
                                      {msg.content}

                                      {/* Render Attachments */}
                                      {msg.attachments && msg.attachments.length > 0 && (
                                          <div className="mt-3 grid grid-cols-1 gap-2">
                                              {msg.attachments.map((file: any, idx: number) => (
                                                  <div key={idx}>
                                                      {file.fileType?.startsWith('image/') ? (
                                                          <img 
                                                              src={file.url} 
                                                              alt={file.filename} 
                                                              className="rounded-2xl w-full max-h-52 object-cover border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                                                              onClick={() => window.open(file.url, '_blank')}
                                                          />
                                                      ) : file.fileType?.startsWith('audio/') ? (
                                                          <audio controls className={`w-full max-w-[200px] h-10 ${isMe ? 'filter invert hue-rotate-180 opacity-90' : 'opacity-80'}`}>
                                                              <source src={file.url} type={file.fileType} />
                                                          </audio>
                                                      ) : (
                                                          <a 
                                                              href={file.url} 
                                                              target="_blank" 
                                                              rel="noreferrer"
                                                              className={`flex items-center space-x-3 p-3 rounded-xl border ${isMe ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-blue-600/5 border-blue-500/20 hover:bg-blue-600/10'} transition-all`}
                                                          >
                                                              <Shield className="h-4 w-4 shrink-0" />
                                                              <span className="text-[10px] font-black uppercase truncate max-w-[150px]">{file.filename}</span>
                                                          </a>
                                                      )}
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                   </div>
                                   <p className={`text-[8px] font-black uppercase tracking-widest text-fg-muted px-3 ${isMe ? 'text-right' : 'text-left'}`}>
                                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </p>
                                </div>
                             </div>
                          );
                       })}
                       <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-bg-primary border-t border-border-base shrink-0">
                       <form onSubmit={handleSendMessage} className="space-y-3">
                          {/* Attachment Previews */}
                          {attachments.length > 0 && (
                              <div className="flex flex-wrap gap-3 px-1 pb-1">
                                  {attachments.map((file, idx) => (
                                      <div key={idx} className="relative group">
                                          {file.fileType?.startsWith('image/') ? (
                                            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-blue-500/20">
                                              <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                                              <button 
                                                type="button"
                                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg"
                                              >×</button>
                                            </div>
                                          ) : (
                                            <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center space-x-2 pr-8">
                                                <Shield className="h-4 w-4 text-blue-500 shrink-0" />
                                                <span className="text-[10px] font-black uppercase truncate max-w-[100px]">{file.filename}</span>
                                                <button 
                                                    type="button"
                                                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg"
                                                >×</button>
                                            </div>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          )}

                          <div className="flex items-center space-x-3">
                             <button 
                               type="button" 
                               onClick={() => fileInputRef.current?.click()}
                               disabled={uploading}
                               className={`p-4 rounded-2xl border transition-all active:scale-95 shrink-0 ${uploading ? 'bg-blue-600/20 border-blue-500/30 text-blue-500' : 'bg-bg-muted border-border-base text-fg-dim hover:text-blue-500 hover:border-blue-500/30'}`}
                               title="Attach file"
                             >
                                {uploading ? <Activity className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                             </button>

                              {showRecorder ? (
                                 <div className="flex-1 ml-2">
                                    <AudioRecorder 
                                      onRecordingComplete={handleVoiceNoteSubmit} 
                                      onCancel={() => setShowRecorder(false)} 
                                    />
                                 </div>
                              ) : (
                                 <div className="flex-1 relative flex items-center">
                                    <input 
                                       type="text" 
                                       value={newMessage}
                                       onChange={(e) => setNewMessage(e.target.value)}
                                       placeholder={uploading ? "Uploading file..." : `Reply to ${selectedUser.name}...`}
                                       className="w-full bg-bg-muted border border-border-base rounded-[2rem] p-5 pr-28 text-xs font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all text-fg-primary"
                                    />
                                    <div className="absolute right-2 flex items-center gap-1">
                                       <button 
                                          type="button"
                                          onClick={() => setShowRecorder(true)}
                                          disabled={uploading}
                                          className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors disabled:opacity-50"
                                          title="Record Voice Note"
                                       >
                                          <Mic className="w-4 h-4" />
                                       </button>
                                       <button 
                                         type="submit" 
                                         disabled={(!newMessage.trim() && attachments.length === 0) || uploading}
                                         className="p-3.5 bg-blue-600 text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center"
                                       >
                                          <Send className="h-4 w-4 ml-0.5" />
                                       </button>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </form>
                     </div>
                 </>
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="p-8 bg-bg-muted rounded-[3rem] border border-border-subtle shadow-xl">
                       <MessageSquare className="h-16 w-16 text-fg-dim opacity-20" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight italic">Select a <span className="text-blue-500">Contact</span></h3>
                       <p className="text-fg-muted font-medium text-sm">Choose a technician or customer from the list, or use "Message a Customer" to start a new private conversation.</p>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
};

const AdminChatPage = () => {
   return (
     <ProtectedRoute allowedRoles={['admin']}>
       <AdminChat />
     </ProtectedRoute>
   );
};

export default AdminChatPage;
