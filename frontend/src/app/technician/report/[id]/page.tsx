"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ServiceReportForm from '@/components/technician/ServiceReportForm';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { fetchWithAuth } from '@/utils/api';

const ServiceReportPage = () => {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJob = async () => {
      try {
        // Try to find in WorkFlows first
        const jobs = await fetchWithAuth('/technician/my-tasks');
        let current = jobs.find((j: any) => j.order?._id === jobId || j._id === jobId);
        
        if (!current) {
          // If not in WorkFlows, check Bookings
          const bookings = await fetchWithAuth('/technician/my-bookings');
          const booking = bookings.find((b: any) => b._id === jobId);
          if (booking) {
            // Transform booking to match the expected structure as much as possible
            current = {
              _id: booking._id,
              order: {
                _id: booking._id,
                customer: booking.customer,
                deliveryAddress: booking.address,
              },
              isBooking: true
            };
          }
        }
        setJobData(current);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadJob();
  }, [jobId]);

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-black uppercase tracking-widest">Loading Report Node...</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-12 selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto mb-10">
        <Link 
          href="/technician" 
          className="flex items-center space-x-2 text-slate-500 hover:text-white transition-colors group mb-8"
        >
          <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Dashboard</span>
        </Link>

        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Finish <span className="text-blue-500 italic">Job</span></h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Closing Order ID: {jobId.slice(-6)}</p>
        </div>
      </div>

      <ServiceReportForm 
        jobId={jobId} 
        initialData={{
           customerName: jobData?.order?.customer?.name || '',
           customerAddress: jobData?.order?.deliveryAddress || '',
           photos: {
             before: jobData?.stages?.started?.photo?.url || '',
             after: jobData?.stages?.completed?.photo?.url || ''
           }
        }}
        onComplete={() => {
          alert("Report submitted successfully! Job Completed.");
          router.push('/technician');
        }} 
      />
    </div>
  );
};

export default ServiceReportPage;
