import React, { useState } from 'react';
import { Shield, Clock, Camera, MapPin, CheckCircle2, Wrench, AlertTriangle, Play, FileText, Send, PenTool, Mic, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const mockServiceJobs = [
  {
    id: 'SR-2026-904',
    serviceType: 'Warranty Service',
    product: 'Pro Series 4K Camera',
    issueCategory: 'Camera Fault',
    description: 'Camera feed is flickering during night mode.',
    customerName: 'Aarav Patel',
    address: '123 Smart Ave, Mumbai',
    status: 'assigned',
    createdAt: new Date().toISOString()
  },
  {
    id: 'SR-2026-905',
    serviceType: 'AMC Visit',
    product: '8-Channel NVR',
    issueCategory: 'Routine Checkup',
    description: 'Quarterly maintenance.',
    customerName: 'Tech Innovators Inc.',
    address: 'Bandra West, Mumbai',
    status: 'in_progress',
    createdAt: new Date().toISOString()
  }
];

export const TechnicianServiceFlow = () => {
  const [activeTab, setActiveTab] = useState('assigned');
  const [jobs, setJobs] = useState<any[]>(mockServiceJobs);
  const [activeJob, setActiveJob] = useState<any | null>(null);

  // Flow State
  const [step, setStep] = useState(1); 
  const [needParts, setNeedParts] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // In real app, this blob would be uploaded to /api/upload
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Microphone access is required to record voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  const updateJobStatus = (newStatus: string) => {
    if (!activeJob) return;
    const updated = { ...activeJob, status: newStatus };
    setJobs(jobs.map(j => j.id === activeJob.id ? updated : j));
    setActiveJob(updated);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'accept':
        updateJobStatus('accepted');
        setStep(2);
        break;
      case 'arrived':
        updateJobStatus('in_progress');
        setStep(3);
        break;
      case 'submit_inspection':
        if (needParts) {
          updateJobStatus('waiting_parts');
          setStep(4);
        } else {
          setStep(5);
        }
        break;
      case 'complete_repair':
        updateJobStatus('completed');
        setStep(6);
        break;
    }
  };

  const filteredJobs = jobs.filter(j => {
    if (activeTab === 'assigned') return ['assigned', 'accepted'].includes(j.status);
    if (activeTab === 'progress') return j.status === 'in_progress';
    if (activeTab === 'parts') return j.status === 'waiting_parts';
    if (activeTab === 'completed') return j.status === 'completed';
    return true;
  });

  if (activeJob) {
    return (
      <div className="bg-bg-surface border border-border-base rounded-[2.5rem] p-4 sm:p-6 lg:p-12 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-6 border-b border-border-base pb-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">{activeJob.serviceType}</span>
              <span className="font-mono text-xs font-black text-fg-muted">{activeJob.id}</span>
            </div>
            <h3 className="text-2xl font-black text-fg-primary uppercase">{activeJob.customerName}</h3>
            <p className="text-sm font-bold text-fg-muted flex items-center gap-2 mt-2">
              <MapPin className="h-4 w-4 text-red-500" /> {activeJob.address}
            </p>
          </div>
          <button onClick={() => setActiveJob(null)} className="px-6 py-3 bg-bg-muted text-fg-primary border border-border-base rounded-xl text-xs font-black uppercase tracking-widest hover:bg-bg-hover transition-all">
            Back to List
          </button>
        </div>

        {/* Workflow Action Terminal */}
        <div className="max-w-3xl mx-auto space-y-12">
          
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-8">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-fg-primary uppercase">New Service Request</h4>
                <p className="text-fg-muted font-medium mt-2">Issue: {activeJob.description}</p>
              </div>
              <div className="flex gap-4 max-w-md mx-auto">
                <button onClick={() => handleAction('accept')} className="flex-1 py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-blue-700">Accept</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-8">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <MapPin className="h-10 w-10 animate-bounce" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-fg-primary uppercase">Navigate to Client</h4>
                <p className="text-fg-muted font-medium mt-2">Open map and proceed to destination.</p>
              </div>
              <button onClick={() => handleAction('arrived')} className="w-full max-w-md mx-auto py-4 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 block">Report Arrival</button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h4 className="text-2xl font-black text-fg-primary uppercase">Site Inspection</h4>
                <p className="text-fg-muted font-medium mt-2">Diagnose the issue and determine if spare parts are required.</p>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest block mb-2">Inspection Notes / Fault Found</label>
                  <textarea 
                    value={inspectionNotes}
                    onChange={e => setInspectionNotes(e.target.value)}
                    className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm outline-none focus:border-blue-600 font-bold text-fg-primary resize-none h-32"
                    placeholder="Enter diagnostic details..."
                  />
                </div>
                
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                  <input type="checkbox" id="needParts" checked={needParts} onChange={e => setNeedParts(e.target.checked)} className="w-5 h-5 accent-orange-500 cursor-pointer" />
                  <label htmlFor="needParts" className="text-sm font-black text-orange-400 cursor-pointer uppercase tracking-widest">Spare Parts Required</label>
                </div>

                {needParts && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest block mb-2">Requested Parts List</label>
                    <input type="text" className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm outline-none focus:border-orange-600 font-bold text-fg-primary" placeholder="e.g. 1x SMPS 12V 10A, 2x BNC Connectors" />
                  </div>
                )}
              </div>
              
              <button onClick={() => handleAction('submit_inspection')} className="w-full py-5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-blue-700">Submit Inspection</button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-8">
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto text-orange-500 animate-pulse">
                <Clock className="h-10 w-10" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-fg-primary uppercase text-orange-500">Waiting for Parts</h4>
                <p className="text-fg-muted font-medium mt-2">The request for spare parts has been sent to Admin. You will be reassigned once parts are ready.</p>
              </div>
              <button onClick={() => setActiveJob(null)} className="w-full max-w-md mx-auto py-4 border border-border-base rounded-xl text-xs font-black uppercase tracking-widest hover:bg-bg-muted block">Return to Dashboard</button>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h4 className="text-2xl font-black text-fg-primary uppercase">Execute Repair & Complete</h4>
                <p className="text-fg-muted font-medium mt-2">Upload completion evidence and obtain customer signature.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-2 border-dashed border-border-strong rounded-2xl p-8 text-center hover:bg-bg-muted cursor-pointer transition-colors">
                  <Camera className="h-8 w-8 text-fg-muted mx-auto mb-2" />
                  <p className="text-sm font-bold text-fg-primary">Upload After Photos</p>
                </div>
                <div className="border-2 border-dashed border-border-strong rounded-2xl p-8 text-center hover:bg-bg-muted cursor-pointer transition-colors">
                  <PenTool className="h-8 w-8 text-fg-muted mx-auto mb-2" />
                  <p className="text-sm font-bold text-fg-primary">Customer Signature</p>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest block mb-2">Final Work Report / Notes</label>
                <textarea 
                  value={reportNotes}
                  onChange={e => setReportNotes(e.target.value)}
                  className="premium-textarea w-full min-h-[100px]"
                  placeholder="Detail the work completed, parts replaced, and any final notes for Admin..."
                />
              </div>

              <div className="space-y-2 text-left bg-bg-muted/30 p-4 rounded-2xl border border-border-base">
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest block mb-2">Voice Note (Optional)</label>
                <div className="flex items-center gap-4">
                  {!isRecording ? (
                    <button type="button" onClick={startRecording} className="voice-record-btn idle flex-1">
                      <Mic className="h-4 w-4" /> Start Recording
                    </button>
                  ) : (
                    <button type="button" onClick={stopRecording} className="voice-record-btn recording flex-1">
                      <Square className="h-4 w-4 fill-current" /> Stop Recording
                    </button>
                  )}
                  {audioUrl && !isRecording && (
                    <audio src={audioUrl} controls className="flex-1 h-[40px] rounded-lg" />
                  )}
                </div>
              </div>

              <button onClick={() => handleAction('complete_repair')} className="w-full py-5 bg-green-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-green-700">Submit Report & Mark Completed</button>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h4 className="text-3xl font-black text-fg-primary uppercase tracking-tighter">Service Completed</h4>
              <button onClick={() => setActiveJob(null)} className="w-full max-w-md mx-auto py-4 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 block">Back to Grid</button>
            </motion.div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex bg-bg-muted rounded-2xl p-1.5 border border-border-base shadow-sm overflow-x-auto max-w-full scrollbar-hide">
        {[
          { id: 'assigned', label: 'New & Accepted' },
          { id: 'progress', label: 'In Progress' },
          { id: 'parts', label: 'Waiting Parts' },
          { id: 'completed', label: 'Completed' }
        ].map((f) => (
          <button 
            key={f.id}
            onClick={() => setActiveTab(f.id)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === f.id ? 'bg-blue-600 text-white shadow-lg' : 'text-fg-muted hover:text-fg-primary'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map(job => (
          <div key={job.id} onClick={() => { setActiveJob(job); setStep(job.status === 'assigned' ? 1 : job.status === 'in_progress' ? 3 : job.status === 'waiting_parts' ? 4 : job.status === 'completed' ? 6 : 1); }} className="bg-bg-surface border border-border-base rounded-3xl p-4 sm:p-6 hover:border-blue-500/50 cursor-pointer transition-all shadow-sm hover:shadow-xl group flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${job.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                {job.status.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-fg-muted font-bold">{new Date(job.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight mb-2">{job.customerName}</h3>
            <p className="text-xs text-fg-muted font-bold flex items-center gap-1.5 mb-4">
              <MapPin className="h-3 w-3 text-red-500" /> {job.address}
            </p>
            <div className="mt-auto pt-4 border-t border-border-base flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-muted">{job.product}</span>
              <Play className="h-4 w-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
        {filteredJobs.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border-base rounded-3xl">
            <p className="text-fg-muted font-black uppercase tracking-widest text-xs">No tasks in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};
