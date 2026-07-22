"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroCarousel from "@/components/home/HeroCarousel";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";
import NextImage from "next/image";
import ServiceCard from "@/components/home/ServiceCard";
import StrategicHardwareCarousel from "@/components/home/StrategicHardwareCarousel";
import { ArrowRight, Shield, Zap, Hammer, Star, CheckCircle2, Users, ShieldCheck, Cpu, MessageSquare, Activity, Loader2 } from "lucide-react";
import { fetchWithAuth, getImageUrl } from "@/utils/api";
import OfferPopup from "@/components/home/OfferPopup";
import CTAPopup from "@/components/home/CTAPopup";
import FAQSection from "@/components/home/FAQSection";
import BrandsMarquee from "@/components/home/BrandsMarquee";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_PRODUCTS = [
  { _id: 'prod_1', name: 'Recon-4K Dome', price: 12999, category: 'CCTV Cameras', image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800', description: 'Ultra-HD surveillance with night vision.' },
  { _id: 'prod_2', name: 'Tactical NVR-8', price: 24500, category: 'Storage', image: 'https://images.unsplash.com/photo-1590059132718-266581a28cb0?w=800', description: '8-Channel network video recorder.' },
  { _id: 'prod_3', name: 'Signal-X Router', price: 8999, category: 'Networking', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800', description: 'High-speed encrypted security uplink.' },
  { _id: 'prod_4', name: 'Secure-Pad Pro', price: 15700, category: 'Smart Access', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800', description: 'Biometric fingerprint access node.' }
];

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
        
        const products = prodData?.products || [];
        setFeaturedProducts(products.length > 0 ? products : DEFAULT_PRODUCTS);
        
        const cats = catData?.filter((c: any) => c.isActive && c.showOnHome) || [];
        setCategories(cats);
        
        setActiveOffers(offerData?.filter((o: any) => o.isActive) || []);
      } catch (err: any) {
        console.error("Failed to load platform data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useGSAP(() => {
    gsap.utils.toArray('.gsap-fade-in').forEach((section: any) => {
      gsap.fromTo(section, 
        { y: 50, opacity: 0 }, 
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          ease: "power3.out", 
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroCarousel />
      <BrandsMarquee />
      <CTAPopup />
      
      {/* Browse by Categories */}
      {categories.length > 0 && (
        <section className="py-16 md:py-24 bg-background border-t border-border-base gsap-fade-in">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 md:mb-16 gap-6">
              <div>
                <span className="text-blue-500 font-black tracking-[0.3em] uppercase text-xs">Catalog</span>
                <h2 className="text-3xl md:text-5xl font-black mt-2 text-fg-primary tracking-tight uppercase">Browse by <span className="text-blue-500">Category</span></h2>
              </div>
              <Link href="/products">
                <button className="text-sm font-bold uppercase tracking-widest text-fg-muted hover:text-blue-500 transition-colors flex items-center gap-2 group">
                  View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {categories.map((cat, i) => (
                <Link key={cat._id} href={`/products?category=${encodeURIComponent(cat.name)}`}>
                  <div className="group relative glass-card p-6 rounded-[2.5rem] border border-border-base hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col items-center text-center shadow-lg hover:shadow-blue-500/20 bg-bg-surface h-full">
                    
                    {/* Background thumbnail with overlay */}
                    {cat.image && (
                      <div className="absolute inset-0 z-0">
                        <img src={cat.image} alt={cat.displayName || cat.name} className="w-full h-full object-cover opacity-10 group-hover:opacity-30 transition-opacity duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/80 to-transparent"></div>
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full pt-4">
                      <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 border border-blue-500/20 shadow-inner overflow-hidden">
                        {cat.icon ? (
                          <img src={cat.icon} alt={`${cat.displayName} icon`} className="w-8 h-8 object-contain" />
                        ) : (
                          <Shield className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors" />
                        )}
                      </div>
                      <h3 className="font-black text-fg-primary uppercase tracking-tight mb-2 text-lg">{cat.displayName || cat.name}</h3>
                      {cat.description && (
                        <p className="text-[10px] text-fg-muted font-bold uppercase tracking-widest line-clamp-2 mt-auto">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Categories Section (Featured Systems) */}
      <section className="py-16 md:py-24 bg-background gsap-fade-in">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-6 mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-fg-primary tracking-tight uppercase">Featured <span className="text-blue-500">Systems</span></h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
          </div>
          <div className="relative w-full overflow-hidden pb-12 pt-4">
            {/* Fade Edges for Marquee */}
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
            
            <div className="flex w-max animate-marquee space-x-6 md:space-x-8 px-4">
              {/* Duplicate the array to create an infinite seamless loop effect */}
              {[...featuredProducts, ...featuredProducts, ...featuredProducts].map((p, i) => (
                <div key={`${p._id || i}-${i}`} className="w-[300px] md:w-[340px] shrink-0">
                  <ProductCard {...p} id={p._id} image={p.images?.[0] || p.image || '/placeholder.png'} />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-16 text-center">
            <Link href="/products">
              <button className="bg-bg-muted hover:bg-white/5 border border-border-base text-fg-primary font-black text-[11px] uppercase tracking-[0.2em] px-10 py-5 rounded-2xl transition-all shadow-sm">View All Hardware</button>
            </Link>
          </div>
        </div>
      </section>

      {/* Explore Products Section */}
      <section className="py-16 md:py-24 bg-bg-muted/30 border-y border-border-base relative overflow-hidden gsap-fade-in">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/[0.02] blur-[120px] -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-fg-primary tracking-tight uppercase mb-6">Strategic <span className="text-blue-500">Hardware</span> Deployments</h2>
          <p className="text-fg-muted font-medium text-lg max-w-2xl mx-auto mb-16">Explore high-end physical security infrastructure used in enterprise, residential, and tactical environments.</p>
          <StrategicHardwareCarousel products={featuredProducts} loading={loading} />
        </div>
      </section>

      {/* Professional Services Section */}
      <section className="py-32 bg-background relative overflow-hidden gsap-fade-in">
        {/* Decor */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-600/20 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-blue-500 font-black tracking-[0.3em] uppercase text-xs">Our Arsenal</span>
              <h2 className="text-4xl md:text-6xl font-black mt-4 text-fg-primary leading-[1.1] uppercase tracking-tight">Security Solutions</h2>
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
      <section className="py-32 bg-bg-muted border-y border-border-base gsap-fade-in">
        <div className="max-w-7xl mx-auto px-4">
           <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
              <div className="max-w-2xl">
                 <span className="text-blue-500 font-black tracking-[0.3em] uppercase text-xs">The Protocol</span>
                 <h2 className="text-4xl md:text-6xl font-black mt-4 text-fg-primary uppercase tracking-tight leading-[1.1]">Flawless <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">Execution</span></h2>
              </div>
              <p className="text-fg-muted font-medium max-w-sm text-lg md:text-right">A systematic approach to deploying impenetrable security networks.</p>
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
      <section className="py-32 bg-background gsap-fade-in">
        <div className="max-w-7xl mx-auto px-4">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                 <div className="space-y-6">
                    <span className="text-blue-500 font-black tracking-[0.3em] uppercase text-xs">Intel</span>
                    <h2 className="text-4xl md:text-6xl font-black mt-4 mb-8 text-fg-primary uppercase tracking-tight leading-[1.1]">Why choose <br/>SK Tech?</h2>
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
                 <div className="aspect-square rounded-[3rem] overflow-hidden relative group shadow-2xl shadow-[#1E3A8A]/15 border border-[#1E3A8A]/10">
                    <NextImage src="/assets/products/ptz_recon.png" alt="Professional Tech" fill className="object-cover group-hover:scale-110 transition-transform duration-1000 p-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A]/10 to-transparent group-hover:opacity-0 transition-opacity"></div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-bg-muted/50 border-t border-border-base gsap-fade-in">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <div className="space-y-4 mb-20">
              <span className="text-blue-500 font-black tracking-[0.3em] uppercase text-xs">Network Status</span>
              <h2 className="text-4xl md:text-6xl font-black text-fg-primary uppercase tracking-tight leading-[1.1]">Metrics</h2>
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

      {/* Download App Banner Section */}
      <section className="w-full bg-[#070b10] relative overflow-hidden flex items-center justify-center py-16 md:py-24 border-t border-border-base gsap-fade-in">
        {/* Background glow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-[1200px] mx-auto w-full px-6 md:px-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
          {/* Left Text Content */}
          <div className="flex-1 space-y-8 max-w-xl">
            <div className="space-y-4">
              <p className="text-gray-500 text-xs font-bold tracking-[0.2em] uppercase">SK Technology Mobile App</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
                Your Security,<br/>
                <span className="text-blue-500">one tap away</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed pt-2">
                Monitor your camera in real time, receive instants alerts, and access live footage from anywhere, Available for ios and Android.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4">

              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-[1.5rem] blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <a href="https://play.google.com/store/apps/details?id=com.sktechnology.cctv" target="_blank" rel="noopener noreferrer" className="relative flex items-center gap-3 bg-[#0a0f16] border border-gray-700 hover:border-blue-500 hover:scale-105 transition-all duration-300 rounded-[1.25rem] px-6 py-3 min-w-[200px]">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                  <path d="M4 2.6l14 7.9-7 6L4 2.6z" fill="#4CAF50"/>
                  <path d="M4 21.4l14-7.9-7-6-7 13.9z" fill="#2196F3"/>
                  <path d="M18 10.5l4 2-4 2v-4z" fill="#FFC107"/>
                  <path d="M11 10.5l7-6-7-1.9-7 6 7 1.9z" fill="#F44336"/>
                </svg>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-gray-400 font-medium tracking-wide">GET IT ON</span>
                  <span className="text-white font-bold text-sm leading-tight">Google Play</span>
                </div>
              </a>
              </div>
            </div>

            {/* Ratings Section Removed */}
          </div>

          {/* Right Phone Mockup */}
          <div className="relative w-full max-w-[300px] shrink-0 mt-10 md:mt-0 transition-transform duration-700 hover:-translate-y-4 hover:rotate-2">
             {/* Outer Phone Frame */}
             <div className="relative mx-auto border-gray-600 bg-gray-800 border-[8px] rounded-[3rem] h-[580px] w-[270px] shadow-2xl overflow-hidden ring-1 ring-white/10 flex flex-col group">
               
               {/* Phone Screen Background */}
               <div className="bg-[#f6f8fb] absolute inset-[2px] rounded-[2.5rem] flex flex-col items-center pt-16 px-6 text-center shadow-inner">
                 
                 {/* Top Notch / Camera hole */}
                 <div className="absolute top-4 w-full flex justify-center left-0">
                   <div className="w-4 h-4 bg-gray-900 rounded-full shadow-inner"></div>
                 </div>

                 <div className="space-y-1 mb-8">
                   <p className="text-blue-950 font-semibold text-[13px]">Download Our</p>
                   <p className="text-blue-600 font-black text-[15px]">SK Technology App</p>
                 </div>

                 {/* SK Tech Small Logo Representation */}
                 <div className="flex items-center justify-center gap-2 mb-8">
                   <div className="bg-blue-600 p-2 rounded-full">
                     <ShieldCheck className="w-4 h-4 text-white" />
                   </div>
                   <div className="text-left leading-tight">
                     <span className="block text-[9px] font-black uppercase text-blue-950 tracking-widest">SK Technology</span>
                     <span className="block text-[7px] font-bold uppercase text-blue-600 tracking-widest">CCTV Solutions</span>
                   </div>
                 </div>

                 {/* QR Code container */}
                 <div className="mb-6 flex items-center justify-center">
                   <div className="relative w-40 h-40">
                     <NextImage 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://play.google.com/store/apps/details?id=com.sktechnology.cctv&color=0f172a" 
                        alt="Playstore QR Code" 
                        fill 
                        className="object-contain rounded-xl mix-blend-multiply" 
                        unoptimized 
                     />
                   </div>
                 </div>

                 {/* Scan Button inside Phone */}
                 <a href="https://play.google.com/store/apps/details?id=com.sktechnology.cctv" target="_blank" rel="noopener noreferrer" className="w-[85%] bg-[#082f49] hover:bg-[#0c4a6e] text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors text-xs shadow-md">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                   Scan to Download
                 </a>

               </div>
             </div>
             
             {/* Device hardware buttons (volume / power) */}
             <div className="absolute top-[120px] -right-[2px] w-[3px] h-12 bg-gray-600 rounded-r-md"></div>
             <div className="absolute top-[190px] -right-[2px] w-[3px] h-20 bg-gray-600 rounded-r-md"></div>
          </div>
        </div>
      </section>

      <FAQSection />

      <Footer />
      <OfferPopup offers={activeOffers} />
      {/* <ScrollToTop /> Removed due to duplicate in FloatingActions */}
    </main>
  );
}
