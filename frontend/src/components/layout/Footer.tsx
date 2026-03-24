"use client";
import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Camera, ArrowRight, ShieldCheck, Lock, Award, Users } from 'lucide-react';
import { API_URL } from '@/utils/api';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
    const footerRef = React.useRef<HTMLElement>(null);
    const pathname = usePathname();
    const { user } = useAuth();
    const [email, setEmail] = React.useState('');
    const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
      const footer = footerRef.current;
      if (!footer) return;

      const elements = footer.querySelectorAll('.footer-animate');
      
      gsap.fromTo(elements, 
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footer,
            start: "top 85%",
          }
        }
      );
    }, []);

    if (!mounted) {
      if (pathname.startsWith('/admin') || pathname.startsWith('/technician')) return null;
      return <footer className="bg-background h-20" />; // Empty placeholder
    }

    if (pathname.startsWith('/admin') || pathname.startsWith('/technician')) return null;
    if (user && (user.role === 'admin' || user.role === 'technician')) return null;

    const handleSubscribe = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) return;
      setStatus('loading');
      try {
        const response = await fetch(`${API_URL}/subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (response.ok) {
          setStatus('success');
          setEmail('');
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    return (
     <footer ref={footerRef} className="bg-background border-t border-border-base pt-24 pb-12 overflow-hidden relative transition-colors">
       {/* Glow Decor */}
       <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -translate-y-1/2"></div>
       
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
         {/* Newsletter Section */}
         <div className="footer-animate glass-card p-12 rounded-[3.5rem] mb-24 border-border-base relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -mr-48 -mt-48 transition-all group-hover:bg-blue-600/10"></div>
            <div className="flex flex-col lg:flex-row gap-12 items-center">
                <div className="flex-1 space-y-4">
                   <h3 className="text-4xl font-black uppercase tracking-tighter">Stay <span className="text-blue-500">Connected</span></h3>
                   <p className="text-fg-muted font-medium">Get the latest news, security tips, and best offers sent to you.</p>
                   <div className="flex flex-wrap gap-3 pt-2">
                     {['Security Alerts', 'Pro Tips', 'Special Offers'].map(tag => (
                      <span key={tag} className="px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-[8px] font-black text-blue-500 uppercase tracking-widest">{tag}</span>
                    ))}
                  </div>
               </div>
               <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex flex-col sm:flex-row gap-4">
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email..." 
                    className="px-8 py-5 bg-bg-muted border border-border-base rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-xs tracking-widest w-full sm:w-80 text-fg-primary placeholder:text-fg-muted"
                  />
                   <button 
                     type="submit"
                     disabled={status === 'loading'}
                     className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl shadow-blue-600/20 disabled:opacity-50"
                   >
                      {status === 'loading' ? 'Sending...' : status === 'success' ? 'Joined!' : 'Join Now'}
                   </button>
               </form>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
           <div className="footer-animate space-y-10">
             <Link href="/" className="flex items-center space-x-3 group">
               <div className="p-2.5 bg-blue-600 rounded-2xl group-hover:rotate-12 transition-all duration-500 shadow-lg shadow-blue-600/30">
                 <Camera className="h-6 w-6 text-white" />
               </div>
               <span className="text-2xl font-black tracking-tighter">
                 <span className="text-fg-primary">SK</span><span className="text-blue-500">TECH</span>
               </span>
             </Link>
             <p className="text-sm leading-relaxed font-medium text-fg-muted">
               Building the future of home and business security. We provide smart camera systems for all types of buildings and needs.
             </p>
             <div className="flex items-center space-x-4">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <Link key={i} href="#" className="w-12 h-12 bg-bg-muted rounded-2xl border border-border-base flex items-center justify-center text-fg-secondary hover:bg-blue-600 hover:text-white transition-all transform hover:-translate-y-1">
                     <Icon className="h-5 w-5" />
                  </Link>
                ))}
             </div>
           </div>

           <div className="footer-animate">
             <h4 className="text-fg-primary font-black text-xs uppercase tracking-[0.3em] mb-10">Our Products</h4>
             <ul className="space-y-4 text-sm font-bold">
               {['Shop CCTV', 'Home Security', 'Night Vision', 'Smart Monitoring', 'Network Systems'].map((item) => (
                 <li key={item}>
                   <Link href="/products" className="text-fg-secondary hover:text-blue-500 transition-colors flex items-center group">
                     <ArrowRight className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                     {item}
                   </Link>
                 </li>
               ))}
             </ul>
           </div>

           <div className="footer-animate">
             <h4 className="text-fg-primary font-black text-xs uppercase tracking-[0.3em] mb-10">Helpful Links</h4>
             <ul className="space-y-4 text-sm font-bold">
               {[
                 { name: 'Success Stories', href: '#' },
                 { name: 'How to Install', href: '/installation' },
                 { name: 'Customer Help', href: '/support' },
                 { name: 'Register Warranty', href: '/warranty' },
                 { name: 'Privacy Policy', href: '/privacy' }
               ].map((item) => (
                 <li key={item.name}>
                   <Link href={item.href} className="text-fg-secondary hover:text-blue-500 transition-colors uppercase text-[10px] tracking-widest">{item.name}</Link>
                 </li>
               ))}
             </ul>
           </div>

           <div className="footer-animate space-y-10">
             <h4 className="text-fg-primary font-black text-xs uppercase tracking-[0.3em] mb-10">Contact Us</h4>
             <div className="space-y-6 text-sm font-medium">
               <div className="flex items-start space-x-4">
                 <MapPin className="h-5 w-5 text-blue-500 mt-1" />
                 <span className="text-fg-muted">404 Tech Corridor, Cyber City, Bangalore 560001</span>
               </div>
               <div className="flex items-center space-x-4">
                 <Phone className="h-5 w-5 text-blue-500" />
                 <span className="text-fg-muted">+91 (080) 4567-8900</span>
               </div>
               <div className="flex items-center space-x-4">
                 <Mail className="h-5 w-5 text-blue-500" />
                 <span className="text-fg-muted">support@sktech.com</span>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               {[
                 { icon: ShieldCheck, title: 'Secure', desc: 'Protected Systems' },
                 { icon: Lock, title: 'Payments', desc: '100% Secure' },
                 { icon: Award, title: 'Trusted', desc: '5+ Years Experience' },
                 { icon: Users, title: 'Experts', desc: 'Best Installers' }
               ].map((badge, i) => (
                 <div key={i} className="p-4 bg-bg-muted rounded-2xl border border-border-base flex items-center space-x-3 group cursor-help hover:bg-bg-surface transition-all">
                    <badge.icon className="h-5 w-5 text-blue-600 transition-transform group-hover:scale-110" />
                    <div>
                       <p className="text-[9px] font-black uppercase text-fg-primary tracking-widest leading-none mb-1">{badge.title}</p>
                       <p className="text-[7px] text-fg-muted font-black uppercase tracking-tight">{badge.desc}</p>
                    </div>
                 </div>
               ))}
             </div>
           </div>
         </div>

         <div className="footer-animate pt-12 border-t border-border-base flex flex-col lg:flex-row justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-fg-muted gap-8">
           <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12 text-fg-dim">
             <p>© 2026 SK TECHNOLOGY. BEST IN CCTV TECHNOLOGY.</p>
             <div className="flex items-center space-x-6">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
               <span>Website Status: Online</span>
             </div>
           </div>
           <div className="flex space-x-8 text-fg-muted">
             <Link href="/privacy" className="hover:text-blue-500 transition-colors">Privacy Policy</Link>
             <Link href="/architecture" className="hover:text-blue-500 transition-colors">How it works</Link>
             <Link href="/compliance" className="hover:text-blue-500 transition-colors">Safety Rules</Link>
           </div>
         </div>
       </div>
     </footer>
    );
};

export default Footer;
