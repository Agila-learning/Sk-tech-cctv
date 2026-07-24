"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import { Search, Package, Users, Phone, LayoutDashboard, ChevronRight } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import BackButton from '@/components/common/BackButton';

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({
    orders: [] as any[],
    technicians: [] as any[],
    customers: [] as any[],
    tickets: [] as any[]
  });

  useEffect(() => {
    if (!query) return;
    
    const fetchResults = async () => {
      setLoading(true);
      try {
        const [ordersData, techsData, customersData, ticketsData] = await Promise.all([
          fetchWithAuth('/orders/all').catch(() => []),
          fetchWithAuth('/technician').catch(() => []),
          fetchWithAuth('/customer-contact').catch(() => []),
          fetchWithAuth('/tickets/admin/all').catch(() => [])
        ]);

        const qLower = query.toLowerCase();

        const filteredOrders = (ordersData || []).filter((o: any) => 
          o._id?.toLowerCase().includes(qLower) || 
          o.customer?.name?.toLowerCase().includes(qLower) || 
          o.status?.toLowerCase().includes(qLower)
        );

        const filteredTechs = (techsData || []).filter((t: any) => 
          t.name?.toLowerCase().includes(qLower) || 
          t.email?.toLowerCase().includes(qLower) || 
          t.phone?.includes(qLower)
        );

        const filteredCustomers = (customersData || []).filter((c: any) => 
          c.customerName?.toLowerCase().includes(qLower) || 
          c.mobileNumber?.includes(qLower) || 
          c.email?.toLowerCase().includes(qLower)
        );

        const isUnassignedTicketsSearch = qLower === 'unassigned tickets';
        const filteredTickets = (ticketsData || []).filter((t: any) => 
          isUnassignedTicketsSearch ? !t.assignedTo : 
          (t.subject?.toLowerCase().includes(qLower) || t.status?.toLowerCase().includes(qLower) || t.ticketId?.toLowerCase().includes(qLower))
        );

        setResults({
          orders: filteredOrders,
          technicians: filteredTechs,
          customers: filteredCustomers,
          tickets: filteredTickets
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="flex-1 flex flex-col bg-bg-body text-fg-primary min-h-screen">
      <AdminNavbar />
      <div className="flex-1 flex overflow-hidden">
        <AdminSidebar isOpen={false} onClose={() => {}} />
        <main className="flex-1 overflow-y-auto lg:ml-80">
          <div className="p-6 lg:p-12 space-y-12 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div className="space-y-6">
                <BackButton />
                <div>
                  <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Search <span className="text-blue-500">Results</span></h1>
                  <p className="text-fg-muted font-medium text-lg mt-2">Showing results for: <span className="text-fg-primary font-bold">"{query}"</span></p>
                </div>
              </div>
            </header>

            {loading ? (
              <p className="text-fg-muted font-bold animate-pulse">Searching everywhere...</p>
            ) : (
              <div className="space-y-12">
                {/* Orders */}
                {results.orders.length > 0 && (
                  <section>
                    <h2 className="text-xl font-black uppercase tracking-widest text-fg-primary mb-6 flex items-center gap-3">
                      <Package className="text-blue-500 w-5 h-5" /> Orders ({results.orders.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.orders.map(order => (
                        <div key={order._id} onClick={() => router.push('/admin/orders')} className="glass-card p-6 rounded-2xl cursor-pointer hover:border-blue-500/50 transition-colors">
                          <p className="text-sm font-black text-blue-500 tracking-widest">ORDER #{order._id.slice(-6).toUpperCase()}</p>
                          <p className="text-lg font-bold mt-2">{order.customer?.name || 'Unknown'}</p>
                          <p className="text-xs text-fg-muted uppercase tracking-widest mt-1">Status: {order.status}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Technicians */}
                {results.technicians.length > 0 && (
                  <section>
                    <h2 className="text-xl font-black uppercase tracking-widest text-fg-primary mb-6 flex items-center gap-3">
                      <Users className="text-emerald-500 w-5 h-5" /> Technicians ({results.technicians.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.technicians.map(tech => (
                        <div key={tech._id} onClick={() => router.push('/admin/technicians')} className="glass-card p-6 rounded-2xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                          <p className="text-lg font-bold">{tech.name}</p>
                          <p className="text-xs text-fg-muted uppercase tracking-widest mt-1">{tech.phone || tech.email}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Customers */}
                {results.customers.length > 0 && (
                  <section>
                    <h2 className="text-xl font-black uppercase tracking-widest text-fg-primary mb-6 flex items-center gap-3">
                      <Phone className="text-purple-500 w-5 h-5" /> Customers ({results.customers.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.customers.map(cust => (
                        <div key={cust._id} onClick={() => router.push('/admin/customer-contact')} className="glass-card p-6 rounded-2xl cursor-pointer hover:border-purple-500/50 transition-colors">
                          <p className="text-lg font-bold">{cust.customerName}</p>
                          <p className="text-xs text-fg-muted uppercase tracking-widest mt-1">{cust.mobileNumber || cust.email}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Tickets */}
                {results.tickets.length > 0 && (
                  <section>
                    <h2 className="text-xl font-black uppercase tracking-widest text-fg-primary mb-6 flex items-center gap-3">
                      <LayoutDashboard className="text-orange-500 w-5 h-5" /> Tickets ({results.tickets.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.tickets.map((t: any) => (
                        <div key={t._id} onClick={() => router.push('/admin/tickets')} className="glass-card p-6 rounded-2xl cursor-pointer hover:border-orange-500/50 transition-colors">
                          <p className="text-lg font-bold">{t.subject || 'Ticket'}</p>
                          <p className="text-xs text-fg-muted uppercase tracking-widest mt-1">Status: {t.status} • {t.assignedTechnician ? 'Assigned' : 'Unassigned'}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {results.orders.length === 0 && results.technicians.length === 0 && results.customers.length === 0 && results.tickets.length === 0 && (
                  <div className="text-center py-20 bg-bg-surface border border-border-base rounded-3xl">
                    <Search className="w-12 h-12 text-fg-muted mx-auto mb-4" />
                    <h3 className="text-xl font-black text-fg-primary uppercase tracking-widest">No results found</h3>
                    <p className="text-sm font-bold text-fg-muted mt-2">Try adjusting your search term.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold animate-pulse">Loading search...</div>}>
      <SearchResults />
    </Suspense>
  );
}
