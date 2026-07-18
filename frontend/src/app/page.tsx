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
import ChatbotSection from "@/components/home/ChatbotSection";
import ScrollToTop from "@/components/ui/ScrollToTop";
import FloatingChatbot from "@/components/ui/FloatingChatbot";


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
      <CTAPopup />
      
      {/* Top Categories Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-6 mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-fg-primary uppercase tracking-tight">Top <span className="text-primary-blue">Categories</span></h2>
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
                  name={cat.displayName || cat.name}
                  image={cat.image || cat.icon}
                  category={cat.name}
                  type="category"
                />
              ))
            ) : (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-border-base rounded-[3rem] bg-bg-muted/10">
                <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center">
                  <Activity className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-black text-fg-primary uppercase tracking-tight">Intelligence Vacuum</p>
                  <p className="text-sm text-fg-muted font-medium">No strategic categories have been defined in the sector.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Space Types Section */}
      <section className="py-8 md:py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="/products?type=Home" className="group relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden border border-border-base shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/40 to-transparent z-10 transition-opacity group-hover:opacity-90"></div>
              <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay z-10 group-hover:bg-blue-600/20 transition-colors"></div>
              {/* Fallback pattern if image is missing */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-[#0a0f16] -z-10"></div>
              <img src="/assets/products/dome_4k.png" alt="Home Security" className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-full p-10 z-20 flex justify-between items-end">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>Residential</p>
                  <h3 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tight">For Home</h3>
                </div>
                <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center group-hover:bg-blue-600 transition-colors border border-white/10 group-hover:border-blue-500">
                  <ArrowRight className="text-white h-6 w-6 -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/products?type=Office" className="group relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden border border-border-base shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/40 to-transparent z-10 transition-opacity group-hover:opacity-90"></div>
              <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay z-10 group-hover:bg-blue-600/20 transition-colors"></div>
              {/* Fallback pattern if image is missing */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-[#0a0f16] -z-10"></div>
              <img src="/assets/products/bullet_ultra.png" alt="Office Security" className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-full p-10 z-20 flex justify-between items-end">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>Enterprise</p>
                  <h3 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tight">For Office</h3>
                </div>
                <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center group-hover:bg-blue-600 transition-colors border border-white/10 group-hover:border-blue-500">
                  <ArrowRight className="text-white h-6 w-6 -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Explore Products Section */}
      <section className="py-16 md:py-24 bg-bg-muted/30 border-y border-border-base relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/[0.02] blur-[120px] -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6 text-left">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Featured <span className="text-blue-500">CCTV Products</span></h2>
              <p className="text-fg-muted text-base md:text-lg font-medium max-w-xl">Professional CCTV Cameras, DVRs, NVRs, Hard Disks, Laptops, Printers & Accessories</p>
            </div>
            <Link href="/products" className="group flex items-center space-x-3 px-8 py-4 bg-bg-surface border border-border-base rounded-2xl font-bold hover:border-blue-500/50 transition-all text-fg-primary shadow-xl shadow-black/5">
              <span className="text-sm uppercase tracking-widest">Global Inventory</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <StrategicHardwareCarousel products={featuredProducts} loading={loading} />
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
                 <div className="aspect-square rounded-[3rem] overflow-hidden relative group shadow-2xl shadow-[#1E3A8A]/15 border border-[#1E3A8A]/10">
                    <NextImage src="/assets/products/ptz_recon.png" alt="Professional Tech" fill className="object-cover group-hover:scale-110 transition-transform duration-1000 p-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A]/10 to-transparent group-hover:opacity-0 transition-opacity"></div>
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

      {/* Download App Banner Section */}
      <section className="w-full bg-[#070b10] relative overflow-hidden flex items-center justify-center py-16 md:py-24 border-t border-border-base">
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
      <ChatbotSection />

      <Footer />
      <OfferPopup offers={activeOffers} />
      <ScrollToTop />
      <FloatingChatbot />
    </main>
  );
}
