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
  X, UserPlus
} from 'lucide-react';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Customer search state
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);

  const loadData = async () => {
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
      
<<<<<<< HEAD
      // Map summaries to a unified participant list
      const unified = (chatSummaries || []).map((s: any) => ({
        ...s.userInfo,
        _id: s._id,
        lastActivity: s.lastMessage?.createdAt || 0,
        unreadCount: s.unreadCount || 0,
        lastMessage: s.lastMessage?.content || ''
      }));
      setParticipants(unified);
=======
      // Map summaries to a unified participant list, merge with unique senders
      const unified = chatSummaries.map((s: any) => {
         uniqueSenders.delete(s._id);
         return {
           ...s.userInfo,
           _id: s._id,
           lastActivity: s.lastMessage?.createdAt || 0,
           unreadCount: s.unreadCount || 0,
           lastMessage: s.lastMessage?.content || ''
         };
      });
      
      setParticipants([...unified, ...Array.from(uniqueSenders.values())]);
>>>>>>> d58e89f (feat: admin chat and billing UI updates for parity and quotations)
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-select participant from ?userId= query param
  useEffect(() => {
    const targetUserId = searchParams.get('userId');
    if (targetUserId && participants.length > 0) {
      const match = participants.find((p: any) => p._id === targetUserId);
      if (match) {
        selectParticipant(match);
      } else {
        fetchWithAuth(`/admin/users/${targetUserId}`)
          .then((userData: any) => {
            if (userData) {
              const syntheticParticipant = {
                ...userData,
                lastActivity: 0,
                unreadCount: 0,
                lastMessage: ''
              };
              setParticipants(prev => [syntheticParticipant, ...prev]);
              selectParticipant(syntheticParticipant);
            }
          })
          .catch(console.error);
      }
    }
  }, [searchParams, participants.length]);

  useEffect(() => {
    if (socket) {
      socket.on(`message:${user?._id}`, (msg: any) => {
        setMessages(prev => [...prev, msg]);
        loadData();
      });
      socket.on(`message_role:admin`, (msg: any) => {
        setMessages(prev => [...prev, msg]);
        loadData();
      });
    }
    return () => {
      if (socket) {
        socket.off(`message:${user?._id}`);
        socket.off('message_role:admin');
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
    } catch (e) {
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
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const selectParticipant = async (participant: any) => {
    setSelectedUser(participant);
    try {
      await fetchWithAuth(`/chat/read/${participant._id}`, { method: 'PATCH' });
      loadData();
    } catch (e) {
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
    } catch (e) { alert('Failed to send message. Please try again.'); }
  };

  const [roleFilter, setRoleFilter] = useState<'all'|'technician'|'customer'>('all');

  const filteredMessages = selectedUser 
    ? messages.filter(m => {
        const senderId = typeof m.sender === 'object' ? m.sender?._id : m.sender;
        const receiverId = typeof m.receiver === 'object' ? m.receiver?._id : m.receiver;
        
        return (senderId === selectedUser._id && receiverId === user?._id) ||
               (senderId === user?._id && receiverId === selectedUser._id) ||
               (senderId === selectedUser._id && m.receiverRole === 'admin') ||
               (senderId === user?._id && receiverId === null && m.receiverRole === 'customer');
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
      <main className="flex-1 lg:ml-80 flex flex-col h-screen relative bg-bg-muted/10 w-full overflow-hidden">
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
<<<<<<< HEAD
              <div className="p-4 space-y-3">
                {/* Search existing contacts */}
                <div className="relative group">
                   <Search className="absolute top-3.5 left-4 h-4 w-4 text-fg-dim group-focus-within:text-blue-500 transition-colors" />
                   <input 
                      type="text" 
                      placeholder="Search contacts..." 
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-bg-muted border border-border-base rounded-2xl p-3 pl-12 text-[10px] font-black uppercase outline-none focus:border-blue-600 transition-all text-fg-primary"
                   />
                </div>
                {/* New Customer Conversation Button */}
                <button
                  onClick={() => setShowCustomerSearch(v => !v)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${showCustomerSearch ? 'bg-blue-600 text-white border-blue-600' : 'bg-bg-muted border-border-base text-fg-muted hover:text-blue-500 hover:border-blue-500/30'}`}
                >
                  <UserPlus className="h-4 w-4" />
                  Message a Customer
                </button>

                {/* Customer search dropdown */}
                {showCustomerSearch && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute top-3.5 left-4 h-4 w-4 text-fg-dim" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search customer name or phone..."
                        value={customerQuery}
                        onChange={e => handleCustomerSearch(e.target.value)}
                        className="w-full bg-bg-muted border border-blue-500/30 rounded-2xl p-3 pl-12 text-[10px] font-black uppercase outline-none focus:border-blue-600 transition-all text-fg-primary"
                      />
                    </div>
                    {customerSearching && (
                      <p className="text-[9px] font-black text-fg-muted uppercase tracking-widest px-2">Searching...</p>
                    )}
                    {customerResults.length > 0 && (
                      <div className="bg-bg-surface border border-border-base rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                        {customerResults.map((c: any) => (
                          <button
                            key={c._id}
                            onClick={() => startConversationWith(c)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-bg-muted transition-all text-left border-b border-border-base last:border-b-0"
                          >
                            <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center font-black text-emerald-600 text-xs">
                              {c.name?.[0]}
                            </div>
                            <div>
                              <p className="text-xs font-black text-fg-primary">{c.name}</p>
                              <p className="text-[9px] text-fg-muted">{c.phone || c.email}</p>
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
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-hide">
                 {loading ? (
                   <div className="flex justify-center py-10">
                     <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                   </div>
                 ) : (
                   participants
                     .filter((p: any) => !searchFilter || p.name?.toLowerCase().includes(searchFilter.toLowerCase()))
                     .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
                     .map((participant) => (
                     <button 
                        key={participant._id}
                        onClick={() => selectParticipant(participant)}
                        className={`w-full p-4 rounded-[2rem] flex items-center space-x-3 transition-all group ${selectedUser?._id === participant._id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'hover:bg-bg-muted text-fg-primary'}`}
                     >
                        <div className="relative shrink-0">
                           <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm ${selectedUser?._id === participant._id ? 'bg-white/20' : 'bg-bg-hover text-blue-500 border border-border-subtle group-hover:bg-blue-600 group-hover:text-white transition-all'}`}>
                              {participant.name?.[0]}
                           </div>
                           <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-bg-primary rounded-full ${participant.availabilityStatus === 'online' ? 'bg-green-500' : 'bg-fg-dim'}`} />
                        </div>
                        <div className="flex-1 text-left overflow-hidden">
                           <div className="flex items-center justify-between gap-1">
                             <p className="text-[11px] font-black uppercase tracking-tight truncate">{participant.name}</p>
                             <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${selectedUser?._id === participant._id ? 'bg-white/20 border-white/20 text-white' : roleColor(participant.role)} uppercase shrink-0`}>{participant.role}</span>
                           </div>
                           <p className={`text-[9px] font-bold truncate ${selectedUser?._id === participant._id ? 'text-white/60' : 'text-fg-muted'}`}>
                             {participant.lastMessage || 'Start a conversation'}
                           </p>
                        </div>
                        {participant.unreadCount > 0 && selectedUser?._id !== participant._id && (
                           <div className="bg-red-500 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/40 shrink-0">
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
=======
              <div className="p-6 pb-2">
               <div className="relative group mb-4">
                  <Search className="absolute top-4 left-5 h-4 w-4 text-fg-dim group-focus-within:text-blue-500 transition-colors" />
                  <input 
                     type="text" 
                     placeholder="Filter contacts..." 
                     value={searchFilter}
                     onChange={(e) => setSearchFilter(e.target.value)}
                     className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 pl-14 text-[10px] font-black uppercase outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all text-fg-primary"
                  />
               </div>
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
            </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                 {participants
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
                       <div className="relative">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${selectedUser?._id === participant._id ? 'bg-white/20' : 'bg-bg-hover text-blue-500 border border-border-subtle group-hover:bg-blue-600 group-hover:text-white transition-all'}`}>
                             {participant.name?.[0]}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-4 border-bg-primary rounded-full ${participant.availabilityStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]' : 'bg-fg-dim'}`}></div>
                       </div>
                       <div className="flex-1 text-left overflow-hidden">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-black uppercase tracking-tight truncate">{participant.name}</p>
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${selectedUser?._id === participant._id ? 'bg-white/20 border-white/20' : 'bg-blue-600/10 border-blue-500/20 text-blue-500'} uppercase`}>{participant.role}</span>
                          </div>
                          <p className={`text-[9px] font-bold uppercase tracking-widest truncate ${selectedUser?._id === participant._id ? 'text-white/60' : 'text-fg-muted'}`}>{participant.lastMessage || (participant.availabilityStatus === 'online' ? 'Signal Active' : 'Offline')}</p>
                       </div>
                       {participant.unreadCount > 0 && selectedUser?._id !== participant._id && (
                          <div className="bg-red-500 text-white text-[8px] font-black w-6 h-6 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/40">
                             {participant.unreadCount}
                          </div>
                       )}
                    </button>
                 ))}
>>>>>>> d58e89f (feat: admin chat and billing UI updates for parity and quotations)
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
                             <div className="flex-1 relative">
                                <input 
                                   type="text" 
                                   value={newMessage}
                                   onChange={(e) => setNewMessage(e.target.value)}
                                   placeholder={uploading ? "Uploading file..." : `Reply to ${selectedUser.name}...`}
                                   className="w-full bg-bg-muted border border-border-base rounded-[2rem] p-5 pr-16 text-xs font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all text-fg-primary"
                                />
                                <button 
                                  type="submit" 
                                  disabled={(!newMessage.trim() && attachments.length === 0) || uploading}
                                  className="absolute top-2 right-2 p-4 bg-blue-600 text-white rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                                >
                                   <Send className="h-4 w-4" />
                                </button>
                             </div>
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
