"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, ArrowRight, Phone, Wrench, ShieldCheck, Star, HelpCircle, MapPin, Ticket, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

const predefinedQA = {
  "installation": {
    q: "How do I book an installation?",
    a: "You can book an installation directly through our services page. Our expert technicians usually arrive within 24 hours.",
    link: "/installation",
    linkText: "Book Installation",
    icon: Wrench
  },
  "warranty": {
    q: "What is your warranty policy?",
    a: "We offer 1-3 years manufacturer warranty on most products. Extended AMC plans are available for full coverage.",
    link: "/warranty",
    linkText: "Check Warranty",
    icon: ShieldCheck
  },
  "support": {
    q: "I need technical support.",
    a: "Our support team is available 24/7. You can raise a ticket from your dashboard or contact us directly.",
    link: "/support",
    linkText: "Get Support",
    icon: Phone
  },
  "review": {
    q: "Write a review",
    a: "We'd love to hear your feedback! Please leave a review on our Google profile.",
    link: "https://www.google.com/search?sca_esv=e38d49348875d759&sxsrf=APpeQnvOsqLp0dYAXfy8huEEOMlUZXdfQA:1784376649520&si=APenkKm7iecQ4G6P-TsbSMFKIQtv3EFIqRAFw-i8uEbk55Z-_6a1FFpGtpiR_GmvrOEAqf08brfrInXIOOpuH8S2Pb0LGyh3FoQsbE1r2XWYGUFcw5bo9A2qs5Yc9a9t5NXJ6d6TNAK5&q=SK+TECHNOLOGY+Reviews&sa=X&ved=2ahUKEwiGgNyCmdyVAxWuTGwGHV1POpkQ0bkNegQIJBAI&biw=1336&bih=589&dpr=1.44",
    linkText: "Write Review",
    icon: Star
  },
  "faq": {
    q: "View FAQs",
    a: "Find answers to our most commonly asked questions in our Support Center.",
    link: "/support",
    linkText: "View FAQs",
    icon: HelpCircle
  },
  "contact": {
    q: "Contact number",
    a: "You can reach us directly at +91 9600975483 for immediate assistance.",
    link: "tel:+919600975483",
    linkText: "Call Now",
    icon: Phone
  },
  "purchase": {
    q: "Buy products",
    a: "Explore our wide range of premium smart home and security products.",
    link: "/products",
    linkText: "Shop Products",
    icon: ShoppingCart
  },
  "tickets": {
    q: "Raise a ticket",
    a: "Need help? Raise a support ticket from your dashboard and our team will get on it.",
    link: "/customer",
    linkText: "Go to Dashboard",
    icon: Ticket
  },
  "address": {
    q: "Company Address",
    a: "Visit us at SK Technology Headquarters. We'd love to see you!",
    link: "https://maps.google.com/?q=SK+Technology",
    linkText: "Get Directions",
    icon: MapPin
  }
};

const ChatbotSection = () => {
  const [messages, setMessages] = useState<{sender: 'bot' | 'user', text: string, link?: string, linkText?: string}[]>([
    { sender: 'bot', text: "Hi! I'm your digital security assistant. How can I help you today?" }
  ]);
  const [inputValue, setInputValue] = useState("");

  const handlePillClick = (key: keyof typeof predefinedQA) => {
    const qa = predefinedQA[key];
    setMessages(prev => [...prev, { sender: 'user', text: qa.q }]);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'bot', text: qa.a, link: qa.link, linkText: qa.linkText }]);
    }, 600);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const userText = inputValue.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputValue("");
    
    // Keyword matching logic
    let matchedKey: keyof typeof predefinedQA | null = null;
    const lowerText = userText.toLowerCase();
    if (lowerText.includes('review') || lowerText.includes('rating')) matchedKey = 'review';
    else if (lowerText.includes('faq') || lowerText.includes('question')) matchedKey = 'faq';
    else if (lowerText.includes('contact') || lowerText.includes('number') || lowerText.includes('phone') || lowerText.includes('call')) matchedKey = 'contact';
    else if (lowerText.includes('purchase') || lowerText.includes('buy') || lowerText.includes('product')) matchedKey = 'purchase';
    else if (lowerText.includes('ticket') || lowerText.includes('issue')) matchedKey = 'tickets';
    else if (lowerText.includes('address') || lowerText.includes('location') || lowerText.includes('where')) matchedKey = 'address';
    else if (lowerText.includes('install')) matchedKey = 'installation';
    else if (lowerText.includes('warranty')) matchedKey = 'warranty';
    else if (lowerText.includes('support') || lowerText.includes('help')) matchedKey = 'support';

    setTimeout(() => {
      if (matchedKey) {
        const qa = predefinedQA[matchedKey];
        setMessages(prev => [...prev, { sender: 'bot', text: qa.a, link: qa.link, linkText: qa.linkText }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: "Thanks for reaching out! Our team will review your message and get back to you shortly. You can also try selecting one of the quick options above." }]);
      }
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <section id="chatbot-section" className="py-24 bg-blue-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]"></div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center gap-12">
        
        <div className="flex-1 text-white text-center lg:text-left">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 mx-auto lg:mx-0 backdrop-blur-md border border-white/20">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">Instant <span className="text-blue-200">Assistance</span></h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">Have a question? Interact with our automated assistant to get instant answers and quick links to what you need.</p>
          
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            {(Object.keys(predefinedQA) as Array<keyof typeof predefinedQA>).map((key) => {
              const Icon = predefinedQA[key].icon;
              return (
                <button 
                  key={key}
                  onClick={() => handlePillClick(key)} 
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-colors flex items-center gap-2 text-xs shadow-lg"
                >
                  <Icon className="w-3 h-3" /> {predefinedQA[key].q}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 w-full max-w-lg lg:max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100 flex flex-col h-[450px]">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3 shadow-sm z-10">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center relative">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Support Agent</h4>
                <p className="text-xs text-slate-500 font-medium">Online</p>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 flex flex-col">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'}`}>
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                      {msg.link && (
                        <Link href={msg.link} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                          {msg.linkText} <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-10">
              <div className="relative">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message or select an option..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all" 
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-100 hover:bg-blue-600 text-blue-500 hover:text-white disabled:opacity-50 disabled:hover:bg-blue-100 disabled:hover:text-blue-500 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ChatbotSection;
