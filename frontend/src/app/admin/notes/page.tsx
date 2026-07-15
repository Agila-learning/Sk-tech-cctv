"use client";
import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { FileText, Mic, Send, Image as ImageIcon, Plus, MessageSquare } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { format } from 'date-fns';

export default function NotesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/notes');
      setNotes(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePostNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await fetchWithAuth('/notes', {
        method: 'POST',
        body: JSON.stringify({ content: newNote, priority: 'Medium' })
      });
      setNewNote('');
      fetchNotes();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <div className="flex min-h-screen bg-bg-body text-fg-primary">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen h-screen overflow-hidden">
          <AdminNavbar onMenuClick={() => setIsSidebarOpen(true)} />
          
          <main className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full h-full">
            <header className="flex items-center space-x-4 mb-6 shrink-0">
              <div className="p-3 bg-emerald-600/10 rounded-2xl">
                <FileText className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tight">Team Notes</h1>
                <p className="text-fg-muted font-medium text-sm">Internal communication, daily reports & voice updates</p>
              </div>
            </header>

            {/* Notes Feed */}
            <div className="flex-1 bg-bg-surface border border-border-base rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loading ? (
                  <p className="text-center text-fg-muted font-bold">Loading notes...</p>
                ) : notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <MessageSquare className="h-16 w-16 mb-4 text-fg-muted" />
                    <p className="font-bold">No notes yet. Start the conversation!</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note._id} className="bg-bg-muted/30 p-5 rounded-2xl border border-border-base/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black text-xs">
                             {note.author?.name?.charAt(0) || 'U'}
                           </div>
                           <div>
                             <p className="font-bold text-sm">{note.author?.name || 'Unknown User'}</p>
                             <p className="text-[10px] uppercase font-bold text-fg-muted">{format(new Date(note.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                           </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${note.priority === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-bg-muted text-fg-secondary'}`}>
                          {note.priority}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{note.content}</p>
                      
                      {note.voiceUrl && (
                        <div className="mt-3 p-3 bg-bg-surface border border-border-base rounded-xl flex items-center gap-4 w-fit">
                          <button className="p-2 bg-emerald-500 text-white rounded-full"><Mic className="h-4 w-4" /></button>
                          <div className="w-32 h-1 bg-border-base rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-1/3 rounded-full"></div>
                          </div>
                          <span className="text-xs font-bold text-fg-muted">0:14</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-bg-surface border-t border-border-base shrink-0">
                <div className="flex items-end gap-3">
                  <div className="flex-1 bg-bg-muted border border-border-base rounded-2xl p-2 flex items-center">
                    <button className="p-3 text-fg-muted hover:text-emerald-500 transition-colors">
                      <Mic className="h-5 w-5" />
                    </button>
                    <button className="p-3 text-fg-muted hover:text-blue-500 transition-colors">
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <textarea 
                      rows={1}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Type a note or daily report..."
                      className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-sm font-medium h-[46px]"
                    />
                  </div>
                  <button 
                    onClick={handlePostNote}
                    disabled={!newNote.trim()}
                    className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
