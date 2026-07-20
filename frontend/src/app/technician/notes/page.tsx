"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FileText, Mic, Send, Image as ImageIcon, MessageSquare, X, Square, Edit, Trash2 } from 'lucide-react';
import { fetchWithAuth, getImageUrl as getMediaUrl } from '@/utils/api';
import { format } from 'date-fns';

export default function TechnicianNotesPage() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  // Edit states
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Media states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/notes');
      setNotes(data || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File | Blob, filename: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append('images', file, filename);

    try {
      const token = localStorage.getItem('sk_auth_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.imageUrl || data.imageUrls?.[0] || null;
    } catch (err: any) {
      console.error(err);
      return null;
    }
  };

  const handlePostNote = async () => {
    if (!newNote.trim() && !imageFile && !audioBlob) return;
    
    setUploading(true);
    try {
      let uploadedImageUrl = '';
      let uploadedVoiceUrl = '';

      if (imageFile) {
        uploadedImageUrl = await uploadFile(imageFile, imageFile.name) || '';
      }
      
      if (audioBlob) {
        uploadedVoiceUrl = await uploadFile(audioBlob, 'voice_note.webm') || '';
      }

      await fetchWithAuth('/notes', {
        method: 'POST',
        body: JSON.stringify({ 
          content: newNote, 
          priority: 'Medium',
          images: uploadedImageUrl ? [uploadedImageUrl] : [],
          voiceUrl: uploadedVoiceUrl
        })
      });
      
      setNewNote('');
      setImageFile(null);
      setAudioBlob(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchNotes();
    } catch (e: any) {
      console.error(e);
      alert("Failed to post note");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateNote = async (id: string) => {
    try {
      await fetchWithAuth(`/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ content: editContent })
      });
      setEditingNoteId(null);
      fetchNotes();
    } catch (err: any) {
      alert("Failed to update note");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await fetchWithAuth(`/notes/${id}`, { method: 'DELETE' });
      fetchNotes();
    } catch (err: any) {
      alert("Failed to delete note");
    }
  };

  return (
      <div className="flex-1 flex flex-col min-h-[100dvh]">
          <main className="flex-1 flex flex-col p-4 md:p-6 max-w-5xl mx-auto w-full h-full pb-20 lg:pb-6">
            <header className="flex items-center space-x-4 mb-6 shrink-0">
              <div className="p-3 bg-emerald-600/10 rounded-2xl">
                <FileText className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">Team Notes</h1>
                <p className="text-fg-muted font-medium text-sm">Internal communication & updates</p>
              </div>
            </header>

            {/* Notes Feed */}
            <div className="flex-1 bg-bg-surface border border-border-base rounded-2xl shadow-sm flex flex-col mb-4">
              <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
                {loading ? (
                  <p className="text-center text-fg-muted font-bold">Loading notes...</p>
                ) : notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <MessageSquare className="h-16 w-16 mb-4 text-fg-muted" />
                    <p className="font-bold">No notes yet. Start the conversation!</p>
                  </div>
                ) : (
                  notes.map((note) => {
                    const canEdit = user?.id === note.author?._id;
                    
                    return (
                    <div key={note._id} className="bg-bg-muted/30 p-4 md:p-5 rounded-2xl border border-border-base/50 relative group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black text-xs">
                             {note.author?.name?.charAt(0) || 'U'}
                           </div>
                           <div>
                             <p className="font-bold text-sm">{note.author?.name || 'Unknown User'}</p>
                             <div className="flex items-center gap-2">
                               <p className="text-[10px] uppercase font-bold text-fg-muted">{format(new Date(note.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                               {note.isEdited && <span className="text-[9px] uppercase font-bold text-fg-dim">(Edited)</span>}
                             </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${note.priority === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-bg-muted text-fg-secondary'}`}>
                            {note.priority}
                          </span>
                          {canEdit && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setEditingNoteId(note._id); setEditContent(note.content); }} className="p-1.5 text-fg-muted hover:text-blue-500 bg-bg-surface rounded-md border border-border-base shadow-sm transition-colors">
                                <Edit className="h-3 w-3" />
                              </button>
                              <button onClick={() => handleDeleteNote(note._id)} className="p-1.5 text-fg-muted hover:text-red-500 bg-bg-surface rounded-md border border-border-base shadow-sm transition-colors">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {editingNoteId === note._id ? (
                        <div className="mb-3 space-y-2">
                          <textarea 
                            value={editContent} 
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-bg-surface border border-border-base rounded-xl p-3 text-sm font-medium focus:border-emerald-500 outline-none resize-none"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingNoteId(null)} className="px-3 py-1.5 text-xs font-bold text-fg-muted bg-bg-surface border border-border-base rounded-lg hover:bg-bg-muted transition-colors">Cancel</button>
                            <button onClick={() => handleUpdateNote(note._id)} className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">Save Changes</button>
                          </div>
                        </div>
                      ) : (
                        note.content && <p className="text-sm font-medium leading-relaxed mb-2 whitespace-pre-wrap">{note.content}</p>
                      )}
                      
                      {note.images && note.images.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {note.images.map((img: string, idx: number) => (
                            <img key={idx} src={getMediaUrl(img)} alt="Note attachment" className="max-w-[200px] max-h-[200px] object-cover rounded-lg border border-border-base" />
                          ))}
                        </div>
                      )}
                      
                      {note.voiceUrl && (
                        <div className="mt-3 p-3 bg-bg-surface border border-border-base rounded-xl flex items-center gap-4 w-fit">
                          <audio controls src={getMediaUrl(note.voiceUrl)} className="h-8 max-w-[250px]" />
                        </div>
                      )}
                    </div>
                  )})
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 md:p-4 bg-bg-surface border-t border-border-base rounded-b-2xl sticky bottom-0">
                {/* Previews */}
                {(imageFile || audioBlob || isRecording) && (
                  <div className="flex gap-4 mb-3 p-2">
                    {imageFile && (
                      <div className="relative inline-block">
                         <img src={URL.createObjectURL(imageFile)} className="h-12 w-12 object-cover rounded-lg border border-border-base" alt="Preview" />
                         <button onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="h-3 w-3" /></button>
                      </div>
                    )}
                    {isRecording && (
                      <div className="flex items-center gap-2 text-red-500 animate-pulse font-bold text-xs bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                        <div className="h-2 w-2 bg-red-500 rounded-full"></div> Recording Audio...
                      </div>
                    )}
                    {audioBlob && !isRecording && (
                      <div className="relative flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-500/20 font-bold text-xs">
                        <Mic className="h-4 w-4" /> Audio Attached
                        <button onClick={() => setAudioBlob(null)} className="ml-2 bg-red-500 text-white rounded-full p-1"><X className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-end gap-2 md:gap-3">
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  <div className="flex-1 bg-bg-muted border border-border-base rounded-2xl p-1 md:p-2 flex items-center">
                    {isRecording ? (
                      <button onClick={stopRecording} className="p-2 md:p-3 text-red-500 hover:text-red-600 transition-colors animate-pulse">
                        <Square className="h-5 w-5 fill-current" />
                      </button>
                    ) : (
                      <button onClick={startRecording} className="p-2 md:p-3 text-fg-muted hover:text-red-500 transition-colors">
                        <Mic className="h-5 w-5" />
                      </button>
                    )}
                    
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 md:p-3 text-fg-muted hover:text-blue-500 transition-colors">
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <textarea 
                      rows={1}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Type a note..."
                      className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 md:py-3 px-2 text-xs md:text-sm font-medium h-[40px] md:h-[46px]"
                    />
                  </div>
                  <button 
                    onClick={handlePostNote}
                    disabled={(!newNote.trim() && !imageFile && !audioBlob) || uploading || isRecording}
                    className="p-3 md:p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px] md:min-w-[56px]"
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

          </main>
      </div>
  );
}
