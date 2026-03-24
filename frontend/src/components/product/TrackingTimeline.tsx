"use client";
import React from 'react';
import { CheckCircle2, Circle, Clock, Truck, ShieldCheck, UserCheck, Activity } from 'lucide-react';

interface TrackingTimelinePrSystems {
  status?: string;
  orderId?: string;
  technician?: {
    name: string;
    id: string;
  } | null;
}

const TrackingTimeline = ({ status = 'pending', orderId, technician }: TrackingTimelinePrSystems) => {
  const steps = [
    { id: 'pending', label: 'Order Received', icon: Clock, desc: 'Strategy finalized' },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2, desc: 'Payment verified' },
    { id: 'assigned', label: 'Technician Assigned', icon: UserCheck, desc: 'Technician dispatched' },
    { id: 'shipped', label: 'In Transit', icon: Truck, desc: 'Hardware en route' },
    { id: 'delivered', label: 'Secured', icon: ShieldCheck, desc: 'System online' },
  ];

  // Map backend status to timeline steps if needed
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'confirmed': 'confirmed',
    'assigned': 'assigned',
    'accepted': 'assigned',
    'shipped': 'shipped',
    'delivered': 'delivered',
    'processing': 'confirmed',
    'work_started': 'shipped'
  };

  const mappedStatus = statusMap[status] || 'pending';
  const currentIdx = steps.findIndex(s => s.id === mappedStatus);

  return (
    <div className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden h-full">
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h3 className="text-xl font-black text-fg-primary uppercase tracking-tight">Service Tracking</h3>
            <p className="text-fg-muted text-xs font-medium">Real-time status of your security node</p>
         </div>
         {orderId && (
            <div className="px-4 py-2 bg-blue-600/10 border border-blue-600/20 rounded-xl">
               <span className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Order #{orderId.slice(-8).toUpperCase()}</span>
            </div>
         )}
      </div>

      <div className="space-y-12 relative">
        {/* Progress Line */}
        <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-border-base">
           <div 
             className="absolute top-0 left-0 w-full bg-blue-600 transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,1)]" 
             style={{ height: `${(currentIdx / (steps.length - 1)) * 100}%` }}
           ></div>
        </div>

        {steps.map((step, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-start space-x-8 group">
              <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border ${isDone ? 'bg-blue-600 border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : isCurrent ? 'bg-bg-surface border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-bg-surface border-border-base text-fg-dim'}`}>
                <StepIcon className={`h-6 w-6 ${isDone ? 'text-white' : isCurrent ? 'text-blue-600 animate-pulse' : 'text-fg-dim'}`} />
              </div>
              <div className="flex-1 pt-1">
                <div className="flex justify-between items-center mb-1">
                   <h4 className={`text-sm font-black uppercase tracking-widest ${isDone || isCurrent ? 'text-fg-primary' : 'text-fg-muted'}`}>
                      {step.label}
                   </h4>
                   {isDone && <span className="text-[10px] font-bold text-fg-muted">Log Recorded</span>}
                </div>
                <p className="text-xs font-medium text-fg-muted">{step.desc}</p>
                
                {isCurrent && technician && (
                   <div className="mt-4 p-4 bg-blue-600/5 rounded-2xl border border-blue-600/10 flex items-center space-x-4 animate-in fade-in slide-in-from-left-4 duration-500">
                      <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                         <UserCheck className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-fg-muted uppercase">Deployed Agent</p>
                         <p className="text-xs text-fg-primary font-bold">
                           {technician.name} 
                           <span className="text-blue-500 ml-2">
                             ID:{technician.id?.slice(-4).toUpperCase() || 'UNKN'}
                           </span>
                         </p>
                      </div>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackingTimeline;
