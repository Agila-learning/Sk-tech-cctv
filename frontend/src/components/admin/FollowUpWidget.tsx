"use client";
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/api';
import { Clock, AlertCircle, FileText, Wrench, ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FollowUpWidget() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadFollowUps = async () => {
      try {
        // Fetch all follow-up data from invoices, tickets, and warranties
        // Since we don't have a single backend route for this unified feed, we fetch from their respective endpoints
        const [invoicesData, ticketsData, warrantiesData] = await Promise.all([
          fetchWithAuth('/billing/invoices').catch(() => []),
          fetchWithAuth('/tickets/admin/all').catch(() => []),
          fetchWithAuth('/product-warranty').catch(() => [])
        ]);

        const unified: any[] = [];

        // Invoices / Quotations Follow-ups
        (invoicesData || []).forEach((inv: any) => {
          if (inv.type === 'quotation' && inv.nextFollowUpDate && !['Closed', 'Invoice Generated'].includes(inv.followUpStatus)) {
            unified.push({
              _id: inv._id,
              type: 'Quotation',
              title: `Quotation #${inv.invoiceNumber}`,
              customer: inv.customer?.name || 'Customer',
              dueDate: new Date(inv.nextFollowUpDate),
              urgency: new Date(inv.nextFollowUpDate).getTime() - Date.now(),
              status: inv.followUpStatus,
              route: '/admin/billing'
            });
          }
        });

        // Tickets Follow-ups
        (ticketsData || []).forEach((t: any) => {
          if (t.status !== 'Closed' && t.status !== 'Resolved') {
             unified.push({
              _id: t._id,
              type: 'Ticket',
              title: t.subject,
              customer: t.customer?.name || t.customerName || 'Customer',
              dueDate: new Date(t.createdAt), // For tickets, urgency is based on creation (oldest first)
              urgency: new Date(t.createdAt).getTime() - Date.now(),
              status: t.status,
              route: '/admin/tickets'
            });
          }
        });

        // Warranties Follow-ups
        (warrantiesData || []).forEach((w: any) => {
          if (w.nextFollowUpDate && w.followUpStatus !== 'Closed') {
             unified.push({
              _id: w._id,
              type: 'Warranty',
              title: `Warranty: ${w.productName}`,
              customer: w.customerName || 'Customer',
              dueDate: new Date(w.nextFollowUpDate),
              urgency: new Date(w.nextFollowUpDate).getTime() - Date.now(),
              status: w.followUpStatus,
              route: '/admin/product-warranty'
            });
          }
        });

        // Sort by most urgent (urgency value closest to 0 or negative)
        unified.sort((a, b) => a.urgency - b.urgency);
        setItems(unified.slice(0, 10)); // Top 10
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadFollowUps();
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'Quotation': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'Ticket': return <Wrench className="w-5 h-5 text-orange-500" />;
      case 'Warranty': return <ShieldCheck className="w-5 h-5 text-green-500" />;
      default: return <AlertCircle className="w-5 h-5 text-fg-muted" />;
    }
  };

  const isOverdue = (urgency: number) => urgency < 0;

  return (
    <div className="glass-card rounded-3xl border border-border-base p-6 flex flex-col h-full shadow-lg overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-fg-primary tracking-tight">Unified <span className="gradient-text">Follow-ups</span></h2>
          <p className="text-[10px] text-fg-muted font-bold uppercase tracking-widest mt-0.5">Prioritized Action Items</p>
        </div>
        <div className="p-2 bg-blue-500/10 rounded-xl">
          <Clock className="w-5 h-5 text-blue-500" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-bg-muted/50 rounded-2xl animate-pulse border border-border-base"></div>
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-fg-muted opacity-50">
            <CheckCircle className="w-12 h-12 mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest">All caught up!</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={`${item.type}-${item._id}-${idx}`} 
                 onClick={() => router.push(item.route)}
                 className="group flex items-center gap-4 p-4 rounded-2xl bg-bg-muted/30 hover:bg-bg-muted border border-transparent hover:border-border-base cursor-pointer transition-all">
               <div className={`p-3 rounded-xl flex-shrink-0 ${isOverdue(item.urgency) ? 'bg-red-500/10' : 'bg-bg-surface border border-border-base'}`}>
                 {getIcon(item.type)}
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex items-center justify-between gap-2">
                   <h3 className="text-xs font-bold text-fg-primary truncate">{item.title}</h3>
                   {isOverdue(item.urgency) && (
                     <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-red-500 animate-pulse">
                       OVERDUE
                     </span>
                   )}
                 </div>
                 <div className="flex items-center justify-between gap-2 mt-1">
                   <p className="text-[10px] text-fg-muted font-medium truncate">{item.customer}</p>
                   <p className={`text-[9px] font-bold uppercase tracking-widest ${isOverdue(item.urgency) ? 'text-red-500' : 'text-blue-500'}`}>
                     {item.dueDate.toLocaleDateString()}
                   </p>
                 </div>
               </div>
               <ArrowRight className="w-4 h-4 text-fg-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
