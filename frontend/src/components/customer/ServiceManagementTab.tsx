import React, { useState } from 'react';
import { Shield, Clock, CheckCircle2, AlertCircle, Wrench, Package, Camera, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mocked Service Requests to avoid modifying the DB while satisfying UI requirements
const initialMockRequests = [
  {
    id: 'SR-2026-904',
    serviceType: 'Warranty Service',
    product: 'Pro Series 4K Camera',
    issueCategory: 'Camera Fault',
    description: 'Camera feed is flickering during night mode.',
    address: '123 Smart Ave, Mumbai',
    status: 'Inspection',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    timeline: [
      { status: 'Submitted', date: new Date(Date.now() - 86400000 * 2).toISOString(), by: 'Customer' },
      { status: 'Under Verification', date: new Date(Date.now() - 86400000 * 1.8).toISOString(), by: 'System' },
      { status: 'Technician Assigned', date: new Date(Date.now() - 86400000 * 1).toISOString(), by: 'Admin' },
      { status: 'Inspection', date: new Date(Date.now() - 3600000).toISOString(), by: 'Technician' }
    ]
  }
];

const STAGES = [
  'Submitted',
  'Under Verification',
  'Waiting Approval',
  'Technician Assigned',
  'Technician On the Way',
  'Inspection',
  'Waiting Spare Parts',
  'Repair Started',
  'Testing',
  'Completed',
  'Closed'
];

export const ServiceManagementTab = ({ user }: { user: any }) => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail'>('list');
  const [requests, setRequests] = useState<any[]>(initialMockRequests);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    serviceType: 'Warranty Service (Free)',
    address: user?.address || '',
    product: 'Camera (Bullet/Dome)',
    issueCategory: 'Camera Fault (No Video/Blurry)',
    description: '',
    visitDate: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      const newReq = {
        id: `SR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        ...formData,
        status: 'Submitted',
        createdAt: new Date().toISOString(),
        timeline: [
          { status: 'Submitted', date: new Date().toISOString(), by: user?.name || 'Customer' }
        ]
      };
      setRequests([newReq, ...requests]);
      setSubmitting(false);
      setActiveView('list');
      setFormData({
        serviceType: 'Warranty Service (Free)',
        address: user?.address || '',
        product: 'Camera (Bullet/Dome)',
        issueCategory: 'Camera Fault (No Video/Blurry)',
        description: '',
        visitDate: ''
      });
      alert('Service request created successfully!');
    }, 1200);
  };

  const getStatusColor = (status: string) => {
    if (['Closed', 'Completed'].includes(status)) return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (['Submitted', 'Under Verification'].includes(status)) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    if (status.includes('Waiting')) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-base pb-4">
        <div>
          <h2 className="text-xl font-black text-fg-primary uppercase tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" /> Service & Warranty
          </h2>
          <p className="text-xs text-fg-muted font-bold mt-1">Manage repairs, AMC visits, and warranty claims.</p>
        </div>
        {activeView === 'list' && (
          <button 
            onClick={() => setActiveView('create')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2"
          >
            <Wrench className="h-4 w-4" /> New Request
          </button>
        )}
        {activeView !== 'list' && (
          <button 
            onClick={() => { setActiveView('list'); setSelectedRequest(null); }}
            className="px-6 py-3 bg-bg-muted text-fg-primary border border-border-base rounded-xl text-xs font-black uppercase tracking-widest hover:bg-bg-hover transition-all"
          >
            Back to List
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {requests.map(req => (
              <div 
                key={req.id} 
                onClick={() => { setSelectedRequest(req); setActiveView('detail'); }}
                className="p-4 sm:p-6 rounded-2xl bg-bg-surface border border-border-base hover:border-blue-500/50 cursor-pointer transition-all flex flex-col sm:flex-row justify-between gap-6"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-black text-fg-primary">{req.id}</span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-fg-primary mb-1">{req.product}</h3>
                  <p className="text-xs text-fg-muted">{req.issueCategory}</p>
                </div>
                <div className="text-left sm:text-right flex flex-col justify-center">
                  <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1">Service Type</p>
                  <p className={`text-sm font-bold ${req.serviceType.includes('Paid') ? 'text-orange-400' : 'text-blue-500'}`}>{req.serviceType}</p>
                  <p className="text-[10px] font-bold text-fg-muted mt-2">{new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="text-center py-12 rounded-2xl border border-border-base bg-bg-surface">
                <Wrench className="h-12 w-12 text-fg-muted mx-auto mb-3" />
                <p className="text-fg-primary font-bold">No Service Requests found.</p>
                <p className="text-fg-muted text-xs mt-1">Create one if you need technical assistance.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeView === 'create' && (
          <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-bg-surface border border-border-base rounded-3xl p-4 sm:p-6 md:p-8">
            <h3 className="text-lg font-black text-fg-primary mb-6">Create Service Request</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest block mb-2">Service Type</label>
                  <select 
                    value={formData.serviceType}
                    onChange={e => setFormData({...formData, serviceType: e.target.value})}
                    className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm outline-none focus:border-blue-600 font-bold text-fg-primary"
                  >
                    <option>Warranty Service (Free)</option>
                    <option>AMC Visit (Included)</option>
                    <option>Paid Service (Out of Warranty)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest block mb-2">Installed Product Category</label>
                  <select 
                    value={formData.product}
                    onChange={e => setFormData({...formData, product: e.target.value})}
                    className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm outline-none focus:border-blue-600 font-bold text-fg-primary"
                  >
                    <option>Camera (Bullet/Dome)</option>
                    <option>DVR / NVR</option>
                    <option>Hard Drive (HDD)</option>
                    <option>Power Supply (SMPS)</option>
                    <option>Cabling / Networking</option>
                    <option>Biometric System</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest block mb-2">Issue Category</label>
                  <select 
                    value={formData.issueCategory}
                    onChange={e => setFormData({...formData, issueCategory: e.target.value})}
                    className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm outline-none focus:border-blue-600 font-bold text-fg-primary"
                  >
                    <option>Loose Wiring</option>
                    <option>Camera Fault (No Video/Blurry)</option>
                    <option>DVR/NVR Fault (Beeping/Not Starting)</option>
                    <option>Mobile App Viewing Issue</option>
                    <option>Password Reset Needed</option>
                    <option>Physical Damage</option>
                    <option>Other / Unsure</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest block mb-2">Preferred Visit Date</label>
                  <input 
                    type="date"
                    value={formData.visitDate}
                    onChange={e => setFormData({...formData, visitDate: e.target.value})}
                    className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm outline-none focus:border-blue-600 font-bold text-fg-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest block mb-2">Installation Address</label>
                <textarea 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm outline-none focus:border-blue-600 font-bold text-fg-primary resize-none h-20"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-fg-muted uppercase tracking-widest block mb-2">Issue Description</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Please describe the problem in detail..."
                  className="w-full bg-bg-muted border border-border-base rounded-2xl p-4 text-sm outline-none focus:border-blue-600 font-bold text-fg-primary resize-none h-32"
                  required
                />
              </div>

              <div className="border border-dashed border-border-strong rounded-2xl p-6 text-center hover:bg-bg-muted cursor-pointer transition-colors">
                <Camera className="h-8 w-8 text-fg-muted mx-auto mb-2" />
                <p className="text-sm font-bold text-fg-primary">Upload Photos/Videos (Optional)</p>
                <p className="text-[10px] text-fg-muted uppercase tracking-widest mt-1">Help technicians diagnose faster</p>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Submitting...' : <><Send className="h-4 w-4" /> Submit Service Request</>}
              </button>
            </form>
          </motion.div>
        )}

        {activeView === 'detail' && selectedRequest && (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Request Details */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-bg-surface border border-border-base rounded-3xl p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-fg-primary">{selectedRequest.id}</h3>
                    <p className="text-[10px] text-fg-muted font-bold uppercase tracking-widest">{selectedRequest.serviceType}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1">Product</p>
                    <p className="text-sm font-bold text-fg-primary">{selectedRequest.product}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1">Issue</p>
                    <p className="text-sm font-bold text-fg-primary">{selectedRequest.issueCategory}</p>
                    <p className="text-xs text-fg-muted mt-1">{selectedRequest.description}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1">Address</p>
                    <p className="text-xs text-fg-primary">{selectedRequest.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Timeline */}
            <div className="lg:col-span-2 bg-bg-surface border border-border-base rounded-3xl p-4 sm:p-6 md:p-8">
              <h3 className="text-lg font-black text-fg-primary mb-8 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" /> Live Status Timeline
              </h3>
              
              <div className="relative pl-6 space-y-8">
                {/* Timeline Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border-strong rounded-full"></div>

                {STAGES.map((stage, idx) => {
                  const timelineEvent = selectedRequest.timeline.find((t: any) => t.status === stage);
                  const isCompleted = !!timelineEvent;
                  const isCurrent = selectedRequest.status === stage;
                  const isPending = !isCompleted && !isCurrent;

                  // Adjust styles based on state
                  let dotColor = 'bg-border-strong border-border-base';
                  let textColor = 'text-fg-muted';
                  let pulse = false;

                  if (isCompleted) {
                    dotColor = 'bg-green-500 border-green-500/30';
                    textColor = 'text-green-500';
                  } else if (isCurrent) {
                    dotColor = 'bg-blue-500 border-blue-500/30';
                    textColor = 'text-blue-500';
                    pulse = true;
                  }

                  return (
                    <div key={stage} className={`relative flex items-start gap-6 ${isPending ? 'opacity-50' : ''}`}>
                      <div className={`absolute -left-6 top-1.5 h-4 w-4 rounded-full border-4 shadow-sm z-10 transition-colors ${dotColor}`}>
                        {pulse && <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`text-sm font-black uppercase tracking-widest mb-1 ${textColor}`}>{stage}</h4>
                        {timelineEvent && (
                          <div className="flex items-center gap-3 text-[10px] font-bold text-fg-muted uppercase tracking-widest mt-1">
                            <span>{new Date(timelineEvent.date).toLocaleString()}</span>
                            <span>•</span>
                            <span>By: {timelineEvent.by}</span>
                          </div>
                        )}
                        {isCurrent && stage === 'Waiting Approval' && (
                          <div className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <p className="text-xs text-orange-400 font-bold mb-3">Estimate provided for Out of Warranty Repair. Please review and approve.</p>
                            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors">
                              Review Estimate
                            </button>
                          </div>
                        )}
                        {isCurrent && stage === 'Waiting Spare Parts' && (
                          <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-purple-400" />
                            <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Parts Ordered. Awaiting Delivery.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
