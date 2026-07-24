"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or unavailable.");
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleTogglePlayback = () => {
    if (!audioRef.current || !audioBlob) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src) {
        audioRef.current.src = URL.createObjectURL(audioBlob);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-slate-900 rounded-[2rem] p-3 shadow-xl">
      <audio ref={audioRef} className="hidden" />
      
      {!audioBlob ? (
        <>
          <div className="flex-1 flex items-center justify-center gap-3">
             {isRecording ? (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                  <span className="text-white font-mono text-sm tracking-widest">{formatTime(recordingTime)}</span>
                </>
             ) : (
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Ready to record</span>
             )}
          </div>
          
          {isRecording ? (
             <button 
               onClick={stopRecording}
               className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all shadow-lg"
               title="Stop Recording"
             >
                <Square className="w-5 h-5 fill-current" />
             </button>
          ) : (
             <button 
               onClick={startRecording}
               className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-all shadow-lg"
               title="Start Voice Note"
             >
                <Mic className="w-5 h-5" />
             </button>
          )}
        </>
      ) : (
        <>
          <button 
            onClick={() => { setAudioBlob(null); onCancel(); }}
            className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
          >
             <Trash2 className="w-4 h-4" />
          </button>
          
          <div className="flex-1 flex items-center gap-4 bg-slate-800 rounded-full px-4 py-2">
             <button onClick={handleTogglePlayback} className="text-blue-400 hover:text-blue-300 transition-colors">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
             </button>
             <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden relative">
                <div className={`absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300 ${isPlaying ? 'w-full' : 'w-0'}`} />
             </div>
             <span className="text-slate-400 font-mono text-xs">{formatTime(recordingTime)}</span>
          </div>

          <button 
            onClick={() => onRecordingComplete(audioBlob)}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-full transition-all shadow-lg shadow-blue-500/25"
          >
             Send
          </button>
        </>
      )}
    </div>
  );
};
