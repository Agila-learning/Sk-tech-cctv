"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroCarousel from "@/components/home/HeroCarousel";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";
import NextImage from "next/image";
import ServiceCard from "@/components/home/ServiceCard";
import { ArrowRight, Shield, Zap, Hammer, Star, CheckCircle2, Users, ShieldCheck, Cpu, MessageSquare, Activity, Loader2 } from "lucide-react";
import { fetchWithAuth, getImageUrl } from "@/utils/api";
import OfferPopup from "@/components/home/OfferPopup";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeOffers, setActiveOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodData, catData, offerData] = await Promise.all([
          fetchWithAuth('/products?limit=4'),
          fetchWithAuth('/internal/categories'),
          fetchWithAuth('/offers') 
        ]);
        console.log('[Home] API Data Loaded:', { prodData, catData, offerData });
        setFeaturedProducts(prodData.products || []);
        setCategories(catData || []);
        setActiveOffers(offerData.filter((o: any) => o.isActive) || []);
      } catch (err) {
        console.error("Failed to load platform data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroCarousel />
      
      {/* Top Categories Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-6 mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-fg-primary uppercase tracking-tight">Top <span className="text-blue-500 italic">Categories</span></h2>
            <div className="h-px flex-1 bg-border-base"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-square bg-bg-muted animate-pulse rounded-3xl md:rounded-[3rem] border border-border-base"></div>
              ))
            ) : categories.length > 0 ? (
              categories.map((cat) => (
                <ProductCard 
                  key={cat._id} 
                  id={cat._id}
                  name={cat.name}
                  image={cat.image}
                  category={cat.name}
                  type="category"
                />
              ))
            ) : (
              <div className="col-span-full py-10 text-center text-fg-muted font-bold uppercase tracking-widest text-xs">No Categories Tracked</div>
            )}
          </div>
        </div>
      </section>

      {/* Explore Products Section */}
      <section className="py-16 md:py-24 bg-bg-muted/30 border-y border-border-base relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/[0.02] blur-[120px] -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6 text-left">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Strategic <span className="text-blue-500">Hardware</span></h2>
              <p className="text-fg-muted text-base md:text-lg font-medium max-w-xl">Check out our best-selling security systems designed to protect your home and enterprise assets.</p>
            </div>
            <Link href="/products" className="group flex items-center space-x-3 px-8 py-4 bg-bg-surface border border-border-base rounded-2xl font-bold hover:border-blue-500/50 transition-all text-fg-primary shadow-xl shadow-black/5">
              <span className="text-sm uppercase tracking-widest">Global Inventory</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4 text-left">
                  <div className="aspect-[4/5] bg-bg-card animate-pulse rounded-3xl border border-border-base"></div>
                  <div className="h-4 w-3/4 bg-bg-card animate-pulse rounded-lg"></div>
                  <div className="h-4 w-1/2 bg-bg-card animate-pulse rounded-lg"></div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard 
                  key={product._id} 
                  {...product} 
                  id={product._id}
                  image={product.images?.[0] || product.image || '/placeholder.png'}
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center opacity-50 font-black uppercase tracking-widest text-[10px]">No Hardware Clusters Detected</div>
            )}
          </div>
        </div>
      </section>

      {/* Professional Services Section */}
      <section className="py-32 bg-background relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-600/20 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto mb-20 space-y-6">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Our Services</p>
              <h2 className="text-5xl md:text-6xl font-black text-fg-primary tracking-tight uppercase font-poppins">Technical <span className="text-blue-600">Solutions</span></h2>
              <p className="text-fg-muted font-manrope font-medium text-lg">Elite security systems demand expert installation and regular maintenance.</p>
            </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Expert Consultation', desc: 'Strategic analysis of your sector to optimize node placement and coverage density.', icon: ShieldCheck, href: '/support', category: 'Intelligence' },
                { title: 'Professional Service', desc: 'Seamless physical integration of 4K Technicians with high-speed uplink calibration.', icon: Hammer, href: '/installation', category: 'Field Op' },
                { title: 'Sustained Vigilance', desc: 'Predictive maintenance protocols and AMC subscriptions for zero-downtime Systems.', icon: Zap, href: '/support', category: 'Maintenance' }
              ].map((service, i) => (
                <ServiceCard key={i} index={i} {...service} />
              ))}
           </div>
        </div>
      </section>

      {/* How It Works Timeline */}
      <section className="py-32 bg-bg-muted border-y border-border-base">
        <div className="max-w-7xl mx-auto px-4">
           <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
              <div className="space-y-4">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Protocol Execution</p>
                 <h2 className="text-5xl font-black text-fg-primary tracking-tight uppercase font-poppins">Order <span className="text-blue-600">Workflow</span></h2>
              </div>
              <p className="text-fg-muted font-manrope font-medium max-w-lg">Our systematic approach ensures your security matrix is deployed with precision.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
              {/* Timeline Line */}
              <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-border-base"></div>
              
              {[
                { step: '01', title: 'Consultation', desc: 'System requirements and site analysis.' },
                { step: '02', title: 'Purchase', desc: 'Product selection and secure payment.' },
                { step: '03', title: 'Installation', desc: 'On-site setup and configuration.' },
                { step: '04', title: 'Activation', desc: 'System check and live monitoring.' }
              ].map((item, i) => (
                <div key={i} className="relative z-10 space-y-6 group">
                   <div className="w-24 h-24 bg-bg-surface border border-border-base rounded-full flex items-center justify-center text-3xl font-black text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 font-mono shadow-xl">
                      {item.step}
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-xl font-black text-fg-primary uppercase tracking-tight">{item.title}</h4>
                      <p className="text-sm text-fg-muted font-manrope font-medium leading-relaxed">{item.desc}</p>
                    </div>
                 </div>
               ))}
           </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                 <div className="space-y-6">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Core Advantages</p>
                    <h2 className="text-5xl lg:text-6xl font-black text-fg-primary tracking-tight uppercase font-poppins">Engineered for <br /><span className="text-blue-600">Total Dominance</span></h2>
                    <p className="text-fg-muted font-manrope font-medium text-lg leading-relaxed">We don't just sell cameras; we architect impenetrable security ecosystems powered by advanced AI and Professional field expertise.</p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {[
                      { title: 'AI Integration', icon: Cpu, desc: 'Neural-network-based threat detection active on all nodes.' },
                      { title: '24/7 Support', icon: MessageSquare, desc: 'Direct uplink to Professional support Technicians anytime.' },
                      { title: 'Data Privacy', icon: ShieldCheck, desc: 'Full-spectrum encryption and secure local storage.' },
                      { title: 'Scalable Matrix', icon: Activity, desc: 'Easily expand your coverage as your operation grows.' }
                    ].map((point, i) => (
                      <div key={i} className="space-y-4">
                         <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
                            <point.icon className="h-6 w-6" />
                         </div>
                         <h4 className="text-lg font-black text-fg-primary uppercase tracking-tight">{point.title}</h4>
                         <p className="text-sm text-fg-muted font-manrope font-medium leading-relaxed">{point.desc}</p>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="relative">
                 <div className="aspect-square rounded-[4rem] bg-gradient-to-br from-blue-600/20 to-transparent border border-white/10 p-1">
                    <div className="w-full h-full rounded-[3.8rem] bg-card/30 overflow-hidden relative group p-20">
                       <NextImage src="/assets/products/ptz_recon.png" alt="Professional Tech" fill className="object-cover group-hover:scale-110 transition-transform duration-1000 p-20" />
                       <div className="absolute inset-0 bg-blue-600/5 group-hover:opacity-0 transition-opacity"></div>
                    </div>
                 </div>
                 {/* Floating Badges */}
                 <div className="absolute -top-12 -right-12 p-10 bg-blue-600 rounded-[2.5rem] shadow-2xl animate-float">
                    <p className="text-4xl font-black text-white">10k+</p>
                    <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Active Technicians</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-bg-muted/50 border-t border-border-base">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <div className="space-y-4 mb-20">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Operator Testimonials</p>
              <h2 className="text-5xl font-black text-fg-primary tracking-tight uppercase font-poppins">Secured <span className="text-blue-600">Sectors</span></h2>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: 'Lt. Mark Vance', company: 'Global Logistics', text: 'The Recon-4K series transformed our port security. Latency is non-existent, and the AI detection is flawless.', rating: 5 },
                { name: 'Sarah Chen', company: 'Nexus Retail', text: 'Installation was surgical. The Professional technicians calibrated our 32-node matrix in under 6 hours.', rating: 5 },
                { name: 'Director Aris', company: 'Capital Guard', text: 'Premium hardware meets unmatched support. SK Tech IS the standard for modern urban surveillance.', rating: 5 }
              ].map((test, i) => (
                <div key={i} className="glass-card p-12 rounded-[3.5rem] border border-border-base text-left space-y-8 group hover:-translate-y-2 transition-all">
                   <div className="flex space-x-1">
                      {[...Array(test.rating)].map((_, i) => <Star key={i} className="h-4 w-4 text-blue-500 fill-blue-500" />)}
                   </div>
                   <p className="text-lg text-fg-muted font-manrope font-medium leading-relaxed italic">"{test.text}"</p>
                   <div>
                      <p className="text-xl font-black text-fg-primary uppercase tracking-tight">{test.name}</p>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">{test.company}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      <Footer />
      <OfferPopup offers={activeOffers} />
    </main>
  );
}
