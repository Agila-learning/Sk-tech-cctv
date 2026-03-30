"use client";
import React, { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { fetchWithAuth, API_URL } from '@/utils/api';
import { 
  MessageSquare, User, Send, Search, 
  Clock, CheckCircle, ChevronLeft,
  Users, Activity, Paperclip, MoreVertical, Menu
} from 'lucide-react';

const AdminChat = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTech, setSelectedTech] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const [techs, allMessages, chatSummaries] = await Promise.all([
        fetchWithAuth('/admin/technicians/status'),
        fetchWithAuth('/chat'),
        fetchWithAuth('/chat/summary')
      ]);
      setTechnicians(techs || []);
      setMessages(allMessages || []);
      setSummaries(chatSummaries || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on(`message:${user?._id}`, (msg: any) => {
        setMessages(prev => [...prev, msg]);
        loadData(); // Refresh summaries for counts
      });
      socket.on(`message_role:admin`, (msg: any) => {
        setMessages(prev => [...prev, msg]);
        loadData(); // Refresh summaries for counts
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
  }, [messages, selectedTech]);

  const selectTechnician = async (tech: any) => {
    setSelectedTech(tech);
    try {
      await fetchWithAuth(`/chat/read/${tech._id}`, { method: 'PATCH' });
      loadData(); // Refresh counts
    } catch (e) {
      console.error("Mark as read error:", e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTech) return;
    try {
      const msg = await fetchWithAuth('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          receiver: selectedTech._id, 
          content: newMessage 
        })
      });
      setMessages([...messages, msg]);
      setNewMessage('');
      loadData(); // Update last message in summary
    } catch (e) { alert('Failed to send'); }
  };


  const filteredMessages = selectedTech 
    ? messages.filter(m => {
        const senderId = typeof m.sender === 'object' ? m.sender?._id : m.sender;
        const receiverId = typeof m.receiver === 'object' ? m.receiver?._id : m.receiver;
        
        return (senderId === selectedTech._id && receiverId === user?._id) ||
               (senderId === user?._id && receiverId === selectedTech._id) ||
               (senderId === selectedTech._id && m.receiverRole === 'admin');
      })
    : [];

  return (
    <div className="flex h-screen bg-background transition-all duration-300 overflow-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:ml-80 flex flex-col h-screen relative bg-bg-muted/10 w-full overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b border-border-base bg-bg-primary flex items-center justify-between shadow-sm z-10 shrink-0">
           <div className="flex items-center space-x-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-bg-muted border border-border-base rounded-xl">
                 <Menu className="h-5 w-5 text-fg-primary" />
              </button>
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                 <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-fg-primary uppercase tracking-tight">Support <span className="text-blue-500">Chat</span></h2>
                 <p className="text-[10px] font-black text-fg-muted uppercase tracking-[0.2em] mt-0.5 italic">Communication with Technicians</p>
              </div>
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
           {/* Tech List */}
           <div className="w-96 border-r border-border-base bg-bg-primary flex flex-col">
              <div className="p-6">
                 <div className="relative group">
                    <Search className="absolute top-4 left-5 h-4 w-4 text-fg-dim group-focus-within:text-blue-500 transition-colors" />
                    <input 
                       type="text" 
                       placeholder="Filter Operatives..." 
                       className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 pl-14 text-[10px] font-black uppercase outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all text-fg-primary"
                    />
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                 {technicians
                   .map(tech => {
                     const summary = summaries.find(s => s._id === tech._id);
                     return { ...tech, lastActivity: summary?.lastMessageAt || 0, unreadCount: summary?.unreadCount || 0 };
                   })
                   .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
                   .map((tech) => (
                    <button 
                       key={tech._id}
                       onClick={() => selectTechnician(tech)}
                       className={`w-full p-5 rounded-[2rem] flex items-center space-x-4 transition-all group ${selectedTech?._id === tech._id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'hover:bg-bg-muted text-fg-primary'}`}
                    >
                       <div className="relative">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${selectedTech?._id === tech._id ? 'bg-white/20' : 'bg-bg-hover text-blue-500 border border-border-subtle group-hover:bg-blue-600 group-hover:text-white transition-all'}`}>
                             {tech.name[0]}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-4 border-bg-primary rounded-full ${tech.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]' : 'bg-fg-dim'}`}></div>
                       </div>
                       <div className="flex-1 text-left overflow-hidden">
                          <p className="text-[11px] font-black uppercase tracking-tight truncate">{tech.name}</p>
                          <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedTech?._id === tech._id ? 'text-white/60' : 'text-fg-muted'}`}>{tech.status === 'online' ? 'Signal Active' : 'Offline'}</p>
                       </div>
                       {tech.unreadCount > 0 && selectedTech?._id !== tech._id && (
                          <div className="bg-red-500 text-white text-[8px] font-black w-6 h-6 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/40">
                             {tech.unreadCount}
                          </div>
                       )}
                    </button>
                 ))}
              </div>
           </div>

           {/* Chat Window */}
           <div className="flex-1 flex flex-col bg-bg-muted/20 relative">
              {selectedTech ? (
                 <>
                    {/* Chat Window Header */}
                    <div className="p-6 bg-bg-primary border-b border-border-base flex items-center justify-between shadow-sm">
                       <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-bg-muted rounded-xl flex items-center justify-center font-black text-blue-600 text-xs border border-border-subtle">
                             {selectedTech.name[0]}
                          </div>
                          <div>
                             <h3 className="text-xs font-black text-fg-primary uppercase tracking-widest">{selectedTech.name}</h3>
                             <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest flex items-center space-x-1">
                                <Activity className="h-3 w-3" />
                                <span>Online</span>
                             </p>
                          </div>
                       </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                       {filteredMessages.map((msg: any, i: number) => {
                          const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                          return (
                             <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] space-y-2`}>
                                   <div className={`p-6 rounded-[2.5rem] text-[11px] font-medium leading-relaxed shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-bg-primary border border-border-base text-fg-primary rounded-tl-none'}`}>
                                      {msg.content}
                                   </div>
                                   <p className={`text-[8px] font-black uppercase tracking-widest text-fg-muted px-4 ${isMe ? 'text-right' : 'text-left'}`}>
                                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </p>
                                </div>
                             </div>
                          );
                       })}
                       <div ref={chatEndRef}></div>
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-8 bg-bg-primary border-t border-border-base shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                       <div className="flex items-center space-x-4">
                          <button type="button" className="p-4 bg-bg-muted text-fg-dim rounded-[1.5rem] border border-border-base hover:text-blue-500 hover:border-blue-500/30 transition-all">
                             <Paperclip className="h-5 w-5" />
                          </button>
                          <div className="flex-1 relative">
                             <input 
                                type="text" 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Transmit message to technician..."
                                className="w-full bg-bg-muted border border-border-base rounded-[2rem] p-5 pr-14 text-xs font-black uppercase outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all text-fg-primary tracking-tight"
                             />
                             <button type="submit" className="absolute top-2 right-2 p-4 bg-blue-600 text-white rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/30">
                                <Send className="h-4 w-4" />
                             </button>
                          </div>
                       </div>
                    </form>
                 </>
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="p-8 bg-bg-muted rounded-[3rem] border border-border-subtle shadow-xl">
                       <MessageSquare className="h-16 w-16 text-fg-dim opacity-20" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight italic">No Operative <span className="text-blue-500">Selected</span></h3>
                       <p className="text-fg-muted font-medium text-sm">Select a technician from the roster to start a secure transmission.</p>
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
