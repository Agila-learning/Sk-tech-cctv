"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import BackButton from '@/components/common/BackButton';
import { Send, Users, Mic, Image as ImageIcon, CheckCircle, Clock, Square, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

export default function CollaborationWorkspace() {
  const searchParams = useSearchParams();
  const taskId = searchParams?.get('taskId');
  const type = searchParams?.get('type') || 'order';
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState('');
  
  // Media State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (taskId) {
      loadMessages();
      const interval = setInterval(loadMessages, 10000); // Simple polling instead of sockets for now
      return () => clearInterval(interval);
    }
  }, [taskId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await fetchWithAuth(`/task-messages/${taskId}`);
      setMessages(data || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const uploadFile = async (file: File | Blob, filename: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append('images', file, filename);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.imageUrl || data.imageUrls?.[0] || null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async () => {
    if (!newMsg.trim() && !imageFile && !audioBlob) return;
    
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

      await fetchWithAuth('/task-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          type,
          content: newMsg,
          messageType: 'text', // Can be refined
          images: uploadedImageUrl ? [uploadedImageUrl] : [],
          voiceUrl: uploadedVoiceUrl
        })
      });

      setNewMsg('');
      setImageFile(null);
      setAudioBlob(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadMessages();
    } catch (e) {
      alert("Failed to send message");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full h-screen max-h-screen">
      <header className="flex flex-col mb-6 shrink-0 space-y-4">
        <BackButton />
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-600/10 rounded-2xl">
            <Users className="h-8 w-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Team Workspace</h1>
            <p className="text-fg-muted font-medium text-sm">Collaboration & Independent Logs for Task #{taskId?.slice(-6).toUpperCase()}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-bg-surface border border-border-base rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <p className="text-center text-fg-muted font-bold">Loading workspace...</p>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <Users className="h-16 w-16 mb-4 text-fg-muted" />
              <p className="font-bold">No messages yet. Start collaborating!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.author?._id === user?.id;
              return (
                <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMine ? 'bg-indigo-600/10 border border-indigo-600/20' : 'bg-bg-muted/30 border border-border-base/50'} p-4 rounded-2xl`}>
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${isMine ? 'text-indigo-500' : 'text-fg-primary'}`}>
                         {isMine ? 'You' : msg.author?.name}
                       </span>
                       <span className="text-[9px] font-bold text-fg-muted">{format(new Date(msg.createdAt), 'hh:mm a')}</span>
                    </div>
                    {msg.content && <p className="text-sm font-medium leading-relaxed">{msg.content}</p>}
                    
                    {msg.images && msg.images.length > 0 && (
                      <div className="mt-3">
                        {msg.images.map((img: string, idx: number) => (
                          <img key={idx} src={img} alt="Attachment" className="max-w-[200px] rounded-lg border border-border-base" />
                        ))}
                      </div>
                    )}
                    
                    {msg.voiceUrl && (
                      <div className="mt-3 p-3 bg-bg-surface border border-border-base rounded-xl flex items-center gap-4 w-fit">
                        <audio controls src={msg.voiceUrl} className="h-8" />
                      </div>
                    )}

                    {msg.messageType === 'material_request' && (
                      <div className="mt-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" /> Material Request
                        </p>
                        <ul className="space-y-1">
                          {msg.materialRequest?.items.map((item: any, i: number) => (
                            <li key={i} className="text-sm text-fg-primary flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                              <span className={`text-[10px] uppercase font-bold ${item.status === 'approved' ? 'text-green-500' : item.status === 'rejected' ? 'text-red-500' : 'text-fg-muted'}`}>{item.status}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-bg-surface border-t border-border-base shrink-0">
          {(imageFile || audioBlob || isRecording) && (
            <div className="flex gap-4 mb-3 p-2">
              {imageFile && (
                <div className="relative inline-block">
                   <img src={URL.createObjectURL(imageFile)} className="h-16 w-16 object-cover rounded-lg border border-border-base" alt="Preview" />
                   <button onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="h-3 w-3" /></button>
                </div>
              )}
              {isRecording && (
                <div className="flex items-center gap-2 text-red-500 animate-pulse font-bold text-xs bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div> Recording...
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
          
          <div className="flex items-end gap-3">
            <input type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files?.[0]) setImageFile(e.target.files[0]) }} accept="image/*" className="hidden" />
            <div className="flex-1 bg-bg-muted border border-border-base rounded-2xl p-2 flex items-center">
              {isRecording ? (
                <button onClick={stopRecording} className="p-3 text-red-500 hover:text-red-600 transition-colors animate-pulse">
                  <Square className="h-5 w-5 fill-current" />
                </button>
              ) : (
                <button onClick={startRecording} className="p-3 text-fg-muted hover:text-red-500 transition-colors">
                  <Mic className="h-5 w-5" />
                </button>
              )}
              
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-fg-muted hover:text-blue-500 transition-colors">
                <ImageIcon className="h-5 w-5" />
              </button>
              <textarea 
                rows={1}
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type a message or use @ to mention team..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-sm font-medium h-[46px]"
              />
            </div>
            <button 
              onClick={handleSend}
              disabled={(!newMsg.trim() && !imageFile && !audioBlob) || uploading || isRecording}
              className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[56px]"
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
    </div>
  );
}
