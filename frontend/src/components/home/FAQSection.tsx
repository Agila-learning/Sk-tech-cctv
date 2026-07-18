"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';

const faqs = [
  {
    question: "Do you provide installation services for all products?",
    answer: "Yes, our certified technicians provide professional installation for all CCTV cameras, networking equipment, and smart access systems purchased through our platform."
  },
  {
    question: "What is covered under the AMC (Annual Maintenance Contract)?",
    answer: "Our AMC covers regular check-ups, unlimited remote support, hardware diagnostics, and priority on-site visits to ensure your security system operates flawlessly year-round."
  },
  {
    question: "Can I view my security cameras remotely on my phone?",
    answer: "Absolutely! All our modern IP and Wi-Fi cameras come with dedicated mobile applications (iOS & Android) that allow you to monitor your premises 24/7 from anywhere in the world."
  },
  {
    question: "Do you offer warranties on your hardware?",
    answer: "Yes, all products come with a standard manufacturer's warranty, typically ranging from 1 to 3 years. We also offer extended warranty options during checkout."
  },
  {
    question: "How do I request a repair or support technician?",
    answer: "You can easily request a service through your dashboard. Simply click 'Request Support', choose your issue, and a technician will be assigned to you promptly."
  }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageCircleQuestion className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground mb-4">Frequently Asked <span className="text-blue-600">Questions</span></h2>
          <p className="text-muted-foreground text-lg">Everything you need to know about our products and services.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white border ${openIndex === index ? 'border-blue-500 shadow-md' : 'border-border-base shadow-sm'} rounded-3xl overflow-hidden transition-all duration-300`}
            >
              <button 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none"
              >
                <h3 className={`text-lg md:text-xl font-bold ${openIndex === index ? 'text-blue-600' : 'text-slate-800'}`}>{faq.question}</h3>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180 bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 md:p-8 pt-0 text-slate-600 text-lg leading-relaxed border-t border-slate-100">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-blue-100/40 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-blue-100/40 rounded-full blur-[100px] -z-10"></div>
    </section>
  );
};

export default FAQSection;
