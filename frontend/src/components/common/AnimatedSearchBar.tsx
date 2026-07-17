"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import Typewriter from 'typewriter-effect';

interface AnimatedSearchBarProps {
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export default function AnimatedSearchBar({ onSearch, isLoading, suggestions = [], onSuggestionClick }: AnimatedSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <div className="relative z-50 w-full max-w-2xl mx-auto">
      <motion.div
        animate={{
          boxShadow: isFocused ? '0 0 30px rgba(59, 130, 246, 0.3)' : '0 0 0px rgba(59, 130, 246, 0)',
          scale: isFocused ? 1.02 : 1
        }}
        className="relative flex items-center bg-bg-surface/50 backdrop-blur-xl border border-border-base rounded-[2rem] overflow-hidden transition-all duration-300"
      >
        <div className="pl-6 pr-4">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loader" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.5 }}>
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              </motion.div>
            ) : (
              <motion.div key="search" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, rotate: 90 }}>
                <Search className={`h-5 w-5 transition-colors duration-300 ${isFocused ? 'text-blue-500' : 'text-fg-muted'}`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative flex-1">
          {/* Animated Placeholder Layer */}
          {!query && !isFocused && (
            <div className="absolute inset-0 flex items-center pointer-events-none text-xs font-black uppercase tracking-widest text-fg-muted/60">
              <Typewriter
                options={{
                  strings: [
                    'Search Customer...',
                    'Search Invoice...',
                    'Search Product...',
                    'Search Technician...',
                    'Search Ticket...'
                  ],
                  autoStart: true,
                  loop: true,
                  delay: 40,
                  deleteSpeed: 20
                }}
              />
            </div>
          )}

          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (onSearch) onSearch(e.target.value);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={isFocused ? "Type to search..." : ""}
            className="w-full bg-transparent py-4 pr-6 outline-none text-sm font-bold text-fg-primary placeholder:text-fg-muted placeholder:font-black placeholder:uppercase placeholder:tracking-widest relative z-10"
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {isFocused && suggestions.length > 0 && query && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 8, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
            className="absolute top-full left-0 right-0 bg-bg-surface/90 backdrop-blur-2xl border border-border-base rounded-[2rem] shadow-2xl overflow-hidden origin-top"
          >
            <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
              {suggestions.map((sug, i) => (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={i}
                  onClick={() => {
                    setQuery(sug);
                    if (onSuggestionClick) onSuggestionClick(sug);
                    setIsFocused(false);
                  }}
                  className="w-full text-left px-6 py-4 rounded-[1.5rem] hover:bg-blue-600/10 hover:text-blue-500 text-xs font-black text-fg-primary uppercase tracking-widest transition-all"
                >
                  {sug}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
