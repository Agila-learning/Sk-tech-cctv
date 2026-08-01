"use client";
import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Book, LifeBuoy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    category: "Dashboard & Navigation",
    items: [
      {
        q: "What is the Dashboard used for?",
        a: "The dashboard is your central hub. It provides a real-time overview of your current tasks, pending follow-ups, and daily stats. You can use the Quick Actions (+) button at the bottom of the sidebar to quickly log expenses, request leave, or create an order."
      },
      {
        q: "How do I check my assigned tasks?",
        a: "Click on 'Tasks' in the left sidebar. You will see a list of all assigned, in-progress, and completed tasks. You can also accept new tasks assigned by the admin."
      }
    ]
  },
  {
    category: "Services & Tasks",
    items: [
      {
        q: "How do I start a task?",
        a: "Navigate to Tasks, select a specific task, and click 'Start Work'. The system will track your location and timestamp your progress. You must upload photos as proof of work when completing a task."
      },
      {
        q: "What is the QR Code Center?",
        a: "The QR Code Center allows you to view and share QR codes for quick payments or feedback. You can use the Floating QR Button from your dashboard to quickly pull these up while on-site."
      }
    ]
  },
  {
    category: "Management & Admin",
    items: [
      {
        q: "How do I log Attendance?",
        a: "Clicking 'Attendance' from the sidebar will redirect you to the internal attendance tracker where your official attendance is logged."
      },
      {
        q: "How do I request a Leave?",
        a: "Go to 'Leave Request' in the sidebar or use the Quick Actions menu. Fill out the dates and reason, and your request will be sent to the admin for approval."
      },
      {
        q: "How do I submit an Expense?",
        a: "Go to 'Expenses' and upload a picture of your receipt along with the amount and description. Admin approval is required for reimbursement."
      }
    ]
  }
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleAccordion = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="p-4 lg:p-12 space-y-12 max-w-5xl mx-auto">
      <div className="space-y-4">
        <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center border border-blue-500/20 mb-6 shadow-inner">
          <HelpCircle className="h-8 w-8 text-blue-500" />
        </div>
        <h1 className="text-4xl lg:text-5xl font-black text-fg-primary uppercase tracking-tighter">Help <span className="text-blue-500">& FAQ</span></h1>
        <p className="text-fg-muted font-medium text-lg">Understand how to use the Technician portal and manage your daily activities.</p>
      </div>

      <div className="space-y-12">
        {faqs.map((section, sIdx) => (
          <div key={sIdx} className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-fg-primary flex items-center gap-3">
              <Book className="h-5 w-5 text-blue-500" />
              {section.category}
            </h2>
            <div className="space-y-4">
              {section.items.map((faq, fIdx) => {
                const id = `${sIdx}-${fIdx}`;
                const isOpen = openIndex === id;
                return (
                  <div key={id} className="bg-bg-surface border border-border-base rounded-[1.5rem] overflow-hidden shadow-sm transition-all hover:shadow-md">
                    <button
                      onClick={() => toggleAccordion(id)}
                      className="w-full px-8 py-6 flex items-center justify-between text-left focus:outline-none"
                    >
                      <h3 className="font-bold text-fg-primary text-base pr-8">{faq.q}</h3>
                      <ChevronDown className={`h-5 w-5 text-fg-muted transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-8 pb-6 pt-2 text-fg-muted font-medium leading-relaxed border-t border-border-subtle mx-8 mt-2">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-600 rounded-[2.5rem] p-10 flex flex-col items-center text-center mt-12 shadow-2xl shadow-blue-600/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <LifeBuoy className="h-12 w-12 text-white mb-6" />
        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3 relative z-10">Still Need Help?</h3>
        <p className="text-blue-100 font-medium mb-8 max-w-md relative z-10">Contact the admin team through the internal Chat feature or raise a direct support request.</p>
        <button onClick={() => window.location.href = '/technician/chat'} className="px-8 py-4 bg-white text-blue-600 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-transform relative z-10">
          Open Chat
        </button>
      </div>
    </div>
  );
}
