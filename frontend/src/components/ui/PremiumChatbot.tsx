"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Phone, MessageCircle, Send, Home, Briefcase, Factory, GraduationCap, Store, Activity, Calendar, Wrench, Shield, CheckCircle2, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';

const BUBBLE_MESSAGES = [
  "💬 Need help choosing the right CCTV?",
  "🏠 Secure your Home in just 2 minutes.",
  "🎁 Book a FREE Site Inspection.",
  "🛡️ Ask our Security Expert.",
  "📹 Looking for AI Surveillance?"
];

const SCENARIO_CARDS = [
  { id: 'Home', icon: Home, label: 'Home' },
  { id: 'Office', icon: Briefcase, label: 'Office' },
  { id: 'Factory', icon: Factory, label: 'Factory' },
  { id: 'School', icon: GraduationCap, label: 'School' },
  { id: 'Shop', icon: Store, label: 'Shop' },
  { id: 'Hospital', icon: Activity, label: 'Hospital' }
];

const QUICK_ACTIONS = [
  { id: 'install', label: '📹 CCTV Installation' },
  { id: 'repair', label: '🔧 CCTV Repair' },
  { id: 'amc', label: '🛡 AMC' },
  { id: 'human', label: '📞 Talk to human' },
];

export default function PremiumChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState<{sender: 'bot'|'user', text: string, id: string, isTyping?: boolean}[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', city: '', preferredTime: '' });
  const [step, setStep] = useState<'welcome'|'chat'|'lead'|'success'>('welcome');
  const [selectedInterest, setSelectedInterest] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isDashboard = pathname?.startsWith('/admin') || pathname?.startsWith('/technician');

  // Load returning visitor state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sk_chatbot_state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.messages && parsed.messages.length > 0) {
             setMessages(parsed.messages);
             setStep('chat');
             if (parsed.messages.length > 3) {
                // If they talked a bit, we welcome back
                setTimeout(() => addBotMessage("Welcome back! Continue where you left off?"), 1000);
             }
          }
        } catch (e: any){}
      }
    }
  }, []);

  // Save state on change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('sk_chatbot_state', JSON.stringify({ messages }));
    }
  }, [messages]);

  // Proactive bubbles timer
  useEffect(() => {
    if (isOpen || isDashboard) return;
    
    const cycleBubbles = setInterval(() => {
      setBubbleIndex(prev => (prev + 1) % BUBBLE_MESSAGES.length);
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 8000); // Hide after 8s
    }, 15000); // Trigger every 15s

    return () => clearInterval(cycleBubbles);
  }, [isOpen, isDashboard]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
       messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, step]);

  const playSound = () => {
    // Soft click/notification sound (only if user has interacted with document)
    try {
      const audio = new Audio('/assets/sounds/pop.mp3'); // We'll assume this exists or fails gracefully
      audio.volume = 0.2;
      const promise = audio.play();
      if (promise !== undefined) {
         promise.catch(e => { /* Ignore blocked play */ });
      }
    } catch (e: any) {}
  };

  const addBotMessage = (text: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setMessages(prev => [...prev, { sender: 'bot', text: '', id, isTyping: true }]);
    setTimeout(() => {
       setMessages(prev => prev.map(m => m.id === id ? { ...m, text, isTyping: false } : m));
       playSound();
    }, 1500);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { sender: 'user', text, id: Date.now().toString() + Math.random().toString() }]);
  };

  const handleScenarioSelect = (interest: string) => {
    setSelectedInterest(interest);
    setStep('chat');
    addUserMessage(interest);
    addBotMessage(`Great! We have specialized security solutions for ${interest}s. How can we assist you today?`);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    addUserMessage(text);
    setInputValue("");
    
    const lower = text.toLowerCase();
    if (lower.includes('human') || lower.includes('call') || lower.includes('agent')) {
       addBotMessage("I can connect you with a human expert right away. Please provide a few details so they can reach you.");
       setTimeout(() => setStep('lead'), 2500);
    } else if (lower.includes('price') || lower.includes('cost')) {
       addBotMessage("Our pricing depends on your exact requirements and the size of the area. I can arrange a FREE site inspection to give you an exact quote.");
    } else {
       addBotMessage("I see. To give you the best recommendation, our security expert can review this. Could you share your details for a quick callback?");
       setTimeout(() => setStep('lead'), 2500);
    }
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/leads', {
        method: 'POST',
        body: JSON.stringify({
          ...leadForm,
          interest: selectedInterest || 'General Inquiry'
        })
      });
      setStep('success');
      setTimeout(() => {
         setIsOpen(false);
         setStep('chat'); // reset for next open
      }, 5000);
    } catch (err: any) {
      console.error(err);
      alert('Something went wrong. Please try calling us instead.');
    }
  };

  if (isDashboard) return null;

  return (
    <>
      {/* Dark overlay when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="z-[100] pointer-events-none">
        
        {/* Chatbot Window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-[96px] right-4 md:right-6 origin-bottom-right w-[90vw] md:w-[400px] bg-bg-surface/90 backdrop-blur-2xl border border-border-strong shadow-[0_30px_60px_rgba(0,0,0,0.5)] rounded-[28px] overflow-hidden flex flex-col pointer-events-auto z-[9999]"
              style={{ height: 'min(600px, calc(100dvh - 110px))' }}
            >
              {/* Premium Header */}
              <div className="p-4 bg-gradient-to-r from-blue-900/50 to-bg-surface border-b border-border-base flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                   <div className="relative">
                     <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border border-blue-400">
                        <Bot className="w-6 h-6 text-white" />
                     </div>
                     <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-bg-surface rounded-full"></span>
                   </div>
                   <div>
                     <h3 className="font-bold text-fg-primary leading-tight flex items-center gap-2">
                        SK Security Expert
                     </h3>
                     <p className="text-[10px] text-green-400 font-medium">Online Now • Avg response: &lt; 1 min</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href="tel:+919600975483" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <Phone className="w-4 h-4 text-fg-primary" />
                  </a>
                  <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-colors text-fg-muted">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative scroll-smooth hide-scrollbar">
                
                {step === 'welcome' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-bg-muted/50 p-4 rounded-2xl rounded-tl-sm border border-border-base max-w-[85%]">
                      <p className="text-fg-primary text-sm font-medium">Welcome 👋</p>
                      <p className="text-fg-muted text-sm mt-1">I am your CCTV service assistant, how can I assist you?</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {SCENARIO_CARDS.map((card) => (
                        <button 
                          key={card.id}
                          onClick={() => handleScenarioSelect(card.id)}
                          className="flex flex-col items-center justify-center p-3 bg-bg-muted hover:bg-blue-600/20 border border-border-base hover:border-blue-500/50 rounded-2xl transition-all hover:-translate-y-1 group"
                        >
                          <card.icon className="w-6 h-6 text-blue-400 group-hover:text-blue-300 mb-2 transition-colors" />
                          <span className="text-[10px] font-bold text-fg-primary">{card.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step !== 'welcome' && (
                  <>
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => (
                        <motion.div 
                          key={msg.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] p-3 text-sm rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-sm shadow-lg' : 'bg-bg-muted/80 text-fg-primary rounded-tl-sm border border-border-base'}`}>
                            {msg.isTyping ? (
                               <div className="flex space-x-1 items-center h-5 px-2">
                                 <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                 <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                 <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                               </div>
                            ) : (
                               <p className="leading-relaxed">{msg.text}</p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {step === 'chat' && !messages[messages.length-1]?.isTyping && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2 pt-2">
                        {QUICK_ACTIONS.map(action => (
                          <button 
                            key={action.id} 
                            onClick={() => { setInputValue(action.label); setTimeout(handleSend, 100); }}
                            className="px-3 py-1.5 bg-bg-surface border border-border-strong hover:border-blue-500 rounded-full text-[11px] font-bold text-fg-primary hover:text-blue-400 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </>
                )}

                {step === 'lead' && (
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-bg-muted/50 p-4 rounded-2xl border border-border-base space-y-4">
                     <p className="text-sm font-bold text-fg-primary text-center">Fast-Track Your Request</p>
                     <form onSubmit={submitLead} className="space-y-3">
                        <input required type="text" placeholder="Your Name" value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} className="w-full bg-bg-surface border border-border-strong rounded-xl px-3 py-2 text-sm text-fg-primary focus:outline-none focus:border-blue-500" />
                        <input required type="tel" placeholder="Phone Number" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} className="w-full bg-bg-surface border border-border-strong rounded-xl px-3 py-2 text-sm text-fg-primary focus:outline-none focus:border-blue-500" />
                        <input required type="text" placeholder="City" value={leadForm.city} onChange={e => setLeadForm({...leadForm, city: e.target.value})} className="w-full bg-bg-surface border border-border-strong rounded-xl px-3 py-2 text-sm text-fg-primary focus:outline-none focus:border-blue-500" />
                        <input required type="text" placeholder="Preferred Time (e.g. 10 AM)" value={leadForm.preferredTime} onChange={e => setLeadForm({...leadForm, preferredTime: e.target.value})} className="w-full bg-bg-surface border border-border-strong rounded-xl px-3 py-2 text-sm text-fg-primary focus:outline-none focus:border-blue-500" />
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-sm transition-colors shadow-lg">
                          Request Callback
                        </button>
                     </form>
                   </motion.div>
                )}

                {step === 'success' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                     <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                     </div>
                     <p className="font-bold text-fg-primary">Request Received!</p>
                     <p className="text-xs text-fg-muted">Our expert will contact you shortly.</p>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              {step === 'chat' && (
                <div className="p-3 bg-bg-surface border-t border-border-base shrink-0">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type your message..." 
                      className="w-full bg-bg-muted border border-border-strong rounded-full pl-4 pr-12 py-3 text-sm text-fg-primary focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!inputValue.trim()}
                      className="absolute right-1 top-1 w-9 h-9 bg-blue-600 text-white disabled:opacity-50 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Send className="w-4 h-4 -ml-0.5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button & Bubbles */}
        <div className="fixed bottom-6 right-4 md:right-6 flex flex-col items-end pointer-events-none">
          
          <AnimatePresence>
            {!isOpen && showBubble && (
              <motion.div 
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                className="absolute right-[80px] bottom-2 w-48 bg-white text-blue-900 text-xs font-bold p-3 rounded-2xl rounded-br-sm shadow-xl border border-blue-100 cursor-pointer pointer-events-auto"
                onClick={() => { setIsOpen(true); setShowBubble(false); }}
              >
                {BUBBLE_MESSAGES[bubbleIndex]}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => {
               setIsOpen(!isOpen);
               if (isOpen && messages.length === 0) {
                 // Exit message if closing without typing
                 setStep('welcome');
               }
            }}
            className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:scale-110 hover:shadow-[0_0_40px_rgba(37,99,235,0.8)] transition-all relative overflow-hidden group pointer-events-auto"
          >
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full border border-white/40 group-hover:scale-150 group-hover:opacity-0 transition-all duration-700"></div>
            
            {isOpen ? <X className="w-8 h-8 text-white relative z-10" /> : (
              <>
                <MessageCircle className="w-8 h-8 text-white relative z-10" />
                <span className="absolute top-3 right-3 w-3.5 h-3.5 bg-green-400 border-2 border-blue-600 rounded-full animate-pulse z-20"></span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
